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

async function getTenantConfig(tenantId: string) {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_SHOWCASE_API_URL}/${tenantId}/tenants/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  
    if (!res.ok) console.log(`Tenant config not found for ${tenantId}`)
  
    return await res.json()
  } catch (error) {
    console.log('Error fetching tenant config:', error)
  }

}


export const { handlers, auth, signIn, signOut } = NextAuth(async (req) => {

  const tenantId = (await cookies()).get('tenantId')?.value

  if (!tenantId) {
    console.warn('No tenantId found in cookies');
    return {
      providers: [],
      session: { strategy: 'jwt' },
    };
  }

  const tenantConfig = await getTenantConfig(tenantId)

  if(tenantConfig.message === `No tenant found for id: ${tenantId}`) {
    console.warn('No tenant config found for tenantId:', tenantId);
    return {
      providers: [],
      session: { strategy: 'jwt' },
    };
  }

  return {
    providers: [
      Keycloak({
        clientId: tenantConfig?.tenant.clientId,
        clientSecret: tenantConfig?.tenant.clientSecret,
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
                client_id: tenantConfig?.tenant.clientId!,
                client_secret: tenantConfig?.tenant.clientSecret!,
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
              refresh_token: newTokens.refresh_token ?? token.refresh_token,
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
    secret: env.AUTH_KEYCLOAK_SECRET,
  }
})
