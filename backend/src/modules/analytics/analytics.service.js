const prisma = require('../../utils/prisma');

// Get overview statistics
exports.getOverviewStats = async (user, startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Filter by department for ADMIN_JURUSAN
  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  // Total labs
  const totalLabs = await prisma.lab.count({
    where: departmentFilter
  });

  // Total items
  const totalItems = await prisma.item.count({
    where: {
      lab: departmentFilter
    }
  });

  // Total attendance
  const totalAttendance = await prisma.attendance.count({
    where: {
      ...dateFilter,
      ...(user.role === 'ADMIN_JURUSAN' && {
        lab: departmentFilter
      })
    }
  });

  // Total loans
  const totalLoans = await prisma.loan.count({
    where: {
      ...dateFilter,
      ...(user.role === 'ADMIN_JURUSAN' && {
        item: {
          lab: departmentFilter
        }
      })
    }
  });

  // Pending loans
  const pendingLoans = await prisma.loan.count({
    where: {
      status: 'pending',
      ...(user.role === 'ADMIN_JURUSAN' && {
        item: {
          lab: departmentFilter
        }
      })
    }
  });

  // Active check-ins (not checked out)
  const activeCheckIns = await prisma.attendance.count({
    where: {
      checkInTime: { not: null },
      checkOutTime: null,
      ...(user.role === 'ADMIN_JURUSAN' && {
        lab: departmentFilter
      })
    }
  });

  return {
    totalLabs,
    totalItems,
    totalAttendance,
    totalLoans,
    pendingLoans,
    activeCheckIns
  };
};

// Get lab utilization analytics
exports.getLabUtilization = async (user, startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.checkInTime = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  const labs = await prisma.lab.findMany({
    where: departmentFilter,
    include: {
      department: {
        select: { name: true }
      },
      attendances: {
        where: {
          ...dateFilter,
          checkInTime: { not: null }
        }
      },
      _count: {
        select: {
          attendances: {
            where: {
              ...dateFilter,
              checkInTime: { not: null }
            }
          }
        }
      }
    }
  });

  const labUtilization = labs.map(lab => {
    const totalVisits = lab._count.attendances;
    const capacity = lab.capacity || 1;
    
    // Calculate average occupancy
    const attendances = lab.attendances;
    let totalOccupancyHours = 0;
    
    attendances.forEach(att => {
      if (att.checkInTime && att.checkOutTime) {
        const hours = (new Date(att.checkOutTime) - new Date(att.checkInTime)) / (1000 * 60 * 60);
        totalOccupancyHours += hours;
      }
    });

    const avgOccupancyHours = attendances.length > 0 ? totalOccupancyHours / attendances.length : 0;
    const utilizationRate = capacity > 0 ? (totalVisits / (capacity * 30)) * 100 : 0; // Assuming 30 days

    return {
      labId: lab.id,
      labName: lab.name,
      department: lab.department.name,
      capacity: lab.capacity,
      totalVisits,
      avgOccupancyHours: parseFloat(avgOccupancyHours.toFixed(2)),
      utilizationRate: parseFloat(utilizationRate.toFixed(2))
    };
  });

  return labUtilization.sort((a, b) => b.totalVisits - a.totalVisits);
};

// Get equipment usage analytics
exports.getEquipmentUsage = async (user, startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  const items = await prisma.item.findMany({
    where: {
      lab: departmentFilter
    },
    include: {
      lab: {
        select: { name: true, department: { select: { name: true } } }
      },
      loans: {
        where: dateFilter
      },
      _count: {
        select: {
          loans: {
            where: dateFilter
          }
        }
      }
    }
  });

  const equipmentUsage = items.map(item => {
    const totalLoans = item._count.loans;
    const approvedLoans = item.loans.filter(l => l.status === 'approved').length;
    const pendingLoans = item.loans.filter(l => l.status === 'pending').length;
    const returnedLoans = item.loans.filter(l => l.status === 'returned').length;

    // Calculate average loan duration
    const returnedWithDuration = item.loans.filter(l => l.status === 'returned' && l.returnedAt && l.createdAt);
    let avgLoanDuration = 0;
    
    if (returnedWithDuration.length > 0) {
      const totalDuration = returnedWithDuration.reduce((sum, loan) => {
        const days = (new Date(loan.returnedAt) - new Date(loan.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgLoanDuration = totalDuration / returnedWithDuration.length;
    }

    const returnRate = totalLoans > 0 ? (returnedLoans / totalLoans) * 100 : 0;

    return {
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
      lab: item.lab.name,
      department: item.lab.department.name,
      totalLoans,
      approvedLoans,
      pendingLoans,
      returnedLoans,
      avgLoanDuration: parseFloat(avgLoanDuration.toFixed(2)),
      returnRate: parseFloat(returnRate.toFixed(2))
    };
  });

  return equipmentUsage.sort((a, b) => b.totalLoans - a.totalLoans);
};

// Get department comparison
exports.getDepartmentComparison = async (user, startDate, endDate) => {
  // Only SUPER_ADMIN can see all departments
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Access denied. Only super admin can view department comparison.');
  }

  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const departments = await prisma.department.findMany({
    include: {
      labs: {
        include: {
          _count: {
            select: {
              attendances: {
                where: {
                  ...dateFilter,
                  checkInTime: { not: null }
                }
              },
              items: true
            }
          }
        }
      },
      _count: {
        select: {
          labs: true,
          users: true
        }
      }
    }
  });

  const departmentStats = await Promise.all(departments.map(async dept => {
    // Count total items in department
    const totalItems = await prisma.item.count({
      where: {
        lab: {
          departmentId: dept.id
        }
      }
    });

    // Count total loans in department
    const totalLoans = await prisma.loan.count({
      where: {
        ...dateFilter,
        item: {
          lab: {
            departmentId: dept.id
          }
        }
      }
    });

    // Count total attendance
    const totalAttendance = dept.labs.reduce((sum, lab) => sum + lab._count.attendances, 0);

    // Calculate average lab utilization
    const avgUtilization = dept.labs.length > 0 
      ? dept.labs.reduce((sum, lab) => sum + lab._count.attendances, 0) / dept.labs.length 
      : 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalLabs: dept._count.labs,
      totalUsers: dept._count.users,
      totalItems,
      totalLoans,
      totalAttendance,
      avgLabUtilization: parseFloat(avgUtilization.toFixed(2))
    };
  }));

  return departmentStats.sort((a, b) => b.totalAttendance - a.totalAttendance);
};

// Get attendance trends (daily)
exports.getAttendanceTrends = async (user, startDate, endDate) => {
  const dateFilter = {
    checkInTime: {
      gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      lte: new Date(endDate || new Date())
    }
  };

  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  const attendances = await prisma.attendance.findMany({
    where: {
      ...dateFilter,
      checkInTime: { not: null },
      ...(user.role === 'ADMIN_JURUSAN' && {
        lab: departmentFilter
      })
    },
    select: {
      checkInTime: true,
      date: true
    }
  });

  // Group by date
  const trendsByDate = {};
  attendances.forEach(att => {
    const date = att.date || new Date(att.checkInTime).toISOString().split('T')[0];
    trendsByDate[date] = (trendsByDate[date] || 0) + 1;
  });

  const trends = Object.entries(trendsByDate).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return trends;
};

// Get peak hours analysis
exports.getPeakHours = async (user, startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.checkInTime = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  const attendances = await prisma.attendance.findMany({
    where: {
      ...dateFilter,
      checkInTime: { not: null },
      ...(user.role === 'ADMIN_JURUSAN' && {
        lab: departmentFilter
      })
    },
    select: {
      checkInTime: true
    }
  });

  // Group by hour
  const hourCounts = {};
  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  attendances.forEach(att => {
    const hour = new Date(att.checkInTime).getHours();
    hourCounts[hour]++;
  });

  const peakHours = Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    hourLabel: `${hour.toString().padStart(2, '0')}:00`,
    count
  })).sort((a, b) => b.count - a.count);

  return peakHours;
};

// Get loan status distribution
exports.getLoanStatusDistribution = async (user, startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  const departmentFilter = user.role === 'ADMIN_JURUSAN' ? { departmentId: user.departmentId } : {};

  const loans = await prisma.loan.groupBy({
    by: ['status'],
    where: {
      ...dateFilter,
      ...(user.role === 'ADMIN_JURUSAN' && {
        item: {
          lab: departmentFilter
        }
      })
    },
    _count: {
      status: true
    }
  });

  return loans.map(loan => ({
    status: loan.status,
    count: loan._count.status
  }));
};

module.exports = exports;
