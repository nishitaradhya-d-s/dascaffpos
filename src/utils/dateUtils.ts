/**
 * Date utility helpers with strict Local Timezone awareness.
 * Prevents UTC slice drift (where evening / night restaurant bills shift calendar days).
 */

/**
 * Returns YYYY-MM-DD in the user's local timezone.
 */
export function getLocalDateString(input?: string | Date | number): string {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM in the user's local timezone.
 */
export function getLocalMonthString(input?: string | Date | number): string {
  const d = input ? new Date(input) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if a bill date is Today in local timezone
 */
export function isToday(input: string | Date): boolean {
  const d = new Date(input);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a bill date is Yesterday in local timezone
 */
export function isYesterday(input: string | Date): boolean {
  const d = new Date(input);
  if (isNaN(d.getTime())) return false;
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  return (
    d.getDate() === yest.getDate() &&
    d.getMonth() === yest.getMonth() &&
    d.getFullYear() === yest.getFullYear()
  );
}

/**
 * Check if a bill date matches a specific local date (YYYY-MM-DD)
 */
export function isSameLocalDate(input: string | Date, targetDateStr: string): boolean {
  return getLocalDateString(input) === targetDateStr;
}

/**
 * Check if a bill date matches a specific local month (YYYY-MM)
 */
export function isSameLocalMonth(input: string | Date, targetMonthStr: string): boolean {
  return getLocalMonthString(input) === targetMonthStr;
}

/**
 * Check if a bill date is in the current month in local timezone
 */
export function isThisMonth(input: string | Date): boolean {
  const d = new Date(input);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Check if a bill date is in the previous month in local timezone
 */
export function isLastMonth(input: string | Date): boolean {
  const d = new Date(input);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
}

/**
 * Check if a bill date is within a local date range [fromDateStr, toDateStr] (inclusive)
 */
export function isWithinLocalDateRange(
  input: string | Date,
  fromDateStr: string,
  toDateStr: string
): boolean {
  const billDateStr = getLocalDateString(input);
  if (!billDateStr) return false;
  return billDateStr >= fromDateStr && billDateStr <= toDateStr;
}
