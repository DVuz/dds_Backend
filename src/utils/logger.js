const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');

/**
 * Log levels
 */
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

/**
 * Format log message
 */
const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;

  if (meta) {
    logMessage += ` ${JSON.stringify(meta)}`;
  }

  return logMessage;
};

/**
 * Write log to file
 */
const writeLog = message => {
  fs.appendFileSync(logFile, message + '\n');
};

/**
 * Logger object
 */
const logger = {
  info: (message, meta = null) => {
    const logMessage = formatMessage(LogLevel.INFO, message, meta);
    console.log(logMessage);
    writeLog(logMessage);
  },

  warn: (message, meta = null) => {
    const logMessage = formatMessage(LogLevel.WARN, message, meta);
    console.warn(logMessage);
    writeLog(logMessage);
  },

  error: (message, meta = null) => {
    const logMessage = formatMessage(LogLevel.ERROR, message, meta);
    console.error(logMessage);
    writeLog(logMessage);
  },

  debug: (message, meta = null) => {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = formatMessage(LogLevel.DEBUG, message, meta);
      console.log(logMessage);
      writeLog(logMessage);
    }
  },
};

module.exports = logger;
