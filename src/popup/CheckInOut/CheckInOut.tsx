import React, { useCallback, useEffect, useState } from 'react';

import { CheckInOutMonthItem } from './components/CheckInOutMonthItem';
import { exportBatchForCheckInOut } from './helpers/exportBatch';
import { useCheckInOutItems } from './helpers/useCheckInOutItems';

import { MAX_CRAWL_COUNT } from '@/configs';
import { CrawlActionsBar } from '@/shared/components/CrawlActionsBar';
import { MonthDatePicker } from '@/shared/components/MonthDatePicker';
import { SIGNALS } from '@/shared/enums';
import { handleStartCrawl, handleStopCrawl } from '@/shared/hooks/useCrawlActions';
import { useCrawlControl } from '@/shared/hooks/useCrawlControl';
import { useDateStorage } from '@/shared/hooks/useDateStorage';
import type { MonthDate } from '@/shared/types';

import './CheckInOut.scss';

const CheckInOut: React.FC = () => {
  const { items, setItems } = useCheckInOutItems();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ downloaded: 0, total: 0 });

  const { dateFrom, dateTo, setDateFrom, setDateTo, maxDate, isDateRangeValid } = useDateStorage({
    storageKeyDateFrom: 'checkInOutDateFrom',
    storageKeyDateTo: 'checkInOutDateTo',
  });

  // Memoize startCrawl function to prevent recreation on every render
  const startCrawl = useCallback(async () => {
    console.info('[popup] CheckInOut - startCrawl', dateFrom, dateTo);
    const dateRange: { from: MonthDate | null; to: MonthDate | null } = {
      from: dateFrom ? { year: dateFrom.year, month: dateFrom.month } : null,
      to: dateTo ? { year: dateTo.year, month: dateTo.month } : null,
    };
    await handleStartCrawl(
      SIGNALS.CHECK_IN_OUT_START_CRAWL,
      dateRange,
      () => {},
      (error) => {
        throw new Error(error);
      },
    );
  }, [dateFrom, dateTo]);

  // Memoize stopCrawl function to prevent recreation on every render
  const stopCrawl = useCallback(async () => {
    await handleStopCrawl(SIGNALS.CHECK_IN_OUT_STOP_CRAWL, (error) => {
      throw new Error(error);
    });
  }, []);

  // Memoize clearItems function to prevent recreation on every render
  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const {
    isLoading,
    isStopping,
    onStartCrawl: handleStartCrawlInternal,
    onStopCrawl: onStopCrawl,
  } = useCrawlControl({
    completionSignal: SIGNALS.CHECK_IN_OUT_CRAWL_COMPLETE,
    crawlStateStorageKey: 'checkInOutCrawlItems_crawlInProgress',
    maxCrawlCount: MAX_CRAWL_COUNT.CHECK_IN_OUT,
    itemCount: items.length,
    clearItems,
    startCrawl,
    stopCrawl,
  });

  const onStartCrawl = useCallback(async () => {
    if (!isDateRangeValid) {
      return;
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
      const totalImages = items.reduce((sum, item) => sum + item.images.length, 0);
      setDownloadProgress({ downloaded: 0, total: totalImages });
      await exportBatchForCheckInOut(
        items,
        { batchFilenamePrefix: 'qoqolo-check-in-out' },
        (downloaded, total) => {
          setDownloadProgress({ downloaded, total });
        },
      );
    } catch (error) {
      console.error('[popup] Failed to export batch', error);
      window.alert('Failed to export batch. Please check the console for details.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ downloaded: 0, total: 0 });
    }
  }, [items, isDownloading, isLoading]);

  useEffect(() => {
    if (isLoading && items.length > 0) {
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
    <div className="check-in-out-container">
      <CrawlActionsBar
        dateRangeSection={dateRangeSection}
        onStartCrawl={onStartCrawl}
        onStopCrawl={onStopCrawl}
        onDownload={onBatchDownload}
        isLoading={isLoading}
        isStopping={isStopping}
        isDownloading={isDownloading}
        isStartDisabled={!isDateRangeValid}
        maxCrawlCount={MAX_CRAWL_COUNT.CHECK_IN_OUT}
        showDownload={items.length > 0}
        downloadProgress={downloadProgress.downloaded}
        downloadTotal={downloadProgress.total}
      />
      <div className="check-in-out-items">
        {items.length === 0 ? (
          <div className="empty-state">
            {isLoading ? 'Crawling...' : 'No months found. Click "Start Crawl" to begin.'}
          </div>
        ) : (
          items.map((item, index) => (
            <CheckInOutMonthItem
              key={item.yearMonth}
              monthItem={item}
              index={index}
              totalItems={items.length}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CheckInOut;
