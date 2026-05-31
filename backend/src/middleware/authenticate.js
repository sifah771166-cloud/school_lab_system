const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const prisma = require('../utils/prisma');

// Middleware untuk authenticate user dengan JWT
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true,
        role: true, 
        departmentId: true 
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = authenticate;
