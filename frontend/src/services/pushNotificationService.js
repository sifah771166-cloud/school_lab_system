/**
 * Push Notification Service
 * Manages Web Push notifications with permission handling and subscription
 */

import * as indexedDB from '../utils/indexedDB';

const getApiOrigin = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
};

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.supported = this.checkSupport();
    this.listeners = [];
  }

  /**
   * Check if push notifications are supported
   */
  checkSupport() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Initialize push notifications
   */
  async init(swRegistration) {
    if (!this.supported) {
      console.warn('Push Notifications not supported');
      return false;
    }

    try {
      this.registration = swRegistration;
      
      // Check if already subscribed
      const existingSubscription = await this.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.supported) {
      console.warn('Push Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else if (permission === 'denied') {
        console.log('Notification permission denied');
        return false;
      } else {
        console.log('Notification permission dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(vapidPublicKey) {
    if (!this.supported || !this.registration) {
      console.warn('Cannot subscribe: Push not supported or SW not registered');
      return null;
    }

    try {
      // Request permission first if not already granted
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) return null;
      }

      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Subscribed to push notifications');
      
      // Save subscription to IndexedDB
      await this.saveSubscription(subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    if (!this.supported || !this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      const subscription = await this.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        
        // Notify server about unsubscription
        await this.sendUnsubscriptionToServer(subscription);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Save subscription to IndexedDB
   */
  async saveSubscription(subscription) {
    try {
      const subscriptionData = {
        id: 'pushSubscription',
        subscription: JSON.parse(JSON.stringify(subscription)),
        savedAt: new Date().toISOString()
      };

      await indexedDB.updateSyncStatus(subscriptionData);
      console.log('Subscription saved to IndexedDB');
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(`${getApiOrigin()}/api/v1/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server');
      return await response.json();
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      // Don't throw - subscription still works locally
    }
  }

  /**
   * Send unsubscription to server
   */
  async sendUnsubscriptionToServer(subscription) {
    try {
      await fetch(`${getApiOrigin()}/api/v1/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      console.log('Unsubscription sent to server');
    } catch (error) {
      console.error('Error sending unsubscription to server:', error);
    }
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed() {
    try {
      const subscription = await this.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(title, options = {}) {
    if (!this.supported) {
      console.warn('Notifications not supported');
      return;
    }

    try {
      if (Notification.permission === 'granted') {
        const notification = await this.registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          ...options
        });

        return notification;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Handle push message (called from service worker)
   */
  handlePushMessage(event) {
    try {
      const data = event.data ? event.data.json() : {};
      
      this.registration.showNotification(data.title || 'Notification', {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-96x96.png',
        data: data.data || {},
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false
      });

      this.notifyListeners('notification', data);
    } catch (error) {
      console.error('Error handling push message:', error);
    }
  }

  /**
   * Get permission status
   */
  getPermissionStatus() {
    if (!this.supported) return 'not-supported';
    return Notification.permission;
  }

  /**
   * Subscribe to events
   */
  subscribeToEvents(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, ...data });
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Convert VAPID key from base64 string to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get notification statistics
   */
  async getStats() {
    try {
      const subscription = await this.getSubscription();
      const isSubscribed = subscription !== null;
      const permission = Notification.permission;

      return {
        supported: this.supported,
        subscribed: isSubscribed,
        permission,
        subscription: isSubscribed ? subscription.toJSON() : null
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new PushNotificationService();
