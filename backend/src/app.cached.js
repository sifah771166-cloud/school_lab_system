const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Route imports (cached versions)
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes.cached');
const departmentRoutes = require('./modules/departments/department.routes.cached');
const labRoutes = require('./modules/labs/labs.routes.cached');
const itemRoutes = require('./modules/items/items.routes.cached');
const scheduleRoutes = require('./modules/schedules/schedules.routes.cached');
const attendanceRoutes = require('./modules/attendance/attendance.routes.cached');
const loanRoutes = require('./modules/loans/loan.routes.cached');
const notificationRoutes = require('./modules/notifications/notification.routes.cached');
const searchRoutes = require('./modules/search/search.routes.cached');
const auditRoutes = require('./modules/audit/audit.routes.cached');
const qrRoutes = require('./modules/qr/qr.routes.cached');
const analyticsRoutes = require('./modules/analytics/analytics.routes.cached');

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: 'Too many login/register attempts, please try again later.'
});

const app = express();

// Global middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rate limiting
app.use('/api/v1/', generalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Routes (using cached versions)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/labs', labRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health check
app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Cache status endpoint
app.get('/api/v1/cache/status', async (req, res) => {
  try {
    const { cache } = require('./config/redis');
    const info = await cache.info();
    res.json({
      status: 'ok',
      redis: info ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Cache flush endpoint (admin only)
app.delete('/api/v1/cache/flush', async (req, res) => {
  try {
    const { cache } = require('./config/redis');
    await cache.flushAll();
    res.json({ status: 'ok', message: 'Cache flushed successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;