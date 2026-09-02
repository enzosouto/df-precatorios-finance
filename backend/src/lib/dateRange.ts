import { formatDateOnly } from './dateOnly';

/** Returns the [startDate, endDate] (YYYY-MM-DD) for the current calendar month. */
export function getDefaultMonthRange(reference: Date = new Date()): { startDate: string; endDate: string } {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  return { startDate: formatDateOnly(start), endDate: formatDateOnly(end) };
}

/** Returns an array of "YYYY-MM" months (inclusive) covering the given date-only range. */
export function getMonthsInRange(startDate: string, endDate: string): string[] {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);

  const months: string[] = [];
  let year = startYear;
  let month = startMonth; // 1-indexed

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}
