const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Overview statistics
router.get('/overview', controller.getOverviewStats);

// Lab utilization analytics
router.get('/lab-utilization', controller.getLabUtilization);

// Equipment usage analytics
router.get('/equipment-usage', controller.getEquipmentUsage);

// Department comparison (Super Admin only)
router.get('/department-comparison', authorize('SUPER_ADMIN'), controller.getDepartmentComparison);

// Attendance trends
router.get('/attendance-trends', controller.getAttendanceTrends);

// Peak hours analysis
router.get('/peak-hours', controller.getPeakHours);

// Loan status distribution
router.get('/loan-status', controller.getLoanStatusDistribution);

// Export to Excel
router.get('/export/excel', controller.exportToExcel);

// Export to PDF
router.get('/export/pdf', controller.exportToPDF);

module.exports = router;
