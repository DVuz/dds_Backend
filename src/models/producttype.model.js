const db = require("../database/connection")

/**
 * ProductType Model
 * Handles all database operations related to product types
 */
class ProductTypeModel {
  /**
   * Check if product type name already exists
   * @param {string} productTypeNameVn - Vietnamese product type name
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  static async checkProductTypeExists(productTypeNameVn) {
    try {
      const query = `SELECT COUNT(*) AS count
                     FROM producttypes
                     WHERE product_type_name_vn = ?`;
      const [rows] = await db.execute(query, [productTypeNameVn]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if product type name exists by a specific ID
   * @param {number} excludeId - Product type ID to exclude
   * @returns {Promise<boolean>} - True if exists, false otherwise
   */
  static async checkProductTypeExistsById(excludeId) {
    try {
      const query = `SELECT COUNT(*) AS count
                     FROM producttypes
                     WHERE product_type_id = ?`;
      const [rows] = await db.execute(query, [excludeId]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product types with filtering, sorting, and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Product types and pagination info
   */
  static async getProductTypes(filters) {
    try {
      let {
        status,
        product_type_name_vn,
        category_id,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'DESC',
      } = filters;

      // Ensure page and limit are valid numbers
      page = Number.isInteger(page) ? page : parseInt(page, 10) || 1;
      limit = Number.isInteger(limit) ? limit : parseInt(limit, 10) || 10;
      page = Math.max(1, page);
      limit = Math.min(Math.max(1, limit), 100);

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const whereConditions = [];
      const queryParams = [];

      if (product_type_name_vn) {
        whereConditions.push('pt.product_type_name_vn LIKE ?');
        queryParams.push(`%${product_type_name_vn}%`);
      }

      if (status && status !== 'all') {
        whereConditions.push('pt.status = ?');
        queryParams.push(status);
      }

      if (category_id) {
        whereConditions.push('pt.category_id = ?');
        queryParams.push(category_id);
      }

      const whereClause = whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Build ORDER BY clause
      const allowedSortFields = ['product_type_name_vn', 'created_at', 'updated_at'];
      const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Main query with JOINs
      const sql = `
        SELECT 
          pt.product_type_id,
          pt.product_type_name_vn,
          pt.description_vn,
          pt.image_url,
          pt.status,
          pt.category_id,
          pt.created_at,
          pt.updated_at,
          
          c.category_id,
          c.category_name_vn,
          c.image_url as category_image_url,
          c.status as category_status,
          
          p.product_id,
          p.product_code,
          p.product_name_vn,
          p.main_image,
          p.status as product_status
        FROM producttypes pt
        LEFT JOIN categories c ON pt.category_id = c.category_id
        LEFT JOIN products p ON pt.product_type_id = p.product_type_id
        ${whereClause}
        ORDER BY pt.${sortField} ${sortDirection}, p.product_id
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [rows] = await db.execute(sql, queryParams);

      // Transform flat rows into nested structure
      const productTypesMap = new Map();

      rows.forEach(row => {
        const ptId = row.product_type_id;

        // Create product type object if not exists
        if (!productTypesMap.has(ptId)) {
          productTypesMap.set(ptId, {
            product_type_id: row.product_type_id,
            product_type_name_vn: row.product_type_name_vn,
            description_vn: row.description_vn,
            image_url: row.image_url,
            status: row.status,
            category_id: row.category_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category: row.category_id ? {
              category_id: row.category_id,
              category_name_vn: row.category_name_vn,
              category_image_url: row.category_image_url,
              category_status: row.category_status,
            } : null,
            products: [],
            product_count: 0,
            active_product_count: 0,
          });
        }

        // Add product to list if exists
        const productType = productTypesMap.get(ptId);
        if (row.product_id && !productType.products.find(p => p.product_id === row.product_id)) {
          productType.products.push({
            product_id: row.product_id,
            product_code: row.product_code,
            product_name_vn: row.product_name_vn,
            main_image: row.main_image,
            status: row.product_status,
          });
        }
      });

      const productTypes = Array.from(productTypesMap.values());

      // Calculate product counts for each product type
      productTypes.forEach(productType => {
        productType.product_count = productType.products.length;
        productType.active_product_count = productType.products.filter(p => p.status === 'visible').length;
      });

      // Count total records
      const countSql = `
        SELECT COUNT(DISTINCT pt.product_type_id) AS total
        FROM producttypes pt
        ${whereClause}
      `;
      const [countResult] = await db.execute(countSql, queryParams);
      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        productTypes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get product type by ID
   * @param {number} productTypeId - Product type ID
   * @returns {Promise<Object|null>} - Product type object or null
   */
  static async getProductTypeById(productTypeId) {
    try {
      const query = `
        SELECT 
          product_type_id,
          product_type_name_vn,
          description_vn,
          image_url,
          status,
          category_id,
          created_at,
          updated_at
        FROM producttypes
        WHERE product_type_id = ?
      `;
      const [rows] = await db.execute(query, [productTypeId]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if product type has associated products
   * @param {number} productTypeId - Product type ID
   * @returns {Promise<boolean>} - True if has products, false otherwise
   */
  static async hasAssociatedProducts(productTypeId) {
    try {
      const query = `SELECT COUNT(*) AS count FROM products WHERE product_type_id = ?`;
      const [rows] = await db.execute(query, [productTypeId]);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete product type by ID
   * @param {number} productTypeId - Product type ID
   * @returns {Promise<void>}
   */
  static async deleteProductTypeById(productTypeId) {
    try {
      const query = `DELETE FROM producttypes WHERE product_type_id = ?`;
      await db.execute(query, [productTypeId]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update product type
   * @param {number} productTypeId - Product type ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Update result
   */
  static async updateProductType(productTypeId, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.category_id !== undefined) {
        fields.push('category_id = ?');
        values.push(updateData.category_id);
      }
      if (updateData.product_type_name_vn !== undefined) {
        fields.push('product_type_name_vn = ?');
        values.push(updateData.product_type_name_vn);
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
      values.push(productTypeId);

      const query = `
        UPDATE producttypes
        SET ${fields.join(', ')}
        WHERE product_type_id = ?
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

module.exports = ProductTypeModel;
