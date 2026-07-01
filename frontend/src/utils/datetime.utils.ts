const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

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

/**
 * Formats a datetime value into a human-readable string with the full date.
 * Example:
 * - "2026-07-01T13:49:57.000Z" -> "July 1, 2026"
 */
export function formatIsoDateTimeToDate(
  value: string | Date | null | undefined
): string {
  if (!value) {
    return '';
  }

  const text = value instanceof Date
    ? value.toISOString()
    : String(value).trim();

  const match = /(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (!match) {
    return text;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return `${monthNames[month - 1]} ${day}, ${year}`;
}

/**
 * Formats a datetime value into a human-readable string with the full date and time.
 * Example:
 * - "2026-07-01T13:49:57.000Z" -> "July 1, 2026 1:49 PM"
 */
export function formatIsoDateTimeToDateTime(
  value: string | Date | null | undefined
): string {
  if (!value) {
    return '';
  }

  const text = value instanceof Date
    ? value.toISOString()
    : String(value).trim();

  const match = /(\d{4})-(\d{2})-(\d{2})T?[\sT]?(\d{2}):(\d{2})/.exec(text);

  if (!match) {
    return text;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = match[5];

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${monthNames[month - 1]} ${day}, ${year} ${displayHour}:${minute} ${period}`;
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

export function getShiftRemainingHours(
  startTimeValue: string | Date | null | undefined
): string {
  const elapsed = Number(getShiftProgressHours(startTimeValue));
  const remaining = Math.max(0, SHIFT_HOURS - elapsed);

  return remaining.toFixed(2);
}

export function formatShiftDurationDisplay(
  startStr: string,
  endStr: string | null
): string {
  if (!startStr) return '—';

  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();

  const diffMs = Math.max(0, end.getTime() - start.getTime());

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  // Adaptive display
  if (hours > 0) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${remainingSeconds}s`;
}
