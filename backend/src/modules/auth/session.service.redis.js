const prisma = require('../../utils/prisma');
const sessionStore = require('../../utils/sessionStore');
const crypto = require('crypto');

// Create new session (store in both Redis and DB)
exports.createSession = async (userId, token, req) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Parse device info from user agent
  const deviceInfo = parseUserAgent(userAgent);

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create session in database
  const dbSession = await prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      ipAddress,
      userAgent,
      deviceInfo,
      expiresAt,
    },
  });

  // Cache session in Redis for fast access
  const sessionData = {
    id: dbSession.id,
    userId,
    token: hashToken(token),
    ipAddress,
    userAgent,
    deviceInfo,
    expiresAt: expiresAt.toISOString(),
    lastActivity: new Date().toISOString(),
  };

  await sessionStore.set(dbSession.id, sessionData, 7 * 24 * 60 * 60); // 7 days TTL

  return dbSession;
};

// Get session by token (check Redis first, then DB)
exports.getSession = async (token) => {
  const hashedToken = hashToken(token);

  // Try to get from Redis first
  const sessionId = await findSessionIdByToken(hashedToken);
  if (sessionId) {
    const cachedSession = await sessionStore.get(sessionId);
    if (cachedSession) {
      console.log('✅ Session from Redis cache');
      return {
        ...cachedSession,
        user: await getUserById(cachedSession.userId),
      };
    }
  }

  // Fallback to database
  console.log('⚠️ Session from database (cache miss)');
  const dbSession = await prisma.session.findUnique({
    where: { token: hashedToken },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, departmentId: true },
      },
    },
  });

  // Cache the session if found
  if (dbSession) {
    const sessionData = {
      id: dbSession.id,
      userId: dbSession.userId,
      token: dbSession.token,
      ipAddress: dbSession.ipAddress,
      userAgent: dbSession.userAgent,
      deviceInfo: dbSession.deviceInfo,
      expiresAt: dbSession.expiresAt.toISOString(),
      lastActivity: dbSession.lastActivity.toISOString(),
    };
    await sessionStore.set(dbSession.id, sessionData, 7 * 24 * 60 * 60);
  }

  return dbSession;
};

// Update session activity (update Redis and DB)
exports.updateActivity = async (token) => {
  try {
    const hashedToken = hashToken(token);
    
    // Update in database
    const dbSession = await prisma.session.update({
      where: { token: hashedToken },
      data: { lastActivity: new Date() },
    });

    // Update in Redis cache
    const cachedSession = await sessionStore.get(dbSession.id);
    if (cachedSession) {
      cachedSession.lastActivity = new Date().toISOString();
      await sessionStore.set(dbSession.id, cachedSession, 7 * 24 * 60 * 60);
    }
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
};

// Delete session (logout) - remove from both Redis and DB
exports.deleteSession = async (token) => {
  try {
    const hashedToken = hashToken(token);
    
    // Get session ID first
    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      select: { id: true },
    });

    if (session) {
      // Delete from Redis
      await sessionStore.destroy(session.id);
      
      // Delete from database
      await prisma.session.delete({
        where: { token: hashedToken },
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to delete session:', error);
    return false;
  }
};

// Delete all user sessions (logout from all devices)
exports.deleteAllUserSessions = async (userId, excludeToken = null) => {
  const where = { userId };
  
  if (excludeToken) {
    where.NOT = { token: hashToken(excludeToken) };
  }

  // Get all sessions to delete from Redis
  const sessions = await prisma.session.findMany({ where, select: { id: true } });
  
  // Delete from Redis
  for (const session of sessions) {
    await sessionStore.destroy(session.id);
  }

  // Delete from database
  const result = await prisma.session.deleteMany({ where });
  return result.count;
};

// Get user sessions (from DB with Redis caching)
exports.getUserSessions = async (userId) => {
  // Try Redis first
  const cachedSessions = await sessionStore.getUserSessions(userId);
  if (cachedSessions && cachedSessions.length > 0) {
    console.log('✅ User sessions from Redis cache');
    return cachedSessions;
  }

  // Fallback to database
  console.log('⚠️ User sessions from database');
  const dbSessions = await prisma.session.findMany({
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

  return dbSessions;
};

// Clean expired sessions (from both Redis and DB)
exports.cleanExpiredSessions = async () => {
  // Clean from database
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  // Clean from Redis
  await sessionStore.cleanup();

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

// Helper: Find session ID by token in Redis
const findSessionIdByToken = async (hashedToken) => {
  try {
    // This is a workaround - in production, consider using Redis hash or secondary index
    const pattern = 'session:*';
    const { redisClient } = require('../../config/redis');
    const keys = await redisClient.keys(pattern);
    
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) {
        const session = JSON.parse(data);
        if (session.token === hashedToken) {
          return session.id;
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Error finding session by token:', err);
    return null;
  }
};

// Helper: Get user by ID
const getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, departmentId: true },
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
