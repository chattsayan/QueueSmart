const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/User");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3001",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        socket.userId = null; // Allow unauthenticated users
        socket.userRole = "guest";
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("+password");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.organizationId = user.organizationId?.toString();
      socket.branchId = user.branchId?.toString();
      socket.username = user.name;

      next();
    } catch (err) {
      logger.error("Socket authentication error:", err);
      socket.userId = null; // Allow unauthenticated users
      socket.userRole = "guest";
      next();
    }
  });

  // connection handler
  io.on("connection", (socket) => {
    logger.info(
      `Socket connected: ${socket.id} | (User: ${socket.username || "Guest"} | Role: ${socket.userRole})`,
    );

    if (socket.organizationId) {
      socket.join(`org:${socket.organizationId}`);
      logger.info(
        `Socket ${socket.id} joined organization room: org:${socket.organizationId}`,
      );
    }

    if (socket.branchId) {
      socket.join(`branch:${socket.branchId}`);
      logger.info(
        `Socket ${socket.id} joined branch room: branch:${socket.branchId}`,
      );
    }

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.info(
        `Socket ${socket.id} joined user room: user:${socket.userId}`,
      );
    }

    socket.on("join:service", (serviceId) => {
      socket.join(`service:${serviceId}`);
      logger.info(
        `Socket ${socket.id} joined service room: service:${serviceId}`,
      );

      socket.emit("joined:service", {
        serviceId,
        message: "Joined service room successfully",
      });
    });

    socket.on("join:counter", (counterId) => {
      socket.join(`counter:${counterId}`);
      logger.info(
        `Socket ${socket.id} joined counter room: counter:${counterId}`,
      );

      socket.emit("joined:counter", {
        counterId,
        message: "Joined counter room successfully",
      });
    });

    socket.on("leave:service", (serviceId) => {
      if (!serviceId) {
        socket.leave(`service:${serviceId}`);
        logger.info(
          `Socket ${socket.id} left service room: service:${serviceId}`,
        );
      }
    });

    socket.on("leave:counter", (counterId) => {
      if (!counterId) {
        socket.leave(`counter:${counterId}`);
        logger.info(
          `Socket ${socket.id} left counter room: counter:${counterId}`,
        );
      }
    });

    socket.on("staff:status", (data) => {
      if (
        socket.userRole === "staff" ||
        socket.userRole === "admin" ||
        socket.userRole === "superadmin"
      ) {
        const { counterId, status } = data;
        if (counterId && socket.branchId) {
          io.to(`branch:${socket.branchId}`).emit("counter:status:update", {
            counterId,
            staffId: socket.userId,
            staffName: socket.username,
            status,
            timestamp: new Date(),
          });
          logger.info(
            `Staff ${socket.username} updated counter ${counterId} status to ${status}`,
          );
        }
      }
    });

    socket.on("typing:start", (data) => {
      if (socket.userId && data.roomId) {
        socket.to(data.roomId).emit("user:typing", {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    socket.on("typing:stop", (data) => {
      if (socket.userId && data.roomId) {
        socket.to(data.roomId).emit("user:stopped:typing", {
          userId: socket.userId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);

      if (
        (socket.userRole === "staff" || socket.userRole === "admin") &&
        socket.branchId
      ) {
        io.to(`branch:${socket.branchId}`).emit("staff:offline", {
          staffId: socket.userId,
          staffName: socket.username,
          timestamp: new Date(),
        });
      }
    });

    socket.on("error", (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info("Socket.io server initialized");
  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

const emitToService = (serviceId, event, data) => {
  if (io) {
    io.to(`service:${serviceId}`).emit(event, data);
    logger.debug(`Emitted ${event} to service:${serviceId}`);
  }
};

const emitToBranch = (branchId, event, data) => {
  if (io) {
    io.to(`branch:${branchId}`).emit(event, data);
    logger.debug(`Emitted ${event} to branch:${branchId}`);
  }
};

const emitToOrganization = (organizationId, event, data) => {
  if (io) {
    io.to(`org:${organizationId}`).emit(event, data);
    logger.debug(`Emitted ${event} to org:${organizationId}`);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user:${userId}`);
  }
};

const emitToCounter = (counterId, event, data) => {
  if (io) {
    io.to(`counter:${counterId}`).emit(event, data);
    logger.debug(`Emitted ${event} to counter:${counterId}`);
  }
};

const broadCastAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    logger.debug(`Broadcasted ${event} to all clients`);
  }
};

const getConnectedCount = () => {
  if (io) {
    return io.sockets.sockets.size;
  }
  return 0;
};

const getSocketsInRoom = async (room) => {
  if (io) {
    const sockets = await io.in(room).fetchSockets();
    return sockets.map((socket) => socket.id);
  }
  return [];
};

module.exports = {
  initSocket,
  getIo,
  emitToService,
  emitToBranch,
  emitToOrganization,
  emitToUser,
  emitToCounter,
  broadCastAll,
  getConnectedCount,
  getSocketsInRoom,
};
