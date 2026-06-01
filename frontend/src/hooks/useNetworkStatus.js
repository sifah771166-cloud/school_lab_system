import { useState, useEffect } from 'react';
import offlineQueueService from '../services/offlineQueueService';

/**
 * Custom hook for network status tracking
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Custom hook for sync status
 */
export const useSyncStatus = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Subscribe to queue events
    const unsubscribe = offlineQueueService.subscribe((data) => {
      if (data.event === 'queue-processed') {
        setLastSync(new Date());
        setQueueSize(0);
      }
      if (data.event === 'queued') {
        setQueueSize(prev => prev + 1);
      }
    });

    // Get initial queue size
    offlineQueueService.getQueueStatus().then(status => {
      if (status) {
        setQueueSize(status.queueSize);
        setIsSyncing(status.isSyncing);
      }
    });

    return unsubscribe;
  }, []);

  return {
    isSyncing,
    queueSize,
    lastSync
  };
};

export default useNetworkStatus;
