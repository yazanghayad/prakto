import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/auth'];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for Appwrite session cookie
  const session =
    req.cookies.get('a_session_' + (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')) ??
    req.cookies.get('appwrite_session');
  const isAuthenticated = !!session;

  // Redirect unauthenticated users away from protected routes
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth routes
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
