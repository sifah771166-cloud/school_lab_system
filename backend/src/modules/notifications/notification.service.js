const prisma = require('../../utils/prisma');

exports.getNotifications = async (userId, filters = {}) => {
  const where = { userId };
  
  if (filters.read !== undefined) {
    where.read = filters.read;
  }
  
  if (filters.category) {
    where.category = filters.category;
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
      read: false,
    },
  });
};

exports.createNotification = async (userId, data) => {
  return prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'general',
      actionUrl: data.actionUrl,
    },
  });
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
      read: true,
      readAt: new Date(),
    },
  });
};

exports.markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
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
  return prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'general',
      actionUrl: data.actionUrl,
    })),
  });
};

// Helper function to send notification to department
exports.sendNotificationToDepartment = async (departmentId, data) => {
  const users = await prisma.user.findMany({
    where: { departmentId },
    select: { id: true },
  });

  const userIds = users.map(u => u.id);
  return exports.sendNotificationToUsers(userIds, data);
};
