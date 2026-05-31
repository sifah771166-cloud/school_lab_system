const express = require('express');
const router = express.Router();
const controller = require('./qr.controller');
const authenticate = require('../../middleware/authenticate');
const { cacheMiddleware, cacheTTL, invalidateCache, cacheKeyGenerators } = require('../../middleware/cacheMiddleware');

// All routes require authentication
router.use(authenticate);

// Generate QR code for specific lab - cached with role/department specific key
router.get('/lab/:id', 
  cacheMiddleware(cacheTTL.long, cacheKeyGenerators.role), 
  controller.generateLabQRCode
);

// Generate QR codes for all labs (batch) - cached with role/department specific key
router.get('/labs/batch', 
  cacheMiddleware(cacheTTL.long, cacheKeyGenerators.role), 
  controller.generateBatchQRCodes
);

// Generate QR code for equipment/item - cached with role/department specific key
router.get('/item/:id', 
  cacheMiddleware(cacheTTL.long, cacheKeyGenerators.role), 
  controller.generateItemQRCode
);

// Validate QR code scan - no caching (real-time operation)
router.post('/validate', controller.validateQRScan);

// QR-based check-in - invalidate cache after check-in
router.post('/checkin', 
  async (req, res, next) => {
    try {
      await controller.qrCheckIn(req, res, next);
      // Invalidate attendance and related caches
      await invalidateCache('cache:role:*');
      await invalidateCache('cache:dept:*');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;