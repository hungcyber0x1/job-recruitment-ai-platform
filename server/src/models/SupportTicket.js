const { pool } = require('../config/database.config');

class SupportTicketRepository {
  async create(ticketData) {
    const { userId, subject, category, priority } = ticketData;
    const [result] = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, category, priority) VALUES (?, ?, ?, ?)',
      [userId, subject, category, priority]
    );
    return result.insertId;
  }

  async findAll({ status, priority, category, search, limit, offset }) {
    let whereClause = ' WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }
    if (priority && priority !== 'all') {
      whereClause += ' AND t.priority = ?';
      params.push(priority);
    }
    if (category && category !== 'all') {
      whereClause += ' AND t.category = ?';
      params.push(category);
    }
    if (search) {
      whereClause += ' AND (t.subject LIKE ? OR t.description LIKE ? OR u.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const query = `
            SELECT t.*, u.email, u.first_name, u.last_name, u.avatar_url
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id
            ${whereClause}
            ORDER BY t.created_at DESC
            ${limit !== undefined ? 'LIMIT ?' : ''}
            ${offset !== undefined ? 'OFFSET ?' : ''}
        `;

    const queryParams = [...params];
    if (limit !== undefined) queryParams.push(parseInt(limit));
    if (offset !== undefined) queryParams.push(parseInt(offset));

    const [rows] = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM support_tickets t 
      JOIN users u ON t.user_id = u.id
      ${whereClause}
    `;
    const [countResult] = await pool.query(countQuery, params);

    return { data: rows, total: countResult[0].total };
  }

  async countByStatus(status) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM support_tickets WHERE status = ?',
      [status]
    );
    return rows[0].total;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT t.*, u.email, u.first_name, u.last_name, u.avatar_url
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `,
      [id]
    );
    return rows[0];
  }

  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE support_tickets SET status = ? WHERE id = ?', [
      status,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async addMessage(messageData) {
    const { ticketId, senderId, message, isInternal, attachments } = messageData;
    const [result] = await pool.query(
      'INSERT INTO support_messages (ticket_id, sender_id, message, is_internal, attachments) VALUES (?, ?, ?, ?, ?)',
      [
        ticketId,
        senderId,
        message,
        isInternal || 0,
        attachments ? JSON.stringify(attachments) : null,
      ]
    );
    return result.insertId;
  }

  async getMessages(ticketId) {
    const [rows] = await pool.query(
      `
            SELECT m.*, u.first_name, u.last_name, u.role
            FROM support_messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.ticket_id = ?
            ORDER BY m.created_at ASC
        `,
      [ticketId]
    );
    return rows;
  }
}

module.exports = new SupportTicketRepository();
