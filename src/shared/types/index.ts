export type {
  ContentMessage,
  ContentResponse,
  BackgroundMessage,
  BackgroundResponse,
  TabInfo,
  MonthDate,
} from './message';
export type { PageType } from './page';
export type CrawlItem = {
  link: string;
  title: string;
  details?: unknown; // Stage 2+
};
// Unified item types
export type { Item, ItemDetails, ItemImage } from './item';
// Legacy type exports for backward compatibility
export type { PortfolioItem, PortfolioItemDetails, PortfolioItemImage } from './portfolio';
export type {
  ClassActivityItem,
  ClassActivityItemDetails,
  ClassActivityItemImage,
} from './classActivity';
