import { Worker } from 'bullmq';
import { getRedisConnection } from '../lib/queue';
import { sendEmail } from '../lib/mailer';
import { logger } from '../lib/logger';

// Generic worker for email queue
const connection = getRedisConnection();

if (!connection) {
  logger.warn('Redis is not configured. Email worker will exit.');
  process.exit(0);
}

const worker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html } = job.data;
    logger.info({ jobId: job.id, to }, 'Processing email job');
    await sendEmail({ to, subject, html });
  },
  { connection, concurrency: 5 }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Email job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Email job failed');
});
