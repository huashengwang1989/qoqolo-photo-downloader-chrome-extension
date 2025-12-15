/** Grouping:
 * - Basic signals: 1-9
 * - View and tab signals: 11-19
 * - Portfolio signals: 20-29
 * - Class Album and Activity signals: 30-39
 * - Check in-out signals: 40-49
 *
 * Naming convention:
 * - Other than basic signals,
 * key should start with the group / sub-group name
 * ("VIEW", "TAB", "PORTFOLIO", "ALBUM", "ACTIVITY", "CHECK_IN_OUT", etc.)
 */
export enum SIGNALS {
  // Basic signals
  PING = 1,
  LOG = 2,

  // View and tab signals
  VIEW_TOGGLE_MODE = 11,
  VIEW_GET_MODE = 12,
  TAB_GET_INFO = 13,
  TAB_UPDATED = 14,

  // Portfolio signals
  PORTFOLIO_START_CRAWL = 20,
  PORTFOLIO_STOP_CRAWL = 21,
  PORTFOLIO_ITEMS_GET = 22,
  PORTFOLIO_ITEMS_UPDATED = 23,
  PORTFOLIO_ITEM_ADDED = 24,
  PORTFOLIO_CRAWL_COMPLETE = 25,

  // Logo extraction signal
  GET_LOGO = 30,
}
