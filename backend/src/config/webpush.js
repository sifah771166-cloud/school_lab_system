const webpush = require('web-push');

// VAPID keys for Web Push API
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BM-Lq6e0qZuj5XxlsjOUvNlyOVZLlVQxYEt44IpB8O1Sb-6TgKM3vkXq6geAISeUGNOiFOOGgdfU9K8ZbeD0et4',
  privateKey: process.env.VAPID_PRIVATE_KEY || '-fuKrrrV7Nz5HMmMhfhPKrqKs8DEF-dt3tMQu4aUZwg',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@schoollab.com'
};

// Configure web-push with VAPID details
webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Send push notification to a subscription
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 * @returns {Promise} Result of sendNotification
 */
const sendNotification = async (subscription, payload) => {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message, statusCode: error.statusCode };
  }
};

/**
 * Send push notification to multiple subscriptions
 * @param {Array} subscriptions - Array of push subscription objects
 * @param {Object} payload - Notification payload
 * @returns {Promise<Array>} Array of results
 */
const sendNotificationToMany = async (subscriptions, payload) => {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendNotification(sub, payload))
  );
  
  return results.map((result, index) => ({
    subscription: subscriptions[index],
    ...result
  }));
};

module.exports = {
  webpush,
  vapidKeys,
  sendNotification,
  sendNotificationToMany
};
