import React from 'react';

import { ItemActions } from './ItemActions';
import { ItemContent } from './ItemContent';

import '../activityShared.scss';

import type { Item } from '@/shared/types/item';

interface ActivityItemProps {
  item: Item;
  index: number;
  totalItems: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ item, index, totalItems }) => {
  return (
    <div className="portfolio-item">
      <ItemActions item={item} />
      <ItemContent item={item} index={index} totalItems={totalItems} />
    </div>
  );
};

export default ActivityItem;
