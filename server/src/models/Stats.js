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
      SELECT j.job_type AS name, COUNT(a.id) AS value
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE j.deleted_at IS NULL
      GROUP BY j.job_type
    `);
    return rows;
  }

  async getWeeklyActivity() {
    const [rows] = await pool.query(`
      SELECT 
        CASE DAYOFWEEK(d.date)
          WHEN 2 THEN 'T2'
          WHEN 3 THEN 'T3'
          WHEN 4 THEN 'T4'
          WHEN 5 THEN 'T5'
          WHEN 6 THEN 'T6'
          WHEN 7 THEN 'T7'
          WHEN 1 THEN 'CN'
        END as name,
        COUNT(CASE WHEN u.role = 'recruiter' THEN 1 END) as uv,
        COUNT(CASE WHEN u.role = 'candidate' THEN 1 END) as pv
      FROM (
        SELECT CURDATE() - INTERVAL (a.a + (10 * b.a)) DAY as date
        FROM (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) as a
        CROSS JOIN (SELECT 0 as a UNION ALL SELECT 1) as b
      ) d
      LEFT JOIN users u ON DATE(u.created_at) = d.date AND u.deleted_at IS NULL
      WHERE d.date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY d.date, name
      ORDER BY d.date ASC
    `);
    return rows;
  }

  async getUserDistribution() {
    const [rows] = await pool.query(`
      SELECT 
        CASE 
          WHEN role = 'candidate' THEN 'Ứng viên'
          WHEN role = 'recruiter' THEN 'Nhà tuyển dụng'
          WHEN role = 'admin' THEN 'Quản trị viên'
          ELSE role
        END AS name,
        COUNT(*) AS value
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY role
    `);
    return rows;
  }
}

module.exports = new StatsRepository();
