const { z } = require('zod');

const productQuerySchema = z
  .object({
    status: z.enum(['active', 'inactive', 'all']).optional(),
    product_code: z.string().optional(),
    product_name_vn: z.string().optional(),
    product_type_id: z.string().optional(),
    category_id: z.string().optional(),
    color_vn: z.string().optional(),
    min_price: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
    max_price: z.string().transform(Number).pipe(z.number().nonnegative()).optional(),
    page: z.string().transform(Number).pipe(z.number().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().positive().max(100)).default('10'),
    sort_by: z.enum(['created_at', 'product_name_vn', 'price']).default('created_at'),
    sort_order: z.enum(['ASC', 'DESC']).default('DESC'),
  })
  .refine(
    data => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['minPrice'],
    }
  );

const productCreateSchema = z.object({
  product_code: z.string(),
  product_name_vn: z.string(),
  length: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()),
  width: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()),
  height: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()),
  material_vn: z.string(),
  color_vn: z.string().optional(),
  description_vn: z.string().optional(),
  price: z.string().transform(Number).pipe(z.number().nonnegative()).or(z.number().nonnegative()),
  product_type_id: z.string(),
  status: z
    .string()
    .refine(val => ['active', 'inactive'].includes(val), {
      message: 'Status must be either "active" or "inactive"',
    })
    .default('active'),
  origin_vn: z.string().optional(),
  warranty_period: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .or(z.number().positive())
    .optional(),
});

const productUpdateSchema = z.object({
  product_code: z.string().optional(),
  product_name_vn: z.string().optional(),
  length: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()).optional(),
  width: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()).optional(),
  height: z.string().transform(Number).pipe(z.number().positive()).or(z.number().positive()).optional(),
  material_vn: z.string().optional(),
  color_vn: z.string().optional(),
  description_vn: z.string().optional(),
  price: z.string().transform(Number).pipe(z.number().nonnegative()).or(z.number().nonnegative()).optional(),
  product_type_id: z.string().optional(),
  status: z
    .string()
    .refine(val => ['active', 'inactive'].includes(val), {
      message: 'Status must be either "active" or "inactive"',
    })
    .optional(),
  origin_vn: z.string().optional(),
  warranty_period: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .or(z.number().positive())
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

module.exports = { productQuerySchema, productCreateSchema, productUpdateSchema };
