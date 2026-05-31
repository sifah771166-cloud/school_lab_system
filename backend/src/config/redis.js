const Redis = require('ioredis');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Redis event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready to accept commands');
});

redisClient.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

// Helper functions for caching
const cache = {
  // Get value from cache
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error('Redis GET error:', err);
      return null;
    }
  },

  // Set value in cache with optional TTL (in seconds)
  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.error('Redis SET error:', err);
      return false;
    }
  },

  // Delete key from cache
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error('Redis DEL error:', err);
      return false;
    }
  },

  // Delete multiple keys matching pattern
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (err) {
      console.error('Redis DEL PATTERN error:', err);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (err) {
      console.error('Redis EXISTS error:', err);
      return false;
    }
  },

  // Set expiration time for key
  async expire(key, seconds) {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (err) {
      console.error('Redis EXPIRE error:', err);
      return false;
    }
  },

  // Get TTL for key
  async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (err) {
      console.error('Redis TTL error:', err);
      return -1;
    }
  },

  // Increment value
  async incr(key) {
    try {
      return await redisClient.incr(key);
    } catch (err) {
      console.error('Redis INCR error:', err);
      return null;
    }
  },

  // Decrement value
  async decr(key) {
    try {
      return await redisClient.decr(key);
    } catch (err) {
      console.error('Redis DECR error:', err);
      return null;
    }
  },

  // Flush all keys (use with caution)
  async flushAll() {
    try {
      await redisClient.flushall();
      return true;
    } catch (err) {
      console.error('Redis FLUSHALL error:', err);
      return false;
    }
  },

  // Get Redis info
  async info() {
    try {
      return await redisClient.info();
    } catch (err) {
      console.error('Redis INFO error:', err);
      return null;
    }
  },
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redisClient.quit();
  process.exit(0);
});

module.exports = { redisClient, cache };
