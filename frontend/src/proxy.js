import { NextResponse } from 'next/server';

// Named export "proxy" - required for Next.js 15+
export function proxy(request) {
  // Get locale from cookie
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
  
  // Create response and continue
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};