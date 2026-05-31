const express = require('express');
const router = express.Router();
const twoFAController = require('./twofa.controller');
const authenticate = require('../../middleware/authenticate');

// Generate 2FA setup (requires authentication)
router.post('/setup', authenticate, twoFAController.generateSetup);

// Enable 2FA (requires authentication)
router.post('/enable', authenticate, twoFAController.enableTwoFA);

// Disable 2FA (requires authentication)
router.post('/disable', authenticate, twoFAController.disableTwoFA);

// Get 2FA status (requires authentication)
router.get('/status', authenticate, twoFAController.getStatus);

// Regenerate backup codes (requires authentication)
router.post('/backup-codes/regenerate', authenticate, twoFAController.regenerateBackupCodes);

// Verify 2FA token during login (no authentication required)
router.post('/verify-login', twoFAController.verifyLoginToken);

module.exports = router;
