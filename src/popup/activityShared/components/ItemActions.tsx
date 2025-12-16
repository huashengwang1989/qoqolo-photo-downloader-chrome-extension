import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { useItemActions } from '../helpers/useItemActions';

import type { Item } from '@/shared/types/item';

interface ItemActionsProps {
  item: Item;
}

export const ItemActions: React.FC<ItemActionsProps> = ({ item }) => {
  const { isCopied, isExporting, handleCopy, handleExport } = useItemActions(item);

  return (
    <div className="item-actions">
      <button type="button" className="item-action-button" onClick={handleCopy}>
        <FontAwesomeIcon icon={faCopy} />
        <span>Copy</span>
      </button>
      <button
        type="button"
        className="item-action-button"
        onClick={handleExport}
        disabled={isExporting}
      >
        <FontAwesomeIcon icon={faDownload} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>
      {isCopied && <span className="item-action-status">Copied</span>}
    </div>
  );
};
