import { useCallback, useMemo } from 'react';

import { exportItem } from '../export';

import { buildMarkdownFromItem } from './buildMarkdown';

import type { Item } from '@/shared/types/item';

/**
 * Hook to provide markdown and actions (copy/export) for an activity item.
 * State management (isCopied, isExporting) is now handled by the shared ItemActions component.
 */
export function useItemActions(item: Item) {
  const markdown = useMemo(() => buildMarkdownFromItem(item), [item]);

  const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(markdown);
  }, [markdown]);

  const handleExport = useCallback(async () => {
      await exportItem(item);
  }, [item]);

  return {
    handleCopy,
    handleExport,
  };
}
