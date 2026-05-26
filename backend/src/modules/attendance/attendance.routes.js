const express = require('express');
const { protect, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createKunjunganSchema, updateKunjunganSchema } = require('./attendance.validation');
const ctrl = require('./attendance.controller');

const router = express.Router();

router.use(protect); // all routes require authentication

// Get all kunjungan (with optional search)
router.get('/', ctrl.getAll);

// Get labs with attendance summary (for admin views)
router.get('/labs/summary', authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), ctrl.getLabsWithAttendance);

// Get specific lab attendance history
router.get('/lab/:labId', authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), ctrl.getLabAttendance);

// Get department labs with attendance (for admin jurusan)
router.get('/department/:departmentId', authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), ctrl.getDepartmentLabsAttendance);

// Get all departments with attendance (for super admin)
router.get('/admin/all-departments', authorize('SUPER_ADMIN'), ctrl.getAllDepartmentsAttendance);

// Create kunjungan
router.post('/', validate(createKunjunganSchema), ctrl.create);

// Update kunjungan
router.put('/:id', validate(updateKunjunganSchema), ctrl.update);

// Delete kunjungan (admin only)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN_JURUSAN'), ctrl.delete);

module.exports = router;