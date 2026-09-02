import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório.'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET é obrigatório e deve ter pelo menos 10 caracteres.'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL é obrigatório.'),
  PORT: z.coerce.number().int().positive().default(4000),
  ADMIN_EMAIL: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Falha ao carregar variáveis de ambiente. Verifique o arquivo .env.');
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
