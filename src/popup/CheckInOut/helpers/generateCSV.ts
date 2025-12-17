import type { DailyCheckInOut } from '@/shared/types/checkInOut';

/**
 * CSV columns in the correct order
 * Note: Photo links are excluded from CSV (available in JSON export)
 */
const CSV_COLUMNS = [
  'idx',
  'date',
  'button_id',
  'drop_ts',
  'drop_person',
  'drop_comment',
  'pick_ts',
  'pick_person',
  'pick_comment',
] as const;

/**
 * Escape CSV value (handle quotes and commas)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert daily record to CSV row
 * Note: Photo links are excluded from CSV (available in JSON export)
 * Timestamps are already formatted to YYYY-MM-DD HH:MM:SS (24-hour format) at source
 */
function recordToCSVRow(record: DailyCheckInOut): string {
  const values = [
    record.idx.toString(),
    record.date,
    record.buttonId,
    record.dropTs,
    record.dropPerson,
    record.dropComment,
    record.pickTs,
    record.pickPerson,
    record.pickComment,
  ];

  return values.map(escapeCSVValue).join(',');
}

/**
 * Generate CSV content from daily records
 * @param records - Array of daily check-in/out records
 * @returns CSV content as string (UTF-8)
 */
export function generateCSVForCheckInOut(records: DailyCheckInOut[]): string {
  // CSV header
  const header = CSV_COLUMNS.join(',');

  // CSV rows
  const rows = records.map(recordToCSVRow);

  // Combine header and rows
  return [header, ...rows].join('\n');
}
