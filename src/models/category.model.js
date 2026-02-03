const db = require('../database/connection');

/**
 * Category Model
 * Handles all database operations related to categories
 */
class CategoryModel {
  /**
   * Check if category name already exists
   * @param {string} categoryNameVn - Vietnamese category name
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  static async checkCategoryExists(categoryNameVn) {
    try {
      const query = `SELECT COUNT(*) AS count FROM categories WHERE category_name_vn = ?`;
      const [rows] = await db.execute(query, [categoryNameVn]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if category has associated product types
   * @param {number} category_id - Category ID
   * @returns {Promise<boolean>} - True if has associated product types, false otherwise
   */
  static async hasAssociatedProductTypes(category_id) {
    try {
      const query = `SELECT COUNT(*) AS count FROM producttypes WHERE category_id = ?`;
      const [rows] = await db.execute(query, [category_id]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get category by id
   * @param {number} category_id - Category ID
   * @returns {Promise<Object|null>} - Category data or null if not found
   */
  static async getCategoryById(category_id) {
    try {
      const query = `SELECT * FROM categories WHERE category_id = ?`;
      const [rows] = await db.execute(query, [category_id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }


  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} - Created category result
   */
  static async createCategory(categoryData) {
    try {
      const insertQuery = `
        INSERT INTO categories (category_name_vn, description_vn, image_url, status, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      const [result] = await db.execute(insertQuery, [
        categoryData.category_name_vn,
        categoryData.description_vn || null,
        categoryData.image_url || null,
        categoryData.status || 'active',
      ]);

      return {
        categoryId: result.insertId,
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get categories with filtering, sorting, and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Categories and pagination info
   */
  static async getCategories(filters) {
    try {
      let {
        status,
        category_name_vn,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;

      // Validate page and limit
      page = Number.isInteger(page) ? page : parseInt(page, 10) || 1;
      limit = Number.isInteger(limit) ? limit : parseInt(limit, 10) || 10;
      page = Math.max(1, page);
      limit = Math.max(1, limit);

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const whereConditions = [];
      const queryParams = [];

      if (category_name_vn && category_name_vn.trim()) {
        whereConditions.push('c.category_name_vn LIKE ?');
        queryParams.push(`%${category_name_vn}%`);
      }

      if (status && status !== 'all' && status.trim()) {
        whereConditions.push('c.status = ?');
        queryParams.push(status);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : 'WHERE 1=1';

      const validSortBy = ['category_name_vn', 'created_at'].includes(sort_by)
        ? sort_by
        : 'created_at';
      const validSortOrder = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // ✅ FIX: KHÔNG dùng ? cho LIMIT và OFFSET, string template thay vào
      const sql = `
      SELECT
        c.category_id,
        c.category_name_vn,
        c.description_vn,
        c.image_url,
        c.status,
        c.created_at,
        COUNT(DISTINCT pt.product_type_id) AS product_type_count,
        COUNT(DISTINCT CASE WHEN pt.status = 'active' THEN pt.product_type_id END) AS active_product_type_count
      FROM categories c
      LEFT JOIN producttypes pt ON c.category_id = pt.category_id
      ${whereClause}
      GROUP BY
        c.category_id,
        c.category_name_vn,
        c.description_vn,
        c.image_url,
        c.status,
        c.created_at
      ORDER BY c.${validSortBy} ${validSortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

      const [categories] = await db.execute(sql, queryParams);

      // Get total count
      const countSql = `
          SELECT COUNT(DISTINCT c.category_id) as total
          FROM categories c
                   LEFT JOIN producttypes pt ON c.category_id = pt.category_id
              ${whereClause}
      `;

      const [countResult] = await db.execute(countSql, queryParams);
      const total = countResult?.[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        categories: categories || [],
        pagination: {
          page,
          limit,
          total: parseInt(total, 10),
          totalPages,
        },
      };
    } catch (error) {
      throw error;
    }
  }



  /**
   * Get category by ID
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object|null>} - Category data or null
   */
  static async getCategoryById(categoryId) {
    try {
      const query = `
        SELECT 
          category_id,
          category_name_vn,
          description_vn,
          image_url,
          status,
          created_at,
          updated_at
        FROM categories
        WHERE category_id = ?
      `;

      const [rows] = await db.execute(query, [categoryId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update category
   * @param {number} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Update result
   */
  static async updateCategory(categoryId, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.category_name_vn !== undefined) {
        fields.push('category_name_vn = ?');
        values.push(updateData.category_name_vn);
      }
      if (updateData.description_vn !== undefined) {
        fields.push('description_vn = ?');
        values.push(updateData.description_vn);
      }
      if (updateData.image_url !== undefined) {
        fields.push('image_url = ?');
        values.push(updateData.image_url);
      }
      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }

      fields.push('updated_at = NOW()');
      values.push(categoryId);

      const query = `
        UPDATE categories
        SET ${fields.join(', ')}
        WHERE category_id = ?
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

  /**
   * Delete category
   * @param {number} category_id - Category ID
   * @returns {Promise<Object>} - Delete result
   */
  static deleteCategoryById(category_id) {
    try {
      const query = `DELETE FROM categories WHERE category_id = ?`;
      return db.execute(query, [category_id]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete category (update status to inactive)
   * @param {number} categoryId - Category ID
   * @returns {Promise<Object>} - Update result
   */
  static async softDeleteCategory(categoryId) {
    try {
      const query = `
        UPDATE categories
        SET status = 'inactive', updated_at = NOW()
        WHERE category_id = ?
      `;

      const [result] = await db.execute(query, [categoryId]);

      return {
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CategoryModel;
