import { useState, useEffect, useCallback } from 'react';
import * as indexedDB from '../utils/indexedDB';

/**
 * Custom hook for managing offline queue operations
 */
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  /**
   * Get current queue size
   */
  const getQueueSize = useCallback(async () => {
    try {
      const queue = await indexedDB.getQueue();
      setQueueSize(queue.length);
      return queue.length;
    } catch (error) {
      console.error('Error getting queue size:', error);
      return 0;
    }
  }, []);

  /**
   * Add item to queue
   */
  const addItem = useCallback(async (action, data, endpoint, priority = 'normal') => {
    try {
      const id = await indexedDB.addToQueue(action, data, endpoint, priority);
      await getQueueSize();
      return id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }, [getQueueSize]);

  /**
   * Process queue
   */
  const processQueue = useCallback(async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      const queue = await indexedDB.getQueue();
      
      if (queue.length === 0) {
        setSyncStatus('idle');
        setLastSyncTime(new Date());
        return { success: 0, failed: 0 };
      }

      let successful = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          // Process the item (this would be implemented by the caller)
          // For now, just mark as synced
          await indexedDB.updateQueueItem(item.id, { synced: true });
          successful++;
        } catch (error) {
          console.error('Error processing queue item:', error);
          
          // Update retry count and last error
          const retryCount = (item.retryCount || 0) + 1;
          const maxRetries = 3;
          
          if (retryCount > maxRetries) {
            // Mark as failed permanently
            await indexedDB.updateQueueItem(item.id, {
              synced: true,
              lastError: error.message,
              retryCount
            });
          } else {
            // Update retry count for next attempt
            await indexedDB.updateQueueItem(item.id, {
              lastError: error.message,
              retryCount
            });
          }
          
          failed++;
        }
      }

      setSyncStatus('idle');
      setLastSyncTime(new Date());
      await getQueueSize();

      return { success: successful, failed };
    } catch (error) {
      console.error('Error processing queue:', error);
      setSyncStatus('error');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [getQueueSize]);

  /**
   * Clear entire queue
   */
  const clearAll = useCallback(async () => {
    try {
      await indexedDB.clearQueue();
      await getQueueSize();
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }, [getQueueSize]);

  /**
   * Get queue statistics
   */
  const getStats = useCallback(async () => {
    try {
      const queue = await indexedDB.getQueue();
      const stats = {
        total: queue.length,
        pending: queue.filter(q => !q.synced).length,
        priorityHigh: queue.filter(q => q.priority === 'high').length,
        priorityNormal: queue.filter(q => q.priority === 'normal').length,
        priorityLow: queue.filter(q => q.priority === 'low').length,
      };
      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }, []);

  /**
   * Initialize - get initial queue size
   */
  useEffect(() => {
    getQueueSize();
  }, [getQueueSize]);

  return {
    queueSize,
    isSyncing,
    syncStatus,
    lastSyncTime,
    addItem,
    processQueue,
    clearAll,
    getStats,
    getQueueSize
  };
};

export default useOfflineQueue;
