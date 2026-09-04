import type { Precatorio, Socio } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';

const CATEGORIA_NOME = 'Precatórios';
const TODOS_SOCIOS: Socio[] = ['CHIQUINHO', 'FILIPI', 'LOMAR'];

async function ensureCategoria(userId: string): Promise<string> {
  const existing = await prisma.category.findUnique({
    where: { userId_name_type: { userId, name: CATEGORIA_NOME, type: 'RECEITA' } },
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: { userId, name: CATEGORIA_NOME, type: 'RECEITA' },
  });
  return created.id;
}

/**
 * Quando o precatório tem comprador e lucro apurado (venda registrada), gera/atualiza
 * automaticamente uma movimentação de receita para a empresa, dividida entre os 3 sócios.
 * Sem comprador ou sem lucro positivo, remove a movimentação automática (soft delete) se existir.
 */
export async function syncReceitaAutomatica(userId: string, precatorio: Precatorio, lucro: Decimal | null): Promise<void> {
  const existing = await prisma.transaction.findUnique({ where: { precatorioId: precatorio.id } });

  const deveExistir = !!precatorio.comprador && lucro !== null && lucro.greaterThan(0);

  if (!deveExistir) {
    if (existing && existing.deletedAt === null) {
      await prisma.transaction.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
    }
    return;
  }

  const amount = lucro as Decimal;

  if (existing) {
    await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        amount,
        clientName: precatorio.comprador,
        description: `Lucro precatório — ${precatorio.cedente}`,
        deletedAt: null,
      },
    });
    return;
  }

  const categoryId = await ensureCategoria(userId);
  await prisma.transaction.create({
    data: {
      userId,
      categoryId,
      type: 'RECEITA',
      amount,
      description: `Lucro precatório — ${precatorio.cedente}`,
      clientName: precatorio.comprador,
      socios: TODOS_SOCIOS,
      precatorioId: precatorio.id,
      transactionDate: new Date(),
    },
  });
}
