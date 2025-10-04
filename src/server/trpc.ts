import type { Session } from "next-auth";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export type Context = {
  session: Session | null;
  req: Request | null;
  ip: string | null;
};

function resolveClientIp(req?: Request | null): string | null {
  if (!req) return null;
  const direct = req.headers.get('x-real-ip');
  if (direct) return direct.split(',')[0].trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.split(',')[0].trim();
  return null;
}

export const createContext = async (opts?: { req: Request }) => {
  const session = await getServerSession(authOptions);
  const req = opts?.req ?? null;
  return { session, req, ip: resolveClientIp(req) };
};

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});
