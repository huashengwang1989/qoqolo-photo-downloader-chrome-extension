import { SIGNALS } from '@/shared/enums';

export interface UseCrawlActionsOptions {
  /** Signal type for starting crawl */
  startCrawlSignal:
    | SIGNALS.PORTFOLIO_START_CRAWL
    | SIGNALS.CLASS_ACTIVITY_START_CRAWL
    | SIGNALS.CHECK_IN_OUT_START_CRAWL;
  /** Signal type for stopping crawl */
  stopCrawlSignal:
    | SIGNALS.PORTFOLIO_STOP_CRAWL
    | SIGNALS.CLASS_ACTIVITY_STOP_CRAWL
    | SIGNALS.CHECK_IN_OUT_STOP_CRAWL;
}
