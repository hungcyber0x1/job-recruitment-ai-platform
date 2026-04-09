const { pool } = require('../config/database.config');

class ActivityLogRepository {
  async create(logData) {
    const { adminCode, userId, action, details, ip, userAgent } = logData;
    const [result] = await pool.query(
      'INSERT INTO activity_logs (admin_id, user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [adminCode, userId, action, details, ip, userAgent]
    );
    return result.insertId;
  }

  async findAll({ limit, offset, adminId }) {
    let query = `
            SELECT l.*, 
                   u.email as user_email, 
                   a.email as admin_email 
            FROM activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN users a ON l.admin_id = a.id
        `;
    const params = [];

    if (adminId) {
      query += ' WHERE l.admin_id = ?';
      params.push(adminId);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM activity_logs');
    return rows[0].total;
  }
}

module.exports = new ActivityLogRepository();
