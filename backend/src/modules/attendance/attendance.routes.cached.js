const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createKunjunganSchema, updateKunjunganSchema } = require('./attendance.validation');
const ctrl = require('./attendance.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // all routes require authentication

// Get all kunjungan (with optional search) - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getAll
);

// Get labs with attendance summary (for admin views) - cached with role/department specific key
router.get('/labs/summary', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getLabsWithAttendance
);

// Get specific lab attendance history - cached with role/department specific key
router.get('/lab/:labId', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getLabAttendance
);

// Get department labs with attendance (for admin jurusan) - cached with department specific key
router.get('/department/:departmentId', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.department), 
  ctrl.getDepartmentLabsAttendance
);

// Get all departments with attendance (for super admin) - cached with role specific key
router.get('/admin/all-departments', 
  authorize('SUPER_ADMIN'), 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getAllDepartmentsAttendance
);

// Create kunjungan - invalidate cache after creation
router.post('/', 
  validate(createKunjunganSchema), 
  async (req, res, next) => {
    try {
      await ctrl.create(req, res, next);
      // Invalidate attendance cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// Update kunjungan - invalidate cache after update
router.put('/:id', 
  validate(updateKunjunganSchema), 
  async (req, res, next) => {
    try {
      await ctrl.update(req, res, next);
      // Invalidate specific attendance cache and related caches
      await invalidateCache(`cache:*/api/v1/attendance/${req.params.id}`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// Delete kunjungan (admin only) - invalidate cache after deletion
router.delete('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  async (req, res, next) => {
    try {
      await ctrl.delete(req, res, next);
      // Invalidate attendance cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/attendance/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;