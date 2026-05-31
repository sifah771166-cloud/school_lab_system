const express = require('express');
const { register, login, loginAfter2FA } = require('./auth.controller');
const validate = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('./auth.validation');
const { protect, authorize } = require('../../middleware/auth');
const twoFARoutes = require('./twofa.routes');

const router = express.Router();

// Register hanya bisa dilakukan oleh super admin
router.post('/register', protect, authorize('SUPER_ADMIN'), validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/login-2fa', loginAfter2FA);

// 2FA routes
router.use('/2fa', twoFARoutes);

module.exports = router;