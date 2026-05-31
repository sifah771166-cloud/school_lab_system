const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createItemSchema, updateItemSchema } = require('./item.validation');
const ctrl = require('./item.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // all routes require authentication

// GET all items - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getAll
);

// GET item by ID - cached with role/department specific key
router.get('/:id', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getById
);

// POST create item - invalidate cache after creation
router.post('/', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(createItemSchema), 
  async (req, res, next) => {
    try {
      await ctrl.create(req, res, next);
      // Invalidate items cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// PUT update item - invalidate cache after update
router.put('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(updateItemSchema), 
  async (req, res, next) => {
    try {
      await ctrl.update(req, res, next);
      // Invalidate specific item cache and related caches
      await invalidateCache(`cache:*/api/v1/items/${req.params.id}`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE item - invalidate cache after deletion
router.delete('/:id', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  async (req, res, next) => {
    try {
      await ctrl.remove(req, res, next);
      // Invalidate items cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/items/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;