import { Buffer } from 'buffer'
import fetch from 'cross-fetch'
import { Action, UnauthorizedError } from 'routing-controllers'
import Container from 'typedi'

import TenantService from '../services/TenantService'

type JwtPayload = {
  exp?: number
  iat?: number
  jti?: string
  iss?: string
  aud?: string
  sub?: string
  typ?: string
  azp?: string
  sid?: string
  acr?: string
  'allowed-origins'?: string[]
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
  scope?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  email?: string
  [key: string]: any
}

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)))
}

export async function isAccessTokenValid(
  token: string,
  authServerUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<boolean> {
  const authorization = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return fetch(`${authServerUrl}/protocol/openid-connect/token/introspect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authorization,
    },
    body: new URLSearchParams({
      token: token,
      client_id: `${clientId}`,
      client_secret: `${clientSecret}`,
    }),
  })
    .then(checkResponse)
    .then((response) => response.json().then((data) => data.active))
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
  return process.env.MULTITENANCY_MODE === 'multitenant' ? `/:tenantId${basePath}` : basePath
}

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  const authHeader: string = action.request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header')
  }
  const accessToken = authHeader.split(' ')[1]
  const token = new Token(accessToken)

  const tenantService = Container.get(TenantService)
  const authServerUrl = token.payload.iss
  const realm = authServerUrl?.split('/').slice(-1)[0]
  const clientId = process.env.MODE === 'multitenant' ? action.request.url.split('/')[1] : token.payload.azp

  if (!realm || !clientId) {
    throw new UnauthorizedError('Realm and Client ID are required in token')
  }

  let tenant

  try {
    tenant = await tenantService.getTenantByRealmAndClientId(realm, clientId)
  } catch (error) {
    // TODO: Remove this workaround when the issue is fixed in drizzle-orm: https://4sure.atlassian.net/browse/SHOWCASE-308
    if (error.message.includes('already exists')) {
      tenant = await tenantService.getTenantByRealmAndClientId(realm, clientId)
    } else {
      throw new UnauthorizedError('Tenant not found ' + error.message + ' ' + clientId + ' ' + realm)
    }
  }

  // Calls the introspection endpoint to validate the token
  if (!(await isAccessTokenValid(accessToken, authServerUrl, tenant.clientId, tenant.clientSecret))) {
    throw new UnauthorizedError('Invalid token')
  }
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

export class Token {
  private readonly _payload: JwtPayload

  public constructor(private token: string) {
    if (this.token) {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token string')
      }
      this._payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    } else {
      throw Error('token is required')
    }
  }

  public get payload(): JwtPayload {
    return this._payload
  }

  public hasRole = (name: string) => {
    if (!this._payload?.azp) {
      return false
    }
    const parts = name.split(':')
    if (parts.length === 1) {
      return this.hasApplicationRole(this._payload?.azp, parts[0])
    }
    if (parts[0] === 'realm') {
      return this.hasRealmRole(parts[1])
    }
    return this.hasApplicationRole(parts[0], parts[1])
  }

  public hasApplicationRole = (appName: string, roleName: string): boolean => {
    if (!this._payload.resource_access) {
      return false
    }

    const appRoles = this._payload.resource_access[appName]

    if (!appRoles) {
      return false
    }

    return appRoles.roles.indexOf(roleName) >= 0
  }

  public hasRealmRole = (roleName: string) => {
    if (!this._payload.realm_access || !this._payload.realm_access.roles) {
      return false
    }

    return this._payload.realm_access.roles.indexOf(roleName) >= 0
  }
}
