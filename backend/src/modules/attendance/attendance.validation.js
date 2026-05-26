const { z } = require('zod');

const createKunjunganSchema = z.object({
  teacherName: z.string().min(1, 'Nama guru harus diisi'),
  classTeaching: z.string().min(1, 'Kelas yang diajar harus diisi'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam mulai harus HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam selesai harus HH:MM'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
});

const updateKunjunganSchema = z.object({
  teacherName: z.string().min(1, 'Nama guru harus diisi'),
  classTeaching: z.string().min(1, 'Kelas yang diajar harus diisi'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam mulai harus HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam selesai harus HH:MM'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional(),
});

module.exports = { createKunjunganSchema, updateKunjunganSchema };