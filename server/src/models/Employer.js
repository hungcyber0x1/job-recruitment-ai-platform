/**
 * Employer Model Schema — see migration 003_create_employers_table.sql
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 */

/**
 * @typedef {Object} EmployerRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} user_id - FK → users.id
 * @property {string|null} company_name - Tên công ty
 * @property {string|null} company_website - Website công ty
 * @property {string|null} company_logo - URL logo
 * @property {string|null} company_description - Mô tả công ty
 * @property {string|null} company_size - Quy mô nhân sự
 * @property {string|null} industry - Lĩnh vực
 * @property {string|null} location - Địa điểm
 * @property {string|null} phone - Số điện thoại
 * @property {string|null} tax_code - Mã số thuế
 * @property {boolean} is_verified - Đã xác minh
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/** Tên bảng trong database */
const TABLE_NAME = 'employers';

module.exports = { TABLE_NAME };

const BaseRepository = require('./Base');

class EmployerRepository extends BaseRepository {
  constructor() {
    super('employers');
  }

  async findByUserId(userId) {
    const query = `
      SELECT e.*, u.email, u.first_name, u.last_name, u.avatar_url 
      FROM employers e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    const [rows] = await this.pool.query(query, [userId]);
    return rows[0];
  }
}

module.exports = new EmployerRepository();
