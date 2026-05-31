const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  getLogs,
  getLogById,
  getUserActivitySummary,
  getSystemStats,
  cleanupOldLogs,
} = require('./audit.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get audit logs with filtering - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  getLogs
);

// Get system-wide statistics (SUPER_ADMIN only) - cached with role specific key
router.get('/stats', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  getSystemStats
);

// Get user activity summary - cached with role/department specific key
router.get('/user/:userId/summary', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  getUserActivitySummary
);

// Get single audit log - cached with role/department specific key
router.get('/:id', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  getLogById
);

// Cleanup old logs (SUPER_ADMIN only) - invalidate cache after cleanup
router.delete('/cleanup', 
  async (req, res, next) => {
    try {
      await cleanupOldLogs(req, res, next);
      // Invalidate audit logs cache
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;