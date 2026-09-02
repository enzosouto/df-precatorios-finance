const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that a string is a real calendar date in YYYY-MM-DD format
 * (rejects things like 2024-02-30).
 */
export function isValidDateOnlyString(value: string): boolean {
  if (!DATE_ONLY_REGEX.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Parses a YYYY-MM-DD string into a UTC Date at midnight (date-only semantics). */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a Date (assumed date-only, stored via @db.Date) back into YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
