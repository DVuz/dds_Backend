const db = require('../../database/connection');
const logger = require('../../utils/logger');

/**
 * Get product types by category ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} - Array of product types
 */
const getProductTypesByCategoryID = async (categoryId) => {
  try {
    const query = `
      SELECT 
        pt.product_type_id,
        pt.product_type_name_vn,
        pt.description_vn,
        pt.image_url,
        pt.status,
        pt.created_at
      FROM producttypes pt
      WHERE pt.category_id = ? AND pt.status = 'active'
      ORDER BY pt.created_at DESC
    `;

    const [rows] = await db.execute(query, [categoryId]);
    return rows || [];
  } catch (error) {
    logger.error(`Error getting product types for category ${categoryId}: ${error.message}`);
    return [];
  }
};

module.exports = getProductTypesByCategoryID;