// socket/socket.js
const socketIO = require('socket.io');
const { CLIENT_URL } = require('../config/environment');

let io;

module.exports = {
  init: (server) => {
    io = socketIO(server, {
      pingTimeout: 60000,
      cors: {
        origin: CLIENT_URL || "*",
      },
    });
    
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};