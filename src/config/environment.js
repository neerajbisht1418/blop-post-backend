const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'qwertyuioplkjhgfdsazxcvbnm',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1h',
  APP_VERSION: process.env.APP_VERSION || 'v1',
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:50670",
  JWT_REFRESH_EXPIRATION_DAYS: process.env.JWT_REFRESH_EXPIRATION_DAYS || '30d',
  JWT_ACCESS_EXPIRATION_MINUTES: process.env.JWT_ACCESS_EXPIRATION_MINUTES || '30m'
};