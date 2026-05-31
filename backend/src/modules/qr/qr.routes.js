const express = require('express');
const router = express.Router();
const controller = require('./qr.controller');
const authenticate = require('../../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

// Generate QR code for specific lab
router.get('/lab/:id', controller.generateLabQRCode);

// Generate QR codes for all labs (batch)
router.get('/labs/batch', controller.generateBatchQRCodes);

// Generate QR code for equipment/item
router.get('/item/:id', controller.generateItemQRCode);

// Validate QR code scan
router.post('/validate', controller.validateQRScan);

// QR-based check-in
router.post('/checkin', controller.qrCheckIn);

module.exports = router;
