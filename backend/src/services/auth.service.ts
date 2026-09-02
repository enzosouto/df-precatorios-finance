import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { unauthorized } from '../lib/errors';

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
}

function toDto(user: { id: string; name: string; email: string }): AuthUserDto {
  return { id: user.id, name: user.name, email: user.email };
}

export async function authenticate(email: string, password: string): Promise<{ user: AuthUserDto; userId: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw unauthorized('Email ou senha inválidos.');
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    throw unauthorized('Email ou senha inválidos.');
  }

  return { user: toDto(user), userId: user.id };
}

export async function getUserById(userId: string): Promise<AuthUserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw unauthorized('Não autenticado.');
  }

  return toDto(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw unauthorized('Não autenticado.');
  }

  const valid = await verifyPassword(user.passwordHash, currentPassword);

  if (!valid) {
    throw unauthorized('Senha atual inválida.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
