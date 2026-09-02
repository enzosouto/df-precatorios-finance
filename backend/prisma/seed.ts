import 'dotenv/config';
import { PrismaClient, TransactionType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DESPESA_CATEGORIES = [
  'Aluguel',
  'Energia',
  'Internet',
  'Salários',
  'Impostos',
  'Fornecedores',
  'Marketing',
  'Transporte',
  'Escritório',
  'Outros',
];

const RECEITA_CATEGORIES = ['Recebimento', 'Honorários', 'Comissão', 'Outros'];

/**
 * Seeds the single admin user (from ADMIN_EMAIL / ADMIN_PASSWORD) and the default
 * category set. Idempotent: re-running upserts the user by email and updates the
 * password hash to match ADMIN_PASSWORD every time (so rotating the env var and
 * re-seeding is the supported way to reset the admin password). Categories are
 * upserted by (userId, name, type) and left untouched if already present.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no ambiente para rodar o seed.');
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      name: 'Administrador DF Precatórios',
      email,
      passwordHash,
    },
  });

  for (const name of DESPESA_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: admin.id, name, type: TransactionType.DESPESA } },
      update: {},
      create: { userId: admin.id, name, type: TransactionType.DESPESA },
    });
  }

  for (const name of RECEITA_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: admin.id, name, type: TransactionType.RECEITA } },
      update: {},
      create: { userId: admin.id, name, type: TransactionType.RECEITA },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed concluído para o usuário admin: ${admin.email}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Erro ao rodar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
