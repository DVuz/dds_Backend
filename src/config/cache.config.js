/**
 * Redis Cache TTL Configuration (in seconds)
 */

const CACHE_TTL = {
  // Short-lived cache (frequently changing data)
  ONE_MINUTE: 60,
  FIVE_MINUTES: 5 * 60,
  TEN_MINUTES: 10 * 60,
  FIFTEEN_MINUTES: 15 * 60,

  // Medium-lived cache (moderately changing data)
  THIRTY_MINUTES: 30 * 60,
  ONE_HOUR: 60 * 60,
  THREE_HOURS: 3 * 60 * 60,
  SIX_HOURS: 6 * 60 * 60,
  TWELVE_HOURS: 12 * 60 * 60,

  // Long-lived cache (rarely changing data)
  ONE_DAY: 24 * 60 * 60,
  THREE_DAYS: 3 * 24 * 60 * 60,
  ONE_WEEK: 7 * 24 * 60 * 60,
  ONE_MONTH: 30 * 24 * 60 * 60,
};

/**
 * Recommended TTL for different data types
 */
const RECOMMENDED_TTL = {
  // Products change frequently (prices, stock, etc.)
  PRODUCTS_LIST: CACHE_TTL.THIRTY_MINUTES,
  PRODUCT_DETAIL: CACHE_TTL.THIRTY_MINUTES,

  // Categories change rarely
  CATEGORIES: CACHE_TTL.TWELVE_HOURS,
  CATEGORY_TREE: CACHE_TTL.TWELVE_HOURS,

  // Product types change rarely
  PRODUCT_TYPES: CACHE_TTL.TWELVE_HOURS,

  // Search results can be cached longer
  SEARCH_RESULTS: CACHE_TTL.FIFTEEN_MINUTES,

  // Static/config data
  SETTINGS: CACHE_TTL.ONE_DAY,
  BANNERS: CACHE_TTL.SIX_HOURS,

  // User-specific data (shorter TTL for security)
  USER_SESSION: CACHE_TTL.FIFTEEN_MINUTES,
  USER_PROFILE: CACHE_TTL.FIVE_MINUTES,
};

module.exports = {
  CACHE_TTL,
  RECOMMENDED_TTL,
};
