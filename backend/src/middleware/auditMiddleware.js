const auditService = require('../modules/audit/audit.service');

// Map routes to modules
const routeModuleMap = {
  '/api/v1/users': 'users',
  '/api/v1/labs': 'labs',
  '/api/v1/items': 'items',
  '/api/v1/schedules': 'schedules',
  '/api/v1/attendance': 'attendance',
  '/api/v1/loans': 'loans',
  '/api/v1/departments': 'departments',
  '/api/v1/auth': 'auth',
  '/api/v1/notifications': 'notifications',
};

// Map HTTP methods to actions
const methodActionMap = {
  POST: auditService.ACTIONS.CREATE,
  PUT: auditService.ACTIONS.UPDATE,
  PATCH: auditService.ACTIONS.UPDATE,
  DELETE: auditService.ACTIONS.DELETE,
};

// Routes to skip from logging
const skipRoutes = [
  '/api/v1/health',
  '/api/v1/notifications',
  '/api/v1/search',
];

// Check if route should be skipped
const shouldSkip = (path) => {
  return skipRoutes.some(route => path.startsWith(route));
};

// Get module from path
const getModuleFromPath = (path) => {
  for (const [route, module] of Object.entries(routeModuleMap)) {
    if (path.startsWith(route)) {
      return module;
    }
  }
  return 'unknown';
};

// Audit middleware
const auditMiddleware = async (req, res, next) => {
  // Skip if no user or should skip route
  if (!req.user || shouldSkip(req.path)) {
    return next();
  }

  // Store original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  // Store response data
  let responseData = null;

  // Override json method
  res.json = function (data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Override end method
  res.end = async function (chunk, encoding) {
    // Only log successful operations (2xx status)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const action = methodActionMap[req.method];
        
        if (action) {
          const module = getModuleFromPath(req.path);
          
          // Extract entity ID from params
          const entityId = req.params.id || null;
          
          // Get entity name from response if available
          const entityName = responseData?.data?.name || 
                          responseData?.data?.title ||
                          responseData?.data?.email ||
                          null;

          await auditService.logWithContext(req, {
            action,
            module,
            entityId,
            entityName,
            description: generateDescription(action, module, entityName, req.user.name),
            status: 'success',
          });
        }
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Generate description
const generateDescription = (action, module, entityName, userName) => {
  const actionText = {
    [auditService.ACTIONS.CREATE]: 'created',
    [auditService.ACTIONS.UPDATE]: 'updated',
    [auditService.ACTIONS.DELETE]: 'deleted',
  };

  const moduleText = {
    users: 'user',
    labs: 'lab',
    items: 'item',
    schedules: 'schedule',
    attendance: 'attendance record',
    loans: 'loan',
    departments: 'department',
    auth: 'authentication',
    notifications: 'notification',
  };

  const actionStr = actionText[action] || action.toLowerCase();
  const moduleStr = moduleText[module] || module;

  if (entityName) {
    return `${userName} ${actionStr} ${moduleStr} "${entityName}"`;
  }

  return `${userName} ${actionStr} a ${moduleStr}`;
};

// Manual log helper
exports.logAction = async (req, action, module, data = {}) => {
  return auditService.logWithContext(req, {
    action,
    module,
    ...data,
  });
};

// Export middleware
module.exports = auditMiddleware;
