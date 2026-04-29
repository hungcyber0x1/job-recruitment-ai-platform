/**
 * Employer Model Schema - DEPRECATED
 *
 * ⚠️  BẢNG NÀY ĐÃ BỊ XÓA, CHUYỂN SANG DÙNG company_profiles
 *
 * Module này giữ lại để tương thích ngược.
 * Tất cả các tham chiếu đã được chuyển sang Company.js
 *
 * @deprecated Use Company.js thay thế
 */

const BaseRepository = require('./Base');

class EmployerRepository extends BaseRepository {
  constructor() {
    super('company_profiles');
  }

  async findByUserId(userId) {
    const query = `
      SELECT cp.*, u.email, u.first_name, u.last_name, u.avatar_url, u.gender, u.region 
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ?
    `;
    let [rows] = await this.pool.query(query, [userId]);
    if (rows[0]) {
      return rows[0];
    }

    const [userRows] = await this.pool.query(
      'SELECT first_name, last_name FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const user = userRows[0];
    if (!user) {
      return null;
    }

    const fallbackCompanyName =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Company profile';

    await this.pool.query(
      'INSERT IGNORE INTO company_profiles (user_id, company_name) VALUES (?, ?)',
      [userId, fallbackCompanyName]
    );

    [rows] = await this.pool.query(query, [userId]);
    return rows[0];
  }
}

module.exports = new EmployerRepository();
