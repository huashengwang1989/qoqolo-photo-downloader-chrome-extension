import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useState } from 'react';

import './ItemActions.scss';

export interface ItemActionsProps {
  /** Handler for copy action */
  onCopy: () => Promise<void>;
  /** Handler for export action */
  onExport: () => Promise<void>;
  /** Optional title for copy button */
  copyTitle?: string;
  /** Optional title for export button */
  exportTitle?: string;
  /** Optional className for the container */
  containerClassName?: string;
  /** Optional className for buttons */
  buttonClassName?: string;
}

/**
 * Shared component for item actions (Copy and Export buttons)
 * Used by Portfolio, ClassActivity, and CheckInOut
 */
export const ItemActions: React.FC<ItemActionsProps> = ({
  onCopy,
  onExport,
  copyTitle = 'Copy',
  exportTitle = 'Export',
  containerClassName = 'item-actions',
  buttonClassName = 'item-action-button',
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await onCopy();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error('[ItemActions] Copy failed:', error);
      // Re-throw to allow parent to handle error (e.g., show alert)
      throw error;
    }
  }, [onCopy]);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return; // Prevent multiple simultaneous exports
    }

    setIsExporting(true);
    try {
      await onExport();
    } catch (error) {
      console.error('[ItemActions] Export failed:', error);
      // Re-throw to allow parent to handle error (e.g., show alert)
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [onExport, isExporting]);

  return (
    <div className={containerClassName}>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleCopy}
        disabled={isExporting}
        title={copyTitle}
      >
        <FontAwesomeIcon icon={faCopy} />
        <span>Copy</span>
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleExport}
        disabled={isExporting}
        title={exportTitle}
      >
        <FontAwesomeIcon icon={faDownload} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>
      {isCopied && <span className="item-action-status">Copied</span>}
    </div>
  );
};

