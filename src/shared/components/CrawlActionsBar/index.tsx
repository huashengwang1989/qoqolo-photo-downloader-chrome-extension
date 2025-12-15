import { faDownload, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { ReactNode } from 'react';

import './CrawlActionsBar.scss';

export interface CrawlActionsBarProps {
  /** Date range section (e.g., date pickers) */
  dateRangeSection: ReactNode;
  /** Callback when start crawl button is clicked */
  onStartCrawl: () => void;
  /** Callback when stop crawl button is clicked */
  onStopCrawl: () => void;
  /** Callback when download button is clicked */
  onDownload?: () => void;
  /** Whether crawl is currently loading */
  isLoading: boolean;
  /** Whether crawl is currently stopping */
  isStopping: boolean;
  /** Whether download is in progress */
  isDownloading?: boolean;
  /** Whether start button should be disabled */
  isStartDisabled?: boolean;
  /** Maximum crawl count to display in start button */
  maxCrawlCount: number;
  /** Whether to show download button */
  showDownload?: boolean;
}

/**
 * Reusable crawl actions bar component
 * Displays date range section, start/stop buttons, and optional download button
 */
export const CrawlActionsBar: React.FC<CrawlActionsBarProps> = ({
  dateRangeSection,
  onStartCrawl,
  onStopCrawl,
  onDownload,
  isLoading,
  isStopping,
  isDownloading = false,
  isStartDisabled = false,
  maxCrawlCount,
  showDownload = false,
}) => {
  return (
    <div className="crawl-actions-bar">
      <div className="crawl-actions-date-range">{dateRangeSection}</div>
      <div className="crawl-actions-buttons">
        <button onClick={onStartCrawl} disabled={isLoading || isStartDisabled}>
          <FontAwesomeIcon icon={faPlay} />
          <span>{isLoading ? 'Crawling...' : `Start Crawl (max: ${maxCrawlCount})`}</span>
        </button>
        {(isLoading || isStopping) && (
          <button onClick={onStopCrawl} className="stop-button" disabled={isStopping}>
            <FontAwesomeIcon icon={faStop} />
            <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
          </button>
        )}
        {showDownload && (
          <>
            <div className="flex-spacer" />
            <button
              onClick={onDownload}
              className="download-button"
              disabled={isLoading || isDownloading}
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
