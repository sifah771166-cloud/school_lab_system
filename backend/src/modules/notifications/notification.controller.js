const service = require('./notification.service');

exports.getNotifications = async (req, res, next) => {
  try {
    const { isRead, type, limit } = req.query;
    const filters = {};
    
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (limit) {
      filters.limit = parseInt(limit);
    }

    const notifications = await service.getNotifications(req.user.id, filters);
    const unreadCount = await service.getUnreadCount(req.user.id);

    res.json({
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await service.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await service.markAsRead(id, req.user.id);
    res.json({
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await service.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await service.deleteNotification(id, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await service.deleteAllNotifications(req.user.id);
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    next(err);
  }
};
