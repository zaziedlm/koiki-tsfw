'use server';

import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { enqueueEmail } from '../jobs/emailJob';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation error: ' + error.errors.map(e => e.message).join(', ') 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

const resetRequestSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordReset(input: z.infer<typeof resetRequestSchema>) {
  try {
    const validated = resetRequestSchema.parse(input);
    
    // Generate reset token and save to DB or cache (omitted)
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
        error: 'Validation error: ' + error.errors.map(e => e.message).join(', ') 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
