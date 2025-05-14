import NextAuth, { NextAuthConfig, User } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'
import { Tenant, TenantResponse } from 'bc-wallet-openapi'
import { NextRequest, NextResponse } from 'next/server'
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

// Error class for tenant configuration issues
class TenantConfigError extends Error {
  constructor(tenantId: string) {
    super(`Failed to fetch tenant config for ${tenantId}. Does it exist?`)
    this.name = 'TenantConfigError'
  }
}

// Create a config store for dynamic tenant configuration
const tenantConfigs = new Map()

// Function to get or fetch tenant config
async function getOrFetchTenantConfig(tenantId: string) {
  if (!tenantConfigs.has(tenantId)) {
    const config = await getTenantConfig(tenantId)
    tenantConfigs.set(tenantId, config)
  }
  return tenantConfigs.get(tenantId)
}

// API client function
async function getTenantConfig(tenantId: string): Promise<Tenant> {
  try {
    console.debug(`Fetching tenant config for ${tenantId}`)
    const response = await fetch(`${env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new TenantConfigError(tenantId)
    }
    const tenantResponse = (await response.json()) as TenantResponse
    return tenantResponse.tenant
  } catch (error) {
    console.error('Error fetching tenant config:', error)
    throw error instanceof TenantConfigError ? error : new TenantConfigError(tenantId)
  }
}

function getTenantIdFromCookie(req?: Request): string | undefined {
  const nextReq = req as NextRequest | undefined;
  
  if (!nextReq) {
    return undefined
  }

  // const cookieHeader = req.headers.get('cookie') || ''
  // const cookies = cookieHeader.split(';').reduce(
  //   (acc, cookie) => {
  //     const [key, value] = cookie.trim().split('=')
  //     acc[key] = value
  //     return acc
  //   },
  //   {} as Record<string, string>,
  // )
  // console.debug('Cookies:', cookies)

  // const referer = req.headers.get('referer') || ''
  // const trimmedPath = referer.endsWith('/') ? referer.slice(0, -1) : referer
  // const parts = trimmedPath.split('/').filter(Boolean)
  return nextReq?.cookies.get('tenantId')?.value
  // return cookies['tenant-id'] || (parts.length > 2 ? parts[3] : '')
}

// Token refresh function
async function refreshAccessToken(token: any, tenantConfig: Tenant, tenantId: string) {
  if (!token.refresh_token) {
    throw new Error('Missing refresh_token')
  }

  try {
    const url = new URL(`${tenantConfig.oidcIssuer}/protocol/openid-connect/token`).toString()
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      body: new URLSearchParams({
        client_id: tenantId,
        grant_type: 'refresh_token',
        refresh_token: String(token.refresh_token),
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
      accessTokenExpires: Date.now() + newTokens.expires_in * 1000, // Refresh 5 seconds early to avoid the token expiring during an active request
      refresh_token: newTokens.refresh_token ?? token.refresh_token, // Fall back to the old refresh token when failed to refresh
    }
  } catch (error) {
    console.error('Error refreshing access token', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
      needsSignIn: true,
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth((async (req?: NextRequest, res?: NextResponse) => {
  const tenantId = (await cookies()).get('tenant-id')?.value ?? getTenantIdFromCookie(req)
  console.debug(`Auth using tenantId from cookie: ${tenantId}`)

  if (!tenantId) {
    console.log('No tenantId found in request')
    return {
      providers: [],
      session: { strategy: 'jwt' },
    }
  }

  try {
    const tenantConfig = await getTenantConfig(tenantId)
    return {
      secret: env.AUTH_SECRET,
      providers: [
        Keycloak({
          clientId: tenantId,
          issuer: tenantConfig.oidcIssuer,
        }),
      ],
      callbacks: {
        async jwt({ token, account }) {
          if (account) {
            return {
              ...token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
              refresh_token: account.refresh_token,
            }
          }

          // Check using accessTokenExpires
          const isTokenValid =
            'accessTokenExpires' in token &&
            typeof token.accessTokenExpires === 'number' &&
            Date.now() < token.accessTokenExpires

          if (isTokenValid) {
            return token
          } else {
            return await refreshAccessToken(token, tenantConfig, tenantId)
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
    } as NextAuthConfig
  } catch (error) {
    console.error(`Failed to initialize auth for tenant ${tenantId}:`, error)
    return {
      providers: [],
      session: { strategy: 'jwt' },
    } as NextAuthConfig
  }
}) as unknown as NextAuthConfig)
