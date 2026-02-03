module.exports = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        // Accept both DB_USER and DB_USERNAME (from your .env)
        user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        // Accept both DB_NAME and DB_DATABASE
        database: process.env.DB_NAME || process.env.DB_DATABASE || 'express_mysql_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRE || '7d',
    },

    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
    },
};
