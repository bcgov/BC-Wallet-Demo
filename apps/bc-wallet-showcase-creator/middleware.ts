import { auth } from '@/auth'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { env } from '@/env'
import { getToken } from '@auth/core/jwt'

const handleI18nRouting = createMiddleware(routing)

function getTenantFromPath(path: string) {
  console.debug('getTenantFromPath:', path)
  return path.split('/').pop()
}

export default async function middleware(request: NextRequest) {
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

  /* FIXME ? (this causes too many redirects and not sure if we even need this)
  const sessionToken = await getToken({
    req: request,
    secret: env.AUTH_SECRET
  })

  // Redirect to login if no session and not already on the login page
  if (!sessionToken && !isLoginPage) {
    console.log('No valid session token found, redirecting to login page')
    const localeToNavigate = locale || routing.defaultLocale
    const loginPath = `/${localeToNavigate}/${tenantId}/login`
    return NextResponse.redirect(new URL(loginPath, request.url))
  }
*/

  // Check if a path is root or only contains a locale
  const path = request.nextUrl.pathname
  const isRootPath = path === '/'
  const isLocaleOnlyPath = routing.locales.some(loc => path === `/${loc}`)
  if (isRootPath || isLocaleOnlyPath) {
    // Redirect to the credentials' page with the default tenant
    const defaultLocale = locale || routing.defaultLocale
    const redirectUrl = `/${defaultLocale}/${tenantId}/credentials`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
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
  matcher: ['/', '/(fr|en)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)'],
}
