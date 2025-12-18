/**
 * Maximum crawl counts per type
 */
export const MAX_CRAWL_COUNT = {
  PORTFOLIO: 30, // Max portfolio items per crawl
  CLASS_ACTIVITY: 50, // Max class activity items per crawl
  CHECK_IN_OUT: 12, // Max months per crawl for check-in/out
} as const;

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
