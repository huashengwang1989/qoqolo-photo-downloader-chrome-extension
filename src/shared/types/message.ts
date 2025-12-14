import { SIGNALS } from '../enums';

import type { PageType } from './page';
import type { PortfolioItem } from './portfolio';

export type MonthDate = {
  year: number;
  month: number; // 1-12
};

export type ContentMessage =
  | {
      type: SIGNALS.PORTFOLIO_START_CRAWL;
      dateRange?: { from: MonthDate | null; to: MonthDate | null };
    }
  | { type: SIGNALS.PORTFOLIO_STOP_CRAWL }
  | { type: SIGNALS.PING };

export type TabInfo = {
  isSupported: boolean;
  pageType: PageType | null;
  url: {
    fullUrl: string;
    protocol: string;
    hostname: string;
    domain: string;
    pathname: string;
    search: string;
    hash: string;
    origin: string;
  } | null;
};

export type BackgroundMessage =
  | { type: SIGNALS.LOG; payload: unknown }
  | { type: SIGNALS.VIEW_TOGGLE_MODE }
  | { type: SIGNALS.VIEW_GET_MODE }
  | { type: SIGNALS.TAB_GET_INFO }
  | { type: SIGNALS.TAB_UPDATED; tabId: number; tabInfo: TabInfo }
  | { type: SIGNALS.PORTFOLIO_ITEMS_UPDATED; items: PortfolioItem[] }
  | { type: SIGNALS.PORTFOLIO_ITEM_ADDED; item: PortfolioItem }
  | { type: SIGNALS.PORTFOLIO_CRAWL_COMPLETE }
  | { type: SIGNALS.PORTFOLIO_ITEMS_GET };

// Content script responses
export type ContentResponse = { ok: boolean };

// Background script responses - discriminated by request type
export type BackgroundResponse =
  | { useSidePanel: boolean } // For VIEW_GET_MODE and VIEW_TOGGLE_MODE
  | { tabInfo: TabInfo } // For TAB_GET_INFO
  | { items: PortfolioItem[] } // For PORTFOLIO_ITEMS_GET
  | { ok: boolean }; // For other cases

// Helper type to get response type from message type
export type ResponseForMessage<T extends BackgroundMessage | ContentMessage> = T extends {
  type: SIGNALS.VIEW_GET_MODE;
}
  ? { useSidePanel: boolean }
  : T extends { type: SIGNALS.VIEW_TOGGLE_MODE }
    ? { useSidePanel: boolean }
    : T extends { type: SIGNALS.TAB_GET_INFO }
      ? { tabInfo: TabInfo }
      : T extends { type: SIGNALS.PORTFOLIO_ITEMS_GET }
        ? { items: PortfolioItem[] }
        : T extends { type: SIGNALS.PORTFOLIO_START_CRAWL | SIGNALS.PING }
          ? ContentResponse
          : { ok: boolean };
