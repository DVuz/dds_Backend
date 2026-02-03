const bcrypt = require('bcryptjs');
const { security } = require('../config/app.config');

/**
 * Hash password using bcrypt
 */
const hashPassword = async password => {
  const salt = await bcrypt.genSalt(security.bcryptSaltRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
