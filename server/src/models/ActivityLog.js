const { pool } = require('../config/database.config');

class ActivityLogRepository {
  async create(logData) {
    const { adminCode, userId, action, details, description, ip, userAgent } = logData;
    const [result] = await pool.query(
      'INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId || adminCode, action, description || details || null, ip, userAgent]
    );
    return result.insertId;
  }

  async findAll({ limit, offset, adminId, userId, startDate, endDate, search }) {
    let whereClause = ' WHERE 1=1';
    const params = [];

    if (adminId) {
      whereClause += ' AND al.user_id = ?';
      params.push(adminId);
    }

    if (userId) {
      whereClause += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      whereClause += ' AND (al.action LIKE ? OR al.description LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const query = `
            SELECT al.*,
                   u.email as user_email
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ${whereClause}
            ORDER BY al.created_at DESC
            ${limit !== undefined ? 'LIMIT ?' : ''}
            ${offset !== undefined ? 'OFFSET ?' : ''}
        `;

    const queryParams = [...params];
    if (limit !== undefined) queryParams.push(parseInt(limit));
    if (offset !== undefined) queryParams.push(parseInt(offset));

    const [rows] = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);

    return { data: rows, total: countResult[0].total };

  }

  async count(adminId = null) {
    let query = 'SELECT COUNT(*) as total FROM activity_logs';
    const params = [];
    if (adminId) {
      query += ' WHERE user_id = ?';
      params.push(adminId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = new ActivityLogRepository();
