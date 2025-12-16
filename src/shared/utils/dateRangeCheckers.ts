import { checkIsDateInRange } from './dateRange';
import type { MonthDate } from '@/shared/types';
import type { Item } from '@/shared/types/item';

/**
 * Check if any items are within the date range
 * @param items - Array of items to check
 * @param dateRange - Date range to check against
 * @returns true if at least one item is within range, false otherwise
 */
export function hasItemsInRange(
  items: Item[],
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
): boolean {
  // If no date range, consider all items valid
  if (!dateRange) {
    return true;
  }

  // Check each item's publishDate
  for (const item of items) {
    if (item.publishDate && checkIsDateInRange(item.publishDate, dateRange)) {
      return true; // Found at least one item within range
    }
  }

  return false; // No items found within range
}

/**
 * Check if all items are before the "From" date
 * Items are sorted chronologically from latest to earliest, so if all items are before "From",
 * there's no point continuing to scroll (items will only get older)
 * @param items - Array of items to check
 * @param dateRange - Date range to check against
 * @returns true if all items with dates are before the "From" date, false otherwise
 */
export function areAllItemsBeforeFrom(
  items: Item[],
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
): boolean {
  // If no date range or no "From" date, can't determine if all are before
  if (!dateRange || !dateRange.from) {
    return false;
  }

  let hasAnyItem = false;

  // Check each item's publishDate
  for (const item of items) {
    if (!item.publishDate) {
      continue; // Skip if no date found
    }

    hasAnyItem = true;

    // Parse the item's date
    const dateMatch = item.publishDate.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!dateMatch) {
      continue; // Skip if date format is unexpected
    }

    const [, yearStr, monthStr] = dateMatch;
    const itemYear = parseInt(yearStr, 10);
    const itemMonth = parseInt(monthStr, 10);

    // Check if item is NOT before "From" date (i.e., is within or after range)
    // If itemYear > from.year, item is after "From"
    // If itemYear === from.year && itemMonth >= from.month, item is within or after "From"
    if (itemYear > dateRange.from.year) {
      return false; // Found at least one item after "From"
    }
    if (itemYear === dateRange.from.year && itemMonth >= dateRange.from.month) {
      return false; // Found at least one item within or after "From"
    }
  }

  // If we have items but all are before "From", return true
  return hasAnyItem;
}

/**
 * Check if all items are after the "To" date
 * Items are sorted chronologically from latest to earliest, so if all items are after "To",
 * we should scroll down to load earlier items that might be within range
 * @param items - Array of items to check
 * @param dateRange - Date range to check against
 * @returns true if all items with dates are after the "To" date, false otherwise
 */
export function areAllItemsAfterTo(
  items: Item[],
  dateRange?: { from: MonthDate | null; to: MonthDate | null },
): boolean {
  // If no date range or no "To" date, can't determine if all are after
  if (!dateRange || !dateRange.to) {
    return false;
  }

  let hasAnyItem = false;

  // Check each item's publishDate
  for (const item of items) {
    if (!item.publishDate) {
      continue; // Skip if no date found
    }

    hasAnyItem = true;

    // Parse the item's date
    const dateMatch = item.publishDate.match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!dateMatch) {
      continue; // Skip if date format is unexpected
    }

    const [, yearStr, monthStr] = dateMatch;
    const itemYear = parseInt(yearStr, 10);
    const itemMonth = parseInt(monthStr, 10);

    // Check if item is NOT after "To" date (i.e., is within or before range)
    // If itemYear < to.year, item is before "To"
    // If itemYear === to.year && itemMonth <= to.month, item is within or before "To"
    if (itemYear < dateRange.to.year) {
      return false; // Found at least one item before "To"
    }
    if (itemYear === dateRange.to.year && itemMonth <= dateRange.to.month) {
      return false; // Found at least one item within or before "To"
    }
  }

  // If we have items but all are after "To", return true
  return hasAnyItem;
}

