import NextAuth, { User } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'
import { Buffer } from 'buffer'

export interface JWT {
  accessToken: string
  accessTokenExpires: number
  refreshToken: string
  idToken: string
  tokenType: string
  user: JWTUser
  iat: number
  exp: number
  jti: string
  error: string
}

export interface JWTUser {
  id: string
  name: string
  email: string
}


declare module 'next-auth' {
  interface Session {
    accessToken?: string | undefined
    user: User
    error?: 'RefreshAccessTokenError'
  }
}

async function refreshAccessToken(token: any) {
  try {
    const url = `${env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.AUTH_KEYCLOAK_ID!,
        client_secret: env.AUTH_KEYCLOAK_SECRET!,
        grant_type: 'refresh_token',
        ...('refresh_token' in token && { refresh_token: token.refresh_token }),
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in - 5) * 1000, // Refresh 5 seconds early to avoid the token expiring during an active request
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to the old refresh token when failed to refresh
    }
  } catch (error) {
    console.error('Error refreshing access token', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
  clientId: env.AUTH_KEYCLOAK_ID!,
  clientSecret: env.AUTH_KEYCLOAK_SECRET!,
  issuer: env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        }
      }
      if (
        'accessTokenExpires' in token &&
        typeof token.accessTokenExpires === 'number' &&
        Date.now() < token.accessTokenExpires
      ) {
        return token
      } else {
        if (!token.refresh_token) throw new TypeError("Missing refresh_token")
        try {
          const url = `${env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`

          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            body: new URLSearchParams({
              client_id: env.AUTH_KEYCLOAK_ID!,
              client_secret: env.AUTH_KEYCLOAK_SECRET!,
              grant_type: 'refresh_token',
              ...(token.refresh_token && { refresh_token: String(token.refresh_token) }),
            }),
          })
      
          const tokensOrError = await response.json()
          if (!response.ok) throw tokensOrError
          const newTokens = tokensOrError as {
            access_token: string
            expires_in: number
            refresh_token?: string
          }
          return {
            ...token,
            access_token: newTokens.access_token,
            expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
            refresh_token: newTokens.refresh_token
              ? newTokens.refresh_token
              : token.refresh_token,
          }
        } catch (error) {
          console.error("Error refreshing access_token", error)
          token.error = "RefreshTokenError"
          return token
        }
      }
    },
    async session({ session, token }) {
      session.user = session.user
      session.accessToken = token.access_token as string | undefined
      session.error = token.error as 'RefreshAccessTokenError' | undefined
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})

export const decodeJwt = (token?: string) => {
  if (token) {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token string')
    }
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  } else {
    throw Error('token is required')
  }
}
