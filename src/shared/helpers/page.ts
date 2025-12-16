import type { PageType } from '../types/page';

/**
 * Portfolios page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/folio
 */
const isPortfolioPage = (url: string): boolean => {
  return /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/folio/.test(url);
};

/**
 * Check if URL matches Class Activity page pattern
 * https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/classspace&func=view&gid=<id>&post_type={...}
 */
export const isClassActivityPageUrl = (url: string): boolean => {
  return /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/classspace&func=view&gid=\d+/.test(url);
};

/**
 * Check if Class Activity page has valid post_type (missing, empty, 'album', or 'activity')
 */
const hasValidPostType = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const postType = urlObj.searchParams.get('post_type');

    // If post_type is missing or empty, it's "All" tab - supported
    if (!postType || postType === '') {
      return true;
    }

    // If post_type is 'album' or 'activity', it's supported
    return postType === 'album' || postType === 'activity';
  } catch (error) {
    return false;
  }
};

/**
 * Class Activity page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/classspace&func=view&gid=<id>&post_type={'album'|'activity'|''}
 * post_type can be missing, empty (means "All"), 'album', or 'activity'
 */
const isClassActivityPage = (url: string): boolean => {
  return isClassActivityPageUrl(url) && hasValidPostType(url);
};

export const PAGE_REGEX_CHECKS: Record<PageType, RegExp | ((url: string) => boolean)> = {
  qoqoloPortfolioPage: isPortfolioPage,
  qoqoloClassActivityPage: isClassActivityPage,
};

export const getPageType = (fullUrl: string): PageType | null => {
  for (const [key, checker] of Object.entries(PAGE_REGEX_CHECKS)) {
    if (typeof checker === 'function' ? checker(fullUrl) : checker.test(fullUrl)) {
      return key as PageType;
    }
  }
  return null;
};
