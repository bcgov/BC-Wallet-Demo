import { createHash } from 'crypto'
import { UnauthorizedError } from 'routing-controllers'

import { Claims } from './claims'

export class Token {
  private readonly _payload: Claims
  private readonly _header: any
  private readonly _signature: string
  private readonly _rawToken: string
  private readonly _parts: string[]

  public constructor(authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedError('Missing or malformed Authorization header / bearer token')
    }

    const authHeaderELem = authHeader.split(' ') // Authorization: Bearer <token>
    const accessToken = authHeaderELem[authHeaderELem.length - 1]

    this._rawToken = accessToken
    this._parts = accessToken.split('.')

    if (this._parts.length !== 3) {
      throw new Error('Invalid token string')
    }

    try {
      this._header = JSON.parse(Buffer.from(this._parts[0], 'base64url').toString())
      this._payload = JSON.parse(Buffer.from(this._parts[1], 'base64url').toString())
      this._signature = this._parts[2]
    } catch (error) {
      throw new Error(`Error parsing JWT: ${error.message}`)
    }
  }

  public get payload(): Claims {
    return this._payload
  }

  public get header(): any {
    return this._header
  }

  public getSignature(): string {
    return this._signature
  }

  public getRawToken(): string {
    return this._rawToken
  }

  public getSignatureHash(): string {
    return createHash('sha256').update(this._signature).digest('hex')
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
