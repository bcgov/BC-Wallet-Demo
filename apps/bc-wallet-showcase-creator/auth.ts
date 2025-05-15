import NextAuth, { NextAuthConfig, User } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { env } from '@/env'
import { Tenant, TenantResponse } from 'bc-wallet-openapi'
import { NextRequest, NextResponse } from 'next/server'

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

// Tenant map to avoid excessive tenant config fetching TODO do we need to clear this after an auth error (in case issuer URL was changed which typically does not happen.)
const tenantConfigs = new Map()

async function getOrFetchTenantConfig(tenantId: string): Promise<Tenant> {
  if (!tenantConfigs.has(tenantId)) {
    const config = await fetchTenantConfig(tenantId)
    tenantConfigs.set(tenantId, config)
  }
  return tenantConfigs.get(tenantId)
}

async function fetchTenantConfig(tenantId: string): Promise<Tenant> {
  try {
    const endpoint = `${env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`
    console.debug(`Fetching tenant config for ${tenantId}`, endpoint)
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return Promise.reject(new TenantConfigError(tenantId))
    }
    const tenantResponse = (await response.json()) as TenantResponse
    return tenantResponse.tenant
  } catch (error) {
    console.error('Error fetching tenant config:', error)
    return Promise.reject(error instanceof TenantConfigError ? error : new TenantConfigError(tenantId))
  }
}

/**
 * The tenant-id cookie can't usually be accessed from the auth request, so take it from authjs.callback-url or referer
 * @param nextReq
 */
function getTenantIdFromRequest(nextReq?: NextRequest): string | undefined {
  if (!nextReq) {
    return undefined
  }

  const cookies = nextReq.cookies

  let tenantId: string | undefined
  if (!tenantId) {
    const callbackUrl = cookies.get('authjs.callback-url')?.value ?? cookies.get('__Secure-authjs.callback-url')?.value
    if (callbackUrl) {
      tenantId = extractTenantFromUrl(callbackUrl)
    }
  }

  if (!tenantId) {
    const referer = nextReq.headers.get('referer') || ''
    tenantId = extractTenantFromUrl(referer)
  }

  if (!tenantId) {
    tenantId = cookies.get('tenant-id')?.value
  }

  return tenantId
}

function extractTenantFromUrl(url: string): string | undefined {
  const trimmedPath = url.endsWith('/') // remove the ending slash to avoid and extra empty part
    ? url.slice(0, -1)
    : url
  const parts = trimmedPath.split('/').filter(Boolean)

  if (parts.length > 3) {
    return parts[3] // https://host/<language>/<tenant>/<path>
  }
  return undefined
}

// Token refresh function
async function refreshAccessToken(token: any, tenantConfig: Tenant, tenantId: string) {
  if (!token.refresh_token) {
    return Promise.reject(new Error('Missing refresh_token'))
  }

  try {
    const url = new URL(`${tenantConfig.oidcIssuer}/protocol/openid-connect/token`).toString()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: tenantId,
        grant_type: 'refresh_token',
        refresh_token: String(token.refresh_token),
      }),
    })

    const tokensOrError = await response.json()
    if (!response.ok) {
      return Promise.reject(tokensOrError)
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

async function buildAuthConfig(req?: NextRequest, res?: NextResponse): Promise<NextAuthConfig> {
  const tenantId = getTenantIdFromRequest(req)
  console.debug(`Auth using tenantId from cookie: ${tenantId}`)

  // Basic configuration without tenant-specific settings
  const baseConfig: NextAuthConfig = {
    secret: env.AUTH_SECRET,
    providers: [],
    session: { strategy: 'jwt' },
    callbacks: {
      async redirect({ url, baseUrl }) {
        if (url.startsWith(baseUrl)) {
          return url
        }
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`
        }
        return baseUrl
      },
    },
  }

  if (!tenantId) {
    console.warn(`No tenantId found in request. Req is ${req ? 'not empty' : 'empty'}`)
    return baseConfig
  }

  try {
    const tenantConfig = await getOrFetchTenantConfig(tenantId)

    return {
      ...baseConfig,
      providers: [
        Keycloak({
          clientId: tenantId,
          issuer: tenantConfig.oidcIssuer,
          authorization: {
            params: {
              prompt: 'login',
              max_age: 0,
            },
          },
        }),
      ],
      callbacks: {
        ...baseConfig.callbacks,
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
          session.accessToken = token.access_token as string | undefined
          session.error = token.error as 'RefreshAccessTokenError' | undefined
          return session
        },
      },
    }
  } catch (error) {
    console.error(`Failed to initialize auth for tenant ${tenantId}:`, error)
    return baseConfig
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig)
