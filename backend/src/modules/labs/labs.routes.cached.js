const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createLabSchema, updateLabSchema } = require('./lab.validation');
const ctrl = require('./lab.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // all routes require authentication

// GET all labs - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getAll
);

// GET lab by ID - cached with role/department specific key
router.get('/:id', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getById
);

// POST create lab - invalidate cache after creation
router.post('/', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(createLabSchema), 
  async (req, res, next) => {
    try {
      await ctrl.create(req, res, next);
      // Invalidate labs cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// PUT update lab - invalidate cache after update
router.put('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(updateLabSchema), 
  async (req, res, next) => {
    try {
      await ctrl.update(req, res, next);
      // Invalidate specific lab cache and related caches
      await invalidateCache(`cache:*/api/v1/labs/${req.params.id}`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE lab - invalidate cache after deletion
router.delete('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  async (req, res, next) => {
    try {
      await ctrl.remove(req, res, next);
      // Invalidate labs cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/labs/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;