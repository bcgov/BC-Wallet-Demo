import { auth } from "@/auth";
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const publicPages = ['/login'];
const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
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
    console.log("validLocale", validLocale)
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