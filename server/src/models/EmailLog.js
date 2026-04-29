const { pool } = require('../config/database.config');

class EmailLogRepository {
  constructor() {
    this.schemaPromise = null;
    this.columns = null;
  }

  async ensureSchema() {
    if (!this.schemaPromise) {
      this.schemaPromise = this._ensureSchema().catch((error) => {
        this.schemaPromise = null;
        throw error;
      });
    }
    return this.schemaPromise;
  }

  async _ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NULL,
        email_type VARCHAR(50) NULL,
        recipient_email VARCHAR(255) NULL,
        recipient VARCHAR(255) NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NULL,
        body_html TEXT NULL,
        status ENUM('pending','sent','failed','opened','clicked') DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        opened_at DATETIME NULL,
        clicked_at DATETIME NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_logs_status (status),
        INDEX idx_email_logs_sent_at (sent_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    this.columns = await this._loadColumns();
  }

  async _loadColumns() {
    const [rows] = await pool.query('SHOW COLUMNS FROM email_logs');
    return new Map(rows.map((row) => [row.Field, row]));
  }

  _column(preferred, fallback) {
    if (this.columns?.has(preferred)) return preferred;
    if (this.columns?.has(fallback)) return fallback;
    return preferred;
  }

  _statusValue(status) {
    const requestedStatus = status || 'sent';
    const statusColumn = this.columns?.get('status');
    const enumDefinition = statusColumn?.Type || '';

    if (!enumDefinition.startsWith('enum(')) {
      return requestedStatus;
    }

    const allowedStatuses = enumDefinition
      .slice(5, -1)
      .split(',')
      .map((value) => value.trim().replace(/^'|'$/g, ''));

    return allowedStatuses.includes(requestedStatus) ? requestedStatus : 'sent';
  }

  async create(logData) {
    await this.ensureSchema();

    const {
      recipient,
      recipient_email,
      subject,
      body,
      body_html,
      status,
      error_message,
      user_id,
      userId,
      email_type,
      emailType,
      type,
    } = logData;
    const recipientColumn = this._column('recipient', 'recipient_email');
    const bodyColumn = this._column('body_html', 'body');
    const columns = [];
    const values = [];

    if (this.columns?.has('user_id')) {
      columns.push('user_id');
      values.push(user_id ?? userId ?? 0);
    }

    if (this.columns?.has('email_type')) {
      columns.push('email_type');
      values.push(email_type || emailType || type || 'system');
    }

    columns.push(recipientColumn, 'subject', bodyColumn, 'status', 'error_message');
    values.push(
      recipient || recipient_email || '',
      subject,
      body_html || body || '',
      this._statusValue(status),
      error_message || null
    );

    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await pool.query(
      `INSERT INTO email_logs (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return result.insertId;
  }

  async findAll({ limit = 50, offset = 0, recipient, status }) {
    await this.ensureSchema();

    const recipientColumn = this._column('recipient', 'recipient_email');
    const bodyColumn = this._column('body_html', 'body');
    const orderColumn = this.columns?.has('sent_at') ? 'sent_at' : 'created_at';

    let query = `SELECT *, ${recipientColumn} AS recipient, ${bodyColumn} AS body_html FROM email_logs`;
    const params = [];
    const conditions = [];

    if (recipient) {
      conditions.push(`${recipientColumn} LIKE ?`);
      params.push(`%${recipient}%`);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY ${orderColumn} DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async count({ recipient, status } = {}) {
    await this.ensureSchema();

    const recipientColumn = this._column('recipient', 'recipient_email');
    let query = 'SELECT COUNT(*) as total FROM email_logs';
    const params = [];
    const conditions = [];

    if (recipient) {
      conditions.push(`${recipientColumn} LIKE ?`);
      params.push(`%${recipient}%`);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  async findById(id) {
    await this.ensureSchema();

    const recipientColumn = this._column('recipient', 'recipient_email');
    const bodyColumn = this._column('body_html', 'body');
    const [rows] = await pool.query(
      `SELECT *, ${recipientColumn} AS recipient, ${bodyColumn} AS body_html FROM email_logs WHERE id = ?`,
      [id]
    );
    return rows[0];
  }
}

module.exports = new EmailLogRepository();
