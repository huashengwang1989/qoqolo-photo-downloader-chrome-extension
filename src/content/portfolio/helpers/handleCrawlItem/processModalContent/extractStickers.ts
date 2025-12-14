/**
 * Extract sticker names from modal body
 * @param modalBody - The modal body HTMLDivElement
 * @returns Array of sticker names (from title attribute or filename from src)
 */
export function extractStickers(modalBody: HTMLDivElement | null): string[] {
  if (!modalBody) {
    return [];
  }

  // Find all h5 elements
  const h5Elements = modalBody.querySelectorAll<HTMLHeadingElement>('h5');
  let stickerList: HTMLUListElement | null = null;

  // Find the h5 with "Stickers" text (case-insensitive)
  for (const h5 of Array.from(h5Elements)) {
    const h5Text = (h5.textContent || '').trim().toLowerCase();
    if (h5Text === 'stickers') {
      // Find the next <ul> sibling after this h5
      let nextSibling: Element | null = h5.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.tagName === 'UL') {
          stickerList = nextSibling as HTMLUListElement;
          break;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
      break;
    }
  }

  if (!stickerList) {
    return [];
  }

  // Extract sticker names from all <img> elements
  const images = stickerList.querySelectorAll<HTMLImageElement>('img.foliette-sticker');
  const stickers: string[] = [];

  images.forEach((img) => {
    // Try to get title attribute first
    let stickerName = img.getAttribute('title');
    if (stickerName) {
      stickerName = stickerName.trim();
    }

    // Fallback to filename from src if title is not available
    if (!stickerName) {
      const src = img.getAttribute('src');
      if (src) {
        // Extract filename from path like "/rs/sticker/{sticker_filename}.png"
        const filenameMatch = src.match(/\/([^/]+)\.(png|jpg|jpeg|gif)$/i);
        if (filenameMatch) {
          stickerName = filenameMatch[1];
        } else {
          // Fallback: use the last part of the path
          const pathParts = src.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart) {
            stickerName = lastPart.replace(/\.(png|jpg|jpeg|gif)$/i, '');
          }
        }
      }
    }

    if (stickerName) {
      stickers.push(stickerName);
    }
  });

  return stickers;
}
