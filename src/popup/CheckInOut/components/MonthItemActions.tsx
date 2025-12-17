import React, { useCallback } from 'react';

import { exportMonthForCheckInOut } from '../helpers/exportMonth';
import { generateCSVForCheckInOut } from '../helpers/generateCSV';

import { ItemActions as SharedItemActions } from '@/shared/components/ItemActions';
import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';

import '../CheckInOut.scss';

interface MonthItemActionsProps {
  monthItem: CheckInOutMonthItem;
}

export const MonthItemActions: React.FC<MonthItemActionsProps> = ({ monthItem }) => {
  const handleCopy = useCallback(async () => {
    try {
      const csvContent = generateCSVForCheckInOut(monthItem.dailyRecords);
      await navigator.clipboard.writeText(csvContent);
    } catch (error) {
      console.error('[popup] Failed to copy CSV to clipboard:', error);
      window.alert('Failed to copy CSV to clipboard. Please check the console for details.');
      throw error;
    }
  }, [monthItem.dailyRecords]);

  const handleExport = useCallback(async () => {
    try {
      await exportMonthForCheckInOut(monthItem);
    } catch (error) {
      console.error('[popup] Failed to export month:', error);
      window.alert('Failed to export month. Please check the console for details.');
      throw error;
    }
  }, [monthItem]);

  return (
    <SharedItemActions
      onCopy={handleCopy}
      onExport={handleExport}
      copyTitle="Copy CSV to clipboard"
      exportTitle="Export month as ZIP (images + CSV)"
      containerClassName="month-item-actions"
      buttonClassName="action-button"
    />
  );
};
