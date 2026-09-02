import type { Precatorio, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { formatMoney, toDecimal } from '../lib/money';
import type {
  CreatePrecatorioInput,
  ListPrecatoriosQuery,
  UpdatePrecatorioInput,
} from '../validators/precatorios.validators';

export interface PrecatorioDto {
  id: string;
  cedente: string;
  valorOriginal: string;
  valorAtualizado: string;
  diferenca: string;
  valorPago: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDto(precatorio: Precatorio): PrecatorioDto {
  return {
    id: precatorio.id,
    cedente: precatorio.cedente,
    valorOriginal: formatMoney(precatorio.valorOriginal),
    valorAtualizado: formatMoney(precatorio.valorAtualizado),
    diferenca: formatMoney(precatorio.diferenca),
    valorPago: precatorio.valorPago !== null ? formatMoney(precatorio.valorPago) : null,
    createdAt: precatorio.createdAt.toISOString(),
    updatedAt: precatorio.updatedAt.toISOString(),
  };
}

export async function listPrecatorios(
  userId: string,
  query: ListPrecatoriosQuery
): Promise<{ items: PrecatorioDto[]; total: number }> {
  const where: Prisma.PrecatorioWhereInput = {
    userId,
    deletedAt: null,
  };

  if (query.search) {
    where.cedente = { contains: query.search, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.precatorio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.precatorio.count({ where }),
  ]);

  return { items: items.map(toDto), total };
}

export async function getPrecatorioById(userId: string, id: string): Promise<PrecatorioDto> {
  const precatorio = await prisma.precatorio.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!precatorio) {
    throw notFound('Precatório não encontrado.');
  }

  return toDto(precatorio);
}

export async function createPrecatorio(
  userId: string,
  input: CreatePrecatorioInput
): Promise<PrecatorioDto> {
  const valorOriginal = toDecimal(input.valorOriginal);
  const valorAtualizado = toDecimal(input.valorAtualizado);
  const diferenca = valorAtualizado.minus(valorOriginal);
  const valorPago =
    input.valorPago !== undefined && input.valorPago !== null ? toDecimal(input.valorPago) : null;

  const created = await prisma.precatorio.create({
    data: {
      userId,
      cedente: input.cedente,
      valorOriginal,
      valorAtualizado,
      diferenca,
      valorPago,
    },
  });

  return toDto(created);
}

export async function updatePrecatorio(
  userId: string,
  id: string,
  input: UpdatePrecatorioInput
): Promise<PrecatorioDto> {
  const existing = await prisma.precatorio.findFirst({ where: { id, userId, deletedAt: null } });

  if (!existing) {
    throw notFound('Precatório não encontrado.');
  }

  const resultingValorOriginal =
    input.valorOriginal !== undefined ? toDecimal(input.valorOriginal) : existing.valorOriginal;
  const resultingValorAtualizado =
    input.valorAtualizado !== undefined ? toDecimal(input.valorAtualizado) : existing.valorAtualizado;
  const diferenca = resultingValorAtualizado.minus(resultingValorOriginal);

  const resultingValorPago =
    input.valorPago !== undefined
      ? input.valorPago === null
        ? null
        : toDecimal(input.valorPago)
      : existing.valorPago;

  const updated = await prisma.precatorio.update({
    where: { id },
    data: {
      cedente: input.cedente,
      valorOriginal: resultingValorOriginal,
      valorAtualizado: resultingValorAtualizado,
      diferenca,
      valorPago: resultingValorPago,
    },
  });

  return toDto(updated);
}

export async function softDeletePrecatorio(userId: string, id: string): Promise<void> {
  const existing = await prisma.precatorio.findFirst({ where: { id, userId, deletedAt: null } });

  if (!existing) {
    throw notFound('Precatório não encontrado.');
  }

  await prisma.precatorio.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
