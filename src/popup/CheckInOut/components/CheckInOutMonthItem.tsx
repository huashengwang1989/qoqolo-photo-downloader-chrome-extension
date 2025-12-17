import React from 'react';

import { MonthItemActions } from './MonthItemActions';
import { MonthItemContent } from './MonthItemContent';

import type { CheckInOutMonthItem as CheckInOutMonthItemType } from '@/shared/types/checkInOut';

import '../CheckInOut.scss';

interface CheckInOutMonthItemProps {
  monthItem: CheckInOutMonthItemType;
  index: number;
  totalItems: number;
}

export const CheckInOutMonthItem: React.FC<CheckInOutMonthItemProps> = ({
  monthItem,
  index,
  totalItems,
}) => {
  return (
    <div className="check-in-out-month-item">
      <MonthItemActions monthItem={monthItem} />
      <MonthItemContent monthItem={monthItem} index={index} totalItems={totalItems} />
    </div>
  );
};
