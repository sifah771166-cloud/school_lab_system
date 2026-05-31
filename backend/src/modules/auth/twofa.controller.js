const twoFAService = require('./twofa.service');
const prisma = require('../../utils/prisma');

// Generate 2FA setup
exports.generateSetup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    const { secret, qrCode, otpauth_url } = await twoFAService.generateTwoFactorSecret(userId, user.email);

    res.json({
      message: 'Two-factor setup generated',
      data: {
        secret,
        qrCode,
        otpauth_url
      }
    });
  } catch (err) {
    next(err);
  }
};

// Verify and enable 2FA
exports.enableTwoFA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ message: 'Secret and token are required' });
    }

    // Verify the token
    const isValid = twoFAService.verifyTOTPToken(secret, token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    const { user, backupCodes } = await twoFAService.enableTwoFactor(userId, secret);

    res.json({
      message: '2FA enabled successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled
        },
        backupCodes
      }
    });
  } catch (err) {
    next(err);
  }
};

// Disable 2FA
exports.disableTwoFA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Disable 2FA
    const updatedUser = await twoFAService.disableTwoFactor(userId);

    res.json({
      message: '2FA disabled successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          twoFactorEnabled: updatedUser.twoFactorEnabled
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get 2FA status
exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await twoFAService.getUserTwoFactorStatus(userId);

    res.json({
      message: 'Two-factor status retrieved',
      data: status
    });
  } catch (err) {
    next(err);
  }
};

// Regenerate backup codes
exports.regenerateBackupCodes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Regenerate backup codes
    const backupCodes = await twoFAService.regenerateBackupCodes(userId);

    res.json({
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes
      }
    });
  } catch (err) {
    next(err);
  }
};

// Verify 2FA token during login
exports.verifyLoginToken = async (req, res, next) => {
  try {
    const { userId, token, useBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'User ID and token are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    let isValid = false;

    if (useBackupCode) {
      // Verify backup code
      isValid = await twoFAService.verifyBackupCode(userId, token);
    } else {
      // Verify TOTP token
      isValid = twoFAService.verifyTOTPToken(user.twoFactorSecret, token);
    }

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    res.json({
      message: 'Two-factor verification successful',
      data: {
        verified: true
      }
    });
  } catch (err) {
    next(err);
  }
};
