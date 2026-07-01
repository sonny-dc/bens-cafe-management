import { APP_TIME_ZONE } from 'shared/constants';

/**
 * Parses a SQL date/time value without forcing a timezone shift.
 *
 * - Timezone-aware strings are parsed as-is.
 * - MySQL DATETIME strings are treated as wall-clock local values.
 * - Date-only values are normalized to local midnight.
 *
 * This avoids double-converting timestamps that are already stored in the
 * intended display timezone.
 *
 * @param dateString - The date string from the API (e.g., "2024-05-20 10:00:00")
 * @returns A Date object representing the same wall-clock time.
 */
export function parseSQLDate(dateString: string | Date | null | undefined): Date {
  if (!dateString) {
    return new Date(NaN);
  }

  if (dateString instanceof Date) {
    return dateString;
  }

  const str = String(dateString).trim();

  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(str)) {
    return new Date(str);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00`);
  }

  const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
  return new Date(normalized);
}

function formatInAppTimeZone(
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  const date = parseSQLDate(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatSQLDateTimeInAppTimeZone(
  dateString: string | Date | null | undefined
): string {
  return formatInAppTimeZone(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSQLDateInAppTimeZone(
  dateString: string | Date | null | undefined
): string {
  return formatInAppTimeZone(dateString, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSQLTimeInAppTimeZone(
  dateString: string | Date | null | undefined
): string {
  return formatInAppTimeZone(dateString, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAppDateKey(dateString: string | Date | null | undefined): string {
  const date = parseSQLDate(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
