const service = require('./audit.service');

exports.getLogs = async (req, res, next) => {
  try {
    const {
      userId,
      action,
      module,
      status,
      startDate,
      endDate,
      search,
      page,
      limit,
    } = req.query;

    const filters = {
      userId,
      action,
      module,
      status,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    };

    // Non-super-admin can only see their own logs
    if (req.user.role !== 'SUPER_ADMIN') {
      filters.userId = req.user.id;
    }

    const result = await service.getLogs(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await service.getLogById(id);

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    // Non-super-admin can only see their own logs
    if (req.user.role !== 'SUPER_ADMIN' && log.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
};

exports.getUserActivitySummary = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    // Non-super-admin can only see their own summary
    if (req.user.role !== 'SUPER_ADMIN' && userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const summary = await service.getUserActivitySummary(
      userId,
      days ? parseInt(days) : 30
    );

    res.json(summary);
  } catch (err) {
    next(err);
  }
};

exports.getSystemStats = async (req, res, next) => {
  try {
    // Only super admin can see system-wide stats
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { days } = req.query;
    const stats = await service.getSystemStats(days ? parseInt(days) : 30);

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.cleanupOldLogs = async (req, res, next) => {
  try {
    // Only super admin can cleanup logs
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { days } = req.query;
    const count = await service.deleteOldLogs(days ? parseInt(days) : 90);

    res.json({
      message: `Deleted ${count} old audit logs`,
      deletedCount: count,
    });
  } catch (err) {
    next(err);
  }
};
