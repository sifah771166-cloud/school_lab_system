const express = require('express');
const { protect } = require('../../middleware/auth');
const { getMe, updateProfile, changePassword } = require('./users.controller');
const { cacheMiddleware, cacheTTL, invalidateCacheKey, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

// Protected profile route (any logged-in user) - cached with user-specific key
router.get('/me', 
  protect, 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.user), 
  getMe
);

// Update profile route - invalidate user cache after update
router.put('/profile', 
  protect, 
  async (req, res, next) => {
    try {
      await updateProfile(req, res, next);
      // Invalidate user-specific cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*`);
    } catch (err) {
      next(err);
    }
  }
);

// Change password route - invalidate user cache after password change
router.put('/change-password', 
  protect, 
  async (req, res, next) => {
    try {
      await changePassword(req, res, next);
      // Invalidate user-specific cache
      await invalidateCacheKey(`cache:user:${req.user.id}:*`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;