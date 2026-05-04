const { pool } = require('../config/database.config');

const IDENTIFIER_REGEX = /^[A-Za-z0-9_]+$/;

function quoteIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function quoteTableName(tableName) {
  if (!IDENTIFIER_REGEX.test(String(tableName))) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  return quoteIdentifier(tableName);
}

class StatsRepository {
  constructor() {
    this.columnCache = new Map();
  }

  async getTableColumns(tableName) {
    if (!this.columnCache.has(tableName)) {
      const columnsPromise = pool
        .query(`SHOW COLUMNS FROM ${quoteTableName(tableName)}`)
        .then(([rows]) => new Set(rows.map((row) => row.Field)))
        .catch((error) => {
          if (['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error.code)) {
            return new Set();
          }
          throw error;
        });

      this.columnCache.set(tableName, columnsPromise);
    }

    return this.columnCache.get(tableName);
  }

  async hasColumn(tableName, columnName) {
    const columns = await this.getTableColumns(tableName);
    return columns.has(columnName);
  }

  async pickColumn(tableName, candidates) {
    const columns = await this.getTableColumns(tableName);
    return candidates.find((candidate) => columns.has(candidate)) || null;
  }

  async nullCondition(tableName, alias, columnName = 'deleted_at') {
    return (await this.hasColumn(tableName, columnName))
      ? `${alias}.${quoteIdentifier(columnName)} IS NULL`
      : '1=1';
  }

  async getUserGrowth() {
    const userDeletedCondition = await this.nullCondition('users', 'u');

    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(u.created_at, '%b') AS name,
             COUNT(*) AS users
      FROM users u
      WHERE ${userDeletedCondition}
        AND u.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(u.created_at), MONTH(u.created_at), DATE_FORMAT(u.created_at, '%b')
      ORDER BY YEAR(u.created_at), MONTH(u.created_at)
    `);
    return rows;
  }

  async getJobStats() {
    const jobDeletedCondition = await this.nullCondition('jobs', 'j');

    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(j.created_at, '%b') AS name,
             COUNT(*) AS jobs
      FROM jobs j
      WHERE ${jobDeletedCondition}
        AND j.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(j.created_at), MONTH(j.created_at), DATE_FORMAT(j.created_at, '%b')
      ORDER BY YEAR(j.created_at), MONTH(j.created_at)
    `);
    return rows;
  }

  async getApplicationDistribution() {
    const jobTypeColumn = await this.pickColumn('jobs', ['job_type', 'employment_type', 'type']);
    const jobDeletedCondition = await this.nullCondition('jobs', 'j');
    const applicationDeletedCondition = await this.nullCondition('applications', 'a');
    const jobTypeExpression = jobTypeColumn
      ? `COALESCE(NULLIF(j.${quoteIdentifier(jobTypeColumn)}, ''), 'other')`
      : "'other'";

    const [rows] = await pool.query(`
      SELECT ${jobTypeExpression} AS name, COUNT(a.id) AS value
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE ${jobDeletedCondition}
        AND ${applicationDeletedCondition}
      GROUP BY ${jobTypeExpression}
      ORDER BY value DESC, name ASC
    `);
    return rows;
  }

  async getApplicationTrend(days = 14) {
    const safeDays = Math.min(Math.max(parseInt(days, 10) || 14, 7), 30);
    const applicationDateColumn = await this.pickColumn('applications', [
      'applied_at',
      'created_at',
      'updated_at',
    ]);

    if (!applicationDateColumn) {
      return [];
    }

    const applicationDeletedCondition = await this.nullCondition('applications', 'a');
    const sequence = Array.from({ length: 30 }, (_, index) => `SELECT ${index} AS n`).join(
      ' UNION ALL '
    );

    const [rows] = await pool.query(
      `
      SELECT
        DATE_FORMAT(d.day, '%d/%m') AS name,
        DATE_FORMAT(d.day, '%Y-%m-%d') AS date,
        COUNT(a.id) AS applications
      FROM (
        SELECT DATE_SUB(CURDATE(), INTERVAL seq.n DAY) AS day
        FROM (${sequence}) seq
        WHERE seq.n < ?
      ) d
      LEFT JOIN applications a
        ON DATE(a.${quoteIdentifier(applicationDateColumn)}) = d.day
       AND ${applicationDeletedCondition}
      GROUP BY d.day
      ORDER BY d.day ASC
    `,
      [safeDays]
    );

    return rows;
  }

  async getWeeklyActivity() {
    const userDeletedCondition = await this.nullCondition('users', 'u');

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
      LEFT JOIN users u ON DATE(u.created_at) = d.date AND ${userDeletedCondition}
      WHERE d.date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY d.date, name
      ORDER BY d.date ASC
    `);
    return rows;
  }

  async getUserDistribution() {
    const userDeletedCondition = await this.nullCondition('users', 'u');

    const [rows] = await pool.query(`
      SELECT
        CASE
          WHEN u.role = 'candidate' THEN 'candidate'
          WHEN u.role = 'recruiter' THEN 'recruiter'
          WHEN u.role = 'admin' THEN 'admin'
          ELSE u.role
        END AS role,
        CASE
          WHEN u.role = 'candidate' THEN 'Ứng viên'
          WHEN u.role = 'recruiter' THEN 'Nhà tuyển dụng'
          WHEN u.role = 'admin' THEN 'Quản trị viên'
          ELSE u.role
        END AS name,
        COUNT(*) AS value
      FROM users u
      WHERE ${userDeletedCondition}
      GROUP BY
        CASE
          WHEN u.role = 'candidate' THEN 'candidate'
          WHEN u.role = 'recruiter' THEN 'recruiter'
          WHEN u.role = 'admin' THEN 'admin'
          ELSE u.role
        END,
        CASE
          WHEN u.role = 'candidate' THEN 'Ứng viên'
          WHEN u.role = 'recruiter' THEN 'Nhà tuyển dụng'
          WHEN u.role = 'admin' THEN 'Quản trị viên'
          ELSE u.role
        END
    `);
    return rows;
  }
}

module.exports = new StatsRepository();
