export type PortfolioItemImage = {
  url: string;
  caption: string | undefined;
  exportFilename: string;
};

export type PortfolioItemDetails = {
  images: PortfolioItemImage[];
  content: string;
  teacher: string;
  publishDate: string; // YYYY-MM-DD
  learningArea: string[];
  stickers: string[];
};

export type PortfolioItem = {
  link: string;
  title: string;
  itemCode?: string; // Extracted from foliette-item wrapper id
  details?: PortfolioItemDetails;
};
