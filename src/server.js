const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { MONGODB_URI, PORT } = require('./config/environment');
const socketInit = require('./socket/socket');

const port = PORT || 3000;
const server = http.createServer(app);
const io = socketInit.init(server);

const gracefulShutdown = (error, exitCode = 1) => {
  if (error) console.error('❌ Error:', error);
  server.close(() => {
    mongoose.connection.close(() => process.exit(exitCode));
  });
};

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000
})
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    process.on('uncaughtException', gracefulShutdown);
    process.on('unhandledRejection', gracefulShutdown);
    process.on('SIGTERM', () => gracefulShutdown(null, 0));
  })
  .catch((error) => gracefulShutdown(error));