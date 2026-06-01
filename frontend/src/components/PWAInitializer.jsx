import { useEffect } from 'react';
import { initDB } from '../utils/indexedDB';
import offlineQueueService from '../services/offlineQueueService';
import pushNotificationService from '../services/pushNotificationService';

export default function PWAInitializer() {
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          await pushNotificationService.init(registration);

          navigator.serviceWorker.addEventListener('message', async (event) => {
            if (!mounted || !event?.data) return;

            if (event.data.type === 'sync-queue-request') {
              try {
                await offlineQueueService.processQueue();
              } catch (error) {
                console.error('Queue sync request failed:', error);
              }
            }
          });
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}