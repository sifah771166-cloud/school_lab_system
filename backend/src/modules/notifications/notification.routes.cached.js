const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('./notification.controller');
const { cacheMiddleware, cacheTTL, invalidateCacheKey, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notifications for current user - cached with user-specific key
router.get('/', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.user), 
  getNotifications
);

// Get unread notification count - cached with user-specific key
router.get('/unread/count', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.user), 
  getUnreadCount
);

// Mark specific notification as read - invalidate user cache
router.put('/:id/read', 
  async (req, res, next) => {
    try {
      await markAsRead(req, res, next);
      // Invalidate user notifications cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*/api/v1/notifications*`);
    } catch (err) {
      next(err);
    }
  }
);

// Mark all notifications as read - invalidate user cache
router.put('/read/all', 
  async (req, res, next) => {
    try {
      await markAllAsRead(req, res, next);
      // Invalidate user notifications cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*/api/v1/notifications*`);
    } catch (err) {
      next(err);
    }
  }
);

// Delete specific notification - invalidate user cache
router.delete('/:id', 
  async (req, res, next) => {
    try {
      await deleteNotification(req, res, next);
      // Invalidate user notifications cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*/api/v1/notifications*`);
    } catch (err) {
      next(err);
    }
  }
);

// Delete all notifications - invalidate user cache
router.delete('/all', 
  async (req, res, next) => {
    try {
      await deleteAllNotifications(req, res, next);
      // Invalidate user notifications cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*/api/v1/notifications*`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;