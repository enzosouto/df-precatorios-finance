import type { DocumentoTipo, OrigemPrecatorio, Precatorio, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { badRequest, notFound } from '../lib/errors';
import { formatMoney, toDecimal } from '../lib/money';
import { syncReceitaAutomatica } from './precatorioReceita';
import type {
  CreatePrecatorioInput,
  ListPrecatoriosQuery,
  UpdatePrecatorioInput,
} from '../validators/precatorios.validators';

export interface PrecatorioDto {
  id: string;
  cedente: string;
  valorAtualizado: string;
  valorVendido: string | null;
  valorPago: string;
  comissoes: string[];
  percentualPago: string;
  percentualVendido: string | null;
  lucro: string | null;
  tipoDocumento: DocumentoTipo | null;
  numeroDocumento: string | null;
  livro: string | null;
  folha: string | null;
  origem: OrigemPrecatorio;
  origemOutro: string | null;
  comprador: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Enforces that a type+número pair (documento, ato) is either both set or both empty. */
function assertPairValid(tipo: unknown, numero: unknown, message: string): void {
  if (!!tipo !== !!numero) {
    throw badRequest(message);
  }
}

export interface PrecatorioTotals {
  valorAtualizado: string;
  valorPago: string;
  valorVendido: string;
  lucro: string;
}

const SOCIOS_COUNT = 3;

function somaComissoes(comissoes: Prisma.Decimal[]): Prisma.Decimal {
  return comissoes.reduce((sum, c) => sum.plus(c), toDecimal(0));
}

/**
 * % pago considera valor pago + comissões (o que de fato saiu do bolso).
 * Lucro = valor vendido - valor pago - soma das comissões (só calculado quando há venda registrada).
 */
function calcularDerivados(
  valorAtualizado: Prisma.Decimal,
  valorPago: Prisma.Decimal,
  valorVendido: Prisma.Decimal | null,
  comissoes: Prisma.Decimal[]
) {
  const totalComissoes = somaComissoes(comissoes);
  const totalPago = valorPago.plus(totalComissoes);
  const percentualPago = valorAtualizado.isZero() ? toDecimal(0) : totalPago.div(valorAtualizado).times(100);
  const percentualVendido =
    valorVendido !== null ? (valorAtualizado.isZero() ? toDecimal(0) : valorVendido.div(valorAtualizado).times(100)) : null;
  const lucro = valorVendido !== null ? valorVendido.minus(valorPago).minus(totalComissoes) : null;
  return { percentualPago, percentualVendido, lucro };
}

function toDto(precatorio: Precatorio): PrecatorioDto {
  const { percentualPago, percentualVendido, lucro } = calcularDerivados(
    precatorio.valorAtualizado,
    precatorio.valorPago,
    precatorio.valorVendido,
    precatorio.comissoes
  );

  return {
    id: precatorio.id,
    cedente: precatorio.cedente,
    valorAtualizado: formatMoney(precatorio.valorAtualizado),
    valorVendido: precatorio.valorVendido !== null ? formatMoney(precatorio.valorVendido) : null,
    valorPago: formatMoney(precatorio.valorPago),
    comissoes: precatorio.comissoes.map((c) => formatMoney(c)),
    percentualPago: percentualPago.toFixed(2),
    percentualVendido: percentualVendido !== null ? percentualVendido.toFixed(2) : null,
    lucro: lucro !== null ? formatMoney(lucro) : null,
    tipoDocumento: precatorio.tipoDocumento,
    numeroDocumento: precatorio.numeroDocumento,
    livro: precatorio.livro,
    folha: precatorio.folha,
    origem: precatorio.origem,
    origemOutro: precatorio.origemOutro,
    comprador: precatorio.comprador,
    createdAt: precatorio.createdAt.toISOString(),
    updatedAt: precatorio.updatedAt.toISOString(),
  };
}

export async function listPrecatorios(
  userId: string,
  query: ListPrecatoriosQuery
): Promise<{ items: PrecatorioDto[]; total: number; totals: PrecatorioTotals; porSocio: PrecatorioTotals }> {
  const where: Prisma.PrecatorioWhereInput = {
    userId,
    deletedAt: null,
  };

  if (query.search) {
    where.cedente = { contains: query.search, mode: 'insensitive' };
  }

  if (query.origem) {
    where.origem = query.origem;
  }

  if (query.comprador) {
    where.comprador = { contains: query.comprador, mode: 'insensitive' };
  }

  const [items, total, allMatching] = await Promise.all([
    prisma.precatorio.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.precatorio.count({ where }),
    prisma.precatorio.findMany({
      where,
      select: { valorAtualizado: true, valorPago: true, valorVendido: true, comissoes: true },
    }),
  ]);

  const zero = toDecimal(0);
  interface TotalsAcc {
    valorAtualizado: Prisma.Decimal;
    valorPago: Prisma.Decimal;
    valorVendido: Prisma.Decimal;
    lucro: Prisma.Decimal;
  }
  const initialAcc: TotalsAcc = { valorAtualizado: zero, valorPago: zero, valorVendido: zero, lucro: zero };
  const totalsAcc = allMatching.reduce<TotalsAcc>((acc, row) => {
    const { lucro } = calcularDerivados(row.valorAtualizado, row.valorPago, row.valorVendido, row.comissoes);
    return {
      valorAtualizado: acc.valorAtualizado.plus(row.valorAtualizado),
      valorPago: acc.valorPago.plus(row.valorPago),
      valorVendido: acc.valorVendido.plus(row.valorVendido ?? zero),
      lucro: acc.lucro.plus(lucro ?? zero),
    };
  }, initialAcc);

  const totals: PrecatorioTotals = {
    valorAtualizado: formatMoney(totalsAcc.valorAtualizado),
    valorPago: formatMoney(totalsAcc.valorPago),
    valorVendido: formatMoney(totalsAcc.valorVendido),
    lucro: formatMoney(totalsAcc.lucro),
  };

  const porSocio: PrecatorioTotals = {
    valorAtualizado: formatMoney(totalsAcc.valorAtualizado.div(SOCIOS_COUNT)),
    valorPago: formatMoney(totalsAcc.valorPago.div(SOCIOS_COUNT)),
    valorVendido: formatMoney(totalsAcc.valorVendido.div(SOCIOS_COUNT)),
    lucro: formatMoney(totalsAcc.lucro.div(SOCIOS_COUNT)),
  };

  return { items: items.map(toDto), total, totals, porSocio };
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
  const valorAtualizado = toDecimal(input.valorAtualizado);
  const valorPago = toDecimal(input.valorPago);
  const valorVendido =
    input.valorVendido !== undefined && input.valorVendido !== null ? toDecimal(input.valorVendido) : null;
  const comissoes = (input.comissoes ?? []).map((c) => toDecimal(c));

  const tipoDocumento = input.tipoDocumento ?? null;
  const numeroDocumento = input.numeroDocumento ?? null;
  assertPairValid(tipoDocumento, numeroDocumento, 'Informe o tipo e o número do documento juntos, ou deixe ambos em branco.');

  const livro = input.livro ?? null;
  const folha = input.folha ?? null;
  assertPairValid(livro, folha, 'Informe o livro e a folha do ato juntos, ou deixe ambos em branco.');

  const origemOutro = input.origem === 'OUTRO' ? (input.origemOutro?.trim() ?? null) : null;

  const created = await prisma.precatorio.create({
    data: {
      userId,
      cedente: input.cedente,
      valorAtualizado,
      valorVendido,
      valorPago,
      comissoes,
      tipoDocumento,
      numeroDocumento,
      livro,
      folha,
      origem: input.origem,
      origemOutro,
      comprador: input.comprador ?? null,
    },
  });

  const { lucro } = calcularDerivados(created.valorAtualizado, created.valorPago, created.valorVendido, created.comissoes);
  await syncReceitaAutomatica(userId, created, lucro);

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

  const resultingValorAtualizado =
    input.valorAtualizado !== undefined ? toDecimal(input.valorAtualizado) : existing.valorAtualizado;
  const resultingValorPago = input.valorPago !== undefined ? toDecimal(input.valorPago) : existing.valorPago;
  const resultingValorVendido =
    input.valorVendido !== undefined
      ? input.valorVendido === null
        ? null
        : toDecimal(input.valorVendido)
      : existing.valorVendido;
  const resultingComissoes =
    input.comissoes !== undefined ? input.comissoes.map((c) => toDecimal(c)) : existing.comissoes;

  const resultingTipoDocumento = input.tipoDocumento !== undefined ? input.tipoDocumento : existing.tipoDocumento;
  const resultingNumeroDocumento =
    input.numeroDocumento !== undefined ? input.numeroDocumento : existing.numeroDocumento;
  assertPairValid(
    resultingTipoDocumento,
    resultingNumeroDocumento,
    'Informe o tipo e o número do documento juntos, ou deixe ambos em branco.'
  );

  const resultingLivro = input.livro !== undefined ? input.livro : existing.livro;
  const resultingFolha = input.folha !== undefined ? input.folha : existing.folha;
  assertPairValid(resultingLivro, resultingFolha, 'Informe o livro e a folha do ato juntos, ou deixe ambos em branco.');

  const resultingOrigem = input.origem ?? existing.origem;
  const resultingOrigemOutro =
    resultingOrigem === 'OUTRO'
      ? (input.origemOutro !== undefined ? input.origemOutro?.trim() ?? null : existing.origemOutro)
      : null;
  if (resultingOrigem === 'OUTRO' && !resultingOrigemOutro) {
    throw badRequest('Descreva a origem quando selecionar "Outro".');
  }

  const updated = await prisma.precatorio.update({
    where: { id },
    data: {
      cedente: input.cedente,
      valorAtualizado: resultingValorAtualizado,
      valorPago: resultingValorPago,
      valorVendido: resultingValorVendido,
      comissoes: resultingComissoes,
      tipoDocumento: resultingTipoDocumento,
      numeroDocumento: resultingNumeroDocumento,
      livro: resultingLivro,
      folha: resultingFolha,
      origem: resultingOrigem,
      origemOutro: resultingOrigemOutro,
      comprador: input.comprador !== undefined ? input.comprador : existing.comprador,
    },
  });

  const { lucro } = calcularDerivados(updated.valorAtualizado, updated.valorPago, updated.valorVendido, updated.comissoes);
  await syncReceitaAutomatica(userId, updated, lucro);

  return toDto(updated);
}

export async function softDeletePrecatorio(userId: string, id: string): Promise<void> {
  const existing = await prisma.precatorio.findFirst({ where: { id, userId, deletedAt: null } });

  if (!existing) {
    throw notFound('Precatório não encontrado.');
  }

  const now = new Date();
  await prisma.precatorio.update({
    where: { id },
    data: { deletedAt: now },
  });

  await prisma.transaction.updateMany({
    where: { precatorioId: id, deletedAt: null },
    data: { deletedAt: now },
  });
}
