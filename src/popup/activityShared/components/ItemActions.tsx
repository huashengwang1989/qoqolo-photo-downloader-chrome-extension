import React from 'react';

import { useItemActions } from '../helpers/useItemActions';

import { ItemActions as SharedItemActions } from '@/shared/components/ItemActions';
import type { Item } from '@/shared/types/item';

interface ItemActionsProps {
  item: Item;
}

export const ItemActions: React.FC<ItemActionsProps> = ({ item }) => {
  const { handleCopy, handleExport } = useItemActions(item);

  return (
    <SharedItemActions
      onCopy={handleCopy}
      onExport={handleExport}
      containerClassName="item-actions"
      buttonClassName="item-action-button"
    />
  );
};
