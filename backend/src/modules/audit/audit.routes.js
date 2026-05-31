const express = require('express');
const { protect } = require('../../middleware/auth');
const {
  getLogs,
  getLogById,
  getUserActivitySummary,
  getSystemStats,
  cleanupOldLogs,
} = require('./audit.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get audit logs with filtering
router.get('/', getLogs);

// Get system-wide statistics (SUPER_ADMIN only)
router.get('/stats', getSystemStats);

// Get user activity summary
router.get('/user/:userId/summary', getUserActivitySummary);

// Get single audit log
router.get('/:id', getLogById);

// Cleanup old logs (SUPER_ADMIN only)
router.delete('/cleanup', cleanupOldLogs);

module.exports = router;
