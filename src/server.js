const http = require('http');
const app = require('./app');
const connectDB = require('./db/mongoose');
const { PORT } = require('./config/environment');
const socketInit = require('./socket/socket');
const mongoose = require('mongoose');

const port = PORT || 3000;
const server = http.createServer(app);
const io = socketInit.init(server);

const gracefulShutdown = (error, exitCode = 1) => {
  if (error) console.error('❌ Error:', error);
  server.close(() => {
    mongoose.connection.close(() => process.exit(exitCode));
  });
};

const startServer = async () => {
  await connectDB();

  server.listen(port, () => console.log(`🚀 Server running on port ${port}`));

  process.on('uncaughtException', gracefulShutdown);
  process.on('unhandledRejection', gracefulShutdown);
  process.on('SIGTERM', () => gracefulShutdown(null, 0));
};

startServer();
