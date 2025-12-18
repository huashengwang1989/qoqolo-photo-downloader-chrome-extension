import React from 'react';

import { ActivityPage, type ActivityPageConfig } from '../activityShared';

import { MAX_CRAWL_COUNT } from '@/configs';
import { SIGNALS } from '@/shared/enums';

import './Portfolio.scss';

const portfolioConfig: ActivityPageConfig = {
  itemsStorageKey: 'portfolioCrawlItems',
  itemsUpdatedSignal: SIGNALS.PORTFOLIO_ITEMS_UPDATED,
  itemAddedSignal: SIGNALS.PORTFOLIO_ITEM_ADDED,
  completionSignal: SIGNALS.PORTFOLIO_CRAWL_COMPLETE,
  startCrawlSignal: SIGNALS.PORTFOLIO_START_CRAWL,
  stopCrawlSignal: SIGNALS.PORTFOLIO_STOP_CRAWL,
  batchFilenamePrefix: 'qoqolo-portfolio',
  maxCrawlCount: MAX_CRAWL_COUNT.PORTFOLIO,
  containerClassName: 'portfolio-container',
};

const Portfolio: React.FC = () => {
  return <ActivityPage config={portfolioConfig} />;
};

export default Portfolio;
