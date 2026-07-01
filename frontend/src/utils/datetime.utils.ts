/**
 * Formats a datetime value by reading the clock time directly.
 *
 * This does not apply local timezone conversion. For string inputs, it parses
 * the hour/minute from the incoming value. For Date inputs, it first converts
 * the Date to an ISO string, then reads the UTC clock time from that string.
 *
 * Returns a 12-hour display string like "1:49 PM".
 *
 * Example:
 * - "2026-07-01T13:49:57.000Z" -> "1:49 PM"
 * - new Date("2026-07-01T13:49:57.000Z") -> "1:49 PM"
 */
export function formatIsoDateTimeToTime(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const text = value instanceof Date
    ? value.toISOString()
    : String(value).trim();

  const match = /T?(\d{2}):(\d{2})/.exec(text);

  if (!match) {
    return text;
  }

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

const SHIFT_HOURS = 8;

export function getShiftProgressHours(startTimeValue: string | Date | null | undefined): string {
  if (!startTimeValue) return '0.00';

  const text = String(startTimeValue);

  // Works with:
  // "2026-07-01 13:49:57"
  // "2026-07-01T13:49:57.000Z"
  // "13:49:57"
  const match = /(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);

  if (!match) return '0.00';

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const startSecond = Number(match[3] || 0);

  const now = new Date();

  const start = new Date();
  start.setHours(startHour, startMinute, startSecond, 0);

  // If shift started yesterday and crossed midnight
  if (start.getTime() > now.getTime()) {
    start.setDate(start.getDate() - 1);
  }

  const elapsedHours =
    (now.getTime() - start.getTime()) / (1000 * 60 * 60);

  const safeElapsed = Math.max(0, Math.min(elapsedHours, SHIFT_HOURS));

  return safeElapsed.toFixed(2);
}