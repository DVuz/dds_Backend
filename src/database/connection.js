const mysql = require('mysql2/promise');
const config = require('../config/database');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool(config.database);

// Test connection on startup
pool
  .getConnection()
  .then(connection => {
    logger.info('Database connection pool created');
    connection.release();
  })
  .catch(err => {
    logger.error('Error creating database connection pool:', err);
  });

// Execute query with error handling
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

module.exports = pool;
module.exports.query = query;
