const prisma = require('../../utils/prisma');
const crypto = require('crypto');

// Create new session
exports.createSession = async (userId, token, req) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Parse device info from user agent
  const deviceInfo = parseUserAgent(userAgent);

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      ipAddress,
      userAgent,
      deviceInfo,
      expiresAt,
    },
  });
};

// Get session by token
exports.getSession = async (token) => {
  return prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

// Update session activity
exports.updateActivity = async (token) => {
  try {
    await prisma.session.update({
      where: { token: hashToken(token) },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
};

// Delete session (logout)
exports.deleteSession = async (token) => {
  try {
    await prisma.session.delete({
      where: { token: hashToken(token) },
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Delete all user sessions (logout from all devices)
exports.deleteAllUserSessions = async (userId, excludeToken = null) => {
  const where = { userId };
  
  if (excludeToken) {
    where.NOT = { token: hashToken(excludeToken) };
  }

  const result = await prisma.session.deleteMany({ where });
  return result.count;
};

// Get user sessions
exports.getUserSessions = async (userId) => {
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivity: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      deviceInfo: true,
      lastActivity: true,
      createdAt: true,
    },
  });
};

// Clean expired sessions
exports.cleanExpiredSessions = async () => {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
};

// Get active sessions count
exports.getActiveSessionsCount = async (userId) => {
  return prisma.session.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  });
};

// Hash token for security
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Detect Browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

  // Detect Device Type
  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet')) device = 'Tablet';
  else device = 'Desktop';

  return `${device} - ${browser} on ${os}`;
};

exports.hashToken = hashToken;
