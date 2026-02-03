const db = require('../database/connection');

/**
 * Product Model
 * Handles all database operations related to products
 */
class ProductModel {
  /**
   * Check if product code already exists
   * @param {string} product_code - Vietnamese product code
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  static async checkProductCodeExists(product_code) {
    try {
      const query = `SELECT COUNT(*) AS count
                     FROM products
                     WHERE product_code = ?`;
      const [rows] = await db.execute(query, [product_code]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product by ID
   * @param {number} product_id - Product ID
   * @returns {Promise<Object|null>} - Product data or null if not found
   */
  static async getProductById(product_id) {
    try {
      const query = `SELECT
          p.*,
          pt.product_type_id,
          pt.product_type_name_vn,
          c.category_id,
          c.category_name_vn
        FROM products p
        LEFT JOIN producttypes pt ON p.product_type_id = pt.product_type_id
        LEFT JOIN categories c ON pt.category_id = c.category_id
                     WHERE product_id = ?`;
      const [rows] = await db.execute(query, [product_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new product
   * @param {Object} product_data - Product data
   * @returns {Promise<Object>} - Created product result
   */
  static async createProduct(product_data) {
    try {
      const insertQuery = `
              INSERT INTO products (
            product_code,
            product_name_vn,
            main_image,
            sub_image,
            length,
            width,
            height,
            material_vn,
            description_vn,
            origin_vn,
            color_vn,
            product_type_id,
            status,
            warranty_period,
            price,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

      const [result] = await db.execute(insertQuery, [
        product_data.product_code,
        product_data.product_name_vn,
        product_data.main_image || null,
        product_data.sub_image || null,
        product_data.length || null,
        product_data.width || null,
        product_data.height || null,
        product_data.material_vn || null,
        product_data.description_vn || null,
        product_data.origin_vn || null,
        product_data.color_vn || null,
        product_data.product_type_id,
        product_data.status || 'active',
        product_data.warranty_period || null,
        product_data.price,
      ]);

      return {
        productId: result.insertId,
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get products with filtering, sorting, and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Products and pagination info
   */
  static async getProducts(filters) {
    try {
      let {
        status = 'active',
        product_name_vn,
        product_type_id,
        category_id,
        color_vn,
        min_price,
        max_price,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;
      console.log('Filters in model:', filters);

      page = Number.isInteger(page) ? page : parseInt(page, 10) || 1;
      limit = Number.isInteger(limit) ? limit : parseInt(limit, 10) || 10;
      page = Math.max(1, page);
      limit = Math.max(1, limit);

      const offset = (page - 1) * limit;

      // Build the WHERE clause dynamically
      const whereClauses = [];
      const queryParams = [];

      if (status && status !== 'all') {
        whereClauses.push('p.status = ?');
        queryParams.push(status);
      }
      if (product_name_vn && product_name_vn.trim() !== '') {
        whereClauses.push('p.product_name_vn LIKE ?');
        queryParams.push(`%${product_name_vn.trim()}%`);
      }
      if (product_type_id) {
        whereClauses.push('p.product_type_id = ?');
        queryParams.push(product_type_id);
      }
      if (category_id) {
        whereClauses.push('pt.category_id = ?');
        queryParams.push(category_id);
      }
      if (color_vn && color_vn.trim() !== '') {
        whereClauses.push('p.color_vn LIKE ?');
        queryParams.push(`%${color_vn.trim()}%`);
      }
      if (min_price !== undefined) {
        whereClauses.push('p.price >= ?');
        queryParams.push(min_price);
      }
      if (max_price !== undefined) {
        whereClauses.push('p.price <= ?');
        queryParams.push(max_price);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const validSortBy = ['p.created_at', 'p.product_name_vn', 'p.price'].includes(sort_by)
        ? sort_by
        : 'created_at';
      const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      //query to get products
      const sql = `
        SELECT
          p.*,
          pt.product_type_id,
          pt.product_type_name_vn,
          c.category_id,
          c.category_name_vn
        FROM products p
        LEFT JOIN producttypes pt ON p.product_type_id = pt.product_type_id
        LEFT JOIN categories c ON pt.category_id = c.category_id
        ${whereClause}
        ORDER BY ${validSortBy} ${validSortOrder}
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await db.execute(sql, queryParams);

      // Query to get total count for pagination
      const countSql = `
        SELECT COUNT(*) AS total
        FROM products p
        LEFT JOIN producttypes pt ON p.product_type_id = pt.product_type_id
        LEFT JOIN categories c ON pt.category_id = c.category_id
        ${whereClause}
      `;
      const [countRows] = await db.execute(countSql, queryParams);
      const totalItems = countRows[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      return {
        products: rows,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a product by ID
   * @param {number} product_id - Product ID
   */
  static async deleteProductById(product_id) {
    try {
      const deleteQuery = `DELETE FROM products WHERE product_id = ?`;
      await db.execute(deleteQuery, [product_id]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product
   * @param {number} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Update result
   */
  static async updateProduct(productId, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.product_code !== undefined) {
        fields.push('product_code = ?');
        values.push(updateData.product_code);
      }
      if (updateData.product_name_vn !== undefined) {
        fields.push('product_name_vn = ?');
        values.push(updateData.product_name_vn);
      }
      if (updateData.main_image !== undefined) {
        fields.push('main_image = ?');
        values.push(updateData.main_image);
      }
      if (updateData.sub_image !== undefined) {
        fields.push('sub_image = ?');
        values.push(updateData.sub_image);
      }
      if (updateData.length !== undefined) {
        fields.push('length = ?');
        values.push(updateData.length);
      }
      if (updateData.width !== undefined) {
        fields.push('width = ?');
        values.push(updateData.width);
      }
      if (updateData.height !== undefined) {
        fields.push('height = ?');
        values.push(updateData.height);
      }
      if (updateData.material_vn !== undefined) {
        fields.push('material_vn = ?');
        values.push(updateData.material_vn);
      }
      if (updateData.description_vn !== undefined) {
        fields.push('description_vn = ?');
        values.push(updateData.description_vn);
      }
      if (updateData.origin_vn !== undefined) {
        fields.push('origin_vn = ?');
        values.push(updateData.origin_vn);
      }
      if (updateData.color_vn !== undefined) {
        fields.push('color_vn = ?');
        values.push(updateData.color_vn);
      }
      if (updateData.product_type_id !== undefined) {
        fields.push('product_type_id = ?');
        values.push(updateData.product_type_id);
      }
      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }
      if (updateData.warranty_period !== undefined) {
        fields.push('warranty_period = ?');
        values.push(updateData.warranty_period);
      }
      if (updateData.price !== undefined) {
        fields.push('price = ?');
        values.push(updateData.price);
      }

      fields.push('updated_at = NOW()');
      values.push(productId);

      const query = `
        UPDATE products
        SET ${fields.join(', ')}
        WHERE product_id = ?
      `;

      const [result] = await db.execute(query, values);

      return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
      };
    } catch (error) {
      throw error;
    }
  }
}
module.exports = ProductModel;
