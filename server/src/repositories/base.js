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

  async delete(id) {
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = BaseRepository;
