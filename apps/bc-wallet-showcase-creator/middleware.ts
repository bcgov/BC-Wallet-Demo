import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { env } from '@/env'
import { auth } from '@/auth'

const handleI18nRouting = createMiddleware(routing)

function getTenantFromPath(path: string) {
  console.debug('getTenantFromPath:', path)
  return path.split('/').pop()
}

function extractClientId(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length >= 2 ? segments[1] : null
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check for public routes
  const isLoginRoute = pathname.includes('/login')
  const isInvalidTenantRoute = pathname.includes('/invalid-tenant')
  const isUnauthorizedRoute = pathname.includes('/unauthorized')
  const isApiRoute = pathname.includes('/api')
  const isPublicRoute = isLoginRoute || isInvalidTenantRoute || isUnauthorizedRoute || isApiRoute
  
  // Check if this is an admin route
  const isAdminRoute = pathname.includes('/admin')

  // For protected routes, check authentication and roles
  if (!isPublicRoute) {
    const session = await auth()
    
    // If not authenticated, redirect to login
    if (!session) {
      const { locale, tenantIdFromPath } = extractPathComponents(request)
      const defaultLocale = locale || routing.defaultLocale
      const tenantId = tenantIdFromPath || env.OIDC_DEFAULT_TENANT
      const loginUrl = `/${defaultLocale}/${tenantId}/login`
      return NextResponse.redirect(new URL(loginUrl, request.url))
    }

    // Check if user has admin role (realm or client-specific)
    const userRoles = session.user?.roles
    let hasAdminRole = false
    
    if (userRoles) {
      // Check realm roles
      hasAdminRole = userRoles.realmRoles.includes('admin')
      
      // Check client roles
      if (!hasAdminRole) {
        for (const clientRoles of Object.values(userRoles.clientRoles)) {
          if (Array.isArray(clientRoles) && clientRoles.includes('admin')) {
            hasAdminRole = true
            break
          }
        }
      }
    }

    // For admin routes, admin role is required
    // For other routes, just authentication is enough
    if (isAdminRoute && !hasAdminRole) {
      // User is authenticated but doesn't have admin role, and trying to access admin area
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.rewrite(url)
    }
    
    // For non-admin routes, any authenticated user without admin role still can't access
    // (based on previous RBAC requirement)
    if (!isAdminRoute && !hasAdminRole) {
      // User is authenticated but doesn't have admin role for regular routes
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.rewrite(url)
    }
  }

  // Handle login page tenant validation
  if (isLoginRoute) {

    const tenantId = extractPathComponents(request).tenantIdFromPath

    if (!tenantId) {
      const url = request.nextUrl.clone()
      url.pathname = '/invalid-tenant'
      return NextResponse.rewrite(url)
    }

    try {
      const tenantEndpoint = `${env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`
      const response = await fetch(tenantEndpoint)

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }
    } catch (e) {
      const url = request.nextUrl.clone()
      url.pathname = '/invalid-tenant'
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }
  const { origin } = request.nextUrl

  const { locale, tenantIdFromPath, isLoginPage } = extractPathComponents(request)
  const cookieTenant = request.cookies.get('tenantId')?.value
  const tenantId = tenantIdFromPath ?? cookieTenant ?? env.OIDC_DEFAULT_TENANT

  if (!tenantId) {
    return handleI18nRouting(request)
  }

  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenantId)
  console.log('Setting tenantId cookie:', tenantId)
  response.cookies.set({
    name: 'tenant-id',
    value: tenantId,
    maxAge: 60 * 60, // 1 hour
    path: '/',
    httpOnly: false, // Set to false to allow JavaScript access for Keycloak
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  // Check if a path is root or only contains a locale
  const path = request.nextUrl.pathname
  const isRootPath = path === '/'
  const isLocaleOnlyPath = routing.locales.some((loc) => path === `/${loc}`)
  if (isRootPath || isLocaleOnlyPath) {
    // Redirect to the credentials' page with the default tenant
    const defaultLocale = locale || routing.defaultLocale
    const redirectUrl = `/${defaultLocale}/${tenantId}/credentials`
    console.debug('Redirecting to:', redirectUrl)
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  const clientId = extractClientId(path)
  if (!clientId) return NextResponse.next()

  try {

    const tenantEndpoint = `${env.NEXT_PUBLIC_SHOWCASE_API_URL}/tenants/${tenantId}`
    const response = await fetch(tenantEndpoint)

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

  } catch (error) {
    console.error('Error validating tenant:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/invalid-tenant'
    return NextResponse.rewrite(url)
  }


  return handleI18nRouting(request)
}

function extractPathComponents(request: NextRequest) {
  const path = request.nextUrl.pathname
  const trimmedPath = path.endsWith('/') ? path.slice(0, -1) : path
  const parts = trimmedPath.split('/').filter(Boolean)

  return {
    locale: parts[0],
    tenantIdFromPath: parts[1] && parts[1] !== 'login' ? parts[1] : undefined,
    isLoginPage: parts.includes('login'),
  }
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*', '/:locale(fr|en)/:tenant((?!login)(?!api/auth)(?!unauthorized)(?!_next)(?!_vercel|.*\\..*)/*)'],
}
