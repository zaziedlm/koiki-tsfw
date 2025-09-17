import { getEmailQueue } from '../lib/queue';

export interface EmailJobPayload {
  to: string;
  subject: string;
  html: string;
}

export async function enqueueEmail(payload: EmailJobPayload) {
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('Redis is not configured, skipping enqueueEmail.');
    return;
  }
  await queue.add('sendEmail', payload, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
}
