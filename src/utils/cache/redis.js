const clientRedis = require('../../config/redis');
const { snakeObjToCamelObj } = require('../camelObjToSnakeObj');

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Parsed data or null if not found (in camelCase format)
 */
const getCache = async key => {
  try {
    const cachedData = await clientRedis.get(key);
    if (cachedData) {
      console.log('Cache hit:', key);
      return JSON.parse(cachedData);
    }
    console.log('❌ Cache miss:', key);
    return null;
  } catch (error) {
    console.warn('Redis get error:', error.message);
    return null;
  }
};

/**
 * Set data to cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be converted to camelCase before storing)
 * @param {number} ttl - Time to live in seconds (default: 60)
 * @returns {Promise<boolean>} - Success status
 */
const setCache = async (key, data, ttl = 60) => {
  try {
    // Convert snake_case to camelCase before storing in Redis
    const camelCaseData = snakeObjToCamelObj(data);
    await clientRedis.setEx(key, ttl, JSON.stringify(camelCaseData));
    console.log('💾 Cache saved (camelCase):', key, `(TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.warn('⚠️ Redis set error:', error.message);
    return false;
  }
};

/**
 * Delete cache by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
const deleteCache = async key => {
  try {
    await clientRedis.del(key);
    console.log(' Cache deleted:', key);
    return true;
  } catch (error) {
    console.warn(' Redis delete error:', error.message);
    return false;
  }
};

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Pattern to match (e.g., 'categories:*')
 * @returns {Promise<number>} - Number of keys deleted
 */
const deleteCachePattern = async pattern => {
  try {
    const keys = await clientRedis.keys(pattern);
    if (keys.length === 0) {
      console.log('ℹ No keys found for pattern:', pattern);
      return 0;
    }
    await clientRedis.del(keys);
    console.log(` Deleted ${keys.length} keys matching:`, pattern);
    return keys.length;
  } catch (error) {
    console.warn(' Redis deletePattern error:', error.message);
    return 0;
  }
};

/**
 * Check if cache exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - True if exists
 */
const existsCache = async key => {
  try {
    const result = await clientRedis.exists(key);
    return result === 1;
  } catch (error) {
    console.warn(' Redis exists error:', error.message);
    return false;
  }
};

/**
 * Get cache with fallback function
 * @param {string} key - Cache key
 * @param {Function} fallbackFn - Async function to get data if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<{data: any, source: 'cache'|'db'}>}
 */
const getCacheOrSet = async (key, fallbackFn, ttl = 60) => {
  // Try to get from cache
  const cached = await getCache(key);
  if (cached !== null) {
    return { data: cached, source: 'cache' };
  }

  // Cache miss - get from fallback
  const data = await fallbackFn();

  // Save to cache (fire and forget)
  setCache(key, data, ttl).catch(() => {});

  return { data, source: 'db' };
};

/**
 * Generate cache key from object
 * @param {string} prefix - Key prefix
 * @param {object} params - Parameters object
 * @returns {string} - Cache key
 */
const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key];
      // Only include defined and non-null values
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

  return `${prefix}:${JSON.stringify(sortedParams)}`;
};

/**
 * Wrapper function for easy cache implementation
 * @param {string} keyPrefix - Cache key prefix
 * @param {object} params - Query parameters
 * @param {Function} dataFetcher - Async function to fetch data
 * @param {number} ttl - Cache TTL in seconds
 * @returns {Promise<{data: any, source: 'cache'|'db'}>}
 */
const withCache = async (keyPrefix, params, dataFetcher, ttl = 60) => {
  const cacheKey = generateCacheKey(keyPrefix, params);
  return await getCacheOrSet(cacheKey, dataFetcher, ttl);
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  getCacheOrSet,
  generateCacheKey,
  withCache,
};
