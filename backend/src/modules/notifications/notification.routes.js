const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribePush,
  unsubscribePush,
} = require('./notification.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notifications for current user
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread/count', getUnreadCount);

// Mark specific notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read/all', markAllAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/all', deleteAllNotifications);

// Push subscription management
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

module.exports = router;
