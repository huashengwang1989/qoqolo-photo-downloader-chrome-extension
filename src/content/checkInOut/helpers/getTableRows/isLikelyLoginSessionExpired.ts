/**
 * Check if login session is likely expired
 * @param document - Document object
 * @returns true if login session is likely expired
 */
export function isLikelyLoginSessionExpired(document: Document): boolean {
  const loginElement = document.querySelector('div.lo-user');
  return loginElement !== null;
}

