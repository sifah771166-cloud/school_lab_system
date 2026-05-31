/**
 * Offline Queue Service
 * Manages API requests that fail due to network issues and retries them when online
 */

import * as indexedDB from '../utils/indexedDB';
import axios from 'axios';

class OfflineQueueService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.processing = false;
    this.listeners = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Network: Online');
    this.isOnline = true;
    this.processQueue();
    this.notifyListeners('online');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Network: Offline');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  /**
   * Make an API request with offline queue fallback
   */
  async request(method, endpoint, data = null, options = {}) {
    const priority = options.priority || 'normal';
    const retryable = options.retryable !== false;

    try {
      // Make the request
      const response = await axios({
        method,
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`,
        data,
        headers: options.headers,
        timeout: options.timeout || 10000
      });

      // If successful, remove from queue if it exists
      const syncStatus = await indexedDB.getSyncStatus();
      if (syncStatus.pendingRequestId) {
        await indexedDB.removeFromQueue(syncStatus.pendingRequestId);
      }

      return response.data;
    } catch (error) {
      // If offline and retryable, queue the request
      if (!this.isOnline && retryable) {
        console.log('Request queued for offline processing:', endpoint);
        const id = await indexedDB.addToQueue(method, data, endpoint, priority);
        
        // Notify listeners about queued request
        this.notifyListeners('queued', { id, endpoint });
        
        // Return a special response indicating the request was queued
        return { _queued: true, queueId: id };
      }

      throw error;
    }
  }

  /**
   * GET request with offline queue support
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request with offline queue support
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request with offline queue support
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * DELETE request with offline queue support
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * Process the offline queue
   */
  async processQueue() {
    if (this.processing || !this.isOnline) {
      return;
    }

    this.processing = true;
    console.log('Processing offline queue...');

    try {
      const queue = await indexedDB.getQueue();
      
      if (queue.length === 0) {
        this.notifyListeners('queue-processed', { success: 0, failed: 0 });
        return;
      }

      let successful = 0;
      let failed = 0;
      const failedItems = [];

      // Update sync status
      await indexedDB.updateSyncStatus({
        syncing: true,
        itemsProcessing: queue.length
      });

      for (const item of queue) {
        try {
          console.log('Processing queue item:', item.id, item.endpoint);

          // Make the request
          const response = await axios({
            method: item.action,
            url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.endpoint}`,
            data: item.data,
            timeout: 15000
          });

          // Mark as synced
          await indexedDB.updateQueueItem(item.id, { synced: true });
          successful++;
          console.log('Queue item processed successfully:', item.id);
        } catch (error) {
          console.error('Error processing queue item:', error);
          
          const retryCount = (item.retryCount || 0) + 1;
          const maxRetries = 3;

          if (retryCount > maxRetries) {
            // Permanently failed
            await indexedDB.updateQueueItem(item.id, {
              synced: true,
              lastError: error.message,
              retryCount,
              failed: true
            });
            failed++;
            failedItems.push(item);
          } else {
            // Will retry next time
            await indexedDB.updateQueueItem(item.id, {
              lastError: error.message,
              retryCount
            });
            failed++;
          }
        }

        // Add a small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Update sync status
      await indexedDB.updateSyncStatus({
        syncing: false,
        lastSync: new Date().toISOString(),
        processedItems: successful,
        failedItems: failed
      });

      console.log(`Queue processed: ${successful} successful, ${failed} failed`);
      this.notifyListeners('queue-processed', { success: successful, failed, failedItems });
    } catch (error) {
      console.error('Error processing queue:', error);
      this.notifyListeners('queue-error', { error: error.message });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    try {
      const queue = await indexedDB.getQueue();
      const stats = await indexedDB.getDBStats();
      const syncStatus = await indexedDB.getSyncStatus();

      return {
        isOnline: this.isOnline,
        queueSize: queue.length,
        isSyncing: this.processing,
        lastSync: syncStatus.lastSync,
        dbStats: stats,
        items: queue.map(item => ({
          id: item.id,
          endpoint: item.endpoint,
          action: item.action,
          priority: item.priority,
          retryCount: item.retryCount,
          timestamp: item.timestamp,
          lastError: item.lastError
        }))
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }

  /**
   * Clear specific item from queue
   */
  async clearQueueItem(id) {
    try {
      await indexedDB.removeFromQueue(id);
      this.notifyListeners('item-removed', { id });
    } catch (error) {
      console.error('Error clearing queue item:', error);
      throw error;
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue() {
    try {
      await indexedDB.clearQueue();
      this.notifyListeners('queue-cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Subscribe to queue events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, ...data });
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  /**
   * Retry failed queue items
   */
  async retryFailed() {
    try {
      const queue = await indexedDB.getQueue();
      const failedItems = queue.filter(item => item.failed);

      for (const item of failedItems) {
        await indexedDB.updateQueueItem(item.id, {
          failed: false,
          retryCount: 0
        });
      }

      console.log('Retrying failed items...');
      if (this.isOnline) {
        await this.processQueue();
      }
    } catch (error) {
      console.error('Error retrying failed items:', error);
      throw error;
    }
  }

  /**
   * Get network status
   */
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      type: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 'unknown'
    };
  }
}

// Export singleton instance
export default new OfflineQueueService();
