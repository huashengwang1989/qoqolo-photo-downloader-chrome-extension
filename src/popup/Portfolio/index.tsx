import React, { useCallback, useEffect, useState } from 'react';

import { MonthDatePicker } from './components/MonthDatePicker';
import PortfolioItem from './components/PortfolioItem';
import { handleStartCrawl, handleStopCrawl } from './helpers/handleCrawlActions';
import { exportPortfolioBatch } from './helpers/exportPortfolioBatch';
import { useCrawlControl } from './helpers/useCrawlControl';
import { usePortfolioItems } from './helpers/usePortfolioItems';
import { useDateStorage } from './helpers/useDateStorage/index';

import { MAX_CRAWL_COUNT_PER_TIME } from '@/configs';
import { CrawlActionsBar } from '@/shared/components/CrawlActionsBar';
import { SIGNALS } from '@/shared/enums';
import type { MonthDate as SharedMonthDate } from '@/shared/types';

import './Portfolio.scss';

const Portfolio: React.FC = () => {
  const { items, setItems } = usePortfolioItems();
  const [isDownloading, setIsDownloading] = useState(false);

  // Date storage and validation
  const { dateFrom, dateTo, setDateFrom, setDateTo, maxDate, isDateRangeValid } = useDateStorage();

  // Crawl control hook
  const {
    isLoading,
    isStopping,
    onStartCrawl: handleStartCrawlInternal,
    onStopCrawl: onStopCrawl,
  } = useCrawlControl({
    completionSignal: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
    maxCrawlCount: MAX_CRAWL_COUNT_PER_TIME,
    itemCount: items.length,
    clearItems: () => setItems([]),
    startCrawl: async () => {
      // Convert MonthDate to SharedMonthDate format
      const dateRange: { from: SharedMonthDate | null; to: SharedMonthDate | null } = {
        from: dateFrom ? { year: dateFrom.year, month: dateFrom.month } : null,
        to: dateTo ? { year: dateTo.year, month: dateTo.month } : null,
      };

      await handleStartCrawl(
        dateRange,
        () => {
          // onStart - crawl started successfully
          // Loading state will be set to false when PORTFOLIO_CRAWL_COMPLETE is received
        },
        (error) => {
          // onError - error handling is done in useCrawlControl
          throw new Error(error);
        },
      );
    },
    stopCrawl: async () => {
      await handleStopCrawl((error) => {
        // onError - error handling is done in useCrawlControl
        throw new Error(error);
      });
    },
  });

  const onStartCrawl = useCallback(async () => {
    if (!isDateRangeValid) {
      return; // Don't start if date range is invalid
    }
    await handleStartCrawlInternal();
  }, [isDateRangeValid, handleStartCrawlInternal]);

  const onBatchDownload = useCallback(async () => {
    if (items.length === 0 || isDownloading || isLoading) {
      return;
    }

    setIsDownloading(true);
    try {
      await exportPortfolioBatch(items);
    } catch (error) {
      console.error('[popup] Failed to export batch', error);
      window.alert('Failed to export batch. Please check the console for details.');
    } finally {
      setIsDownloading(false);
    }
  }, [items, isDownloading, isLoading]);

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

  const dateRangeSection = (
    <>
      <MonthDatePicker label="From" value={dateFrom} onChange={setDateFrom} maxDate={maxDate} />
      <MonthDatePicker label="To" value={dateTo} onChange={setDateTo} maxDate={maxDate} />
    </>
  );

  return (
    <div className="portfolio-container">
      <CrawlActionsBar
        dateRangeSection={dateRangeSection}
        onStartCrawl={onStartCrawl}
        onStopCrawl={onStopCrawl}
        onDownload={onBatchDownload}
        isLoading={isLoading}
        isStopping={isStopping}
        isDownloading={isDownloading}
        isStartDisabled={!isDateRangeValid}
        maxCrawlCount={MAX_CRAWL_COUNT_PER_TIME}
        showDownload={items.length > 0}
      />

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
