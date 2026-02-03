module.exports = {
  app: {
    name: 'Express MySQL API',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
  },

  server: {
    requestTimeout: 30000,
    bodyLimit: '10mb',
  },

  security: {
    bcryptSaltRounds: 10,
  },
};
