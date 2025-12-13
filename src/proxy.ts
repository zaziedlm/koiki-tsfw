import { NextRequest } from 'next/server';
import { rateLimit } from './lib/rateLimit';

// Next.js 16 uses proxy instead of middleware
// This proxy function handles rate limiting for API routes
// Proxy always runs on Node.js runtime (no need to specify)

export function proxy(request: NextRequest) {
  return rateLimit(request);
}

export const config = {
  matcher: ['/api/:path*'],
};
