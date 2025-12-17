/** For activity, this is the max item (activity) count that can be crawled at once.
 * For check-in check-out, this is the max months count that can be crawled at once.
 */
export const MAX_CRAWL_COUNT_PER_TIME = 30;

/**
 * URL regex patterns for page detection
 */
export const PAGE_URL_PATTERNS = {
  /**
   * Portfolio page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/folio
   */
  PORTFOLIO: /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/folio/,

  /**
   * Class Activity page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/classspace&func=view&gid=<id>
   */
  CLASS_ACTIVITY: /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/classspace&func=view&gid=\d+/,

  /**
   * Check-in/out page: https://<customer_code>.qoqolo.com/cos/o.x?c=/<hash>/check_in&func=recent
   */
  CHECK_IN_OUT: /^https:\/\/.+\.qoqolo\.com\/cos\/o\.x\?c=\/.+\/check_in(&|&amp;)?func=recent/,

  /**
   * Qoqolo site (any page on qoqolo.com domain)
   */
  QOQOLO_SITE: /^https:\/\/.+\.qoqolo\.com/,
} as const;
