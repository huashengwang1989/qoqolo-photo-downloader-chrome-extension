/**
 * Determine if the modal content indicates that the login session is likely expired.
 *
 * @param modal - The foliette modal element
 * @returns true if session is likely expired
 */
function checkIsLikelyLoginSessionExpired(modal: HTMLDivElement): boolean {
  // Strong signal: login container present inside modal
  const loginContainer = modal.querySelector<HTMLDivElement>('#login-container');
  if (loginContainer) {
    return true;
  }

  // Detect based on title
  const titleElement = modal.querySelector<HTMLHeadingElement>('h4.modal-title');
  const titleText = (titleElement?.textContent || '').trim().toLowerCase();

  // Detect based on empty bootbox body
  const bootboxBody = modal.querySelector<HTMLDivElement>('.modal-body .bootbox-body');
  const bootboxBodyText = (bootboxBody?.textContent || '').replace(/\u00a0/g, ' ').trim();

  return titleText === 'loading...' && !!bootboxBody && bootboxBodyText.length === 0;
}

/**
 * Detect likely login session expiry based on modal content.
 * If detected, optionally close the modal and show an alert.
 *
 * @param modal - The foliette modal element
 * @param closeButton - Optional close button to use for closing the modal
 * @returns true if session is likely expired and caller should stop crawling
 */
export function handleLikelyLoginSessionExpired(
  modal: HTMLDivElement,
  closeButton: HTMLButtonElement | null,
): boolean {
  if (!checkIsLikelyLoginSessionExpired(modal)) {
    return false;
  }

  console.warn('[crawler] Detected likely login session expiry');

  // Close modal if we have a close button
  if (closeButton) {
    closeButton.click();
  }

  // Show alert to inform the user
  window.alert(
    'It is likely that the login session is expired. Please refresh the page and retry.',
  );

  return true;
}
