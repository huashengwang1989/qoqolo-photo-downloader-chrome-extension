import React from 'react';

import { ActivityPage, type ActivityPageConfig } from '../activityShared';

import { SIGNALS } from '@/shared/enums';

import './ClassActivity.scss';

const classActivityConfig: ActivityPageConfig = {
  itemsStorageKey: 'classActivityCrawlItems',
  itemsUpdatedSignal: SIGNALS.CLASS_ACTIVITY_ITEMS_UPDATED,
  itemAddedSignal: SIGNALS.CLASS_ACTIVITY_ITEM_ADDED,
  completionSignal: SIGNALS.CLASS_ACTIVITY_CRAWL_COMPLETE,
  startCrawlSignal: SIGNALS.CLASS_ACTIVITY_START_CRAWL,
  stopCrawlSignal: SIGNALS.CLASS_ACTIVITY_STOP_CRAWL,
  batchFilenamePrefix: 'qoqolo-class-activity',
  containerClassName: 'class-activity-container',
};

const ClassActivity: React.FC = () => {
  return <ActivityPage config={classActivityConfig} />;
};

export default ClassActivity;
