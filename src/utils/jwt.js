const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const uuid = require('uuid');

const jwt_access = process.env.JWT_SECRET;

/**
 * Convert time string to milliseconds
 * Examples: '3d' -> 259200000, '15m' -> 900000, '1h' -> 3600000
 */
const parseExpiryToMs = expiryStr => {
  if (!expiryStr) return null;

  const match = expiryStr.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const [, value, unit] = match;
  const num = parseInt(value);

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return num * (units[unit] || 0);
};

/**
 * Get Access Token Expiry in milliseconds
 */
const getAccessTokenExpiryMs = () => {
  return parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '3d');
};

/**
 * Get Refresh Token Expiry in milliseconds
 */
const getRefreshTokenExpiryMs = () => {
  return parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '14d');
};

/*
 * Generate Access Token
 */
const generateAccessToken = payload => {
  return jwt.sign(payload, jwt_access, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '3d',
  });
};

/*
 * Generate Refresh Token and store it in the database
 */
const generateRefreshToken = async user_id => {
  const refreshToken = uuid.v4();
  const expiryMs = getRefreshTokenExpiryMs();
  const expiryDate = new Date(Date.now() + expiryMs);

  // Store refresh token in database
  const sql = 'INSERT INTO refresh_tokens (user_id, token, expires_At) VALUES (?, ?, ?)';
  await db.query(sql, [user_id, refreshToken, expiryDate]);

  return { refreshToken, expiryDate, expiryMs };
};

/*
 * Verify Access Token
 */
const verifyAccessToken = token => {
  try {
    const decoded = jwt.verify(token, jwt_access);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { expired: true };
    }
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getAccessTokenExpiryMs,
  getRefreshTokenExpiryMs,
  parseExpiryToMs,
};
