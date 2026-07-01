const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
type DateTimeParts = {
  hasDate: boolean;
  year: number | null;
  month: number | null;
  day: number | null;
  hour: number;
  minute: number;
  second: number;
};

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
  return formatHoursToHM(getShiftProgressDecimal(startTimeValue));
}

export function getShiftProgressDecimal(
  startTimeValue: string | Date | null | undefined
): number {
  if (!startTimeValue) return 0;

  const text = String(startTimeValue);
  const match = /(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);

  if (!match) return 0;

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);
  const startSecond = Number(match[3] || 0);

  const now = new Date();

  const start = new Date();
  start.setHours(startHour, startMinute, startSecond, 0);

  if (start.getTime() > now.getTime()) {
    start.setDate(start.getDate() - 1);
  }

  const elapsedHours =
    (now.getTime() - start.getTime()) / (1000 * 60 * 60);

  return Math.max(0, Math.min(elapsedHours, SHIFT_HOURS));
}

function extractDateTimeParts(value: string | Date | null | undefined): DateTimeParts | null {
  if (!value) return null;

  const text = value instanceof Date
    ? value.toISOString()
    : String(value).trim();

  const match = /(?:(\d{4})-(\d{2})-(\d{2})[T\s])?(\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);

  if (!match) return null;

  return {
    hasDate: Boolean(match[1]),
    year: match[1] ? Number(match[1]) : null,
    month: match[2] ? Number(match[2]) : null,
    day: match[3] ? Number(match[3]) : null,
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
}

function createDateFromParts(parts: DateTimeParts, fallbackDate: Date): Date {
  if (parts.hasDate && parts.year && parts.month && parts.day) {
    return new Date(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    );
  }

  return new Date(
    fallbackDate.getFullYear(),
    fallbackDate.getMonth(),
    fallbackDate.getDate(),
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
}


export function getShiftRemainingHours(
  startTimeValue: string | Date | null | undefined
): string {
  const elapsed = getShiftProgressDecimal(startTimeValue);
  const remaining = Math.max(0, SHIFT_HOURS - elapsed);

  return formatHoursToHM(remaining);
}

export function formatShiftDurationDisplay(
  startTimeValue: string | Date | null | undefined,
  endTimeValue: string | Date | null | undefined
): string {
  const startParts = extractDateTimeParts(startTimeValue);

  if (!startParts) return '—';

  // Active / no end time yet
  if (!endTimeValue) {
    return formatHoursToHM(getShiftProgressDecimal(startTimeValue));
  }

  const endParts = extractDateTimeParts(endTimeValue);

  if (!endParts) return '—';

  const now = new Date();
  const start = createDateFromParts(startParts, now);
  const end = createDateFromParts(endParts, start);

  // If only clock time was provided and end is earlier, assume shift crossed midnight.
  if (!endParts.hasDate && end.getTime() < start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const safeDuration = Math.max(0, durationHours);

  return formatHoursToHM(safeDuration);
}

export function formatHoursToHM(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return '0m';

  const totalMinutes = Math.round(hours * 60);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}m`;
}
