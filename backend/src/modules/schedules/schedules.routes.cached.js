const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createScheduleSchema, updateScheduleSchema } = require('./schedule.validation');
const ctrl = require('./schedule.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // all routes require authentication

// GET all schedules - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getAll
);

// GET schedule by ID - cached with role/department specific key
router.get('/:id', 
  cacheMiddleware(cacheTTL.short, cacheKeyGenerators.role), 
  ctrl.getById
);

// POST create schedule - invalidate cache after creation
router.post('/', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(createScheduleSchema), 
  async (req, res, next) => {
    try {
      await ctrl.create(req, res, next);
      // Invalidate schedules cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// PUT update schedule - invalidate cache after update
router.put('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(updateScheduleSchema), 
  async (req, res, next) => {
    try {
      await ctrl.update(req, res, next);
      // Invalidate specific schedule cache and related caches
      await invalidateCache(`cache:*/api/v1/schedules/${req.params.id}`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE schedule - invalidate cache after deletion
router.delete('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  async (req, res, next) => {
    try {
      await ctrl.remove(req, res, next);
      // Invalidate schedules cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/schedules/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;