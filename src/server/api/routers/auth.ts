import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { hashPassword } from '../../../lib/auth';
import { enqueueEmail } from '../../../jobs/emailJob';
import { validatePassword } from '../../../lib/passwordPolicy';
import { issueEmailVerificationToken } from '../../../lib/emailVerification';
import { consumeRegisterRateLimit } from '../../../lib/registerRateLimiter';

const REGISTER_RATE_LIMIT_MESSAGE = 'Too many registration attempts. Please try again later.';

function resolveBaseUrl() {
  return process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const rateLimitKey = (ctx.ip || input.email).toLowerCase();
      try {
        await consumeRegisterRateLimit(rateLimitKey);
      } catch (err) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: REGISTER_RATE_LIMIT_MESSAGE });
      }

      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: passwordValidation.messages.join(' ') });
      }

      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists for the provided email.' });
      }

      const hashed = await hashPassword(input.password);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          hashedPassword: hashed,
          name: input.name,
        },
        select: { id: true, email: true, name: true },
      });

      const tokenPayload = await issueEmailVerificationToken(user.id);
      const baseUrl = resolveBaseUrl();
      const verifyUrl = new URL('/api/auth/verify', baseUrl);
      verifyUrl.searchParams.set('token', tokenPayload.token);

      const recipientName = user.name || 'there';
      const emailBodyParts = [
        '<p>Hello ' + recipientName + ',</p>',
        '<p>Please verify your email address to activate your account.</p>',
        '<p><a href="' + verifyUrl.toString() + '">Verify email address</a></p>',
        '<p>This link expires on ' + tokenPayload.expires.toISOString() + '.</p>',
      ];

      await enqueueEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: emailBodyParts.join(''),
      });

      return { id: user.id, requiresVerification: true };
    }),
  resetRequest: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (!user) {
        return { ok: true };
      }
      const resetToken = 'token';
      await enqueueEmail({ to: input.email, subject: 'Password reset', html: '<p>Reset token: ' + resetToken + '</p>' });
      return { ok: true };
    }),
});
