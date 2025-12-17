import type { CheckInOutImage } from '@/shared/types/checkInOut';

/**
 * Get image sources from check-in/out view page
 * @param document - Document object (should be from fetched page)
 * @param date - Date in YYYY-MM-DD format
 * @param hostname - Hostname for constructing absolute URLs
 * @returns Array of check-in/out images
 */
export function getImageSrcsForCheckInOut(
  document: Document,
  date: string,
  hostname: string,
): CheckInOutImage[] {
  const imgSrcs: CheckInOutImage[] = [];

  if (!date) {
    return imgSrcs;
  }

  // Find all fieldsets
  const fieldsets = document.querySelectorAll('fieldset');

  fieldsets.forEach((fieldset) => {
    // Get Legend to determine "in" or "out"
    const legend = fieldset.querySelector('legend');
    const inoutText = (legend?.textContent || '').trim();

    let inout: 'in' | 'out' | '' = '';
    if (inoutText === 'Sign in') {
      inout = 'in';
    } else if (inoutText === 'Sign out') {
      inout = 'out';
    }

    if (!inout) {
      return;
    }

    // Find all divs with class "form-group"
    const formGroups = fieldset.querySelectorAll('div.form-group');

    formGroups.forEach((formGroup) => {
      const label = formGroup.querySelector('label');
      const img = formGroup.querySelector('img');

      if (label && label.textContent?.trim() === 'Photo' && img && img.hasAttribute('src')) {
        const srcRaw = img.getAttribute('src') || '';
        const src = srcRaw.includes(hostname) ? srcRaw : `https://${hostname}/${srcRaw}`;

        if (src && (srcRaw.includes(hostname) || hostname !== '')) {
          const imgInfo: CheckInOutImage = {
            date,
            inout,
            src,
            renameAs: `${date}-${inout}`,
          };
          imgSrcs.push(imgInfo);
        }
      }
    });
  });

  return imgSrcs;
}
