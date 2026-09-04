import type { Socio } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { formatMoney } from '../lib/money';

export interface SocioTotals {
  receitas: string;
  despesas: string;
  saldo: string;
}

export interface SocioBreakdown extends SocioTotals {
  socio: Socio;
}

const SOCIOS: Socio[] = ['CHIQUINHO', 'FILIPI', 'LOMAR'];
const SOCIOS_COUNT = 3;

/**
 * Sums receitas/despesas by sócio for a date range. Each transaction's amount is split evenly
 * among the sócios assigned to it (1, 2 or 3), so a transaction tagged to 2 sócios contributes
 * half its amount to each, not the full amount to both.
 */
export async function getSocioBreakdown(
  userId: string,
  dateFilter: { gte: Date; lte: Date }
): Promise<SocioBreakdown[]> {
  const transactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null, transactionDate: dateFilter },
    select: { type: true, amount: true, socios: true },
  });

  const totals = new Map<Socio, { receitas: Decimal; despesas: Decimal }>(
    SOCIOS.map((socio) => [socio, { receitas: new Decimal(0), despesas: new Decimal(0) }])
  );

  for (const tx of transactions) {
    if (tx.socios.length === 0) continue;
    const share = new Decimal(tx.amount).div(tx.socios.length);

    for (const socio of tx.socios) {
      const entry = totals.get(socio);
      if (!entry) continue;
      if (tx.type === 'RECEITA') {
        entry.receitas = entry.receitas.plus(share);
      } else {
        entry.despesas = entry.despesas.plus(share);
      }
    }
  }

  return SOCIOS.map((socio) => {
    const { receitas, despesas } = totals.get(socio)!;
    return {
      socio,
      receitas: formatMoney(receitas),
      despesas: formatMoney(despesas),
      saldo: formatMoney(receitas.minus(despesas)),
    };
  });
}

/** Divides period totals by the fixed number of sócios, e.g. the "fair share" reference. */
export function getCotaIgual(receitas: Decimal, despesas: Decimal): SocioTotals {
  const saldo = receitas.minus(despesas);
  return {
    receitas: formatMoney(receitas.div(SOCIOS_COUNT)),
    despesas: formatMoney(despesas.div(SOCIOS_COUNT)),
    saldo: formatMoney(saldo.div(SOCIOS_COUNT)),
  };
}
