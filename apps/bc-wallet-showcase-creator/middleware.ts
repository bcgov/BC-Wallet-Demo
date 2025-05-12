import { auth } from "@/auth";
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const publicPages = ['/login'];
const handleI18nRouting = createMiddleware(routing);

// export default async function middleware(request: NextRequest) {
//   const publicPathnameRegex = RegExp(
//     `^(/(${routing.locales.join('|')}))?(${publicPages
//       .flatMap((p) => (p === '/' ? ['', '/'] : p))
//       .join('|')})/?$`,
//     'i'
//   );
  
//   const isPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);
  
//   if (isPublicPage) {
//     return handleI18nRouting(request);
//   }
  
//   const session = await auth();

//   if (!session) {
//     const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
//     const validLocale = routing.locales.includes(locale as 'en' | 'fr') ? locale : routing.defaultLocale;
//     const loginUrl = new URL(`/${validLocale}/login`, request.url);
    
//     return NextResponse.redirect(loginUrl);
//   }
  
//   return handleI18nRouting(request);
// }

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const trimmedPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const parts = trimmedPathname.split('/').filter(Boolean);

  const locale = parts[0];
  const isLoginPage = parts.includes('login');
  const tenantId = parts[1] && parts[1] !== 'login' ? parts[1] : undefined;


  if (!tenantId && isLoginPage) {
    const defaultTenant = 'public';
    const redirectUrl = new URL(`/${locale}/${defaultTenant}/login`, request.url);

    return NextResponse.redirect(redirectUrl);
  }

  if (!tenantId && pathname.includes('/login')) {
    console.warn('No tenantId in URL or cookies, redirecting to generic login');
    return NextResponse.redirect(new URL('/en/login', request.url));
  }

  const session = await auth();

  if (!session && !isLoginPage) {
    const loginPath = tenantId
      ? `/${locale}/${tenantId}/login`
      : `/${locale}/public/login`;

    return NextResponse.redirect(new URL(loginPath, request.url));
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