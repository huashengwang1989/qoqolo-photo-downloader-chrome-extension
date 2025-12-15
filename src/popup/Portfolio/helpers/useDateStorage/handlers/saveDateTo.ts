import type { MonthDate } from '../../../components/MonthDatePicker';
import { STORAGE_KEY_DATE_TO } from '../constants';
import { isCurrentMonth } from '../utils/isCurrentMonth';

/**
 * Save dateTo to storage
 * Special handling: if current month is selected, clear storage instead
 */
export function saveDateTo(dateTo: MonthDate | null, maxDate: MonthDate): void {
  if (dateTo === null) {
    chrome.storage.local.remove([STORAGE_KEY_DATE_TO]);
  } else if (isCurrentMonth(dateTo, maxDate)) {
    // If current month is selected, don't remember it - clear storage
    chrome.storage.local.remove([STORAGE_KEY_DATE_TO]);
  } else {
    chrome.storage.local.set({ [STORAGE_KEY_DATE_TO]: dateTo });
  }
}

