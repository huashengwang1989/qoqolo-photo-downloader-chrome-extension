import type { MonthDate } from '../../../components/MonthDatePicker';
import { STORAGE_KEY_DATE_FROM } from '../constants';

/**
 * Save dateFrom to storage
 */
export function saveDateFrom(dateFrom: MonthDate | null): void {
  if (dateFrom === null) {
    chrome.storage.local.remove([STORAGE_KEY_DATE_FROM]);
  } else {
    chrome.storage.local.set({ [STORAGE_KEY_DATE_FROM]: dateFrom });
  }
}
