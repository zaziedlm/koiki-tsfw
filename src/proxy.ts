import { NextRequest } from 'next/server';
import { rateLimit } from './lib/rateLimit';

// Next.js 16 uses proxy instead of middleware
// This proxy function handles rate limiting for API routes
// Unlike middleware which could run in Edge runtime, proxy always runs on Node.js runtime
// This allows reliable access to Node.js APIs and Redis connections

export function proxy(request: NextRequest) {
  return rateLimit(request);
}

export const config = {
  matcher: ['/api/:path*'],
};
