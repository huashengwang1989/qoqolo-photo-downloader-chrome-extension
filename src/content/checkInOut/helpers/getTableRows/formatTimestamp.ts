/**
 * Format timestamp from webpage text to YYYY-MM-DD HH:MM:SS (24-hour format)
 * The timestamp cell contains date and time in separate spans with whitespace:
 * <td><span>2025-12-17</span> 08:16:00 AM</td>
 *
 * @param timestamp - Raw timestamp string from textContent (may have extra whitespace)
 * @returns Formatted timestamp in YYYY-MM-DD HH:MM:SS format, or original if parsing fails
 */
export function formatTimestamp(timestamp: string): string {
  if (!timestamp) {
    return timestamp;
  }

  // Trim and split by space
  const trimmed = timestamp.trim();
  const parts = trimmed.split(/\s+/).filter((part) => part.length > 0);

  if (parts.length === 0) {
    return timestamp;
  }

  // arr[0] is YYYY-MM-DD
  const date = parts[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return timestamp;
  }

  // If no time part, return just the date
  if (parts.length === 1) {
    return date;
  }

  // arr[1]?.trim() is HH:MM:SS AM/PM (if there is)
  // Combine remaining parts (in case time has spaces: "08:16:00 AM")
  const timePart = parts.slice(1).join(' ').trim();

  // Match pattern: HH:MM:SS AM/PM
  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i);
  if (!timeMatch) {
    // If time format doesn't match, return date only
    return date;
  }

  const [, hourStr, minute, second, ampm] = timeMatch;
  let hour = parseInt(hourStr, 10);

  // Convert to 24-hour format
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  // Format hour with leading zero
  const hour24 = hour.toString().padStart(2, '0');

  return `${date} ${hour24}:${minute}:${second}`;
}
