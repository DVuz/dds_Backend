const { createClient } = require('redis');

const clientRedis = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

clientRedis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

async function connectRedis() {
  if (!clientRedis.isOpen) {
    await clientRedis.connect();
  }
}

connectRedis();

module.exports = clientRedis;
