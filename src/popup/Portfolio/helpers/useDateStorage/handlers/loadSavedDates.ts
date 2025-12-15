import type { MonthDate } from '../../../components/MonthDatePicker';
import { STORAGE_KEY_DATE_FROM, STORAGE_KEY_DATE_TO } from '../constants';
import { isCurrentMonth } from '../utils/isCurrentMonth';
import { isDateSelectable } from '../utils/isDateSelectable';

/**
 * Load saved date selections from storage
 */
export function loadSavedDates(
  maxDate: MonthDate,
  setDateFrom: (date: MonthDate | null) => void,
  setDateTo: (date: MonthDate | null) => void,
  setIsInitialized: (initialized: boolean) => void,
): void {
  chrome.storage.local.get([STORAGE_KEY_DATE_FROM, STORAGE_KEY_DATE_TO], (result) => {
    // Load dateFrom
    if (result[STORAGE_KEY_DATE_FROM]) {
      const savedFrom = result[STORAGE_KEY_DATE_FROM] as MonthDate;
      if (isDateSelectable(savedFrom, maxDate)) {
        setDateFrom(savedFrom);
      }
    }

    // Load dateTo (only if not current month)
    if (result[STORAGE_KEY_DATE_TO]) {
      const savedTo = result[STORAGE_KEY_DATE_TO] as MonthDate;
      // Don't load if it's the current month (should be cleared)
      if (!isCurrentMonth(savedTo, maxDate) && isDateSelectable(savedTo, maxDate)) {
        setDateTo(savedTo);
      } else if (isCurrentMonth(savedTo, maxDate)) {
        // Clear storage if it's current month
        chrome.storage.local.remove([STORAGE_KEY_DATE_TO]);
      }
    }

    setIsInitialized(true);
  });
}
