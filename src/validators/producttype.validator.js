const { z } = require('zod');

// Schema for creating product type
const productTypeSchema = z.object({
  category_id: z.coerce.number().int().positive('Category ID must be a positive integer'),
  product_type_name_vn: z.string()
    .min(1, 'Product type name in Vietnamese is required')
    .max(255, 'Product type name in Vietnamese must be at most 255 characters long'),
  description_vn: z.string()
    .max(1000, 'Description in Vietnamese must be at most 1000 characters long')
    .optional(),
  status: z.enum(['active', 'inactive'])
    .default('active'),
});

// Schema for updating product type (all fields optional)
const productTypeUpdateSchema = z.object({
  category_id: z.coerce.number().int().positive('Category ID must be a positive integer').optional(),
  product_type_name_vn: z.string()
    .min(1, 'Product type name in Vietnamese cannot be empty')
    .max(255, 'Product type name in Vietnamese must be at most 255 characters long')
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

// Schema for query parameters (GET request)
const productTypeQuerySchema = z.object({
  product_type_name_vn: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort_by: z.enum(['product_type_name_vn', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
});

module.exports = {
  productTypeSchema,
  productTypeUpdateSchema,
  productTypeQuerySchema,
};


