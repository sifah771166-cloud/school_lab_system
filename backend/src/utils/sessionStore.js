const { redisClient } = require('../config/redis');

/**
 * Redis Session Store
 * Store user sessions in Redis for better performance and scalability
 */
class RedisSessionStore {
  constructor(prefix = 'session:') {
    this.prefix = prefix;
    this.defaultTTL = 7 * 24 * 60 * 60; // 7 days in seconds
  }

  /**
   * Generate session key
   */
  getKey(sessionId) {
    return `${this.prefix}${sessionId}`;
  }

  /**
   * Create or update session
   */
  async set(sessionId, sessionData, ttl = this.defaultTTL) {
    try {
      const key = this.getKey(sessionId);
      const data = JSON.stringify(sessionData);
      await redisClient.setex(key, ttl, data);
      return true;
    } catch (err) {
      console.error('Redis session SET error:', err);
      return false;
    }
  }

  /**
   * Get session data
   */
  async get(sessionId) {
    try {
      const key = this.getKey(sessionId);
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Redis session GET error:', err);
      return null;
    }
  }

  /**
   * Delete session
   */
  async destroy(sessionId) {
    try {
      const key = this.getKey(sessionId);
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error('Redis session DESTROY error:', err);
      return false;
    }
  }

  /**
   * Update session TTL
   */
  async touch(sessionId, ttl = this.defaultTTL) {
    try {
      const key = this.getKey(sessionId);
      await redisClient.expire(key, ttl);
      return true;
    } catch (err) {
      console.error('Redis session TOUCH error:', err);
      return false;
    }
  }

  /**
   * Check if session exists
   */
  async exists(sessionId) {
    try {
      const key = this.getKey(sessionId);
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (err) {
      console.error('Redis session EXISTS error:', err);
      return false;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId) {
    try {
      const pattern = `${this.prefix}*`;
      const keys = await redisClient.keys(pattern);
      const sessions = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data);
          if (session.userId === userId) {
            sessions.push({
              sessionId: key.replace(this.prefix, ''),
              ...session,
            });
          }
        }
      }

      return sessions;
    } catch (err) {
      console.error('Redis get user sessions error:', err);
      return [];
    }
  }

  /**
   * Delete all sessions for a user
   */
  async destroyUserSessions(userId) {
    try {
      const sessions = await this.getUserSessions(userId);
      const deletePromises = sessions.map(session => 
        this.destroy(session.sessionId)
      );
      await Promise.all(deletePromises);
      return true;
    } catch (err) {
      console.error('Redis destroy user sessions error:', err);
      return false;
    }
  }

  /**
   * Get session count for a user
   */
  async getUserSessionCount(userId) {
    try {
      const sessions = await this.getUserSessions(userId);
      return sessions.length;
    } catch (err) {
      console.error('Redis get user session count error:', err);
      return 0;
    }
  }

  /**
   * Clean up expired sessions (called periodically)
   */
  async cleanup() {
    try {
      const pattern = `${this.prefix}*`;
      const keys = await redisClient.keys(pattern);
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -2) { // Key doesn't exist
          cleaned++;
        }
      }

      console.log(`✅ Cleaned up ${cleaned} expired sessions`);
      return cleaned;
    } catch (err) {
      console.error('Redis session cleanup error:', err);
      return 0;
    }
  }

  /**
   * Get all active sessions count
   */
  async getActiveSessionsCount() {
    try {
      const pattern = `${this.prefix}*`;
      const keys = await redisClient.keys(pattern);
      return keys.length;
    } catch (err) {
      console.error('Redis get active sessions count error:', err);
      return 0;
    }
  }
}

// Create singleton instance
const sessionStore = new RedisSessionStore();

// Cleanup expired sessions every hour
setInterval(() => {
  sessionStore.cleanup();
}, 60 * 60 * 1000);

module.exports = sessionStore;
