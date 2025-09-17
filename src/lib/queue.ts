import { Queue } from 'bullmq';
import IORedis from 'ioredis';

type RedisConnection = IORedis | null;

type EmailQueue = Queue | null;

let redisConnection: RedisConnection = null;
let emailQueueInstance: EmailQueue = null;

function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function getRedisConnection() {
  if (!isRedisConfigured()) return null;
  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL as string, { lazyConnect: true });
  }
  return redisConnection;
}

export function getEmailQueue() {
  const connection = getRedisConnection();
  if (!connection) return null;
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue('email', { connection });
  }
  return emailQueueInstance;
}

export function resetQueueForTests() {
  redisConnection = null;
  emailQueueInstance = null;
}
