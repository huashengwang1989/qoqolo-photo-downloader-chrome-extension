import React from 'react';

import type { CheckInOutMonthItem } from '@/shared/types/checkInOut';

import '../CheckInOut.scss';

interface MonthItemContentProps {
  monthItem: CheckInOutMonthItem;
  index: number;
  totalItems: number;
}

/**
 * Format date from YYYY-MM-DD to MM-DD for display
 */
function formatDateForDisplay(date: string): string {
  if (!date || !date.includes('-')) {
    return date;
  }
  const parts = date.split('-');
  if (parts.length >= 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return date;
}

export const MonthItemContent: React.FC<MonthItemContentProps> = ({
  monthItem,
  index,
  totalItems,
}) => {
  const { yearMonth, dailyRecords, images, url } = monthItem;

  return (
    <div className="month-item-content">
      <div className="item-section">
        <strong>Month:</strong> {yearMonth}
        {index !== undefined && totalItems !== undefined && (
          <span className="month-item-count">
            {' '}
            ({index + 1} of {totalItems})
          </span>
        )}
      </div>
      <div className="item-section">
        <strong>Link:</strong>{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" className="item-link">
          {url}
        </a>
      </div>
      <div className="item-section">
        <strong>Daily Records:</strong> {dailyRecords.length}
      </div>
      <div className="item-section">
        <strong>Images:</strong> {images.length}
      </div>
      {dailyRecords.length > 0 && (
        <div className="item-section">
          <strong>Daily Check-in/out Records:</strong>
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Drop-off Time</th>
                  <th>Drop-off Person</th>
                  <th>Pick-up Time</th>
                  <th>Pick-up Person</th>
                  <th className="photo-column">In</th>
                  <th className="photo-column">Out</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords.map((record, recordIndex) => (
                  <tr key={recordIndex}>
                    <td>{formatDateForDisplay(record.date)}</td>
                    <td>
                      <div>{record.dropTs}</div>
                      {record.dropComment && <div className="comment">{record.dropComment}</div>}
                    </td>
                    <td>{record.dropPerson}</td>
                    <td>
                      <div>{record.pickTs}</div>
                      {record.pickComment && <div className="comment">{record.pickComment}</div>}
                    </td>
                    <td>{record.pickPerson}</td>
                    <td className="photo-column">
                      {record.checkInPhotoLink ? (
                        <a href={record.checkInPhotoLink} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      ) : (
                        <span className="no-image">—</span>
                      )}
                    </td>
                    <td className="photo-column">
                      {record.checkOutPhotoLink ? (
                        <a
                          href={record.checkOutPhotoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="no-image">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
