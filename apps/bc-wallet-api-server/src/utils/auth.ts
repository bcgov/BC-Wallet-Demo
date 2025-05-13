import { Buffer } from 'buffer'
import fetch from 'cross-fetch'
import { LRUCache } from 'lru-cache'
import process from 'node:process'
import { Action, UnauthorizedError } from 'routing-controllers'
import Container from 'typedi'

import TenantService from '../services/TenantService'
import { Claims } from '../types/auth/claims'
import { Token } from '../types/auth/token'
import { ISessionServiceUpdater } from '../types/services/session'

const oidcClientId = process.env.OIDC_ROOT_CLIENT_ID
const oidcClientSecret = process.env.OIDC_ROOT_CLIENT_SECRET
if (!oidcClientId || !oidcClientSecret) {
  throw new Error('OIDC_ROOT_CLIENT_ID and OIDC_ROOT_CLIENT_SECRET must be set')
}

const tokenCache = new LRUCache<string, Token>({
  max: 65535,
  ttl: 0, // Default TTL - will be overridden by token expiration
  allowStale: false,
})

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)))
}

export async function isAccessTokenValid(token: Token, authServerUrl: string): Promise<boolean> {
  const tokenHash = token.getSignatureHash()
  const cachedToken = tokenCache.get(tokenHash)

  if (cachedToken) {
    // If token is in cache and not expired, it's valid
    return !isAccessTokenExpired(cachedToken)
  }

  const authorization = 'Basic ' + Buffer.from(`${oidcClientId}:${oidcClientSecret}`).toString('base64')
  const response = await fetch(`${authServerUrl}/protocol/openid-connect/token/introspect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authorization,
    },
    body: new URLSearchParams({
      token: token.getRawToken(),
      client_id: `${oidcClientId}`,
      client_secret: `${oidcClientSecret}`,
    }),
  })
  await checkResponse(response)
  const claims = (await response.json()) as Claims
  if (claims.active) {
    const sessionUpdater = Container.get('ISessionService') as ISessionServiceUpdater
    sessionUpdater.setActiveClaims(claims)

    // Cache the token with expiration based on the token's exp claim
    if (token.payload.exp) {
      const expiryMs = token.payload.exp * 1000 - Date.now()
      if (expiryMs > 0) {
        tokenCache.set(tokenHash, token, { ttl: expiryMs })
      }
    }
    return true
  }
  return false
}

async function checkResponse(response: Response) {
  if (response.status < 400) {
    return response
  }

  let errorMessage = `HTTP error! Status: ${response.status} (${response.statusText})`

  try {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json()
      errorMessage += `\nDetails: ${JSON.stringify(errorData)}`
    } else {
      const textContent = await response.text()
      if (textContent) {
        errorMessage += `\nResponse: ${textContent}`
      }
    }
  } catch (e) {
    errorMessage += `\nNo error details available`
  }
  throw new Error(errorMessage)
}

export function getBasePath(path?: string): string {
  const basePath = path ?? ''
  return `/:tenantId${basePath}`
}

function determineClientId(token: Token, action: Action | undefined) {
  const clientAzp = token.payload.azp
  if (!clientAzp) {
    throw new UnauthorizedError('Client ID (azp) is required in token')
  }

  if (action) {
    const path = action.request.url
    const segments = path.split('/').filter(Boolean)
    if (segments.length < 2) {
      throw new UnauthorizedError(`Invalid request path: ${path} No tenant specified?`)
    }
    const routeTenant = segments[0]

    // enforce match between URL and token
    if (routeTenant !== clientAzp) {
      throw new UnauthorizedError(`Tenant mismatch: URL="${routeTenant}" vs token.azp="${clientAzp}"`)
    }

    return routeTenant
  } else {
    return clientAzp
  }
}

async function processAccessToken(authHeader?: string, action?: Action) {
  const token = new Token(authHeader)
  const issuerUrl = token.payload.iss
  if (!issuerUrl) {
    throw new UnauthorizedError('Issuer URL is required in token')
  }
  const clientId = determineClientId(token, action)
  const tenantService = Container.get(TenantService)

  if (!(await isAccessTokenValid(token, issuerUrl))) {
    throw new UnauthorizedError('Invalid token')
  }
  const sessionService: ISessionServiceUpdater = Container.get('ISessionService') as ISessionServiceUpdater
  sessionService.setCurrentTenant(await lookupTenant(tenantService, issuerUrl, clientId))

  const activeClaims = sessionService.getActiveClaims()
  if (!activeClaims) {
    throw new UnauthorizedError('No active claims found for token, probably expired')
  }
  if (activeClaims.preferred_username) {
    void (await sessionService.setCurrentUser(activeClaims.preferred_username))
  }

  return token
}

async function lookupTenant(tenantService: TenantService, issuerUrl: string, clientId: string) {
  try {
    return await tenantService.getTenantByIssuerAndClientId(issuerUrl, clientId)
  } catch (error) {
    // TODO: Remove this workaround when the issue is fixed in drizzle-orm: https://4sure.atlassian.net/browse/SHOWCASE-308
    if (error.message.includes('already exists')) {
      return await tenantService.getTenantByIssuerAndClientId(issuerUrl, clientId)
    } else {
      throw new UnauthorizedError(`Tenant not found for ${clientId} @ ${issuerUrl}: ${error.message}`)
    }
  }
}

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  const authHeader: string = action.request.headers['authorization']
  const token = await processAccessToken(authHeader, action)

  // Realm roles must be prefixed with 'realm:', client roles must be prefixed with the value of clientId + : and
  // User roles which at the moment we are not using, do not need any prefix.
  return checkRoles(token, roles)
}

export function isAccessTokenExpired(token: Token): boolean {
  const currentTime = Math.floor(Date.now() / 1000)

  if (!token.payload.exp) {
    console.warn('Token does not contain an expiration date, assuming it is expired.')
    return true
  }

  return currentTime > token.payload.exp
}

export function RootTenantAuthorized() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      const sessionService: ISessionServiceUpdater = Container.get('ISessionService') as ISessionServiceUpdater

      const authHeader = sessionService.getBearerToken()
      void (await processAccessToken(authHeader))
      return originalMethod.apply(this, args)
    }
    return descriptor
  }
}
