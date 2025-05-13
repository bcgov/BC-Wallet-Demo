import NextAuth, { User } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'
import { cookies } from 'next/headers'

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

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenantId')?.value || env.OIDC_DEFAULT_TENANT

  if (!tenantId) {
    console.error('No tenantId found in cookies or OIDC_DEFAULT_TENANT environment variable')
    return {
      providers: [],
      session: { strategy: 'jwt' },
    }
  }

  return {
    secret: env.AUTH_SECRET,
    providers: [
      Keycloak({
        clientId: tenantId, // clientId == tenantId to make it work
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
          if (!token.refresh_token) {
            return Promise.reject(Error('Missing refresh_token'))
          }

          try {
            const url = `${env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`

            const response = await fetch(url, {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              method: 'POST',
              body: new URLSearchParams({
                client_id: tenantId,
                grant_type: 'refresh_token',
                ...(token.refresh_token && { refresh_token: String(token.refresh_token) }),
              }),
            })

            const tokensOrError = await response.json()
            if (!response.ok) {
              throw tokensOrError
            }

            const newTokens = tokensOrError as {
              access_token: string
              expires_in: number
              refresh_token?: string
            }
            return {
              ...token,
              access_token: newTokens.access_token,
              expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
              refresh_token: newTokens.refresh_token ?? token.refresh_token,
            }
          } catch (error) {
            console.error('Error refreshing access_token', error)
            return {
              ...token,
              error: 'RefreshAccessTokenError',
            }
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
  }
})
