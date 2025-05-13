import { auth } from '@/auth'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { env } from '@/env'

const handleI18nRouting = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const trimmedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const parts = trimmedPathname.split('/').filter(Boolean)

  const locale = parts[0]
  const tenantIdFromPath = parts[1] && parts[1] !== 'login' ? parts[1] : undefined
  const isLoginPage = parts.includes('login')

  const tenantId = tenantIdFromPath || env.OIDC_DEFAULT_TENANT

  // Important: Set cookie before any redirects or returns
  if (tenantId) {
    // Create a response to pass through
    const opts = { path: '/' /*, secure: true, httpOnly: true, sameSite: 'lax' */ }

    const response = NextResponse.next()
    response.cookies.set('tenantId', tenantId, opts)

    // Check if we need authentication
    const session = await auth()

    if (!session && !isLoginPage && tenantId) {
      const loginPath = `/${locale}/${tenantId}/login`
      const redirectResponse = NextResponse.redirect(new URL(loginPath, request.url))
      // Copy the cookie to the redirect response
      redirectResponse.cookies.set('tenantId', tenantId)
      return redirectResponse
    }

    // Apply i18n routing to our modified response
    const i18nResponse = handleI18nRouting(request)
    i18nResponse.cookies.set('tenantId', tenantId, opts)
    return i18nResponse
  }

  if (!tenantId && isLoginPage) {
    if (!env.OIDC_DEFAULT_TENANT) {
      return NextResponse.json({ error: 'No tenant ID in URL and no OIDC_DEFAULT_TENANT configured' }, { status: 400 })
    }

    const redirectUrl = new URL(`/${locale}/${env.OIDC_DEFAULT_TENANT}/login`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  const session = await auth()

  if (!session && !isLoginPage && tenantId) {
    const loginPath = `/${locale}/${tenantId}/login`
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  return handleI18nRouting(request)
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*', '/((?!_next|_vercel|api|.*\\..*).*)'],
}
