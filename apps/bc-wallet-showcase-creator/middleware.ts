import { auth } from '@/auth'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { env } from '@/env'

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

  // Authentication check
  const session = await auth()

  // Redirect to login if no session and not already on login page
  if (!session && !isLoginPage) {
    const loginPath = `/${locale}/${tenantId}/login`
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  return handleI18nRouting(request)
}

function extractPathComponents(request: NextRequest) {
  const forwardedPath = request.headers.get('x-forwarded-prefix') || ''
  const fullPath = forwardedPath + request.nextUrl.pathname
  const trimmedPath = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath
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
