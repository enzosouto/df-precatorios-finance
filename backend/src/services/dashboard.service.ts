import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { formatMoney } from '../lib/money';
import { parseDateOnly } from '../lib/dateOnly';
import { getDefaultMonthRange } from '../lib/dateRange';

export interface DashboardSummary {
  caixaTotal: string;
  receitasPeriodo: string;
  despesasPeriodo: string;
  saldoPeriodo: string;
  hasAnyTransactions: boolean;
}

async function sumByType(
  userId: string,
  extraWhere: { transactionDate?: { gte?: Date; lte?: Date } } = {}
): Promise<{ receitas: Decimal; despesas: Decimal }> {
  const grouped = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, deletedAt: null, ...extraWhere },
    _sum: { amount: true },
  });

  const receitas = grouped.find((g) => g.type === 'RECEITA')?._sum.amount ?? new Decimal(0);
  const despesas = grouped.find((g) => g.type === 'DESPESA')?._sum.amount ?? new Decimal(0);

  return { receitas: new Decimal(receitas), despesas: new Decimal(despesas) };
}

export async function getDashboardSummary(
  userId: string,
  startDate: string | undefined,
  endDate: string | undefined
): Promise<DashboardSummary> {
  const range = startDate && endDate ? { startDate, endDate } : getDefaultMonthRange();

  const [allTime, period, anyTransaction] = await Promise.all([
    sumByType(userId),
    sumByType(userId, {
      transactionDate: {
        gte: parseDateOnly(range.startDate),
        lte: parseDateOnly(range.endDate),
      },
    }),
    prisma.transaction.findFirst({ where: { userId, deletedAt: null }, select: { id: true } }),
  ]);

  const caixaTotal = allTime.receitas.minus(allTime.despesas);
  const saldoPeriodo = period.receitas.minus(period.despesas);

  return {
    caixaTotal: formatMoney(caixaTotal),
    receitasPeriodo: formatMoney(period.receitas),
    despesasPeriodo: formatMoney(period.despesas),
    saldoPeriodo: formatMoney(saldoPeriodo),
    hasAnyTransactions: anyTransaction !== null,
  };
}
