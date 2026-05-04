const { pool } = require('../config/database.config');

class ActivityLogRepository {
  async getColumns() {
    if (!this.columnsPromise) {
      this.columnsPromise = pool
        .query(
          `SELECT COLUMN_NAME
             FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'activity_logs'`
        )
        .then(([rows]) => new Set(rows.map((row) => row.COLUMN_NAME)));
    }
    return this.columnsPromise;
  }

  async create(logData) {
    const { adminCode, userId, action, details, description, ip, userAgent } = logData;
    const actorId = adminCode || userId || null;
    const targetUserId = userId || null;
    const text = description || details || null;
    const columns = await this.getColumns();

    if (columns.has('description')) {
      const [result] = await pool.query(
        'INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [actorId, action, text, ip, userAgent]
      );
      return result.insertId;
    }

    const [result] = await pool.query(
      'INSERT INTO activity_logs (admin_id, user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [actorId, targetUserId, action, text, ip, userAgent]
    );
    return result.insertId;
  }

  async findAll({ limit, offset, adminId, userId, startDate, endDate, search }) {
    const columns = await this.getColumns();
    const actorColumn = columns.has('admin_id') ? 'al.admin_id' : 'al.user_id';
    const targetColumn = columns.has('admin_id') ? 'al.user_id' : 'al.user_id';
    const textColumn = columns.has('description') ? 'al.description' : 'al.details';
    let whereClause = ' WHERE 1=1';
    const params = [];

    if (adminId) {
      whereClause += ` AND ${actorColumn} = ?`;
      params.push(adminId);
    }

    if (userId) {
      whereClause += ` AND ${targetColumn} = ?`;
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
      whereClause += ` AND (al.action LIKE ? OR ${textColumn} LIKE ? OR u.email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const query = `
            SELECT al.*,
                   ${textColumn} as description,
                   u.email as user_email
            FROM activity_logs al
            LEFT JOIN users u ON ${actorColumn} = u.id
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
      LEFT JOIN users u ON ${actorColumn} = u.id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);

    return { data: rows, total: countResult[0].total };
  }

  async count(adminId = null) {
    const columns = await this.getColumns();
    const actorColumn = columns.has('admin_id') ? 'admin_id' : 'user_id';
    let query = 'SELECT COUNT(*) as total FROM activity_logs';
    const params = [];
    if (adminId) {
      query += ` WHERE ${actorColumn} = ?`;
      params.push(adminId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = new ActivityLogRepository();
