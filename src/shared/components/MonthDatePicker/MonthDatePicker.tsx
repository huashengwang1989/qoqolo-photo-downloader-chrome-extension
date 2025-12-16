import React, { useCallback } from 'react';

import type { MonthDate } from '@/shared/types';

import './MonthDatePicker.scss';

type MonthDatePickerProps = {
  label: string;
  value: MonthDate | null;
  onChange: (value: MonthDate | null) => void;
  maxDate: MonthDate; // Maximum selectable date (current month)
};

/**
 * Month date picker component
 * Allows selection of year and month up to maxDate
 */
export const MonthDatePicker: React.FC<MonthDatePickerProps> = ({
  label,
  value,
  onChange,
  maxDate,
}) => {
  // Generate year options (from 2020 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  // Generate month options (1-12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const year = parseInt(e.target.value, 10);
      if (isNaN(year)) {
        onChange(null);
        return;
      }

      // If year is maxDate.year, limit month to maxDate.month
      const maxMonth = year === maxDate.year ? maxDate.month : 12;
      const month = value?.month ? Math.min(value.month, maxMonth) : maxMonth;

      onChange({ year, month });
    },
    [onChange, maxDate, value],
  );

  const handleMonthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const month = parseInt(e.target.value, 10);
      if (isNaN(month) || !value) {
        onChange(null);
        return;
      }

      onChange({ ...value, month });
    },
    [onChange, value],
  );

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Determine max selectable month based on selected year
  const maxSelectableMonth = value?.year === maxDate.year ? maxDate.month : 12;

  return (
    <div className="month-date-picker">
      <label className="month-date-picker-label">{label}</label>
      <div className="month-date-picker-controls">
        <select
          className="month-date-picker-select"
          value={value?.year ?? ''}
          onChange={handleYearChange}
        >
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          className="month-date-picker-select"
          value={value?.month ?? ''}
          onChange={handleMonthChange}
          disabled={!value?.year}
        >
          <option value="">Month</option>
          {months
            .filter((month) => month <= maxSelectableMonth)
            .map((month) => (
              <option key={month} value={month}>
                {new Date(2000, month - 1).toLocaleString('en-US', { month: 'short' })}
              </option>
            ))}
        </select>
        {value && (
          <button
            type="button"
            className="month-date-picker-clear"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

