const app = require('./app');
const db = require('./database/connection');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Test Database Connection
db.getConnection()
  .then(connection => {
    logger.info('✅ Database connection established successfully');
    connection.release();

    // Start Server
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://${HOST}:${PORT}/health`);
    });
  })
  .catch(error => {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  process.exit(1);
});
