const prisma = require('../../utils/prisma');
const emailService = require('../../utils/emailService');
const { emitNotificationToUser, emitNotificationToDepartment, emitNotificationToRole } = require('../../socket/socket');
const { sendNotification, sendNotificationToMany } = require('../../config/webpush');

exports.getNotifications = async (userId, filters = {}) => {
  const where = { userId };
   
  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
  });
};

exports.getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

exports.createNotification = async (userId, data) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.actionUrl || data.link,
    },
  });

  // Emit real-time notification via WebSocket
  try {
    emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Failed to emit WebSocket notification:', error);
  }

  // Send email notification if configured
  if (data.sendEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user) {
        await emailService.sendNotificationEmail(user.email, {
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.emailData,
        });
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  return notification;
};

exports.markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Access denied');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
    },
  });
};

exports.markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

exports.deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Access denied');
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
};

exports.deleteAllNotifications = async (userId) => {
  return prisma.notification.deleteMany({
    where: { userId },
  });
};

// Helper function to send notifications to multiple users
exports.sendNotificationToUsers = async (userIds, data) => {
  const notifications = await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.actionUrl || data.link,
    })),
  });

  // Emit real-time notifications to all users
  try {
    for (const userId of userIds) {
      const notification = {
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.actionUrl || data.link,
        createdAt: new Date(),
        isRead: false
      };
      emitNotificationToUser(userId, notification);
    }
  } catch (error) {
    console.error('Failed to emit WebSocket notifications:', error);
  }

  return notifications;
};

// Helper function to send notification to department
exports.sendNotificationToDepartment = async (departmentId, data) => {
  const users = await prisma.user.findMany({
    where: { departmentId },
    select: { id: true },
  });

  const userIds = users.map(u => u.id);
  
  // Create notifications in database
  const notifications = await exports.sendNotificationToUsers(userIds, data);

  // Emit to department room
  try {
    emitNotificationToDepartment(departmentId, {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.actionUrl || data.link,
      createdAt: new Date(),
      isRead: false
    });
  } catch (error) {
    console.error('Failed to emit department notification:', error);
  }

  return notifications;
};

exports.subscribePush = async (userId, subscription) => {
  if (!subscription || !subscription.endpoint) {
    throw new Error('Invalid subscription payload');
  }

  // Save to database instead of in-memory Map
  const saved = await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
      updatedAt: new Date()
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
    }
  });

  const total = await prisma.pushSubscription.count({
    where: { userId }
  });

  return {
    subscribed: true,
    total,
    subscription: saved
  };
};

exports.unsubscribePush = async (userId, subscription) => {
  if (!subscription || !subscription.endpoint) {
    throw new Error('Invalid subscription payload');
  }

  // Delete from database
  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint: subscription.endpoint
    }
  });

  const total = await prisma.pushSubscription.count({
    where: { userId }
  });

  return {
    unsubscribed: true,
    total
  };
};

// Send push notification to user
exports.sendPushToUser = async (userId, payload) => {
  // Get all subscriptions for user from database
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await sendNotification(subscription, payload);
        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        // Remove invalid subscriptions (410 Gone = subscription expired)
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          });
        }
        return { success: false, error: error.message, endpoint: sub.endpoint };
      }
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;

  return { sent, failed, results };
};

// Send push notification to multiple users
exports.sendPushToUsers = async (userIds, payload) => {
  const results = await Promise.all(
    userIds.map(userId => exports.sendPushToUser(userId, payload))
  );

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  return { sent: totalSent, failed: totalFailed, results };
};
