import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MonthDatePicker, type MonthDate } from './components/MonthDatePicker';
import PortfolioItem from './components/PortfolioItem';
import { handleStartCrawl, handleStopCrawl } from './helpers/handleCrawlActions';
import { usePortfolioItems } from './helpers/usePortfolioItems';

import { MAX_CRAWL_COUNT_PER_TIME } from '@/configs';
import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage, MonthDate as SharedMonthDate } from '@/shared/types';

import './Portfolio.scss';

const Portfolio: React.FC = () => {
  const { items, setItems } = usePortfolioItems();
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [dateFrom, setDateFrom] = useState<MonthDate | null>(null);
  const [dateTo, setDateTo] = useState<MonthDate | null>(null);

  // Get current month as max date
  const maxDate = useMemo<MonthDate>(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // getMonth() returns 0-11
    };
  }, []);

  // Check if date range is valid (from <= to)
  const isDateRangeValid = useMemo(() => {
    // If either date is not set, range is valid (no filtering)
    if (!dateFrom || !dateTo) {
      return true;
    }

    // Compare year-month: from should be <= to
    // If from year is less than to year, it's valid
    if (dateFrom.year < dateTo.year) {
      return true;
    }

    // If from year is greater than to year, it's invalid
    if (dateFrom.year > dateTo.year) {
      return false;
    }

    // Same year: from month must be <= to month
    return dateFrom.month <= dateTo.month;
  }, [dateFrom, dateTo]);

  // Store timeout ID in a ref so we can clear it when crawl completes
  const timeoutRef = useRef<number | null>(null);

  // Listen for crawl completion
  useEffect(() => {
    const handleMessage = (
      message: BackgroundMessage,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (message.type === SIGNALS.PORTFOLIO_CRAWL_COMPLETE) {
        setIsLoading(false);
        setIsStopping(false);
        // Clear timeout if it exists
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const onStartCrawl = useCallback(async () => {
    if (!isDateRangeValid) {
      return; // Don't start if date range is invalid
    }

    setIsLoading(true);
    setItems([]); // Clear previous items

    // Set a timeout fallback in case the content script doesn't send completion message
    // This handles edge cases like: wrong page type, script errors, or network issues
    timeoutRef.current = setTimeout(() => {
      console.warn('[popup] Crawl timeout - resetting loading state');
      setIsLoading(false);
    }, 60000); // 60 seconds timeout (5 items * 1 second delay + processing time)

    // Convert MonthDate to SharedMonthDate format
    const dateRange: { from: SharedMonthDate | null; to: SharedMonthDate | null } = {
      from: dateFrom ? { year: dateFrom.year, month: dateFrom.month } : null,
      to: dateTo ? { year: dateTo.year, month: dateTo.month } : null,
    };

    await handleStartCrawl(
      dateRange,
      () => {
        // onStart - crawl started successfully
        // Loading state will be set to false when PORTFOLIO_ITEMS_UPDATED is received
        // The timeout will be cleared in the message handler when crawl completes
      },
      (error) => {
        // onError
        console.error('[popup] Failed to start crawl:', error);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsLoading(false);
      },
    );
  }, [setItems, dateFrom, dateTo, isDateRangeValid]);

  const onStopCrawl = useCallback(async () => {
    setIsStopping(true);
    await handleStopCrawl((error) => {
      console.error('[popup] Failed to stop crawl:', error);
      // If error, reset stopping state
      setIsStopping(false);
    });
    // Loading state will be set to false when PORTFOLIO_CRAWL_COMPLETE is received
  }, []);

  // Scroll to bottom smoothly when new items are added during loading
  useEffect(() => {
    if (isLoading && items.length > 0) {
      // Scroll window to bottom after DOM update
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [items.length, isLoading]);

  return (
    <div className="portfolio-container">
      <div className="portfolio-actions">
        <div className="portfolio-date-range">
          <MonthDatePicker label="From" value={dateFrom} onChange={setDateFrom} maxDate={maxDate} />
          <MonthDatePicker label="To" value={dateTo} onChange={setDateTo} maxDate={maxDate} />
        </div>
        <div className="portfolio-buttons">
          <button onClick={onStartCrawl} disabled={isLoading || !isDateRangeValid}>
            <FontAwesomeIcon icon={faPlay} />
            <span>
              {isLoading ? 'Crawling...' : `Start Crawl (max: ${MAX_CRAWL_COUNT_PER_TIME})`}
            </span>
          </button>
          {(isLoading || isStopping) && (
            <button onClick={onStopCrawl} className="stop-button" disabled={isStopping}>
              <FontAwesomeIcon icon={faStop} />
              <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="portfolio-items">
        {items.length === 0 ? (
          <div className="empty-state">No items found. Click "Start Crawl" to begin.</div>
        ) : (
          items.map((item, index) => (
            <PortfolioItem key={index} item={item} index={index} totalItems={items.length} />
          ))
        )}
      </div>
    </div>
  );
};

export default Portfolio;
