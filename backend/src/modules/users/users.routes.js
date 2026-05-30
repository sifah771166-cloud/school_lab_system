const express = require('express');
const { protect } = require('../../middleware/auth');
const { getMe, updateProfile, changePassword } = require('./users.controller');

const router = express.Router();

// Protected profile route (any logged-in user)
router.get('/me', protect, getMe);

// Update profile route
router.put('/profile', protect, updateProfile);

// Change password route
router.put('/change-password', protect, changePassword);

module.exports = router;