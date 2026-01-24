'use server';

import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

const createTodoSchema = z.object({
  title: z.string().min(1),
});

const toggleTodoSchema = z.object({
  id: z.string(),
});

export async function listTodos() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      success: false, 
      error: 'Unauthorized' 
    };
  }
  
  const todos = await prisma.todo.findMany({ 
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  return { 
    success: true, 
    todos 
  };
}

export async function createTodo(input: z.infer<typeof createTodoSchema>) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      success: false, 
      error: 'Unauthorized' 
    };
  }
  
  try {
    const validated = createTodoSchema.parse(input);
    
    const todo = await prisma.todo.create({ 
      data: { 
        title: validated.title, 
        userId: session.user.id 
      } 
    });
    
    return { 
      success: true, 
      todo 
    };
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

export async function toggleTodo(input: z.infer<typeof toggleTodoSchema>) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { 
      success: false, 
      error: 'Unauthorized' 
    };
  }
  
  try {
    const validated = toggleTodoSchema.parse(input);
    
    // First verify ownership
    const todo = await prisma.todo.findUnique({ 
      where: { id: validated.id } 
    });
    
    if (!todo || todo.userId !== session.user.id) {
      return { 
        success: false, 
        error: 'Not found' 
      };
    }
    
    // Use atomic update to avoid race conditions
    const updated = await prisma.todo.update({ 
      where: { 
        id: validated.id,
        userId: session.user.id // Double-check ownership in the update
      }, 
      data: { completed: !todo.completed } 
    });
    
    return { 
      success: true, 
      todo: updated 
    };
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
