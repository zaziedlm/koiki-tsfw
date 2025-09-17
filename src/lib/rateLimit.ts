import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import IORedis from 'ioredis';

let limiter: RateLimiterRedis | null = null;

function ensureLimiter() {
  if (!process.env.REDIS_URL) return null;
  if (!limiter) {
    const redis = new IORedis(process.env.REDIS_URL, { lazyConnect: true });
    limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'middleware',
      points: 10, // 10 requests
      duration: 60, // per 60 seconds
    });
  }
  return limiter;
}

export async function rateLimit(request: NextRequest) {
  try {
    const limiterInstance = ensureLimiter();
    if (!limiterInstance) return NextResponse.next();
    const reqWithIp = request as NextRequest & { ip?: string | null };
    const identifier = reqWithIp.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
    await limiterInstance.consume(identifier);
     return NextResponse.next();
  } catch (err) {
    return new NextResponse('Too many requests', { status: 429 });
  }
}
