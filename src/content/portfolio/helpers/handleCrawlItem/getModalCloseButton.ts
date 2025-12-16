/**
 * Get the close button from a modal element
 * @param modal - The modal HTMLDivElement
 * @returns The close button element, or null if not found
 */
export function getModalCloseButton(modal: HTMLDivElement): HTMLButtonElement | null {
  return (
    modal.querySelector<HTMLButtonElement>('button[data-bb-handler="cancel"]') ||
    modal.querySelector<HTMLButtonElement>('button.bootbox-close-button')
  );
}
