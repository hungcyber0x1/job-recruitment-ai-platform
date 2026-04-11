/**
 * Category Model Schema — see migration 004_create_categories_table.sql
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 */

/**
 * @typedef {Object} CategoryRow
 * @property {number} id - Primary key, auto-increment
 * @property {string} name - Tên danh mục
 * @property {string|null} description - Mô tả
 * @property {string|null} icon_url - URL icon
 */

/** Tên bảng trong database */
const TABLE_NAME = 'categories';

module.exports = { TABLE_NAME };

const BaseRepository = require('./Base');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  async findByName(name) {
    const [rows] = await this.pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    return rows[0];
  }
}

module.exports = new CategoryRepository();
