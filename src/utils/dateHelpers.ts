/**
 * Parse a YYYY-MM-DD string into a standard Date object set to local midnight to avoid timezone issues.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * Calculate the difference in calendar days between two YYYY-MM-DD strings (d2 - d1).
 */
export function diffDays(d1Str: string, d2Str: string): number {
  const d1 = parseLocalDate(d1Str);
  const d2 = parseLocalDate(d2Str);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get days remaining until next care.
 */
export function getDaysRemaining(lastActionDate: string, intervalDays: number, todayStr: string): number {
  const dueDateStr = addDays(lastActionDate, intervalDays);
  return diffDays(todayStr, dueDateStr);
}
