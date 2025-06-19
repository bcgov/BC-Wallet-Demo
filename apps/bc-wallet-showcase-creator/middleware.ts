import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { env } from '@/env'

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
  if (request.nextUrl.pathname.includes('/login')) {
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
    const response = await fetch(`${origin}/api/auth/validate-tenant?clientId=${clientId}`)

    if (!response.ok) {
      const url = request.nextUrl.clone()
      url.pathname = '/invalid-tenant'
      return NextResponse.rewrite(url)
    }
    
    const data = await response.json()

    if (!data.valid) {
      const url = request.nextUrl.clone()
      url.pathname = '/invalid-tenant'
      return NextResponse.rewrite(url)
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
  matcher: ['/', '/(fr|en)/:path*', '/:locale(fr|en)/:tenant((?!login)(?!api/auth)(?!_next)(?!_vercel|.*\\..*)/*)'],
}
