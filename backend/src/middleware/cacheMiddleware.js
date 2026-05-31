const { cache } = require('../config/redis');

/**
 * Cache middleware for API responses
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Function to generate cache key from request
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl || req.url}`;

      // Try to get cached response
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        cache.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache response:', err);
        });

        // Send the response
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'cache:users:*')
 */
const invalidateCache = async (pattern) => {
  try {
    await cache.delPattern(pattern);
    console.log(`✅ Cache invalidated: ${pattern}`);
    return true;
  } catch (err) {
    console.error('Cache invalidation error:', err);
    return false;
  }
};

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
const invalidateCacheKey = async (key) => {
  try {
    await cache.del(key);
    console.log(`✅ Cache key invalidated: ${key}`);
    return true;
  } catch (err) {
    console.error('Cache key invalidation error:', err);
    return false;
  }
};

/**
 * Cache key generators for different resources
 */
const cacheKeyGenerators = {
  // User-specific cache key
  user: (req) => `cache:user:${req.user?.id}:${req.originalUrl}`,
  
  // Department-specific cache key
  department: (req) => `cache:dept:${req.user?.departmentId}:${req.originalUrl}`,
  
  // Role-specific cache key
  role: (req) => `cache:role:${req.user?.role}:${req.originalUrl}`,
  
  // Generic resource cache key
  resource: (resource) => (req) => `cache:${resource}:${req.originalUrl}`,
};

/**
 * Cache TTL presets (in seconds)
 */
const cacheTTL = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 900,        // 15 minutes
  hour: 3600,       // 1 hour
  day: 86400,       // 24 hours
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheKey,
  cacheKeyGenerators,
  cacheTTL,
};
