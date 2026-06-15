'use server';

import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { enqueueEmail } from '../jobs/emailJob';
import { logger } from '../lib/logger';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (
    isPrismaError(error, 'P1000') ||
    isPrismaError(error, 'P1001') ||
    isPrismaError(error, 'P1002') ||
    isPrismaError(error, 'P1003') ||
    isPrismaError(error, 'ECONNREFUSED')
  ) {
    return true;
  }

  return error instanceof AggregateError &&
    error.errors.some(isDatabaseConnectionError);
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse(input);
    
    const existing = await prisma.user.findUnique({ 
      where: { email: validated.email } 
    });
    
    if (existing) {
      return { 
        success: false, 
        error: 'User exists' 
      };
    }
    
    const hashed = await hashPassword(validated.password);
    
    try {
      const user = await prisma.user.create({ 
        data: { 
          email: validated.email, 
          hashedPassword: hashed, 
          name: validated.name 
        } 
      });
      
      // Send welcome email asynchronously
      await enqueueEmail({ 
        to: user.email, 
        subject: 'Welcome!', 
        html: `<p>Hello ${user.name ?? ''}</p>` 
      });
      
      return { 
        success: true, 
        userId: user.id 
      };
    } catch (createError: unknown) {
      // Handle unique constraint violation from race condition
      if (isPrismaError(createError, 'P2002')) {
        return { 
          success: false, 
          error: 'User exists' 
        };
      }
      throw createError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation error: ' + error.issues.map(e => e.message).join(', ') 
      };
    }

    logger.error({ err: error }, 'User registration failed');

    if (isDatabaseConnectionError(error)) {
      return {
        success: false,
        error: 'データベースに接続できません。PostgreSQLの起動状態を確認してください',
      };
    }

    return { 
      success: false, 
      error: 'ユーザー登録に失敗しました',
    };
  }
}

const resetRequestSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordReset(input: z.infer<typeof resetRequestSchema>) {
  try {
    const validated = resetRequestSchema.parse(input);
    
    // TODO: Generate cryptographically secure random token and save to DB with expiration
    // For production, use: crypto.randomBytes(32).toString('hex')
    const resetToken = 'token';
    await enqueueEmail({ 
      to: validated.email, 
      subject: 'Password reset', 
      html: `<p>Reset token: ${resetToken}</p>` 
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation error: ' + error.issues.map(e => e.message).join(', ') 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
