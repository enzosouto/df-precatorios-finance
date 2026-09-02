import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { formatMoney } from '../lib/money';
import { formatDateOnly, parseDateOnly } from '../lib/dateOnly';
import { getDefaultMonthRange, getMonthsInRange } from '../lib/dateRange';

export interface CategoryTotal {
  categoryName: string;
  total: string;
}

export interface MonthlyTotal {
  month: string;
  receitas: string;
  despesas: string;
}

export interface ReportsResult {
  receitas: string;
  despesas: string;
  saldo: string;
  topDespesaCategorias: CategoryTotal[];
  topReceitaCategorias: CategoryTotal[];
  monthly: MonthlyTotal[];
}

const TOP_CATEGORIES_LIMIT = 5;

export async function getReports(
  userId: string,
  startDate: string | undefined,
  endDate: string | undefined
): Promise<ReportsResult> {
  const range = startDate && endDate ? { startDate, endDate } : getDefaultMonthRange();
  const dateFilter = {
    gte: parseDateOnly(range.startDate),
    lte: parseDateOnly(range.endDate),
  };

  const transactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null, transactionDate: dateFilter },
    select: {
      type: true,
      amount: true,
      transactionDate: true,
      category: { select: { id: true, name: true } },
    },
  });

  let receitas = new Decimal(0);
  let despesas = new Decimal(0);

  const despesaByCategory = new Map<string, { name: string; total: Decimal }>();
  const receitaByCategory = new Map<string, { name: string; total: Decimal }>();
  const monthlyMap = new Map<string, { receitas: Decimal; despesas: Decimal }>();

  for (const month of getMonthsInRange(range.startDate, range.endDate)) {
    monthlyMap.set(month, { receitas: new Decimal(0), despesas: new Decimal(0) });
  }

  for (const tx of transactions) {
    const amount = new Decimal(tx.amount);
    const month = formatDateOnly(tx.transactionDate).slice(0, 7);
    const monthEntry = monthlyMap.get(month) ?? { receitas: new Decimal(0), despesas: new Decimal(0) };

    if (tx.type === 'RECEITA') {
      receitas = receitas.plus(amount);
      monthEntry.receitas = monthEntry.receitas.plus(amount);
      const current = receitaByCategory.get(tx.category.id) ?? { name: tx.category.name, total: new Decimal(0) };
      current.total = current.total.plus(amount);
      receitaByCategory.set(tx.category.id, current);
    } else {
      despesas = despesas.plus(amount);
      monthEntry.despesas = monthEntry.despesas.plus(amount);
      const current = despesaByCategory.get(tx.category.id) ?? { name: tx.category.name, total: new Decimal(0) };
      current.total = current.total.plus(amount);
      despesaByCategory.set(tx.category.id, current);
    }

    monthlyMap.set(month, monthEntry);
  }

  const toSortedCategoryTotals = (map: Map<string, { name: string; total: Decimal }>): CategoryTotal[] =>
    Array.from(map.values())
      .sort((a, b) => b.total.comparedTo(a.total))
      .slice(0, TOP_CATEGORIES_LIMIT)
      .map((entry) => ({ categoryName: entry.name, total: formatMoney(entry.total) }));

  const monthly: MonthlyTotal[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({
      month,
      receitas: formatMoney(totals.receitas),
      despesas: formatMoney(totals.despesas),
    }));

  return {
    receitas: formatMoney(receitas),
    despesas: formatMoney(despesas),
    saldo: formatMoney(receitas.minus(despesas)),
    topDespesaCategorias: toSortedCategoryTotals(despesaByCategory),
    topReceitaCategorias: toSortedCategoryTotals(receitaByCategory),
    monthly,
  };
}
