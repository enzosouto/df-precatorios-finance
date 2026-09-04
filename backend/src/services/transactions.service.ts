import type { Prisma, Socio, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { formatMoney, toDecimal } from '../lib/money';
import { formatDateOnly, parseDateOnly } from '../lib/dateOnly';
import { assertCategoryCompatible } from './categories.service';
import type { CreateTransactionInput, ListTransactionsQuery, UpdateTransactionInput } from '../validators/transactions.validators';

export interface TransactionDto {
  id: string;
  type: TransactionType;
  amount: string;
  description: string;
  clientName: string | null;
  socios: Socio[];
  category: { id: string; name: string };
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

type TransactionWithCategory = Prisma.TransactionGetPayload<{ include: { category: true } }>;

function toDto(transaction: TransactionWithCategory): TransactionDto {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: formatMoney(transaction.amount),
    description: transaction.description,
    clientName: transaction.clientName,
    socios: transaction.socios,
    category: { id: transaction.category.id, name: transaction.category.name },
    transactionDate: formatDateOnly(transaction.transactionDate),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

/** Normalizes a raw client name input: trims, converts empty string to null. */
function normalizeClientName(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}


export interface TransactionTotals {
  receitas: string;
  despesas: string;
  saldo: string;
}

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery
): Promise<{ items: TransactionDto[]; total: number; totals: TransactionTotals }> {
  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
  };

  if (query.startDate || query.endDate) {
    where.transactionDate = {
      ...(query.startDate ? { gte: parseDateOnly(query.startDate) } : {}),
      ...(query.endDate ? { lte: parseDateOnly(query.endDate) } : {}),
    };
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.clientName) {
    where.clientName = { contains: query.clientName, mode: 'insensitive' };
  }

  if (query.socio) {
    where.socios = { has: query.socio };
  }

  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { clientName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total, allMatching] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({ where, select: { type: true, amount: true, socios: true } }),
  ]);

  const totalsAcc = allMatching.reduce(
    (acc, row) => {
      // Quando filtrado por sócio, cada movimentação contribui só com a parte dele (valor ÷ nº de sócios).
      const amount = query.socio ? new Decimal(row.amount).div(row.socios.length) : new Decimal(row.amount);
      if (row.type === 'RECEITA') {
        acc.receitas = acc.receitas.plus(amount);
      } else {
        acc.despesas = acc.despesas.plus(amount);
      }
      return acc;
    },
    { receitas: new Decimal(0), despesas: new Decimal(0) }
  );

  const totals: TransactionTotals = {
    receitas: formatMoney(totalsAcc.receitas),
    despesas: formatMoney(totalsAcc.despesas),
    saldo: formatMoney(totalsAcc.receitas.minus(totalsAcc.despesas)),
  };

  return { items: items.map(toDto), total, totals };
}

export async function getTransactionById(userId: string, id: string): Promise<TransactionDto> {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: { category: true },
  });

  if (!transaction) {
    throw notFound('Movimentação não encontrada.');
  }

  return toDto(transaction);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<TransactionDto> {
  await assertCategoryCompatible(userId, input.categoryId, input.type);

  const clientName = normalizeClientName(input.clientName);

  const created = await prisma.transaction.create({
    data: {
      userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: toDecimal(input.amount),
      description: input.description,
      clientName,
      socios: input.socios,
      transactionDate: parseDateOnly(input.transactionDate),
    },
    include: { category: true },
  });

  return toDto(created);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput
): Promise<TransactionDto> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });

  if (!existing) {
    throw notFound('Movimentação não encontrada.');
  }

  const resultingType = input.type ?? existing.type;
  const resultingCategoryId = input.categoryId ?? existing.categoryId;

  await assertCategoryCompatible(userId, resultingCategoryId, resultingType);

  const resultingClientName =
    input.clientName !== undefined ? normalizeClientName(input.clientName) : existing.clientName;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type: input.type,
      categoryId: input.categoryId,
      amount: input.amount !== undefined ? toDecimal(input.amount) : undefined,
      description: input.description,
      clientName: resultingClientName,
      socios: input.socios,
      transactionDate: input.transactionDate ? parseDateOnly(input.transactionDate) : undefined,
    },
    include: { category: true },
  });

  return toDto(updated);
}

export async function softDeleteTransaction(userId: string, id: string): Promise<void> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });

  if (!existing) {
    throw notFound('Movimentação não encontrada.');
  }

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
