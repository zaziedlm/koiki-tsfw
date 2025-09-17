import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const todoRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return prisma.todo.findMany({ where: { userId } });
  }),
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return prisma.todo.create({ data: { title: input.title, userId } });
    }),
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const todo = await prisma.todo.findUnique({ where: { id: input.id } });
      if (!todo || todo.userId !== userId) throw new Error('Not found');
      return prisma.todo.update({ where: { id: input.id }, data: { completed: !todo.completed } });
    }),
});
