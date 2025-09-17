import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed);
}

export async function hasRole(userId: string, role: string) {
  const count = await prisma.userRole.count({ where: { userId, role: { name: role } } });
  return count > 0;
}
