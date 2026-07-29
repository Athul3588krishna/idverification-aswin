/**
 * utils/socket.js
 * ═══════════════════════════════════════════════════════════════
 * Handles Socket.io setup, connection events, and helpers to
 * broadcast real-time updates to connected admins and security staff.
 * ═══════════════════════════════════════════════════════════════
 */

const { Server } = require("socket.io");

let io = null;

/**
 * Initializes socket.io instance
 * @param {object} server - HTTP Server instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for dev simplicity
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 New real-time connection: ${socket.id}`);

    // Join a specific room (e.g. 'admin', 'security_staff', or a student's specific email room)
    socket.on("join", (room) => {
      socket.join(room);
      console.log(`👥 Client ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Connection closed: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Gets the initialized socket.io instance
 * @returns {object} Server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized yet!");
  }
  return io;
};

/**
 * Helper to emit events to everyone or a specific room
 * @param {string} eventName 
 * @param {any} data 
 * @param {string} [roomName] 
 */
const emitEvent = (eventName, data, roomName) => {
  if (io) {
    if (roomName) {
      io.to(roomName).emit(eventName, data);
    } else {
      io.emit(eventName, data);
    }
  }
};

module.exports = {
  initSocket,
  getIO,
  emitEvent
};
