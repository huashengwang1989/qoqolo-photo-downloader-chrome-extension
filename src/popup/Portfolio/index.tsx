import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import PortfolioItem from './components/PortfolioItem';
import { handleStartCrawl, handleStopCrawl } from './helpers/handleCrawlActions';
import { usePortfolioItems } from './helpers/usePortfolioItems';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundMessage } from '@/shared/types';

import './Portfolio.scss';

const Portfolio: React.FC = () => {
  const { items, setItems } = usePortfolioItems();
  const [isLoading, setIsLoading] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

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
    setIsLoading(true);
    setItems([]); // Clear previous items

    // Set a timeout fallback in case the content script doesn't send completion message
    // This handles edge cases like: wrong page type, script errors, or network issues
    timeoutRef.current = setTimeout(() => {
      console.warn('[popup] Crawl timeout - resetting loading state');
      setIsLoading(false);
    }, 60000); // 60 seconds timeout (5 items * 1 second delay + processing time)

    await handleStartCrawl(
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
  }, [setItems]);

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
        <button onClick={onStartCrawl} disabled={isLoading}>
          <FontAwesomeIcon icon={faPlay} />
          <span>{isLoading ? 'Crawling...' : 'Start Crawl'}</span>
        </button>
        {(isLoading || isStopping) && (
          <button onClick={onStopCrawl} className="stop-button" disabled={isStopping}>
            <FontAwesomeIcon icon={faStop} />
            <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
          </button>
        )}
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
