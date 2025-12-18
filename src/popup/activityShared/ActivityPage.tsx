import React, { useCallback, useEffect, useState } from 'react';

import { ActivityItem, exportBatch, useItems } from './index';

import { CrawlActionsBar } from '@/shared/components/CrawlActionsBar';
import { MonthDatePicker } from '@/shared/components/MonthDatePicker';
import { SIGNALS } from '@/shared/enums';
import { handleStartCrawl, handleStopCrawl } from '@/shared/hooks/useCrawlActions';
import { useCrawlControl } from '@/shared/hooks/useCrawlControl';
import { useDateStorage } from '@/shared/hooks/useDateStorage';
import type { MonthDate } from '@/shared/types';

import './activityShared.scss';

export interface ActivityPageConfig {
  /** Storage key for items */
  itemsStorageKey: string;
  /** Storage key for dateFrom (optional, uses default if not provided) */
  dateFromStorageKey?: string;
  /** Storage key for dateTo (optional, uses default if not provided) */
  dateToStorageKey?: string;
  /** Signal for items updated */
  itemsUpdatedSignal: SIGNALS;
  /** Signal for item added */
  itemAddedSignal: SIGNALS;
  /** Signal for crawl completion */
  completionSignal: SIGNALS;
  /** Signal for start crawl */
  startCrawlSignal: SIGNALS.PORTFOLIO_START_CRAWL | SIGNALS.CLASS_ACTIVITY_START_CRAWL;
  /** Signal for stop crawl */
  stopCrawlSignal: SIGNALS.PORTFOLIO_STOP_CRAWL | SIGNALS.CLASS_ACTIVITY_STOP_CRAWL;
  /** Batch filename prefix for exports */
  batchFilenamePrefix: string;
  /** Maximum crawl count for this activity type */
  maxCrawlCount: number;
  /** Empty state message */
  emptyStateMessage?: string;
  /** Container CSS class name */
  containerClassName?: string;
}

interface ActivityPageProps {
  config: ActivityPageConfig;
}

/**
 * Generic Activity Page component
 * Handles items management, crawling, date filtering, and batch export
 */
export const ActivityPage: React.FC<ActivityPageProps> = ({ config }) => {
  const {
    itemsStorageKey,
    dateFromStorageKey,
    dateToStorageKey,
    itemsUpdatedSignal,
    itemAddedSignal,
    completionSignal,
    startCrawlSignal,
    stopCrawlSignal,
    batchFilenamePrefix,
    maxCrawlCount,
    emptyStateMessage = 'No items found. Click "Start Crawl" to begin.',
    containerClassName = 'activity-container',
  } = config;

  const { items, setItems } = useItems({
    storageKey: itemsStorageKey,
    itemsUpdatedSignal,
    itemAddedSignal,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ downloaded: 0, total: 0 });

  // Date storage and validation
  const { dateFrom, dateTo, setDateFrom, setDateTo, maxDate, isDateRangeValid } = useDateStorage({
    storageKeyDateFrom: dateFromStorageKey,
    storageKeyDateTo: dateToStorageKey,
  });

  // Memoize startCrawl function to prevent recreation on every render
  const startCrawl = useCallback(async () => {
    console.info('[popup] activityShared - startCrawl', dateFrom, dateTo);

    // Convert MonthDate to SharedMonthDate format
    const dateRange: { from: MonthDate | null; to: MonthDate | null } = {
      from: dateFrom ? { year: dateFrom.year, month: dateFrom.month } : null,
      to: dateTo ? { year: dateTo.year, month: dateTo.month } : null,
    };

    await handleStartCrawl(
      startCrawlSignal,
      dateRange,
      () => {
        // onStart - crawl started successfully
        // Loading state will be set to false when completion signal is received
      },
      (error) => {
        // onError - error handling is done in useCrawlControl
        throw new Error(error);
      },
    );
  }, [dateFrom, dateTo, startCrawlSignal]);

  // Memoize stopCrawl function to prevent recreation on every render
  const stopCrawl = useCallback(async () => {
    await handleStopCrawl(stopCrawlSignal, (error) => {
      // onError - error handling is done in useCrawlControl
      throw new Error(error);
    });
  }, [stopCrawlSignal]);

  // Memoize clearItems function to prevent recreation on every render
  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  // Crawl control hook
  const {
    isLoading,
    isStopping,
    onStartCrawl: handleStartCrawlInternal,
    onStopCrawl: onStopCrawl,
  } = useCrawlControl({
    completionSignal,
    crawlStateStorageKey: `${itemsStorageKey}_crawlInProgress`,
    maxCrawlCount,
    itemCount: items.length,
    clearItems,
    startCrawl,
    stopCrawl,
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
    setDownloadProgress({ downloaded: 0, total: 0 });
    try {
      // Calculate total images
      const totalImages = items.reduce((sum, item) => sum + (item.details?.images?.length || 0), 0);
      setDownloadProgress({ downloaded: 0, total: totalImages });

      await exportBatch(items, { batchFilenamePrefix }, (downloaded, total) => {
        setDownloadProgress({ downloaded, total });
      });
    } catch (error) {
      console.error('[popup] Failed to export batch', error);
      window.alert('Failed to export batch. Please check the console for details.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ downloaded: 0, total: 0 });
    }
  }, [items, isDownloading, isLoading, batchFilenamePrefix]);

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
    <div className={containerClassName}>
      <CrawlActionsBar
        dateRangeSection={dateRangeSection}
        onStartCrawl={onStartCrawl}
        onStopCrawl={onStopCrawl}
        onDownload={onBatchDownload}
        isLoading={isLoading}
        isStopping={isStopping}
        isDownloading={isDownloading}
        isStartDisabled={!isDateRangeValid}
        maxCrawlCount={maxCrawlCount}
        showDownload={items.length > 0}
        downloadProgress={downloadProgress.downloaded}
        downloadTotal={downloadProgress.total}
      />

      <div className="activity-items">
        {items.length === 0 ? (
          <div className="empty-state">
            {isLoading ? 'Crawling...' : emptyStateMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <ActivityItem key={index} item={item} index={index} totalItems={items.length} />
          ))
        )}
      </div>
    </div>
  );
};
