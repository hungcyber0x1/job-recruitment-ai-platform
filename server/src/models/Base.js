const { pool } = require('../config/database.config');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  async findAll({ limit = 1000 } = {}) {
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    if (limit !== null) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    const [rows] = await this.pool.query(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await this.pool.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    return rows[0];
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    const [result] = await this.pool.query(query, values);
    return result.insertId;
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    await this.pool.query(query, [...values, id]);
    return this.findById(id);
  }

  /**
   * Hard delete — permanently removes a record from the database.
   */
  async hardDelete(id) {
    const [result] = await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Soft delete — marks a record as deleted by setting deleted_at (requires column to exist).
   */
  async softDelete(id) {
    const [result] = await this.pool.query(
      `UPDATE ${this.tableName} SET deleted_at = UTC_TIMESTAMP() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Standard delete — defaults to hardDelete. Subclasses often override this for softDelete.
   */
  async delete(id) {
    return this.hardDelete(id);
  }
}

module.exports = BaseRepository;
