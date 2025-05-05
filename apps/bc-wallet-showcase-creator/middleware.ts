import { auth } from "@/auth";
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const publicPages = [`/login`];
// const publicPages = [`/login${'/showcase-tenantA'}`];
const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split('/');
  
  // Check if we have at least 3 parts in the URL (locale/tenant/path)
  const locale = parts[1];
  const tenantId = parts[2];
  
  console.log('pathname in middleware ==>', pathname);
  console.log('tenantId in middleware ==>', tenantId);

  // Create response object first so we can modify it
  const response = NextResponse.next();

  // Set tenant cookie if present in URL
  if (tenantId) {
    console.log('Setting tenantId cookie:', tenantId);
    response.cookies.set({
      name: 'tenantId',
      value: tenantId,
      maxAge: 60 * 60, // 1 hour
      path: '/',
      httpOnly: false, // Set to false to allow JavaScript access for Keycloak
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  const setCookieHeader = response.headers.get('Set-Cookie');
  console.log('Set-Cookie header:', setCookieHeader);
  // Regular expression for public pages
  const publicPathnameRegex = RegExp(
    `^(/(${routing.locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  
  const isPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);
  
  if (isPublicPage) {
    return handleI18nRouting(request);
  }
  
  const session = await auth();

  if (!session) {
    const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
    const validLocale = routing.locales.includes(locale as 'en' | 'fr') ? locale : routing.defaultLocale;
    const loginUrl = new URL(`/${validLocale}/login`, request.url);
    
    return NextResponse.redirect(loginUrl);
  }
  
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    '/', 
    '/(fr|en)/:path*', 
    "/((?!_next|_vercel|api|.*\\..*).*)"
  ]
};