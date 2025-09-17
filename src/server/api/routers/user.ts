import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../trpc';

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        take: input.limit ?? 20,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    }),
});
