# KOIKI-TSFW Copilot Instructions

## Project Context
This is a robust full-stack App Router Next.js 16 framework (KOIKI-TSFW) porting enterprise features from a Python framework. It uses TypeScript, Prisma (PostgreSQL), NextAuth.js, BullMQ (Redis), and Pino logging.

## Architecture & Core Patterns

- **Server-First Data Flow**: Use React Server Components (RSC) for data fetching. Use Server Actions (`src/actions/*.ts`) for mutations.
- **Database Access**: Always use the singleton Prisma client from `src/lib/prisma.ts` to prevent connection exhaustion.
  ```typescript
  import { prisma } from '@/lib/prisma'; // Use this instance
  ```
- **Authentication**: Authentication is handled by NextAuth.js (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`).
  - Access session in Server Components/Actions: `await getServerSession(authOptions)`.
  - Protect actions by checking `session?.user?.id`.
- **Async Workers**: Heavy background tasks (email, etc.) are handled by BullMQ workers (`src/jobs/worker.ts`).
  - Dispatch jobs using `src/lib/queue.ts`.
- **Logging**: Use the structured logger from `src/lib/logger.ts` instead of `console.log`.

## Directory Structure & Conventions

- `src/app/`: Next.js App Router pages and API routes.
- `src/actions/`: Server Actions (business logic & mutations). Mark files with `'use server'`.
- `src/lib/`: Shared utilities (Prisma, Auth, Logger, Queue).
- `src/jobs/`: Worker definitions and processors.
- `prisma/`: Database schema and migrations.

## Development Workflows

- **Start Dev Server**: `pnpm dev` (uses Turbopack).
- **Start Worker**: `pnpm worker`.
- **Database Migrations**:
  - Create/Run: `pnpm prisma migrate dev --name <name>`
  - Deploy: `pnpm prisma migrate deploy`
- **Docker**: The project runs fully in Docker for production/reproduction (`docker-compose.yml`).

## Coding Guidelines

- **Type Safety**: Strictly typed. Avoid `any`. Use Zod for validation in Server Actions.
- **Environment**: Critical variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `REDIS_URL`) must be checked before use in critical paths.
- **Files**: Prefer `export const` functions over classes for services/utilities.
- **Imports**: Use relative imports or configured aliases (check `tsconfig.json`).

## Example: Server Action Pattern

```typescript
'use server';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

const schema = z.object({ /* ... */ });

export async function myAction(input: z.infer<typeof schema>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  
  const data = schema.parse(input);
  // Perform DB operation
}
```
