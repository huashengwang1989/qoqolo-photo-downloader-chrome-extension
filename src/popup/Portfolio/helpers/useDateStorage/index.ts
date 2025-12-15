import { useEffect, useMemo, useState } from 'react';

import type { MonthDate } from '../../components/MonthDatePicker';

import { loadSavedDates } from './handlers/loadSavedDates';
import { saveDateFrom } from './handlers/saveDateFrom';
import { saveDateTo } from './handlers/saveDateTo';
import { getCurrentMonth } from './utils/getCurrentMonth';
import { isDateRangeValid } from './utils/isDateRangeValid';

/**
 * Custom hook to manage date range storage and persistence
 * @returns Object containing dateFrom, dateTo, setters, maxDate, and validation
 */
export function useDateStorage() {
  const [dateFrom, setDateFrom] = useState<MonthDate | null>(null);
  const [dateTo, setDateTo] = useState<MonthDate | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current month as max date
  const maxDate = useMemo<MonthDate>(() => getCurrentMonth(), []);

  // Load saved date selections from storage on mount
  useEffect(() => {
    loadSavedDates(maxDate, setDateFrom, setDateTo, setIsInitialized);
  }, [maxDate]);

  // Save dateFrom to storage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    saveDateFrom(dateFrom);
  }, [dateFrom, isInitialized]);

  // Save dateTo to storage whenever it changes (after initialization)
  // Special handling: if current month is selected, clear storage instead
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    saveDateTo(dateTo, maxDate);
  }, [dateTo, maxDate, isInitialized]);

  // Check if date range is valid (from <= to)
  const dateRangeValid = useMemo(() => {
    return isDateRangeValid(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    maxDate,
    isDateRangeValid: dateRangeValid,
  };
}
