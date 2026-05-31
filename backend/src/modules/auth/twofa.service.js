const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../../utils/prisma');
const crypto = require('crypto');

// Generate 2FA secret and QR code
exports.generateTwoFactorSecret = async (userId, email) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `School Lab System (${email})`,
      issuer: 'School Lab System',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      otpauth_url: secret.otpauth_url
    };
  } catch (err) {
    throw err;
  }
};

// Verify TOTP token
exports.verifyTOTPToken = (secret, token) => {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time windows (±30 seconds)
    });

    return verified;
  } catch (err) {
    return false;
  }
};

// Enable 2FA for user
exports.enableTwoFactor = async (userId, secret) => {
  try {
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Update user with 2FA secret
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      }
    });

    // Create backup codes
    await prisma.backupCode.createMany({
      data: backupCodes.map(code => ({
        userId,
        code
      }))
    });

    return {
      user,
      backupCodes
    };
  } catch (err) {
    throw err;
  }
};

// Disable 2FA for user
exports.disableTwoFactor = async (userId) => {
  try {
    // Delete all backup codes
    await prisma.backupCode.deleteMany({
      where: { userId }
    });

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    return user;
  } catch (err) {
    throw err;
  }
};

// Verify backup code
exports.verifyBackupCode = async (userId, code) => {
  try {
    const backupCode = await prisma.backupCode.findFirst({
      where: {
        userId,
        code,
        used: false
      }
    });

    if (!backupCode) {
      return false;
    }

    // Mark backup code as used
    await prisma.backupCode.update({
      where: { id: backupCode.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    return true;
  } catch (err) {
    throw err;
  }
};

// Get remaining backup codes count
exports.getBackupCodesCount = async (userId) => {
  try {
    const count = await prisma.backupCode.count({
      where: {
        userId,
        used: false
      }
    });

    return count;
  } catch (err) {
    throw err;
  }
};

// Generate new backup codes
exports.regenerateBackupCodes = async (userId) => {
  try {
    // Delete old backup codes
    await prisma.backupCode.deleteMany({
      where: { userId }
    });

    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);

    // Create new backup codes
    await prisma.backupCode.createMany({
      data: backupCodes.map(code => ({
        userId,
        code
      }))
    });

    return backupCodes;
  } catch (err) {
    throw err;
  }
};

// Helper function to generate backup codes
function generateBackupCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Get user 2FA status
exports.getUserTwoFactorStatus = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const backupCodesCount = await exports.getBackupCodesCount(userId);

    return {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: backupCodesCount
    };
  } catch (err) {
    throw err;
  }
};
