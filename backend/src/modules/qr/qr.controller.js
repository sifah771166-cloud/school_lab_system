const qrCodeService = require('../../utils/qrCodeService');
const prisma = require('../../utils/prisma');

// Generate QR code for a specific lab
exports.generateLabQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify lab exists
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true }
        }
      }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Check access for ADMIN_JURUSAN
    if (req.user.role === 'ADMIN_JURUSAN' && lab.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const qrCode = await qrCodeService.generateLabQRCode(lab.id, lab.name);

    res.json({
      message: 'QR code generated successfully',
      data: {
        labId: lab.id,
        labName: lab.name,
        department: lab.department.name,
        qrCode: qrCode.qrCode,
        token: qrCode.token
      }
    });
  } catch (err) {
    next(err);
  }
};

// Generate QR codes for all labs (batch)
exports.generateBatchQRCodes = async (req, res, next) => {
  try {
    // Only SUPER_ADMIN and ADMIN_JURUSAN can generate batch QR codes
    if (req.user.role === 'USER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let labs;
    if (req.user.role === 'SUPER_ADMIN') {
      labs = await prisma.lab.findMany({
        include: {
          department: {
            select: { id: true, name: true }
          }
        }
      });
    } else {
      // ADMIN_JURUSAN only gets their department labs
      labs = await prisma.lab.findMany({
        where: { departmentId: req.user.departmentId },
        include: {
          department: {
            select: { id: true, name: true }
          }
        }
      });
    }

    const qrCodes = await qrCodeService.generateBatchLabQRCodes(labs);

    res.json({
      message: 'QR codes generated successfully',
      count: qrCodes.length,
      data: qrCodes.map(qr => ({
        labId: qr.labId,
        labName: qr.labName,
        qrCode: qr.qrCode
      }))
    });
  } catch (err) {
    next(err);
  }
};

// Validate and process QR code scan
exports.validateQRScan = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    // Validate QR code
    const validation = qrCodeService.validateQRCode(qrData);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const data = validation.data;

    // Process based on QR type
    if (data.type === 'lab_checkin') {
      // Verify lab still exists
      const lab = await prisma.lab.findUnique({
        where: { id: data.labId },
        include: {
          department: {
            select: { id: true, name: true }
          }
        }
      });

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      res.json({
        valid: true,
        type: 'lab_checkin',
        data: {
          labId: lab.id,
          labName: lab.name,
          department: lab.department.name,
          capacity: lab.capacity
        }
      });
    } else if (data.type === 'equipment_loan') {
      // Verify item still exists
      const item = await prisma.item.findUnique({
        where: { id: data.itemId },
        include: {
          lab: {
            select: { id: true, name: true }
          }
        }
      });

      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json({
        valid: true,
        type: 'equipment_loan',
        data: {
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          lab: item.lab.name
        }
      });
    } else {
      res.status(400).json({ message: 'Unknown QR code type' });
    }
  } catch (err) {
    next(err);
  }
};

// QR-based check-in
exports.qrCheckIn = async (req, res, next) => {
  try {
    const { qrData, teacherName, classTeaching } = req.body;

    if (!qrData || !teacherName || !classTeaching) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate QR code
    const validation = qrCodeService.validateQRCode(qrData);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const data = validation.data;

    if (data.type !== 'lab_checkin') {
      return res.status(400).json({ message: 'Invalid QR code type for check-in' });
    }

    // Verify lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: data.labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Check if user already has active check-in
    const activeCheckIn = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        checkOutTime: null
      }
    });

    if (activeCheckIn) {
      return res.status(400).json({ 
        message: 'You already have an active check-in. Please check-out first.',
        activeCheckIn: {
          labId: activeCheckIn.labId,
          checkInTime: activeCheckIn.checkInTime
        }
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: req.user.id,
        labId: data.labId,
        teacherName,
        classTeaching,
        checkInTime: new Date(),
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().split(' ')[0],
        endTime: new Date().toTimeString().split(' ')[0]
      },
      include: {
        lab: {
          select: { id: true, name: true, capacity: true }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // Emit real-time update
    const { emitAttendanceUpdate, emitLabCapacityUpdate } = require('../../socket/socket');
    
    try {
      const currentOccupancy = await prisma.attendance.count({
        where: {
          labId: data.labId,
          checkInTime: { not: null },
          checkOutTime: null
        }
      });

      emitAttendanceUpdate(data.labId, {
        type: 'check-in',
        userId: req.user.id,
        userName: attendance.user.name,
        teacherName,
        classTeaching,
        timestamp: attendance.checkInTime
      });

      emitLabCapacityUpdate(data.labId, {
        current: currentOccupancy,
        capacity: attendance.lab.capacity || 0,
        percentage: attendance.lab.capacity ? Math.round((currentOccupancy / attendance.lab.capacity) * 100) : 0
      });
    } catch (error) {
      console.error('Failed to emit real-time updates:', error);
    }

    res.status(201).json({
      message: 'Check-in successful',
      data: attendance
    });
  } catch (err) {
    next(err);
  }
};

// Generate QR code for equipment
exports.generateItemQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        lab: {
          include: {
            department: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check access for ADMIN_JURUSAN
    if (req.user.role === 'ADMIN_JURUSAN' && item.lab.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const qrCode = await qrCodeService.generateLoanQRCode(item.id, item.name);

    res.json({
      message: 'QR code generated successfully',
      data: {
        itemId: item.id,
        itemName: item.name,
        lab: item.lab.name,
        qrCode: qrCode.qrCode,
        token: qrCode.token
      }
    });
  } catch (err) {
    next(err);
  }
};
