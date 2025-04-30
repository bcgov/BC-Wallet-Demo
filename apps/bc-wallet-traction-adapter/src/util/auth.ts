import { Buffer } from 'buffer'

import { Claims } from '../types/auth/claims'

export function isAccessTokenExpired(token: Token): boolean {
  const currentTime = Math.floor(Date.now() / 1000)

  if (!token.claims.exp) {
    console.warn('Token does not contain an expiration date, assuming it is expired.')
    return true
  }

  return currentTime > token.claims.exp - 10
}

// TODO copy of api-server, we need a common lib
export class Token {
  private readonly _claims: Claims

  public constructor(private token: string) {
    if (this.token) {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token string')
      }
      this._claims = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    } else {
      throw Error('token is required')
    }
  }

  public get claims(): Claims {
    return this._claims
  }
}
