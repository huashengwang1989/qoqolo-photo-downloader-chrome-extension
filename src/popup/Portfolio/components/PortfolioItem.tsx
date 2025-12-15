import React from 'react';

import { ItemActions } from './ItemActions';
import { ItemContent } from './ItemContent';

import type { PortfolioItem as PortfolioItemType } from '@/shared/types/portfolio';

interface PortfolioItemProps {
  item: PortfolioItemType;
  index: number;
  totalItems: number;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ item, index, totalItems }) => {
  return (
    <div className="portfolio-item">
      <ItemActions item={item} />
      <ItemContent item={item} index={index} totalItems={totalItems} />
    </div>
  );
};

export default PortfolioItem;
