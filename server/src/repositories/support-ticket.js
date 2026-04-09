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

  async findAll({ status, priority, limit, offset }) {
    let query = `
            SELECT t.*, u.email, u.first_name, u.last_name, u.avatar_url
            FROM support_tickets t
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
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
    const { ticketId, senderId, message, isInternal } = messageData;
    const [result] = await pool.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal) VALUES (?, ?, ?, ?)',
      [ticketId, senderId, message, isInternal]
    );
    return result.insertId;
  }

  async getMessages(ticketId) {
    const [rows] = await pool.query(
      `
            SELECT m.*, u.first_name, u.last_name, u.role
            FROM ticket_messages m
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
