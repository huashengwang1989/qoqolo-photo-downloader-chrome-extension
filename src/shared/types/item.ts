/**
 * Unified types for both Portfolio and Class Activity items
 */

export type ItemImage = {
  url: string;
  caption: string | undefined;
  exportFilename: string;
};

export type ItemDetails = {
  images: ItemImage[];
  content: string;
  teacher: string;
  publishDatetime?: string; // YYYY-MM-DD HH:MM (Class Activity only)
  learningArea?: string[]; // Portfolio only
  stickers?: string[]; // Portfolio only
};

export type Item = {
  link: string;
  title: string;
  publishDate: string; // YYYY-MM-DD - extracted at collection time
  itemCode?: string; // Portfolio: Extracted from foliette-item wrapper id
  rid?: string; // Class Activity: data-rid from infinite-item
  type?: 'album' | 'activity'; // Class Activity only
  details?: ItemDetails;
};

// Legacy type aliases for backward compatibility during migration
export type PortfolioItemImage = ItemImage;
export type PortfolioItemDetails = ItemDetails;
export type PortfolioItem = Item;

export type ClassActivityItemImage = ItemImage;
export type ClassActivityItemDetails = ItemDetails;
export type ClassActivityItem = Item;
