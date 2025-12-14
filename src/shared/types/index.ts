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
export type { PortfolioItem, PortfolioItemDetails, PortfolioItemImage } from './portfolio';
