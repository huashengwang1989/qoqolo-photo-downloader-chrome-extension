import { faColumns, faWindowRestore } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import Notification from './Notification';

import { SIGNALS } from '@/shared/enums';
import type { BackgroundResponse } from '@/shared/types';

const ToggleViewButton: React.FC = () => {
  const [useSidePanel, setUseSidePanel] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Get current view mode preference
    chrome.runtime.sendMessage(
      { type: SIGNALS.VIEW_GET_MODE },
      (response: BackgroundResponse | undefined) => {
        if (response && 'useSidePanel' in response) {
          setUseSidePanel(response.useSidePanel);
        }
      },
    );
  }, []);

  const handleToggleView = useCallback(async () => {
    // Get current tab to open side panel with user gesture context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Detect if we're in a popup (popups typically have specific window features)
    // In Chrome extensions, popups are typically small windows
    // Check window.opener or window dimensions as indicators
    const isPopup =
      window.innerWidth < 500 || window.location.href.includes('popup') || !window.opener; // Side panels typically have opener

    // Toggle the preference first
    chrome.runtime.sendMessage(
      { type: SIGNALS.VIEW_TOGGLE_MODE },
      async (response: BackgroundResponse | undefined) => {
        if (response && 'useSidePanel' in response) {
          setUseSidePanel(response.useSidePanel);

          if (response.useSidePanel) {
            // Switching to side panel from popup
            if (tab?.id) {
              try {
                await chrome.sidePanel.open({ tabId: tab.id });
                // Try to close popup (may not work due to Chrome restrictions)
                if (isPopup) {
                  // Attempt to close popup - this may not work due to Chrome restrictions
                  // Chrome typically prevents programmatic closing of popups
                  setTimeout(() => {
                    window.close();
                  }, 100);
                }
              } catch (error) {
                console.error('Failed to open side panel:', error);
              }
            }
          } else {
            // Switching to popup from side panel
            // Chrome doesn't allow programmatically opening popups
            // Show notification to user
            setNotification(
              'Popup mode enabled. Please click the extension icon in the toolbar to open the popup.',
            );
          }
        }
      },
    );
  }, []);

  return (
    <>
      <button
        className="toggle-view-btn"
        onClick={handleToggleView}
        title={useSidePanel ? 'Switch to Popup' : 'Switch to Side Panel'}
      >
        <FontAwesomeIcon icon={useSidePanel ? faWindowRestore : faColumns} />
      </button>
      {notification && (
        <Notification message={notification} onClose={() => setNotification(null)} />
      )}
    </>
  );
};

export default ToggleViewButton;
