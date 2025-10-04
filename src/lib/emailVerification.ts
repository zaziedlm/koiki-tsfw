import crypto from 'crypto';
import { prisma } from './prisma';

const TOKEN_BYTES = 32;
const EXPIRATION_MINUTES = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES ?? 60 * 24);

type VerificationStatus = 'success' | 'expired' | 'not_found' | 'already_verified';

export interface VerificationResult {
  status: VerificationStatus;
}

export async function issueEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expires = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
    },
  });
  return { token, expires };
}

export async function verifyEmailWithToken(token: string): Promise<VerificationResult> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) {
    return { status: 'not_found' };
  }

  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } });
    return { status: 'expired' };
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { emailVerified: true },
  });

  if (!user) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    return { status: 'not_found' };
  }

  if (user.emailVerified) {
    await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    return { status: 'already_verified' };
  }

  const transactionKey = String.fromCharCode(36) + 'transaction';
  await (prisma as any)[transactionKey]([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { status: 'success' };
}
