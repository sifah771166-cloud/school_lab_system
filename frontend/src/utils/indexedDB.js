/**
 * IndexedDB Database Utilities
 * Manages offline data persistence for the application
 */

const DB_NAME = 'LabManagerDB';
const DB_VERSION = 1;

let db = null;

/**
 * Initialize IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB failed to open:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object stores
      if (!database.objectStoreNames.contains('offlineQueue')) {
        const queueStore = database.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('endpoint', 'endpoint', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!database.objectStoreNames.contains('attendanceOffline')) {
        database.createObjectStore('attendanceOffline', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('loansOffline')) {
        database.createObjectStore('loansOffline', { keyPath: 'id', autoIncrement: true });
      }

      if (!database.objectStoreNames.contains('userData')) {
        database.createObjectStore('userData', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('syncStatus')) {
        database.createObjectStore('syncStatus', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('formData')) {
        database.createObjectStore('formData', { keyPath: 'id' });
      }

      console.log('IndexedDB object stores created');
    };
  });
};

/**
 * Add item to offline queue
 */
export const addToQueue = async (action, data, endpoint, priority = 'normal') => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    
    const queueItem = {
      action,
      data,
      endpoint,
      priority,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      lastError: null
    };

    const request = store.add(queueItem);

    request.onerror = () => {
      console.error('Failed to add to queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Added to offline queue:', request.result);
      resolve(request.result);
    };
  });
};

/**
 * Get all items in offline queue
 */
export const getQueue = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to get queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const queue = request.result.filter(item => !item.synced);
      resolve(queue);
    };
  });
};

/**
 * Get unsynced items for a specific endpoint
 */
export const getQueueByEndpoint = async (endpoint) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const index = store.index('endpoint');
    const request = index.getAll(endpoint);

    request.onerror = () => {
      console.error('Failed to get queue by endpoint:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const items = request.result.filter(item => !item.synced);
      // Sort by priority (high first) then by timestamp
      items.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
      resolve(items);
    };
  });
};

/**
 * Update queue item (mark as synced or update retry count)
 */
export const updateQueueItem = async (id, updates) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const request = store.get(id);

    request.onerror = () => {
      console.error('Failed to get queue item:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const item = request.result;
      if (!item) {
        reject(new Error('Queue item not found'));
        return;
      }

      Object.assign(item, updates);
      const updateRequest = store.put(item);

      updateRequest.onerror = () => {
        console.error('Failed to update queue item:', updateRequest.error);
        reject(updateRequest.error);
      };

      updateRequest.onsuccess = () => {
        console.log('Queue item updated:', id);
        resolve(item);
      };
    };
  });
};

/**
 * Remove item from offline queue
 */
export const removeFromQueue = async (id) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const request = store.delete(id);

    request.onerror = () => {
      console.error('Failed to remove from queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Removed from queue:', id);
      resolve();
    };
  });
};

/**
 * Clear entire offline queue
 */
export const clearQueue = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const request = store.clear();

    request.onerror = () => {
      console.error('Failed to clear queue:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Queue cleared');
      resolve();
    };
  });
};

/**
 * Save offline attendance entry
 */
export const saveOfflineAttendance = async (data) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['attendanceOffline'], 'readwrite');
    const store = transaction.objectStore('attendanceOffline');
    
    const entry = {
      ...data,
      savedAt: Date.now(),
      synced: false
    };

    const request = store.add(entry);

    request.onerror = () => {
      console.error('Failed to save offline attendance:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Offline attendance saved:', request.result);
      resolve(request.result);
    };
  });
};

/**
 * Get offline attendance entries
 */
export const getOfflineAttendance = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['attendanceOffline'], 'readonly');
    const store = transaction.objectStore('attendanceOffline');
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to get offline attendance:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const entries = request.result.filter(item => !item.synced);
      resolve(entries);
    };
  });
};

/**
 * Save offline loan request
 */
export const saveOfflineLoan = async (data) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['loansOffline'], 'readwrite');
    const store = transaction.objectStore('loansOffline');
    
    const entry = {
      ...data,
      savedAt: Date.now(),
      synced: false
    };

    const request = store.add(entry);

    request.onerror = () => {
      console.error('Failed to save offline loan:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Offline loan saved:', request.result);
      resolve(request.result);
    };
  });
};

/**
 * Get offline loans
 */
export const getOfflineLoans = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['loansOffline'], 'readonly');
    const store = transaction.objectStore('loansOffline');
    const request = store.getAll();

    request.onerror = () => {
      console.error('Failed to get offline loans:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const entries = request.result.filter(item => !item.synced);
      resolve(entries);
    };
  });
};

/**
 * Save form data for auto-recovery
 */
export const saveFormData = async (formId, data) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['formData'], 'readwrite');
    const store = transaction.objectStore('formData');
    
    const formEntry = {
      id: formId,
      data,
      savedAt: Date.now()
    };

    const request = store.put(formEntry);

    request.onerror = () => {
      console.error('Failed to save form data:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Form data saved:', formId);
      resolve(request.result);
    };
  });
};

/**
 * Get saved form data
 */
export const getFormData = async (formId) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['formData'], 'readonly');
    const store = transaction.objectStore('formData');
    const request = store.get(formId);

    request.onerror = () => {
      console.error('Failed to get form data:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result?.data || null);
    };
  });
};

/**
 * Clear form data
 */
export const clearFormData = async (formId) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['formData'], 'readwrite');
    const store = transaction.objectStore('formData');
    const request = store.delete(formId);

    request.onerror = () => {
      console.error('Failed to clear form data:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Form data cleared:', formId);
      resolve();
    };
  });
};

/**
 * Save user data for offline access
 */
export const saveUserData = async (userData) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');
    
    const data = {
      id: 'currentUser',
      ...userData,
      savedAt: Date.now()
    };

    const request = store.put(data);

    request.onerror = () => {
      console.error('Failed to save user data:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('User data saved');
      resolve();
    };
  });
};

/**
 * Get saved user data
 */
export const getUserData = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userData'], 'readonly');
    const store = transaction.objectStore('userData');
    const request = store.get('currentUser');

    request.onerror = () => {
      console.error('Failed to get user data:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
};

/**
 * Update sync status
 */
export const updateSyncStatus = async (status) => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncStatus'], 'readwrite');
    const store = transaction.objectStore('syncStatus');
    
    const statusData = {
      id: 'syncStatus',
      ...status,
      lastUpdated: Date.now()
    };

    const request = store.put(statusData);

    request.onerror = () => {
      console.error('Failed to update sync status:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Sync status updated');
      resolve();
    };
  });
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncStatus'], 'readonly');
    const store = transaction.objectStore('syncStatus');
    const request = store.get('syncStatus');

    request.onerror = () => {
      console.error('Failed to get sync status:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result || { syncing: false, lastSync: null });
    };
  });
};

/**
 * Get database statistics
 */
export const getDBStats = async () => {
  if (!db) await initDB();

  try {
    const stats = {};
    
    for (const storeName of ['offlineQueue', 'attendanceOffline', 'loansOffline', 'userData', 'syncStatus', 'formData']) {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();
      
      await new Promise((resolve) => {
        countRequest.onsuccess = () => {
          stats[storeName] = countRequest.result;
          resolve();
        };
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get DB stats:', error);
    return {};
  }
};

/**
 * Clear all offline data
 */
export const clearAllOfflineData = async () => {
  if (!db) await initDB();

  try {
    for (const storeName of ['offlineQueue', 'attendanceOffline', 'loansOffline', 'formData']) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
      });
    }
    
    console.log('All offline data cleared');
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDB = () => {
  if (db) {
    db.close();
    db = null;
    console.log('IndexedDB closed');
  }
};
