const { z } = require('zod');

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

module.exports = { createDepartmentSchema, updateDepartmentSchema };