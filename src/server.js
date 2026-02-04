const app = require('./app');
const db = require('./database/connection');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

let server;

// Database Connection with Retry Logic
async function connectDatabaseWithRetry(maxRetries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await db.getConnection();
      logger.info(`✅ Database connection established successfully (attempt ${attempt})`);
      connection.release();
      return true;
    } catch (error) {
      logger.warn(
        `⚠️  Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
      );

      if (attempt === maxRetries) {
        logger.error('❌ All database connection attempts failed');
        throw error;
      }

      logger.info(`⏳ Retrying in ${delayMs / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP server closed');

      try {
        // Close database connections
        await db.end();
        logger.info('✅ Database connections closed');

        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('⚠️  Forceful shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

// Start Server
async function startServer() {
  try {
    // Connect to database with retry
    await connectDatabaseWithRetry();

    // Start Express server
    server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server is running on http://${HOST}:${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🏥 Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown signals (Koyeb sends SIGTERM on restart/deploy)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  gracefulShutdown('uncaughtException');
});

// Start the application
startServer();
