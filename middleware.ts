import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setupCookieParsingDebug } from './lib/cookies';

export function middleware(request: NextRequest) {
  // This will help locate where JSON parsing is happening incorrectly
  setupCookieParsingDebug();
  
  return NextResponse.next();
}

// Only run middleware on the client-side pages where the issue occurs
export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};

