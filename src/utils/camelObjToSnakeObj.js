/**
 * Convert camelCase to snake_case
 */
const camelToSnake = str => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = str => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively convert object keys from camelCase to snake_case
 */
const camelObjToSnakeObj = obj => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => camelObjToSnakeObj(item));
  }

  // Handle Date objects
  if (obj instanceof Date) return obj;

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.includes('_') ? key : camelToSnake(key);
      const value = obj[key];

      // Recursively convert nested objects
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        newObj[snakeKey] = camelObjToSnakeObj(value);
      } else {
        newObj[snakeKey] = value;
      }
    }
  }
  return newObj;
};

/**
 * Recursively convert object keys from snake_case to camelCase
 */
const snakeObjToCamelObj = obj => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => snakeObjToCamelObj(item));
  }

  // Handle Date objects
  if (obj instanceof Date) return obj;

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.includes('_') ? snakeToCamel(key) : key;
      const value = obj[key];

      // Recursively convert nested objects
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        newObj[camelKey] = snakeObjToCamelObj(value);
      } else {
        newObj[camelKey] = value;
      }
    }
  }
  return newObj;
};

module.exports = {
  camelObjToSnakeObj,
  snakeObjToCamelObj,
  camelToSnake,
  snakeToCamel,
};
