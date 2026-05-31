const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/auth');
const { cacheMiddleware, cacheTTL, invalidateCache } = require('../../middleware/cacheMiddleware');

// Apply authentication to all routes
router.use(authenticate);

// Get all departments (with caching - 15 minutes)
router.get('/', cacheMiddleware(cacheTTL.long), departmentController.getAllDepartments);

// Get single department (with caching - 15 minutes)
router.get('/:id', cacheMiddleware(cacheTTL.long), departmentController.getDepartmentById);

// Create department (Super Admin only) - invalidate cache after creation
router.post('/', authorize('SUPER_ADMIN'), async (req, res, next) => {
  // Invalidate departments cache
  await invalidateCache('cache:/api/v1/departments*');
  next();
}, departmentController.createDepartment);

// Update department (Super Admin only) - invalidate cache after update
router.put('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  await invalidateCache('cache:/api/v1/departments*');
  next();
}, departmentController.updateDepartment);

// Delete department (Super Admin only) - invalidate cache after deletion
router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  await invalidateCache('cache:/api/v1/departments*');
  next();
}, departmentController.deleteDepartment);

module.exports = router;
