/**
 * Parses a date string coming from MySQL which is stored in UTC
 * but might be missing the 'Z' suffix when sent via JSON.
 * By appending 'Z', `new Date()` correctly parses it as UTC
 * and `toLocaleDateString`/`toLocaleTimeString` will correctly 
 * display it in the user's local timezone (UTC+8).
 * 
 * @param dateString - The date string from the API (e.g., "2024-05-20 10:00:00")
 * @returns A Date object correctly representing the UTC time
 */
export function parseSQLDate(dateString: string | Date | null | undefined): Date {
  if (!dateString) {
    return new Date(); // fallback
  }

  if (dateString instanceof Date) {
    return dateString;
  }
  
  let str = String(dateString);
  
  // If the string doesn't end with Z and doesn't contain a timezone offset, assume UTC
  if (!str.endsWith('Z') && !str.match(/[+-]\d{2}:\d{2}$/)) {
    // Some formats use space instead of T, replace space with T if needed
    // "2024-05-20 10:00:00" -> "2024-05-20T10:00:00Z"
    if (str.includes(' ') && !str.includes('T')) {
      str = str.replace(' ', 'T');
    }
    str += 'Z';
  }
  
  return new Date(str);
}
