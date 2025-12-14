import { setupOnActionClickedListener } from './listeners/onActionClicked';
import { setupOnActivatedListener } from './listeners/onActivated';
import { setupOnInstalledListener } from './listeners/onInstalled';
import { setupOnMessageListener } from './listeners/onMessage';
import { setupOnUpdatedListener } from './listeners/onUpdated';

console.info('[background] Service worker loaded');

// Setup all listeners
setupOnInstalledListener();
setupOnActivatedListener();
setupOnUpdatedListener();
setupOnActionClickedListener();
setupOnMessageListener();
