import { Buffer } from 'buffer'
import fetch from 'cross-fetch'
import process from 'node:process'
import { Action, UnauthorizedError } from 'routing-controllers'
import Container from 'typedi'

import { Claims } from '../types/auth/claims'
import { ISessionServiceUpdater } from '../types/services/session'

export function checkRoles(token: Token, roles: string[]) {
  if (token && !roles.length) return true
  return !!(token && roles.find((role) => token.hasRole(role)))
}

export async function authorizationChecker(action: Action, roles: string[]): Promise<boolean> {
  const authHeader: string = action.request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header')
  }

  try {
    const accessToken = authHeader.split(' ')[1]
    // Introspect the access token
    if (!(await isAccessTokenValid(accessToken))) {
      return false
    }
    const token = new Token(accessToken, `${process.env.CLIENT_ID}`)
    // Realm roles must be prefixed with 'realm:', client roles must be prefixed with the value of clientId + : and
    // User roles which at the moment we are not using, do not need any prefix.
    return checkRoles(token, roles)
  } catch (e) {
    throw new UnauthorizedError(e.message)
  }
}

export async function isAccessTokenValid(token: string): Promise<boolean> {
  const authorization =
    'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
  const response = await fetch(
    `${process.env.AUTH_SERVER_URL}/realms/${process.env.REALM}/protocol/openid-connect/token/introspect`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authorization,
      },
      body: new URLSearchParams({
        token: token,
        client_id: `${process.env.CLIENT_ID}`,
        client_secret: `${process.env.CLIENT_SECRET}`,
      }),
    },
  )

  await checkResponse(response)
  const claims = (await response.json()) as Claims
  if (claims.active) {
    const sessionUpdater = Container.get('ISessionService') as ISessionServiceUpdater
    sessionUpdater.setActiveClaims(claims)
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

// TODO Check if this is correct, or even necessary
export function isAccessTokenAudienceValid(token: Token): boolean {
  const audienceData = Array.isArray(token.payload.aud) ? token.payload.aud : [token.payload.aud]
  return audienceData.includes(process.env.CLIENT_ID)
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
  private readonly _payload: any

  public constructor(
    private token: string,
    private clientId: string,
  ) {
    if (this.token) {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token string')
      }
      this._payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } else {
      throw Error('token is required')
    }
  }

  public get payload() {
    return this._payload
  }

  public hasRole = (name: string) => {
    if (!this.clientId) {
      return false
    }
    const parts = name.split(':')
    if (parts.length === 1) {
      return this.hasApplicationRole(this.clientId, parts[0])
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
