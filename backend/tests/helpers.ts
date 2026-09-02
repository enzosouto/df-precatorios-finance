import type { Express } from 'express';
import request from 'supertest';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/password';
import { createApp } from '../src/app';

export function buildApp(): Express {
  return createApp();
}

/** Deletes all rows from tables touched by tests, respecting FK order. Test DB only. */
export async function cleanupDatabase(): Promise<void> {
  await prisma.transaction.deleteMany({});
  await prisma.precatorio.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export async function createTestUser(
  overrides: Partial<{ name: string; email: string; password: string }> = {}
): Promise<TestUser> {
  const name = overrides.name ?? 'Admin Teste';
  const email = overrides.email ?? 'admin.teste@dfprecatorios.com.br';
  const password = overrides.password ?? 'SenhaForte123!';

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return { id: user.id, email, password };
}

export async function createTestCategory(
  userId: string,
  name: string,
  type: 'RECEITA' | 'DESPESA'
): Promise<{ id: string; name: string; type: 'RECEITA' | 'DESPESA' }> {
  const category = await prisma.category.create({
    data: { userId, name, type },
  });

  return { id: category.id, name: category.name, type: category.type };
}

/** Logs in via the real HTTP endpoint and returns the Set-Cookie header value for reuse. */
export async function loginAndGetCookie(app: Express, email: string, password: string): Promise<string> {
  const response = await request(app).post('/auth/login').send({ email, password });

  if (response.status !== 200) {
    throw new Error(`Falha ao logar no teste: ${response.status} ${JSON.stringify(response.body)}`);
  }

  const setCookie = response.headers['set-cookie'];
  if (!setCookie || setCookie.length === 0) {
    throw new Error('Nenhum cookie retornado no login de teste.');
  }

  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}
