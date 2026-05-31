const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/auth');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

// All routes require authentication
router.use(authenticate);

// Overview statistics - cached with role/department specific key
router.get('/overview', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getOverviewStats
);

// Lab utilization analytics - cached with role/department specific key
router.get('/lab-utilization', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getLabUtilization
);

// Equipment usage analytics - cached with role/department specific key
router.get('/equipment-usage', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getEquipmentUsage
);

// Department comparison (Super Admin only) - cached with role specific key
router.get('/department-comparison', 
  authorize('SUPER_ADMIN'), 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getDepartmentComparison
);

// Attendance trends - cached with role/department specific key
router.get('/attendance-trends', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getAttendanceTrends
);

// Peak hours analysis - cached with role/department specific key
router.get('/peak-hours', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getPeakHours
);

// Loan status distribution - cached with role/department specific key
router.get('/loan-status', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  controller.getLoanStatusDistribution
);

// Export to Excel - no caching for exports
router.get('/export/excel', controller.exportToExcel);

// Export to PDF - no caching for exports
router.get('/export/pdf', controller.exportToPDF);

module.exports = router;