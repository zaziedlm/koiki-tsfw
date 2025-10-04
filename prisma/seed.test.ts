import { PrismaClient } from '@prisma/client';

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.emailVerificationToken.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData(prisma: PrismaClient) {
  const passwordHash = 'a2/dEL1ue1OtSWT8gJtIUEa0jegvqi5aXDpUe1eS';
  const user = await prisma.user.create({
    data: {
      email: 'test-user@example.com',
      hashedPassword: passwordHash,
      name: 'Test User',
      emailVerified: new Date(),
    },
  });

  await prisma.todo.create({
    data: {
      title: 'Sample todo for tests',
      userId: user.id,
    },
  });

  return { user };
}
