const prisma = require('../../utils/prisma');
const { emitAttendanceUpdate, emitLabCapacityUpdate } = require('../../socket/socket');

// Get all kunjungan with optional search
exports.getAll = async (user, search) => {
  const where = {};
  
  // Filter by department for ADMIN_JURUSAN
  if (user.role === 'ADMIN_JURUSAN') {
    where.user = { departmentId: user.departmentId };
  }
  
  // Search filter
  if (search) {
    where.OR = [
      { teacherName: { contains: search, mode: 'insensitive' } },
      { classTeaching: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  return prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { date: 'desc' }
  });
};

// Get lab attendance history - for check-in/check-out tracking
exports.getLabAttendance = async (user, labId, search) => {
  // Verify user has access to this lab
  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: { departmentId: true }
  });

  if (!lab) throw new Error('Lab tidak ditemukan');

  // Check access: SUPER_ADMIN can see all, ADMIN_JURUSAN only their department
  if (user.role === 'ADMIN_JURUSAN' && lab.departmentId !== user.departmentId) {
    throw new Error('Anda tidak memiliki akses ke lab ini');
  }

  const where = {
    labId: labId,
    checkInTime: { not: null } // Only show check-in records
  };

  if (search) {
    where.user = {
      name: { contains: search, mode: 'insensitive' }
    };
  }

  return prisma.attendance.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, departmentId: true }
      },
      lab: {
        select: { id: true, name: true, departmentId: true }
      }
    },
    orderBy: { checkInTime: 'desc' }
  });
};

// Get all labs with their attendance summary - for admin views
exports.getLabsWithAttendance = async (user) => {
  let where = {};

  // ADMIN_JURUSAN only sees their department labs
  if (user.role === 'ADMIN_JURUSAN') {
    where.departmentId = user.departmentId;
  }

  const labs = await prisma.lab.findMany({
    where,
    include: {
      department: {
        select: { id: true, name: true }
      },
      _count: {
        select: {
          attendances: {
            where: { checkInTime: { not: null } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return labs;
};

// Get department labs with attendance - for admin jurusan
exports.getDepartmentLabsAttendance = async (user, departmentId) => {
  // ADMIN_JURUSAN can only see their own department
  if (user.role === 'ADMIN_JURUSAN' && departmentId !== user.departmentId) {
    throw new Error('Anda tidak memiliki akses ke departemen ini');
  }

  const labs = await prisma.lab.findMany({
    where: { departmentId },
    include: {
      department: {
        select: { id: true, name: true }
      },
      attendances: {
        where: { checkInTime: { not: null } },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { checkInTime: 'desc' },
        take: 50 // Latest 50 records per lab
      },
      _count: {
        select: {
          attendances: {
            where: { checkInTime: { not: null } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return labs;
};

// Get all departments with their labs and attendance - for super admin
exports.getAllDepartmentsAttendance = async () => {
  const departments = await prisma.department.findMany({
    include: {
      labs: {
        include: {
          attendances: {
            where: { checkInTime: { not: null } },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { checkInTime: 'desc' },
            take: 20 // Latest 20 records per lab
          },
          _count: {
            select: {
              attendances: {
                where: { checkInTime: { not: null } }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return departments;
};

// Create kunjungan
exports.create = async (userId, data) => {
  const { teacherName, classTeaching, startTime, endTime, date, labId } = data;
  
  if (!teacherName || !classTeaching || !startTime || !endTime) {
    throw new Error('Semua field harus diisi');
  }
  
  const attendance = await prisma.attendance.create({
    data: {
      userId,
      teacherName,
      classTeaching,
      startTime,
      endTime,
      date: date || new Date().toISOString().split('T')[0],
      ...(labId && { labId }),
      checkInTime: new Date()
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      lab: {
        select: { id: true, name: true, capacity: true }
      }
    }
  });

  // Emit real-time attendance update
  if (labId) {
    try {
      // Get current lab occupancy
      const currentOccupancy = await prisma.attendance.count({
        where: {
          labId,
          checkInTime: { not: null },
          checkOutTime: null
        }
      });

      emitAttendanceUpdate(labId, {
        type: 'check-in',
        userId,
        userName: attendance.user.name,
        teacherName,
        classTeaching,
        timestamp: attendance.checkInTime
      });

      // Emit lab capacity update
      emitLabCapacityUpdate(labId, {
        current: currentOccupancy,
        capacity: attendance.lab?.capacity || 0,
        percentage: attendance.lab?.capacity ? Math.round((currentOccupancy / attendance.lab.capacity) * 100) : 0
      });
    } catch (error) {
      console.error('Failed to emit attendance update:', error);
    }
  }
  
  return attendance;
};

// Update kunjungan
exports.update = async (id, user, data) => {
  const kunjungan = await prisma.attendance.findUnique({ 
    where: { id },
    include: {
      lab: {
        select: { id: true, name: true, capacity: true }
      }
    }
  });
  
  if (!kunjungan) {
    throw new Error('Kunjungan tidak ditemukan');
  }
  
  // User can only edit their own kunjungan
  if (user.role === 'USER' && kunjungan.userId !== user.id) {
    throw new Error('Anda tidak memiliki akses untuk mengedit kunjungan ini');
  }
  
  // Admin jurusan can only edit kunjungan from their department
  if (user.role === 'ADMIN_JURUSAN') {
    const kunjunganUser = await prisma.user.findUnique({ where: { id: kunjungan.userId } });
    if (!kunjunganUser) {
      throw new Error('User tidak ditemukan');
    }
    if (kunjunganUser.departmentId !== user.departmentId) {
      throw new Error('Anda tidak memiliki akses untuk mengedit kunjungan ini');
    }
  }
  
  const { teacherName, classTeaching, startTime, endTime, date, checkOut } = data;
  
  const updateData = {
    teacherName,
    classTeaching,
    startTime,
    endTime,
    date: date || kunjungan.date,
  };

  // Handle check-out
  if (checkOut && !kunjungan.checkOutTime) {
    updateData.checkOutTime = new Date();
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      lab: {
        select: { id: true, name: true, capacity: true }
      }
    }
  });

  // Emit real-time update if check-out occurred
  if (checkOut && kunjungan.labId) {
    try {
      // Get current lab occupancy
      const currentOccupancy = await prisma.attendance.count({
        where: {
          labId: kunjungan.labId,
          checkInTime: { not: null },
          checkOutTime: null
        }
      });

      emitAttendanceUpdate(kunjungan.labId, {
        type: 'check-out',
        userId: kunjungan.userId,
        userName: updatedAttendance.user.name,
        timestamp: updateData.checkOutTime
      });

      // Emit lab capacity update
      emitLabCapacityUpdate(kunjungan.labId, {
        current: currentOccupancy,
        capacity: updatedAttendance.lab?.capacity || 0,
        percentage: updatedAttendance.lab?.capacity ? Math.round((currentOccupancy / updatedAttendance.lab.capacity) * 100) : 0
      });
    } catch (error) {
      console.error('Failed to emit attendance update:', error);
    }
  }
  
  return updatedAttendance;
};

// Delete kunjungan (admin only)
exports.delete = async (id, user) => {
  if (user.role === 'USER') {
    throw new Error('Hanya admin yang dapat menghapus kunjungan');
  }
  
  const kunjungan = await prisma.attendance.findUnique({ where: { id } });
  
  if (!kunjungan) {
    throw new Error('Kunjungan tidak ditemukan');
  }
  
  // Admin jurusan can only delete kunjungan from their department
  if (user.role === 'ADMIN_JURUSAN') {
    const kunjunganUser = await prisma.user.findUnique({ where: { id: kunjungan.userId } });
    if (!kunjunganUser) {
      throw new Error('User tidak ditemukan');
    }
    if (kunjunganUser.departmentId !== user.departmentId) {
      throw new Error('Anda tidak memiliki akses untuk menghapus kunjungan ini');
    }
  }
  
  await prisma.attendance.delete({ where: { id } });
};