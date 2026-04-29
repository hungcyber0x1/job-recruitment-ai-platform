/**
 * Notification Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống notifications.
 * Hỗ trợ tất cả roles: candidate, recruiter, admin
 */

/**
 * @typedef {Object} NotificationRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} user_id - FK → users.id
 * @property {string} type - Loại thông báo (application, job, interview, system, moderation, company, report, job_expiring)
 * @property {string|null} category - Phân loại chi tiết
 * @property {string} title - Tiêu đề
 * @property {string|null} message - Nội dung
 * @property {Object|null} data - Dữ liệu bổ sung (JSON)
 * @property {number} is_read - Đã đọc (0/1)
 * @property {string|null} read_at - Thời điểm đọc
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

const BaseRepository = require('./Base');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  /**
   * Lấy thông báo theo user với phân trang
   */
  async findByUser(userId, options = {}) {
    const { limit = 20, offset = 0, type, unreadOnly = false } = options;
    
    let whereClause = 'WHERE n.user_id = ?';
    const params = [userId];

    if (type) {
      whereClause += ' AND n.type = ?';
      params.push(type);
    }

    if (unreadOnly) {
      whereClause += ' AND n.is_read = 0';
    }

    const query = `
      SELECT n.*,
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await this.pool.query(query, params);
    return rows;
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  async countUnread(userId) {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0]?.count || 0;
  }

  /**
   * Đánh dấu đã đọc một thông báo
   */
  async markAsRead(id, userId) {
    const [result] = await this.pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(userId) {
    const [result] = await this.pool.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  }

  /**
   * Xóa thông báo
   */
  async delete(id, userId) {
    const [result] = await this.pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Xóa tất cả thông báo đã đọc của user
   */
  async deleteRead(userId) {
    const [result] = await this.pool.query(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
      [userId]
    );
    return result.affectedRows;
  }

  /**
   * Tạo thông báo mới
   */
  async create(data) {
    const { user_id, type = 'system', category = null, title, message = null, data: extraData = null } = data;
    
    const [result] = await this.pool.query(
      `INSERT INTO notifications (user_id, type, category, title, message, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, type, category, title, message, extraData ? JSON.stringify(extraData) : null]
    );
    
    return { id: result.insertId, ...data };
  }

  /**
   * Tạo nhiều thông báo cùng lúc (cho batch notifications)
   */
  async createBatch(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const values = notifications.map(n => [
      n.user_id,
      n.type || 'system',
      n.category || null,
      n.title,
      n.message || null,
      n.data ? JSON.stringify(n.data) : null
    ]);

    const [result] = await this.pool.query(
      `INSERT INTO notifications (user_id, type, category, title, message, data) VALUES ?`,
      [values]
    );

    return result.affectedRows;
  }

  /**
   * Lấy thống kê thông báo theo loại
   */
  async getStatsByType(userId) {
    const [rows] = await this.pool.query(
      `SELECT type, COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
       FROM notifications WHERE user_id = ?
       GROUP BY type`,
      [userId]
    );
    
    return rows.reduce((acc, row) => {
      acc[row.type] = { total: row.total, unread: row.unread };
      return acc;
    }, {});
  }

  /**
   * Lấy thông báo theo danh mục (category)
   */
  async findByCategory(userId, category, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const [rows] = await this.pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND category = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, category, parseInt(limit, 10), parseInt(offset, 10)]
    );
    
    return rows;
  }
}

module.exports = new NotificationRepository();
module.exports.NotificationRepository = NotificationRepository;
