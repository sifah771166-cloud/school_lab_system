const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const prisma = require('../utils/prisma');

let io;

// Store connected users: { userId: socketId }
const connectedUsers = new Map();

// Initialize Socket.IO server
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, jwtSecret);
      
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          departmentId: true
        }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userDepartmentId = user.departmentId;
      socket.userName = user.name;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userId})`);
    
    // Store connected user
    connectedUsers.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to their department room (if they have one)
    if (socket.userDepartmentId) {
      socket.join(`department:${socket.userDepartmentId}`);
    }

    // Join role-based rooms
    socket.join(`role:${socket.userRole}`);

    // Emit online users count to all
    io.emit('users:online', {
      count: connectedUsers.size,
      timestamp: new Date()
    });

    // Handle client requesting online users
    socket.on('users:getOnline', () => {
      socket.emit('users:online', {
        count: connectedUsers.size,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userName} (${socket.userId})`);
      connectedUsers.delete(socket.userId);
      
      // Emit updated online users count
      io.emit('users:online', {
        count: connectedUsers.size,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit notification to specific user
const emitNotificationToUser = (userId, notification) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:new', notification);
    console.log(`📬 Notification sent to user ${userId}`);
  } catch (error) {
    console.error('Error emitting notification:', error.message);
  }
};

// Emit notification to department
const emitNotificationToDepartment = (departmentId, notification) => {
  try {
    const io = getIO();
    io.to(`department:${departmentId}`).emit('notification:new', notification);
    console.log(`📬 Notification sent to department ${departmentId}`);
  } catch (error) {
    console.error('Error emitting notification to department:', error.message);
  }
};

// Emit notification to role
const emitNotificationToRole = (role, notification) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit('notification:new', notification);
    console.log(`📬 Notification sent to role ${role}`);
  } catch (error) {
    console.error('Error emitting notification to role:', error.message);
  }
};

// Emit loan status update
const emitLoanUpdate = (userId, loanData) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('loan:updated', loanData);
    console.log(`💼 Loan update sent to user ${userId}`);
  } catch (error) {
    console.error('Error emitting loan update:', error.message);
  }
};

// Emit attendance update to lab
const emitAttendanceUpdate = (labId, attendanceData) => {
  try {
    const io = getIO();
    io.emit('attendance:updated', { labId, ...attendanceData });
    console.log(`👥 Attendance update sent for lab ${labId}`);
  } catch (error) {
    console.error('Error emitting attendance update:', error.message);
  }
};

// Emit lab capacity update
const emitLabCapacityUpdate = (labId, capacityData) => {
  try {
    const io = getIO();
    io.emit('lab:capacity', { labId, ...capacityData });
    console.log(`🏢 Lab capacity update sent for lab ${labId}`);
  } catch (error) {
    console.error('Error emitting lab capacity update:', error.message);
  }
};

// Get connected users count
const getConnectedUsersCount = () => {
  return connectedUsers.size;
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  initializeSocket,
  getIO,
  emitNotificationToUser,
  emitNotificationToDepartment,
  emitNotificationToRole,
  emitLoanUpdate,
  emitAttendanceUpdate,
  emitLabCapacityUpdate,
  getConnectedUsersCount,
  isUserOnline
};
