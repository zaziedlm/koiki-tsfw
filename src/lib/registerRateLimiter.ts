import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import type { RateLimiterAbstract } from 'rate-limiter-flexible';
import { getRedisConnection } from './queue';

const POINTS = Number(process.env.REGISTER_RATE_LIMIT_POINTS ?? 5);
const DURATION = Number(process.env.REGISTER_RATE_LIMIT_DURATION ?? 10 * 60);

let limiter: RateLimiterAbstract | null = null;

function createLimiter(): RateLimiterAbstract {
  const redis = getRedisConnection();
  if (redis) {
    return new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl:register',
      points: POINTS,
      duration: DURATION,
    });
  }
  return new RateLimiterMemory({
    keyPrefix: 'rl:register',
    points: POINTS,
    duration: DURATION,
  });
}

function getLimiter(): RateLimiterAbstract {
  if (!limiter) {
    limiter = createLimiter();
  }
  return limiter;
}

export async function consumeRegisterRateLimit(key: string) {
  const instance = getLimiter();
  return instance.consume(key);
}
