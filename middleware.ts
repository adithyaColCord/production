import { NextRequest, NextResponse } from 'next/server';
import { setupSafeJsonParsing } from './lib/cookies/safe-parser';

export function middleware(request: NextRequest) {
  // Setup safe JSON parsing to prevent cookie parsing errors
  setupSafeJsonParsing();
  
  // Continue to the next middleware or page
  return NextResponse.next();
}

// Apply this middleware to all routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};