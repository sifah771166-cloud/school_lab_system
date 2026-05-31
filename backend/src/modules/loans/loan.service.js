const prisma = require('../../utils/prisma');
const { emitLoanUpdate } = require('../../socket/socket');
const notificationService = require('../notifications/notification.service');

exports.requestLoan = async (userId, data) => {
  // Check item exists and quantity available
  const item = await prisma.item.findUnique({ 
    where: { id: data.itemId },
    include: { lab: { include: { department: true } } }
  });
  if (!item) throw new Error('Item not found');
  
  // Check if requested quantity exceeds available stock
  if (data.quantity > item.quantity) {
    throw new Error(`Requested quantity (${data.quantity}) exceeds available stock (${item.quantity})`);
  }
  
  if (data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  const loan = await prisma.loan.create({
    data: {
      userId,
      itemId: data.itemId,
      quantity: data.quantity,
      requestNote: data.requestNote,
      dueDate: data.dueDate,
      status: 'pending',
      borrowerName: data.borrowerName || 'Unknown',
    },
    include: {
      item: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });

  // Notify admins of the department about new loan request
  try {
    await notificationService.sendNotificationToDepartment(item.lab.departmentId, {
      title: 'Permintaan Peminjaman Baru',
      message: `${loan.user.name} mengajukan peminjaman ${item.name} (${data.quantity} unit)`,
      type: 'info',
      link: `/loans`
    });
  } catch (error) {
    console.error('Failed to send loan request notification:', error);
  }
  
  return loan;
};

exports.approveLoan = async (loanId, status, approverId, rejectionReason) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { 
      item: { include: { lab: true } },
      user: { select: { id: true, name: true, email: true } }
    },
  });
  if (!loan) throw new Error('Loan not found');
  
  // Check if approver has right to manage loans in that lab's department
  const user = await prisma.user.findUnique({ where: { id: approverId } });
  if (!user) throw new Error('Approver not found');
  
  // Check department access - SUPER_ADMIN can approve all, ADMIN_JURUSAN only their department
  if (user.role === 'ADMIN_JURUSAN' && !user.departmentId) {
    throw new Error('Your account is not assigned to any department');
  }
  
  if (user.role !== 'SUPER_ADMIN' && loan.item.lab.departmentId !== user.departmentId) {
    throw new Error('Access denied');
  }
  
  if (loan.status !== 'pending') throw new Error('Loan is not in pending state');

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      status,
      approvedBy: approverId,
      approvedAt: new Date(),
      ...(status === 'rejected' && { rejectionReason }),
    },
    include: {
      item: true,
      user: { select: { id: true, name: true, email: true } },
      approver: { select: { id: true, name: true } }
    }
  });

  // Send real-time update to the user who requested the loan
  try {
    emitLoanUpdate(loan.userId, {
      id: updatedLoan.id,
      status: updatedLoan.status,
      itemName: updatedLoan.item.name,
      quantity: updatedLoan.quantity,
      approvedBy: updatedLoan.approver?.name,
      approvedAt: updatedLoan.approvedAt,
      rejectionReason: updatedLoan.rejectionReason
    });
  } catch (error) {
    console.error('Failed to emit loan update:', error);
  }

  // Send notification to the user
  try {
    const notificationMessage = status === 'approved' 
      ? `Peminjaman ${loan.item.name} (${loan.quantity} unit) telah disetujui`
      : `Peminjaman ${loan.item.name} ditolak. Alasan: ${rejectionReason || 'Tidak ada alasan'}`;
    
    await notificationService.createNotification(loan.userId, {
      title: status === 'approved' ? 'Peminjaman Disetujui' : 'Peminjaman Ditolak',
      message: notificationMessage,
      type: status === 'approved' ? 'success' : 'error',
      link: '/loans'
    });
  } catch (error) {
    console.error('Failed to send loan approval notification:', error);
  }

  return updatedLoan;
};

exports.returnLoan = async (loanId, userId) => {
  const loan = await prisma.loan.findUnique({ 
    where: { id: loanId },
    include: {
      item: { include: { lab: { include: { department: true } } } },
      user: { select: { id: true, name: true } }
    }
  });
  if (!loan) throw new Error('Loan not found');
  if (loan.userId !== userId) throw new Error('You can only return your own loans');
  if (loan.status !== 'approved') throw new Error('Loan must be approved before return');
  
  const returnedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { status: 'returned', returnedAt: new Date() },
    include: {
      item: true,
      user: { select: { id: true, name: true } }
    }
  });

  // Send real-time update
  try {
    emitLoanUpdate(userId, {
      id: returnedLoan.id,
      status: 'returned',
      itemName: returnedLoan.item.name,
      quantity: returnedLoan.quantity,
      returnedAt: returnedLoan.returnedAt
    });
  } catch (error) {
    console.error('Failed to emit loan return update:', error);
  }

  // Notify department admins about the return
  try {
    await notificationService.sendNotificationToDepartment(loan.item.lab.departmentId, {
      title: 'Peminjaman Dikembalikan',
      message: `${loan.user.name} telah mengembalikan ${loan.item.name} (${loan.quantity} unit)`,
      type: 'info',
      link: '/loans'
    });
  } catch (error) {
    console.error('Failed to send loan return notification:', error);
  }

  return returnedLoan;
};

exports.getUserLoans = async (userId) => {
  return prisma.loan.findMany({ where: { userId }, include: { item: true } });
};

exports.getAllLoans = async (user) => {
  if (user.role === 'SUPER_ADMIN') return prisma.loan.findMany({ include: { item: true, user: { select: { id: true, name: true } } } });
  return prisma.loan.findMany({
    where: { item: { lab: { departmentId: user.departmentId } } },
    include: { item: true, user: { select: { id: true, name: true } } },
  });
};