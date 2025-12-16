import type { MonthDate } from '@/shared/types';

import { isCurrentMonth } from '../utils/isCurrentMonth';

/**
 * Save dateTo to storage
 * Special handling: if current month is selected, clear storage instead
 */
export function saveDateTo(
  storageKey: string,
  dateTo: MonthDate | null,
  maxDate: MonthDate,
): void {
  if (dateTo === null) {
    chrome.storage.local.remove([storageKey]);
  } else if (isCurrentMonth(dateTo, maxDate)) {
    // If current month is selected, don't remember it - clear storage
    chrome.storage.local.remove([storageKey]);
  } else {
    chrome.storage.local.set({ [storageKey]: dateTo });
  }
}

