const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createLoanSchema, approvalSchema } = require('./loan.validation');
const ctrl = require('./loan.controller');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect); // all routes require authentication

// GET all loans (filtered by role) - cached with role/department specific key
router.get('/', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getLoans
);

// GET user's own loans - cached with user-specific key
router.get('/my', 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.user), 
  ctrl.getUserLoans
);

// GET all loans (admin only) - cached with role specific key
router.get('/all', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  cacheMiddleware(cacheTTL.medium, cacheKeyGenerators.role), 
  ctrl.getAllLoans
);

// POST request loan - invalidate cache after creation
router.post('/', 
  validate(createLoanSchema), 
  async (req, res, next) => {
    try {
      await ctrl.requestLoan(req, res, next);
      // Invalidate loans cache for user and related caches
      await invalidateCache(`cache:user:${req.user.id}:*`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

// PUT approve loan - invalidate cache after approval
router.put('/:id/approve', 
  authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), 
  validate(approvalSchema), 
  async (req, res, next) => {
    try {
      await ctrl.approveLoan(req, res, next);
      // Invalidate loans cache for all users
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/loans/${req.params.id}*`);
    } catch (err) {
      next(err);
    }
  }
);

// PUT return loan - invalidate cache after return
router.put('/:id/return', 
  async (req, res, next) => {
    try {
      await ctrl.returnLoan(req, res, next);
      // Invalidate loans cache for user and related caches
      await invalidateCache(`cache:user:${req.user.id}:*`);
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
      await invalidateCache(`cache:*/api/v1/loans/${req.params.id}*`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;