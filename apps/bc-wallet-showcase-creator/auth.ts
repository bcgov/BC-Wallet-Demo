import NextAuth, { User } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'

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
        ...('refreshToken' in token && { refresh_token: token.refreshToken }),
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
    jwt: async ({ token, user, account }) => {
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          tokenType: account.token_type,
          user,
        }
      }

      if (
        'accessTokenExpires' in token &&
        typeof token.accessTokenExpires === 'number' &&
        Date.now() < token.accessTokenExpires
      ) {
        return token
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      // @ts-expect-error: token.user is not typed
      session.user = token.user
      session.accessToken = token.accessToken as string | undefined
      session.error = token.error as 'RefreshAccessTokenError' | undefined
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
