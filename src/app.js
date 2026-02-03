const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Load .env from the src directory explicitly (in case process.cwd() is project root)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const routes = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');
const { successResponse } = require('./utils/response');
const { autoCaseConverter } = require('./middleware/caseConverter.middleware');

// Create Express app
const app = express();

// Security Middleware - may be not compatible with some third-party scripts
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable if using inline scripts or styles
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body Parser (JSON only - multipart/form-data sẽ do multer xử lý)
// QUAN TRỌNG: Phải skip multipart requests vì express.json() sẽ consume stream
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    console.log('[EXPRESS] Skipping express.json() for multipart request');
    return next();
  }
  express.json()(req, res, next);
});
// KHÔNG dùng express.urlencoded() vì nó conflict với multer multipart/form-data
// app.use(express.urlencoded({ extended: true }));

// Auto Case Converter Middleware (camelCase ↔ snake_case)
// Chuyển request từ camelCase → snake_case và response từ snake_case → camelCase
app.use(autoCaseConverter);

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json(
    successResponse('Server is running!', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  );
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error Handling Middleware (must be last)
app.use(errorMiddleware);

module.exports = app;
