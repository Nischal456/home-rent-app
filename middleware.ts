import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that are public (don't require authentication)
  const isPublicPath = path === '/login' || path === '/register';

  // Get the token from the user's cookies
  const token = request.cookies.get('token')?.value || '';

  // If the user is trying to access a public path and they ARE logged in,
  // redirect them to the dashboard.
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // If the user is trying to access a protected path and they are NOT logged in,
  // redirect them to the login page.
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // If none of the above, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*', // Protect all sub-routes of dashboard
    '/login',
    '/register',
  ],
};