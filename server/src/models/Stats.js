const { pool } = require('../config/database.config');

class StatsRepository {
  async getUserGrowth() {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS name,
             COUNT(*) AS users
      FROM users
      WHERE deleted_at IS NULL
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `);
    return rows;
  }

  async getJobStats() {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b') AS name,
             COUNT(*) AS jobs
      FROM jobs
      WHERE deleted_at IS NULL
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `);
    return rows;
  }

  async getApplicationDistribution() {
    const [rows] = await pool.query(`
      SELECT j.type AS name, COUNT(a.id) AS value
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.deleted_at IS NULL
      GROUP BY j.type
    `);
    return rows;
  }
}

module.exports = new StatsRepository();
