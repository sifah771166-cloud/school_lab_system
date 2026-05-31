const prisma = require('../../utils/prisma');

// Action types
const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
};

// Modules
const MODULES = {
  USERS: 'users',
  LABS: 'labs',
  ITEMS: 'items',
  SCHEDULES: 'schedules',
  ATTENDANCE: 'attendance',
  LOANS: 'loans',
  DEPARTMENTS: 'departments',
  AUTH: 'auth',
  NOTIFICATIONS: 'notifications',
};

// Create audit log
exports.log = async (data) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: data.module,
        entityId: data.entityId,
        entityName: data.entityName,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        status: data.status || 'success',
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main operation
    return null;
  }
};

// Log with request context
exports.logWithContext = async (req, data) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  return exports.log({
    ...data,
    userId: data.userId || req.user?.id,
    ipAddress,
    userAgent,
  });
};

// Get audit logs with filtering
exports.getLogs = async (filters = {}) => {
  const where = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.module) {
    where.module = filters.module;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { entityName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get audit log by ID
exports.getLogById = async (id) => {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

// Get user activity summary
exports.getUserActivitySummary = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      action: true,
      module: true,
      createdAt: true,
    },
  });

  const summary = {
    totalActions: logs.length,
    byAction: {},
    byModule: {},
    byDate: {},
  };

  logs.forEach(log => {
    // Count by action
    summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
    
    // Count by module
    summary.byModule[log.module] = (summary.byModule[log.module] || 0) + 1;
    
    // Count by date
    const date = log.createdAt.toISOString().split('T')[0];
    summary.byDate[date] = (summary.byDate[date] || 0) + 1;
  });

  return summary;
};

// Get system-wide statistics
exports.getSystemStats = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalLogs, failedActions, topUsers, topActions] = await Promise.all([
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate }, status: 'failed' },
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),
  ]);

  // Get user names for top users
  const topUsersWithNames = await Promise.all(
    topUsers.map(async (item) => {
      if (!item.userId) return { ...item, userName: 'System' };
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true },
      });
      return {
        ...item,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
      };
    })
  );

  return {
    totalLogs,
    failedActions,
    successRate: totalLogs > 0 ? ((totalLogs - failedActions) / totalLogs * 100).toFixed(2) : 100,
    topUsers: topUsersWithNames,
    topActions,
  };
};

// Delete old audit logs (cleanup)
exports.deleteOldLogs = async (daysOld = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
};

// Export constants
exports.ACTIONS = ACTIONS;
exports.MODULES = MODULES;
