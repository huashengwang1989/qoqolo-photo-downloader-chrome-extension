import type { PageType } from '../types/page';

/**
 * Portofolios page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/folio
 */
export const PAGE_REGEX_CHECKS: Record<PageType, RegExp | ((url: string) => boolean)> = {
  qoqoloPortfolioPage: /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/folio/,
};

export const getPageType = (fullUrl: string): PageType | null => {
  for (const [key, checker] of Object.entries(PAGE_REGEX_CHECKS)) {
    if (typeof checker === 'function' ? checker(fullUrl) : checker.test(fullUrl)) {
      return key as PageType;
    }
  }
  return null;
};
