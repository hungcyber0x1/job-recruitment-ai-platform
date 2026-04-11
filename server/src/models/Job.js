/**
 * Job Model Schema — see migration 005_create_jobs_table.sql
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Import type bằng: const { JobRow } = require('./Job.Model');
 */

/**
 * @typedef {Object} JobRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} employer_id - FK → employers.id
 * @property {number|null} category_id - FK → categories.id
 * @property {string} title - Tiêu đề vị trí tuyển dụng
 * @property {string} description - Mô tả công việc (HTML hoặc plain text)
 * @property {string|null} requirements - Yêu cầu ứng viên
 * @property {string|null} benefits - Quyền lợi
 * @property {number|null} salary_min - Lương tối thiểu (VND)
 * @property {number|null} salary_max - Lương tối đa (VND)
 * @property {string} currency - Đơn vị tiền tệ, mặc định 'VND'
 * @property {string} location - Địa điểm làm việc
 * @property {string|null} experience_required - Kinh nghiệm yêu cầu
 * @property {string|null} education_required - Bằng cấp yêu cầu
 * @property {'full-time'|'part-time'|'contract'|'internship'|'remote'} type - Loại hình
 * @property {'draft'|'published'|'closed'} status - Trạng thái
 * @property {string|null} deadline - Hạn nộp hồ sơ (ISO date)
 * @property {number} views - Lượt xem
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/** Danh sách trạng thái hợp lệ */
const JOB_STATUSES = ['draft', 'published', 'closed'];

/** Danh sách loại hình công việc hợp lệ */
const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

/** Tên bảng trong database */
const TABLE_NAME = 'jobs';

module.exports = { JOB_STATUSES, JOB_TYPES, TABLE_NAME };

const BaseRepository = require('./Base');

class JobRepository extends BaseRepository {
  constructor() {
    super('jobs');
  }

  buildFilterClauses(filters = {}) {
    const whereClauses = ['1=1'];
    const params = [];

    if (!filters.include_deleted) {
      whereClauses.push('j.deleted_at IS NULL');
    }

    if (filters.status && filters.status !== 'all') {
      whereClauses.push('j.status = ?');
      params.push(filters.status);
    } else if (!filters.status) {
      whereClauses.push("j.status = 'published'");
    }

    if (filters.category_id) {
      whereClauses.push('j.category_id = ?');
      params.push(filters.category_id);
    }

    if (filters.type) {
      whereClauses.push('j.type = ?');
      params.push(filters.type);
    }

    if (filters.search) {
      whereClauses.push('(j.title LIKE ? OR j.description LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.location && String(filters.location).trim()) {
      whereClauses.push('j.location = ?');
      params.push(String(filters.location).trim());
    }

    if (filters.flagged) {
      whereClauses.push('j.is_flagged = 1');
    }

    return { whereSql: whereClauses.join(' AND '), params };
  }

  async findWithDetails(filters = {}) {
    const { whereSql, params } = this.buildFilterClauses(filters);
    let query = `
      SELECT j.*, e.company_name, e.company_logo, c.name as category_name 
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE ${whereSql}
    `;

    query += ` ORDER BY j.created_at DESC`;

    const paginationParams = [...params];
    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        query += ` LIMIT ?`;
        paginationParams.push(limit);
      }
    }

    if (filters.offset) {
      const offset = parseInt(filters.offset, 10);
      if (!isNaN(offset) && offset >= 0) {
        query += ` OFFSET ?`;
        paginationParams.push(offset);
      }
    }

    const [rows] = await this.pool.query(query, paginationParams);
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE ${whereSql}
    `;
    const [countResult] = await this.pool.query(countQuery, params);
    const total = countResult[0].total;

    return { data: rows, total };
  }

  async findByIdWithDetails(id, { includeDeleted = false } = {}) {
    const deletedClause = includeDeleted ? '' : ' AND j.deleted_at IS NULL';
    const query = `
      SELECT j.*, e.company_name, e.company_logo, e.company_description, e.location as company_location, c.name as category_name 
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = ?${deletedClause}
    `;
    const [rows] = await this.pool.query(query, [id]);
    return rows[0];
  }

  async findByEmployer(employerId) {
    const query = `
      SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
      FROM jobs j
      WHERE j.employer_id = ?
      ORDER BY j.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [employerId]);
    return rows;
  }

  async countAll() {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) as total FROM jobs WHERE deleted_at IS NULL'
    );
    return rows[0].total;
  }

  async countByStatus(status) {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) as total FROM jobs WHERE status = ? AND deleted_at IS NULL',
      [status]
    );
    return rows[0].total;
  }

  async countFlagged() {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) as total FROM jobs WHERE is_flagged = 1 AND deleted_at IS NULL'
    );
    return rows[0].total;
  }

  async delete(id) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET deleted_at = UTC_TIMESTAMP() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateStatus(id, status) {
    const [result] = await this.pool.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
  }

  async flagJob(id, isFlagged, note = null) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET is_flagged = ?, moderation_note = ? WHERE id = ?',
      [isFlagged, note, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new JobRepository();
