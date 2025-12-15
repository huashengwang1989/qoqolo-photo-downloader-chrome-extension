import { useCallback, useMemo, useState } from 'react';

import { exportPortfolioItem } from './export';
import { buildMarkdownFromItem } from './buildMarkdown';

import type { PortfolioItem as PortfolioItemType } from '@/shared/types/portfolio';

/**
 * Hook to provide markdown and actions (copy/export) for a portfolio item.
 */
export function usePortfolioItemActions(item: PortfolioItemType) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const markdown = useMemo(() => buildMarkdownFromItem(item), [item]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error('[popup] Failed to copy markdown to clipboard', error);
    }
  }, [markdown]);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return; // Prevent multiple simultaneous exports
    }

    setIsExporting(true);
    try {
      await exportPortfolioItem(item);
    } catch (error) {
      console.error('[popup] Failed to export portfolio item', error);
      // Optionally show error notification to user
      window.alert('Failed to export portfolio item. Please check the console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [item, isExporting]);

  return {
    isCopied,
    isExporting,
    handleCopy,
    handleExport,
  };
}
