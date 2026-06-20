import { DateTime } from "luxon";
import {APP_TIME_ZONE, MYSQL_DATETIME_FORMAT, MYSQL_DATE_FORMAT, MYSQL_TIME_FORMAT} from "../config/constants.js";


/**
 * Converts a given time to the application's time zone.
 * @param time - The time to convert, in ISO 8601 format or as a Date object.
 * @returns The converted time in the application's time zone as a Date object.
 */
export function convertToAppTimeZone(time: string | Date): DateTime {
    const dateTime = DateTime.fromJSDate(new Date(time)).setZone(APP_TIME_ZONE);
    return dateTime;
}

/**
 * Formats a date and time for MySQL compatibility.
 * @param date - The date and time to format.
 * @returns The formatted date and time as a string.
 */
export function formatDateTimeForMySQL(date: Date): string {
    return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat(MYSQL_DATETIME_FORMAT);
}

/**
 * Formats a date for MySQL compatibility.
 * @param date - The date to format.
 * @returns The formatted date as a string.
 */
export function formatDateForMySQL(date: Date): string {
    return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat(MYSQL_DATE_FORMAT);
}

/**
 * Formats a time for MySQL compatibility.
 * @param date - The time to format.
 * @returns The formatted time as a string.
 */
export function formatTimeForMySQL(date: Date): string {
    return DateTime.fromJSDate(date).setZone(APP_TIME_ZONE).toFormat(MYSQL_TIME_FORMAT);
}

/**
 * Parses a date and time string in MySQL format to a DateTime object.
 * @param dateTimeString - The date and time string in MySQL format.
 * @returns The parsed DateTime object.
 */
export function parseMySQLDateTime(dateTimeString: string): DateTime {
    return DateTime.fromFormat(dateTimeString, MYSQL_DATETIME_FORMAT, { zone: APP_TIME_ZONE });
}

/**
 * Gets the current date and time in the application's time zone, formatted for MySQL compatibility.
 * @returns The formatted date and time as a string.
 */
export function getCurrentAppDateTime(): string {
    return DateTime.now().setZone(APP_TIME_ZONE).toFormat(MYSQL_DATETIME_FORMAT);
}
