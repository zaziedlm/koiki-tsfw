import { NextRequest } from 'next/server';
import { rateLimit } from './lib/rateLimit';

export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
  return rateLimit(request);
}

export const config = {
  matcher: ['/api/:path*'],
};
