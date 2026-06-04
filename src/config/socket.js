const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const connectedUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    connectedUsers.set(socket.userId, socket.id);
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join community rooms
    socket.on("join_community", (communityId) => {
      socket.join(`community:${communityId}`);
    });

    socket.on("leave_community", (communityId) => {
      socket.leave(`community:${communityId}`);
    });

    // Typing indicator for community chat
    socket.on("typing", ({ communityId }) => {
      socket.to(`community:${communityId}`).emit("user_typing", { userId: socket.userId });
    });

    // Private messaging
    socket.on("private_message", ({ toUserId, message }) => {
      const toSocketId = connectedUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("private_message", { from: socket.userId, message });
      }
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = socketHandler;
module.exports.connectedUsers = connectedUsers;