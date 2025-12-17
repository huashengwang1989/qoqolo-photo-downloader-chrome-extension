/**
 * Daily check-in/out record
 */
export type DailyCheckInOut = {
  /** Index (0-based) */
  idx: number;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Button ID from the page */
  buttonId: string;
  /** Drop-off timestamp */
  dropTs: string;
  /** Drop-off person name */
  dropPerson: string;
  /** Drop-off comment */
  dropComment: string;
  /** Pick-up timestamp */
  pickTs: string;
  /** Pick-up person name */
  pickPerson: string;
  /** Pick-up comment */
  pickComment: string;
  /** Check-in photo link (added for CSV) */
  checkInPhotoLink?: string;
  /** Check-out photo link (added for CSV) */
  checkOutPhotoLink?: string;
};

/**
 * Check-in/out image information
 */
export type CheckInOutImage = {
  /** "in" or "out" */
  inout: 'in' | 'out';
  /** Image source URL */
  src: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Filename to rename as (e.g., "2025-01-15-in") */
  renameAs: string;
};

/**
 * Check-in/out month item (represents one month of check-in/out data)
 */
export type CheckInOutMonthItem = {
  /** Year-month in YYYY-MM format (e.g., "2025-01") */
  yearMonth: string;
  /** URL for the month page */
  url: string;
  /** Daily check-in/out records for this month */
  dailyRecords: DailyCheckInOut[];
  /** Images for this month */
  images: CheckInOutImage[];
};
