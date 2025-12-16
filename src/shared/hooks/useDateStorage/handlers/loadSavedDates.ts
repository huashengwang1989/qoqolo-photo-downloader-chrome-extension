import type { MonthDate } from '@/shared/types';

import { isCurrentMonth } from '../utils/isCurrentMonth';
import { isDateSelectable } from '../utils/isDateSelectable';

/**
 * Load saved date selections from storage
 */
export function loadSavedDates(
  storageKeyDateFrom: string,
  storageKeyDateTo: string,
  maxDate: MonthDate,
  setDateFrom: (date: MonthDate | null) => void,
  setDateTo: (date: MonthDate | null) => void,
  setIsInitialized: (initialized: boolean) => void,
): void {
  chrome.storage.local.get([storageKeyDateFrom, storageKeyDateTo], (result) => {
    // Load dateFrom
    if (result[storageKeyDateFrom]) {
      const savedFrom = result[storageKeyDateFrom] as MonthDate;
      if (isDateSelectable(savedFrom, maxDate)) {
        setDateFrom(savedFrom);
      }
    }

    // Load dateTo (only if not current month)
    if (result[storageKeyDateTo]) {
      const savedTo = result[storageKeyDateTo] as MonthDate;
      // Don't load if it's the current month (should be cleared)
      if (!isCurrentMonth(savedTo, maxDate) && isDateSelectable(savedTo, maxDate)) {
        setDateTo(savedTo);
      } else if (isCurrentMonth(savedTo, maxDate)) {
        // Clear storage if it's current month
        chrome.storage.local.remove([storageKeyDateTo]);
      }
    }

    setIsInitialized(true);
  });
}

