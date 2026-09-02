import { Decimal } from '@prisma/client/runtime/library';

/** Formats a Prisma Decimal (or decimal-like value) as a fixed 2-decimal string, e.g. "1500.00". */
export function formatMoney(value: Decimal | number | string): string {
  const decimal = new Decimal(value as Decimal.Value);
  return decimal.toFixed(2);
}

export function toDecimal(value: string | number): Decimal {
  return new Decimal(value);
}
