const bcrypt = require('bcryptjs');
const prisma = require('../../utils/prisma');
const { signToken } = require('../../utils/jwt');

const saltRounds = 12;

exports.register = async ({ email, password, name, role, departmentId }) => {
  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // If role is ADMIN_JURUSAN, departmentId must be provided
  if (role === 'ADMIN_JURUSAN' && !departmentId) {
    const err = new Error('Department ID is required for admin_jurusan');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      departmentId: departmentId || null,    // null for USER without department?
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      departmentId: true,
      twoFactorEnabled: true
    }
  });
  
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // If 2FA is enabled, return user ID for 2FA verification
  if (user.twoFactorEnabled) {
    return {
      requiresTwoFA: true,
      userId: user.id,
      email: user.email,
      message: 'Please verify with 2FA'
    };
  }

  const token = signToken({ userId: user.id, id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
};

// Complete login after 2FA verification
exports.completeLogin = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      departmentId: true
    }
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const token = signToken({ userId: user.id, id: user.id, role: user.role });

  return {
    token,
    user
  };
};
