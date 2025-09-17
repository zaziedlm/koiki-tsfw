import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { hashPassword, verifyPassword } from '../../../lib/auth';
import { enqueueEmail } from '../../../jobs/emailJob';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) throw new Error('User exists');
      const hashed = await hashPassword(input.password);
      const user = await prisma.user.create({ data: { email: input.email, hashedPassword: hashed, name: input.name } });
      // Send welcome email asynchronously
      await enqueueEmail({ to: user.email, subject: 'Welcome!', html: `<p>Hello ${user.name ?? ''}</p>` });
      return { id: user.id };
    }),
  resetRequest: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Generate reset token and save to DB or cache (omitted)
      const resetToken = 'token';
      await enqueueEmail({ to: input.email, subject: 'Password reset', html: `<p>Reset token: ${resetToken}</p>` });
      return { ok: true };
    }),
});
