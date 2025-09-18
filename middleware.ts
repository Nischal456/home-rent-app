import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function will run for every request that matches the `config` below.
export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  // If the user is NOT logged in (no token) and is trying to access a protected route,
  // redirect them to the login page.
  if (!token && pathname.startsWith('/dashboard')) {
    // Store the page they were trying to access so we can redirect them back after login.
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user IS logged in and tries to access the login or register page,
  // redirect them to their dashboard.
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If none of the above conditions are met, allow the request to proceed.
  return NextResponse.next();
}

// ✅ This `matcher` configuration is the most important part.
// It specifies which pages this middleware will run on.
// We are PROTECTING the '/dashboard' routes and handling '/login' & '/register' redirects.
// All other routes (like your public '/' homepage, '/bill/:id', and '/report' pages) will be ignored
// by the middleware and will remain public for anyone to see.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ],
}

