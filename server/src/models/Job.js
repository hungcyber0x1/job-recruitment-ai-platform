/**
 * Job Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Table: jobs
 *
 * Cấu trúc mới:
 * - company_id: FK → company_profiles.id
 * - recruiter_id: FK → users.id (người đăng tin, role = 'recruiter')
 */

/**
 * @typedef {Object} JobRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} company_id - FK → company_profiles.id
 * @property {number|null} recruiter_id - FK → users.id (người đăng tin)
 * @property {number|null} category_id - FK → categories.id
 * @property {string} title - Tiêu đề vị trí tuyển dụng
 * @property {string} slug - Slug URL
 * @property {string} description - Mô tả công việc
 * @property {string|null} requirements - Yêu cầu ứng viên
 * @property {string|null} benefits - Quyền lợi
 * @property {number|null} salary_min - Lương tối thiểu (VND)
 * @property {number|null} salary_max - Lương tối đa (VND)
 * @property {string|null} salary_display - Hiển thị lương
 * @property {number} salary_negotiable - Lương thỏa thuận (0=không, 1=có)
 * @property {number} vacancies - Số lượng cần tuyển
 * @property {number|null} location_id - FK → locations.id
 * @property {string|null} address - Địa chỉ chi tiết
 * @property {'full_time'|'part_time'|'contract'|'internship'|'freelance'|'remote'} job_type - Loại hình
 * @property {'draft'|'pending_review'|'approved'|'rejected'|'published'|'expired'|'closed'|'suspended'} status - Trạng thái
 * @property {number} featured - Tin nổi bật
 * @property {number} views - Lượt xem
 * @property {number} applications_count - Số đơn ứng tuyển
 * @property {string|null} expires_at - Hạn nộp
 * @property {string|null} published_at - Ngày đăng
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

const JOB_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'published',
  'expired',
  'closed',
  'suspended',
];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance', 'remote'];
const TABLE_NAME = 'jobs';
const JOB_TYPE_ALIASES = {
  'full-time': 'full_time',
  fulltime: 'full_time',
  full_time: 'full_time',
  'part-time': 'part_time',
  parttime: 'part_time',
  part_time: 'part_time',
  contract: 'contract',
  internship: 'internship',
  freelance: 'freelance',
  remote: 'remote',
};

function normalizeJobTypeFilter(value) {
  if (value == null || value === '') return value;
  const normalized = String(value).trim().toLowerCase();
  return JOB_TYPE_ALIASES[normalized] || normalized;
}

const BaseRepository = require('./Base');
const logger = require('../utils/logger');

class JobRepository extends BaseRepository {
  constructor() {
    super('jobs');
  }

  async cleanupUnavailableCompanyJobs() {
    try {
      const [result] = await this.pool.query(
        `UPDATE jobs j
         LEFT JOIN company_profiles cp ON j.company_id = cp.id
            SET j.deleted_at = NOW(),
                j.status = 'closed',
                j.updated_at = NOW()
          WHERE (cp.id IS NULL OR cp.deleted_at IS NOT NULL)
            AND j.deleted_at IS NULL`
      );
      return Number(result?.affectedRows || 0);
    } catch (err) {
      logger.warn('[JobRepository] Cleanup unavailable-company jobs failed:', err.message);
      return 0;
    }
  }

  buildFilterClauses(filters = {}) {
    const whereClauses = ['1=1'];
    const params = [];

    const hasTextFilter = (value) => String(value ?? '').trim().length > 0;

    if (!filters.include_deleted) {
      whereClauses.push('j.deleted_at IS NULL');
      whereClauses.push('cp.deleted_at IS NULL');
    }

    if (filters.publicOnly) {
      const requestedStatus = String(filters.status || '')
        .trim()
        .toLowerCase();
      if (requestedStatus && !['all', 'published'].includes(requestedStatus)) {
        whereClauses.push('1=0');
      } else {
        whereClauses.push("j.status = 'published'");
        whereClauses.push('COALESCE(cp.is_verified, 0) = 1');
        whereClauses.push('COALESCE(cp.flagged, 0) = 0');
        whereClauses.push("COALESCE(ru.status, 'active') = 'active'");
        whereClauses.push('(j.deadline IS NULL OR j.deadline >= CURDATE())');
      }
    } else if (filters.status && filters.status !== 'all') {
      whereClauses.push('j.status = ?');
      params.push(filters.status);
    } else if (!filters.status) {
      // Public listing: chỉ hiển thị jobs đang published, chưa hết hạn,
      // thuộc doanh nghiệp đã xác minh và không bị khóa/gắn cờ.
      whereClauses.push("j.status = 'published'");
      whereClauses.push('COALESCE(cp.is_verified, 0) = 1');
      whereClauses.push('COALESCE(cp.flagged, 0) = 0');
      whereClauses.push("COALESCE(ru.status, 'active') = 'active'");
      // Tự động đóng job đã hết deadline
      whereClauses.push('(j.deadline IS NULL OR j.deadline >= CURDATE())');
    }

    const categoryId = filters.category_id || filters.categoryId;
    if (categoryId) {
      whereClauses.push('j.category_id = ?');
      params.push(categoryId);
    }

    if (filters.industry) {
      whereClauses.push('(cp.industry LIKE ? OR c.name LIKE ?)');
      params.push(`%${filters.industry}%`, `%${filters.industry}%`);
    }

    const companyId = filters.company_id || filters.companyId;
    if (companyId) {
      whereClauses.push('j.company_id = ?');
      params.push(companyId);
    }

    const recruiterId = filters.recruiter_id || filters.recruiterId;
    if (recruiterId) {
      whereClauses.push('j.recruiter_id = ?');
      params.push(recruiterId);
    }

    const jobType = filters.job_type || filters.type || filters.employment_type;
    if (jobType) {
      whereClauses.push('j.job_type = ?');
      params.push(normalizeJobTypeFilter(jobType));
    }

    if (filters.search) {
      whereClauses.push('(j.title LIKE ? OR j.description LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const locationId = filters.location_id || filters.locationId;
    if (locationId) {
      whereClauses.push('j.location_id = ?');
      params.push(locationId);
    }

    if (hasTextFilter(filters.location)) {
      const locationTerm = `%${String(filters.location).trim()}%`;
      whereClauses.push(
        '(j.location LIKE ? OR j.address LIKE ? OR l.name LIKE ? OR cp.location LIKE ?)'
      );
      params.push(locationTerm, locationTerm, locationTerm, locationTerm);
    }

    if (filters.flagged) {
      whereClauses.push('j.flagged = 1');
    }

    // Date range filters
    if (filters.startDate) {
      whereClauses.push('j.created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClauses.push('j.created_at <= ?');
      params.push(filters.endDate);
    }

    // AI risk level filter
    if (filters.aiRisk) {
      if (filters.aiRisk === 'low') {
        whereClauses.push('(j.ai_risk IS NULL OR j.ai_risk < 0.2)');
      } else if (filters.aiRisk === 'medium') {
        whereClauses.push('j.ai_risk >= 0.2 AND j.ai_risk < 0.6');
      } else if (filters.aiRisk === 'high') {
        whereClauses.push('j.ai_risk >= 0.6');
      }
    }

    return { whereSql: whereClauses.join(' AND '), params };
  }

  async findById(id) {
    await this.cleanupUnavailableCompanyJobs();

    const [rows] = await this.pool.query(
      `SELECT j.*
         FROM jobs j
         JOIN company_profiles cp ON j.company_id = cp.id
        WHERE j.id = ?
          AND j.deleted_at IS NULL
          AND cp.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  async findWithDetails(filters = {}) {
    await this.cleanupUnavailableCompanyJobs();

    // Tự động đóng jobs đã hết hạn (deadline < hôm nay)
    try {
      await this.pool.query(
        `UPDATE jobs
           SET status = 'closed', updated_at = NOW()
         WHERE status = 'published'
           AND deadline IS NOT NULL
           AND deadline < CURDATE()
           AND deleted_at IS NULL`
      );
    } catch (err) {
      logger.warn('[JobRepository] Auto-expire jobs failed:', err.message);
    }

    const { whereSql, params } = this.buildFilterClauses(filters);
    let query = `
      SELECT j.*,
             cp.id AS company_id,
             cp.company_name,
             cp.company_logo,
             cp.company_website,
             cp.company_description,
             cp.company_size,
             cp.industry AS company_industry,
             cp.location AS company_location,
             c.name as category_name,
             l.name as location_name,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
             (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id) AS saved_count,
             (
               SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR '||')
               FROM job_skills js
               JOIN skills s ON s.id = js.skill_id
               WHERE js.job_id = j.id
             ) AS skill_names
      FROM jobs j
      JOIN company_profiles cp ON j.company_id = cp.id
      LEFT JOIN users ru ON ru.id = COALESCE(j.recruiter_id, cp.user_id)
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN locations l ON j.location_id = l.id
      WHERE ${whereSql}
    `;

    // Sorting
    const allowedSortFields = [
      'created_at',
      'title',
      'status',
      'featured',
      'ai_risk',
      'applicant_count',
      'recent_interested',
    ];
    const sortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const order = filters.order === 'ASC' ? 'ASC' : 'DESC';

    if (sortBy === 'recent_interested') {
      query += ` ORDER BY j.featured DESC, saved_count DESC, COALESCE(j.applications_count, 0) DESC, applicant_count DESC, j.created_at DESC`;
    } else if (sortBy === 'applicant_count') {
      query += ` ORDER BY applicant_count ${order}, j.featured DESC, j.created_at DESC`;
    } else if (sortBy === 'title') {
      query += ` ORDER BY j.title ${order}, j.featured DESC, j.created_at DESC`;
    } else {
      query += ` ORDER BY j.${sortBy} ${order}, j.featured DESC, j.created_at DESC`;
    }

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
      JOIN company_profiles cp ON j.company_id = cp.id
      LEFT JOIN users ru ON ru.id = COALESCE(j.recruiter_id, cp.user_id)
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN locations l ON j.location_id = l.id
      WHERE ${whereSql}
    `;
    const [countResult] = await this.pool.query(countQuery, params);
    const total = countResult[0].total;

    return { data: rows, total };
  }

  async findRecentInterested(filters = {}) {
    return this.findWithDetails({
      ...filters,
      publicOnly: true,
      sortBy: 'recent_interested',
      order: 'DESC',
    });
  }

  async findByIdWithDetails(id, { includeDeleted = false, publicOnly = false } = {}) {
    await this.cleanupUnavailableCompanyJobs();

    const visibilityClauses = [];

    if (!includeDeleted) {
      visibilityClauses.push('j.deleted_at IS NULL');
      visibilityClauses.push('cp.deleted_at IS NULL');
    }

    if (publicOnly) {
      visibilityClauses.push("j.status = 'published'");
      visibilityClauses.push('COALESCE(cp.is_verified, 0) = 1');
      visibilityClauses.push('COALESCE(cp.flagged, 0) = 0');
      visibilityClauses.push("COALESCE(u.status, 'active') = 'active'");
      visibilityClauses.push('(j.deadline IS NULL OR j.deadline >= CURDATE())');
    }

    const visibilityClause = visibilityClauses.length
      ? ` AND ${visibilityClauses.join(' AND ')}`
      : '';
    const query = `
      SELECT j.*,
             cp.id AS company_id,
             cp.company_name,
             cp.company_logo,
             cp.company_website,
             cp.company_description,
             cp.company_size,
             cp.industry AS company_industry,
             cp.location as company_location,
             c.name as category_name,
             l.name as location_name,
             u.first_name as recruiter_first_name,
             u.last_name as recruiter_last_name,
             (
               SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR '||')
               FROM job_skills js
               JOIN skills s ON s.id = js.skill_id
               WHERE js.job_id = j.id
             ) AS skill_names
      FROM jobs j
      JOIN company_profiles cp ON j.company_id = cp.id
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN locations l ON j.location_id = l.id
      LEFT JOIN users u ON u.id = COALESCE(j.recruiter_id, cp.user_id)
      WHERE j.id = ?${visibilityClause}
    `;
    const [rows] = await this.pool.query(query, [id]);
    return rows[0];
  }

  async findByCompany(companyId) {
    await this.cleanupUnavailableCompanyJobs();

    const query = `
      SELECT j.*,
             cp.id AS company_id,
             cp.company_name,
             cp.company_logo,
             cp.company_website,
             cp.company_description,
             cp.company_size,
             cp.industry AS company_industry,
             cp.location AS company_location,
             (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
             (
               SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR '||')
               FROM job_skills js
               JOIN skills s ON s.id = js.skill_id
               WHERE js.job_id = j.id
             ) AS skill_names
      FROM jobs j
      JOIN company_profiles cp ON j.company_id = cp.id
      WHERE j.company_id = ?
        AND j.deleted_at IS NULL
        AND cp.deleted_at IS NULL
      ORDER BY j.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [companyId]);
    return rows;
  }

  async findByRecruiter(recruiterId) {
    await this.cleanupUnavailableCompanyJobs();

    const query = `
      SELECT j.*,
             cp.id AS company_id,
             cp.company_name,
             cp.company_logo,
             (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
      FROM jobs j
      JOIN company_profiles cp ON j.company_id = cp.id
      WHERE j.recruiter_id = ?
        AND j.deleted_at IS NULL
        AND cp.deleted_at IS NULL
      ORDER BY j.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [recruiterId]);
    return rows;
  }

  async countAll() {
    await this.cleanupUnavailableCompanyJobs();

    const [rows] = await this.pool.query(
      `SELECT COUNT(*) as total
         FROM jobs j
         JOIN company_profiles cp ON j.company_id = cp.id
        WHERE j.deleted_at IS NULL
          AND cp.deleted_at IS NULL`
    );
    return rows[0].total;
  }

  async countByStatus(status) {
    await this.cleanupUnavailableCompanyJobs();

    const [rows] = await this.pool.query(
      `SELECT COUNT(*) as total
         FROM jobs j
         JOIN company_profiles cp ON j.company_id = cp.id
        WHERE j.status = ?
          AND j.deleted_at IS NULL
          AND cp.deleted_at IS NULL`,
      [status]
    );
    return rows[0].total;
  }

  async countFlagged() {
    await this.cleanupUnavailableCompanyJobs();

    const [rows] = await this.pool.query(
      `SELECT COUNT(*) as total
         FROM jobs j
         JOIN company_profiles cp ON j.company_id = cp.id
        WHERE j.flagged = 1
          AND j.deleted_at IS NULL
          AND cp.deleted_at IS NULL`
    );
    return rows[0].total;
  }

  async delete(id) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows > 0;
  }

  async updateStatus(id, status, rejectionReason = null) {
    const fields = ['status = ?'];
    const params = [status];

    if (status === 'published') {
      fields.push('published_at = COALESCE(published_at, NOW())');
      fields.push('rejection_reason = NULL');
    } else if (status === 'rejected') {
      fields.push('rejection_reason = ?');
      params.push(rejectionReason);
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const [result] = await this.pool.query(
      `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async flagJob(id, flagged, note = null) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET flagged = ?, moderation_note = ?, updated_at = NOW() WHERE id = ?',
      [flagged, note, id]
    );
    return result.affectedRows > 0;
  }

  async bulkUpdateStatus(ids, status, rejectionReason = null) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const fields = ['status = ?'];
    const params = [status];

    if (status === 'published') {
      fields.push('published_at = COALESCE(published_at, NOW())');
      fields.push('rejection_reason = NULL');
    } else if (status === 'rejected') {
      fields.push('rejection_reason = ?');
      params.push(rejectionReason);
    }

    fields.push('updated_at = NOW()');

    const query = `UPDATE jobs SET ${fields.join(', ')} WHERE id IN (?) AND deleted_at IS NULL`;
    const [result] = await this.pool.query(query, [...params, ids]);
    return result.affectedRows;
  }

  async bulkUpdateStatusByCompany(companyId, status) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET status = ?, updated_at = NOW() WHERE company_id = ? AND deleted_at IS NULL',
      [status, companyId]
    );
    return result.affectedRows;
  }

  async bulkDeleteByCompany(companyId) {
    const [result] = await this.pool.query(
      'UPDATE jobs SET deleted_at = NOW(), status = "closed", updated_at = NOW() WHERE company_id = ? AND deleted_at IS NULL',
      [companyId]
    );
    return result.affectedRows;
  }

  async duplicate(id) {
    const job = await this.findById(id);
    if (!job) return null;

    const {
      id: _,
      created_at: __,
      updated_at: ___,
      views: ____,
      applications_count: _____,
      ...jobData
    } = job;

    jobData.title = `${jobData.title} (Copy)`;
    jobData.status = 'draft';
    jobData.slug = `${jobData.slug}-copy-${Date.now()}`;

    const duplicatedJobId = await this.create(jobData);

    try {
      const [skills] = await this.pool.query('SELECT * FROM job_skills WHERE job_id = ?', [id]);
      if (skills && skills.length > 0) {
        const skillValues = skills.map((skill) => [
          duplicatedJobId,
          skill.skill_id,
          skill.is_required ?? skill.requirement_type ?? null,
        ]);
        await this.pool.query('INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ?', [
          skillValues,
        ]);
      }
    } catch (err) {
      logger.warn('[JobRepository] Error copying skills during duplication:', err.message);
    }

    return this.findById(duplicatedJobId);
  }
}

module.exports = new JobRepository();
module.exports.JOB_STATUSES = JOB_STATUSES;
module.exports.JOB_TYPES = JOB_TYPES;
module.exports.TABLE_NAME = TABLE_NAME;
module.exports.JobRepository = JobRepository;
module.exports.getTableName = () => TABLE_NAME;
