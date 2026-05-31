const prisma = require('../../utils/prisma');

// Search across all modules
exports.globalSearch = async (query, user, filters = {}) => {
  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const searchQuery = `%${query}%`;
  const results = {
    labs: [],
    items: [],
    schedules: [],
    attendance: [],
    loans: [],
    departments: [],
  };

  try {
    // Build where clause based on user role
    const labWhere = user.role === 'SUPER_ADMIN' 
      ? {} 
      : { departmentId: user.departmentId };

    // Search Labs
    if (!filters.type || filters.type === 'labs') {
      results.labs = await prisma.lab.findMany({
        where: {
          ...labWhere,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { department: true },
        take: filters.limit || 10,
      });
    }

    // Search Items
    if (!filters.type || filters.type === 'items') {
      results.items = await prisma.item.findMany({
        where: {
          lab: labWhere,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { lab: true },
        take: filters.limit || 10,
      });
    }

    // Search Schedules
    if (!filters.type || filters.type === 'schedules') {
      results.schedules = await prisma.schedule.findMany({
        where: {
          lab: labWhere,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { lab: true, creator: { select: { id: true, name: true } } },
        take: filters.limit || 10,
      });
    }

    // Search Attendance
    if (!filters.type || filters.type === 'attendance') {
      results.attendance = await prisma.attendance.findMany({
        where: {
          OR: [
            { teacherName: { contains: query, mode: 'insensitive' } },
            { classTeaching: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { user: { select: { id: true, name: true } } },
        take: filters.limit || 10,
      });
    }

    // Search Loans
    if (!filters.type || filters.type === 'loans') {
      results.loans = await prisma.loan.findMany({
        where: {
          item: {
            lab: labWhere,
          },
          OR: [
            { requestNote: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { 
          item: true, 
          user: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        take: filters.limit || 10,
      });
    }

    // Search Departments (SUPER_ADMIN only)
    if ((user.role === 'SUPER_ADMIN') && (!filters.type || filters.type === 'departments')) {
      results.departments = await prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: filters.limit || 10,
      });
    }

    return results;
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
};

// Search specific module
exports.searchModule = async (module, query, user, filters = {}) => {
  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const baseWhere = user.role === 'SUPER_ADMIN' 
    ? {} 
    : { departmentId: user.departmentId };

  switch (module) {
    case 'labs':
      return prisma.lab.findMany({
        where: {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { department: true },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

    case 'items':
      return prisma.item.findMany({
        where: {
          lab: baseWhere,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { lab: true },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

    case 'schedules':
      return prisma.schedule.findMany({
        where: {
          lab: baseWhere,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { lab: true, creator: { select: { id: true, name: true } } },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

    case 'attendance':
      return prisma.attendance.findMany({
        where: {
          OR: [
            { teacherName: { contains: query, mode: 'insensitive' } },
            { classTeaching: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { user: { select: { id: true, name: true } } },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

    case 'loans':
      return prisma.loan.findMany({
        where: {
          item: {
            lab: baseWhere,
          },
          OR: [
            { requestNote: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { 
          item: true, 
          user: { select: { id: true, name: true } },
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      });

    default:
      throw new Error('Invalid module');
  }
};

// Get autocomplete suggestions
exports.getAutocompleteSuggestions = async (query, user, module = null) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const suggestions = [];
  const baseWhere = user.role === 'SUPER_ADMIN' 
    ? {} 
    : { departmentId: user.departmentId };

  try {
    // Lab suggestions
    if (!module || module === 'labs') {
      const labs = await prisma.lab.findMany({
        where: {
          ...baseWhere,
          name: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, name: true },
        take: 5,
      });
      suggestions.push(...labs.map(lab => ({
        id: lab.id,
        text: lab.name,
        type: 'lab',
      })));
    }

    // Item suggestions
    if (!module || module === 'items') {
      const items = await prisma.item.findMany({
        where: {
          lab: baseWhere,
          name: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, name: true },
        take: 5,
      });
      suggestions.push(...items.map(item => ({
        id: item.id,
        text: item.name,
        type: 'item',
      })));
    }

    // Teacher name suggestions
    if (!module || module === 'attendance') {
      const teachers = await prisma.attendance.findMany({
        where: {
          teacherName: { contains: query, mode: 'insensitive' },
        },
        select: { teacherName: true },
        distinct: ['teacherName'],
        take: 5,
      });
      suggestions.push(...teachers.map(t => ({
        text: t.teacherName,
        type: 'teacher',
      })));
    }

    return suggestions;
  } catch (error) {
    throw new Error(`Autocomplete failed: ${error.message}`);
  }
};

// Save search history
exports.saveSearchHistory = async (userId, query, results) => {
  // This would require a SearchHistory model in Prisma
  // For now, we'll just return the query
  return {
    userId,
    query,
    resultCount: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    timestamp: new Date(),
  };
};

// Get search history
exports.getSearchHistory = async (userId, limit = 10) => {
  // This would query from SearchHistory model
  // For now, return empty array
  return [];
};
