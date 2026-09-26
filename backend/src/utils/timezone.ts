/**
 * Timezone utilities to authoritatively calculate merchant-local day boundaries
 * Never trust customer device clocks for daily eligibility.
 */

export function getMerchantDateString(date: Date | string, timezone = 'UTC'): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // Returns YYYY-MM-DD in merchant's timezone
  } catch {
    // Fallback to UTC if timezone is invalid
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
}

export function isSameMerchantDay(
  timestamp1: string | Date | null,
  timestamp2: string | Date | null,
  timezone = 'UTC'
): boolean {
  if (!timestamp1 || !timestamp2) return false;
  const day1 = getMerchantDateString(timestamp1, timezone);
  const day2 = getMerchantDateString(timestamp2, timezone);
  return day1 === day2;
}

export function isCompletedToday(
  lastTimestamp: string | Date | null,
  timezone = 'UTC'
): boolean {
  if (!lastTimestamp) return false;
  return isSameMerchantDay(lastTimestamp, new Date(), timezone);
}
