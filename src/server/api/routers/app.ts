import { createTRPCRouter } from '../../trpc';
import { userRouter } from './user';
import { todoRouter } from './todo';
import { authRouter } from './auth';

export const appRouter = createTRPCRouter({
  user: userRouter,
  todo: todoRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
