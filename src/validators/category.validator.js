const { z } = require('zod');

const categorySchema = z.object({
  category_name_vn: z.string()
    .min(1, 'Category name in Vietnamese is required')
    .max(100, 'Category name in Vietnamese must be at most 100 characters long'),

  description_vn: z.string()
    .max(1000, 'Description in Vietnamese must be at most 1000 characters long')
    .optional(),

  status: z.enum(['active', 'inactive'])
    .default('active'),
});

const categoryUpdateSchema = z.object({
  category_name_vn: z.string()
    .min(1, 'Category name in Vietnamese cannot be empty')
    .max(100, 'Category name in Vietnamese must be at most 100 characters long')
    .optional(),

  description_vn: z.string()
    .max(1000, 'Description in Vietnamese must be at most 1000 characters long')
    .optional(),

  status: z.enum(['active', 'inactive'])
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

const categoryQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  category_name_vn: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).default('10'),
  sort_by: z.enum(['created_at', 'category_name_vn']).default('created_at'),
  sort_order: z.enum(['ASC', 'DESC']).default('DESC'),
});

module.exports = { categorySchema, categoryUpdateSchema, categoryQuerySchema };
