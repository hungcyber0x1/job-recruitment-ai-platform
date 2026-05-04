/**
 * Company Repository
 *
 * ⚠️  QUY ƯỚC RẤT QUAN TRỌNG:
 *
 * CompanyRepository query bảng `company_profiles` - thông tin công ty.
 *
 * Cấu trúc mới:
 * - users: Tài khoản người dùng (role = 'recruiter')
 * - company_profiles: Thông tin công ty (FK: user_id)
 * - jobs: Tin tuyển dụng (FK: company_id, recruiter_id)
 *
 * Bảng cũ `employers` và `candidates` đã bị xóa.
 */

const BaseRepository = require('./Base');

const LOCKED_USER_STATUSES = ['banned', 'suspended', 'locked'];
const LOCKED_USER_STATUS_SQL_LIST = LOCKED_USER_STATUSES.map((status) => `'${status}'`).join(', ');

function toBooleanFilter(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return Boolean(value);
}

function lockedStatusSql(alias = 'u') {
  return `COALESCE(${alias}.status, 'active') IN (${LOCKED_USER_STATUS_SQL_LIST})`;
}

function unlockedStatusSql(alias = 'u') {
  return `COALESCE(${alias}.status, 'active') NOT IN (${LOCKED_USER_STATUS_SQL_LIST})`;
}

class CompanyRepository extends BaseRepository {
  constructor() {
    super('company_profiles');
  }

  _buildPublicFiltersQuery(filters = {}) {
    let whereClause = `
      WHERE cp.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND COALESCE(cp.is_verified, 0) = 1
        AND COALESCE(cp.flagged, 0) = 0
        AND COALESCE(u.status, 'active') = 'active'
    `;
    const params = [];

    if (filters.search) {
      whereClause += `
        AND (
          cp.company_name LIKE ?
          OR cp.industry LIKE ?
          OR cp.location LIKE ?
        )
      `;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.industry) {
      whereClause += ` AND cp.industry LIKE ?`;
      params.push(`%${filters.industry}%`);
    }

    return { whereClause, params };
  }

  _buildFiltersQuery(filters = {}) {
    let whereClause = filters.include_deleted
      ? 'WHERE 1=1'
      : 'WHERE cp.deleted_at IS NULL AND u.deleted_at IS NULL';
    const params = [];

    if (filters.search) {
      whereClause += ` AND (cp.company_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.industry) {
      whereClause += ` AND cp.industry LIKE ?`;
      params.push(`%${filters.industry}%`);
    }

    if (filters.is_verified !== undefined && filters.is_verified !== 'all') {
      whereClause += ` AND cp.is_verified = ?`;
      params.push(toBooleanFilter(filters.is_verified));
    }

    if (filters.flagged !== undefined && filters.flagged !== 'all') {
      whereClause += ` AND cp.flagged = ?`;
      params.push(toBooleanFilter(filters.flagged));
    }

    const moderationStatus = String(filters.moderation_status || filters.moderationStatus || '')
      .trim()
      .toLowerCase();
    if (moderationStatus && moderationStatus !== 'all') {
      if (moderationStatus === 'approved' || moderationStatus === 'verified') {
        whereClause += `
          AND COALESCE(cp.is_verified, 0) = 1
          AND COALESCE(cp.flagged, 0) = 0
          AND ${unlockedStatusSql('u')}
        `;
      } else if (moderationStatus === 'pending') {
        whereClause += `
          AND COALESCE(cp.is_verified, 0) = 0
          AND COALESCE(cp.flagged, 0) = 0
          AND COALESCE(cp.verification_status, 'pending') = 'pending'
          AND ${unlockedStatusSql('u')}
        `;
      } else if (moderationStatus === 'rejected') {
        whereClause += `
          AND COALESCE(cp.is_verified, 0) = 0
          AND COALESCE(cp.flagged, 0) = 0
          AND COALESCE(cp.verification_status, 'pending') = 'rejected'
          AND ${unlockedStatusSql('u')}
        `;
      } else if (moderationStatus === 'flagged') {
        whereClause += `
          AND COALESCE(cp.flagged, 0) = 1
          AND ${unlockedStatusSql('u')}
        `;
      } else if (moderationStatus === 'locked' || moderationStatus === 'banned') {
        whereClause += ` AND ${lockedStatusSql('u')}`;
      }
    }

    return { whereClause, params };
  }

  async findAllWithFilters(filters = {}) {
    const { whereClause, params } = this._buildFiltersQuery(filters);
    let query = `
            SELECT cp.*, u.email, u.first_name, u.last_name, u.phone AS user_phone,
             u.avatar_url, u.status AS user_status, u.deleted_at AS user_deleted_at,
             (SELECT COUNT(*) FROM jobs j WHERE j.company_id = cp.id AND j.deleted_at IS NULL) as job_count
            FROM company_profiles cp
            JOIN users u ON cp.user_id = u.id
            ${whereClause}
         `;

    query += ` ORDER BY cp.created_at DESC`;

    const queryParams = [...params];
    const parsedLimit = Number.parseInt(filters.limit, 10);
    const parsedOffset = Number.parseInt(filters.offset, 10);

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT ?`;
      queryParams.push(parsedLimit);
    }

    if (Number.isFinite(parsedLimit) && Number.isFinite(parsedOffset) && parsedOffset >= 0) {
      query += ` OFFSET ?`;
      queryParams.push(parsedOffset);
    }

    const [rows] = await this.pool.query(query, queryParams);

    const total = await this.countWithFilters(filters);

    return { data: rows, total };
  }

  async findPublicWithFilters(filters = {}) {
    const { whereClause, params } = this._buildPublicFiltersQuery(filters);
    let query = `
      SELECT
        cp.id,
        cp.user_id,
        cp.company_name,
        cp.company_logo,
        cp.company_website,
        cp.company_description,
        cp.company_size,
        cp.industry,
        cp.location,
        cp.is_verified,
        cp.created_at,
        cp.updated_at,
        (
          SELECT COUNT(*)
          FROM jobs j
          WHERE j.company_id = cp.id
            AND j.status = 'published'
            AND j.deleted_at IS NULL
            AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        ) AS open_positions
      FROM company_profiles cp
      JOIN users u ON cp.user_id = u.id
      ${whereClause}
      ORDER BY open_positions DESC, cp.company_name ASC
    `;

    const queryParams = [...params];
    const parsedLimit = Number.parseInt(filters.limit, 10);
    const parsedOffset = Number.parseInt(filters.offset, 10);

    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT ?`;
      queryParams.push(parsedLimit);
    }

    if (Number.isFinite(parsedLimit) && Number.isFinite(parsedOffset) && parsedOffset >= 0) {
      query += ` OFFSET ?`;
      queryParams.push(parsedOffset);
    }

    const [rows] = await this.pool.query(query, queryParams);
    const total = await this.countPublicWithFilters(filters);

    return { data: rows, total };
  }

  async countWithFilters(filters = {}) {
    const { whereClause, params } = this._buildFiltersQuery(filters);
    const [rows] = await this.pool.query(
      `
        SELECT COUNT(*) AS total
        FROM company_profiles cp
        JOIN users u ON cp.user_id = u.id
        ${whereClause}
      `,
      params
    );

    return Number(rows[0]?.total || 0);
  }

  async countPublicWithFilters(filters = {}) {
    const { whereClause, params } = this._buildPublicFiltersQuery(filters);
    const [rows] = await this.pool.query(
      `
        SELECT COUNT(*) AS total
        FROM company_profiles cp
        JOIN users u ON cp.user_id = u.id
        ${whereClause}
      `,
      params
    );

    return Number(rows[0]?.total || 0);
  }

  async countByVerification(isVerified) {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM company_profiles WHERE is_verified = ? AND deleted_at IS NULL',
      [Boolean(isVerified)]
    );
    return rows[0].total;
  }

  async countFlagged() {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM company_profiles WHERE flagged = 1 AND deleted_at IS NULL'
    );
    return Number(rows[0]?.total || 0);
  }

  async countByModerationStatus(status) {
    return this.countWithFilters({ moderation_status: status });
  }

  async verifyCompany(id, isVerified, note = null) {
    const verified = Boolean(isVerified);
    const [result] = await this.pool.query(
      `UPDATE company_profiles
          SET is_verified = ?,
              verification_status = ?,
              flagged = CASE WHEN ? = 1 THEN 0 ELSE flagged END,
              moderation_note = ?,
              rejection_reason = ?,
              updated_at = NOW()
        WHERE id = ?`,
      [
        verified ? 1 : 0,
        verified ? 'approved' : 'rejected',
        verified ? 1 : 0,
        note,
        verified ? null : note,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  async flagCompany(id, flagged, note = null) {
    const [result] = await this.pool.query(
      'UPDATE company_profiles SET flagged = ?, moderation_note = ?, updated_at = NOW() WHERE id = ?',
      [Boolean(flagged), note, id]
    );
    return result.affectedRows > 0;
  }

  async banCompany(id, note = 'Banned by Admin') {
    const [result] = await this.pool.query(
      `UPDATE company_profiles
          SET is_verified = 0,
              verification_status = 'rejected',
              flagged = 1,
              moderation_note = ?,
              rejection_reason = ?,
              updated_at = NOW()
        WHERE id = ?`,
      [note, note, id]
    );
    return result.affectedRows > 0;
  }

  async softDelete(id) {
    const [result] = await this.pool.query(
      'UPDATE company_profiles SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async restore(id) {
    const [result] = await this.pool.query(
      'UPDATE company_profiles SET deleted_at = NULL WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async bulkUpdateStatus(ids, status, note = null) {
    if (!ids || !ids.length) return 0;

    let query = '';
    let params = [];

    if (status === 'verify') {
      query =
        "UPDATE company_profiles SET is_verified = 1, verification_status = 'approved', flagged = 0, rejection_reason = NULL";
    } else if (status === 'unverify') {
      query = "UPDATE company_profiles SET is_verified = 0, verification_status = 'rejected'";
    } else if (status === 'flag') {
      query = 'UPDATE company_profiles SET flagged = 1';
    } else if (status === 'unflag') {
      query = 'UPDATE company_profiles SET flagged = 0';
    } else if (status === 'soft-delete') {
      query = 'UPDATE company_profiles SET deleted_at = NOW()';
    } else if (status === 'restore') {
      query = 'UPDATE company_profiles SET deleted_at = NULL';
    } else {
      return 0;
    }

    if (note) {
      query += ', moderation_note = ?';
      params.push(note);
      if (status === 'unverify') {
        query += ', rejection_reason = ?';
        params.push(note);
      }
    }

    query += ', updated_at = NOW()';
    query += ` WHERE id IN (${ids.map(() => '?').join(',')})`;
    params = [...params, ...ids];

    const [result] = await this.pool.query(query, params);
    return result.affectedRows;
  }

  async findByIdWithDetails(id) {
    const [rows] = await this.pool.query(
      `SELECT cp.*, u.email, u.first_name, u.last_name, u.phone AS user_phone, u.avatar_url,
              u.status AS user_status, u.deleted_at AS user_deleted_at,
              (SELECT COUNT(*) FROM jobs j WHERE j.company_id = cp.id AND j.deleted_at IS NULL) AS job_count,
              (SELECT COUNT(*) FROM applications a
                 JOIN jobs j ON a.job_id = j.id
                WHERE j.company_id = cp.id AND j.deleted_at IS NULL) AS application_count
         FROM company_profiles cp
         JOIN users u ON cp.user_id = u.id
        WHERE cp.id = ?`,
      [id]
    );

    return rows[0];
  }

  async findPublicById(id) {
    const [rows] = await this.pool.query(
      `
        SELECT
          cp.id,
          cp.user_id,
          cp.company_name,
          cp.company_logo,
          cp.company_website,
          cp.company_description,
          cp.company_size,
          cp.industry,
          cp.location,
          cp.is_verified,
          cp.created_at,
          cp.updated_at,
          (
            SELECT COUNT(*)
            FROM jobs j
            WHERE j.company_id = cp.id
              AND j.status = 'published'
              AND j.deleted_at IS NULL
              AND (j.deadline IS NULL OR j.deadline >= CURDATE())
          ) AS open_positions
        FROM company_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.id = ?
          AND cp.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND COALESCE(cp.is_verified, 0) = 1
          AND COALESCE(cp.flagged, 0) = 0
          AND COALESCE(u.status, 'active') = 'active'
      `,
      [id]
    );

    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await this.pool.query(
      `SELECT cp.*, u.email as owner_email, u.first_name as owner_first_name, u.last_name as owner_last_name,
              u.status AS owner_status, u.deleted_at AS owner_deleted_at
       FROM company_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.id = ? AND cp.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findByUserId(userId) {
    const [rows] = await this.pool.query(
      `SELECT * FROM company_profiles WHERE user_id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }
}

module.exports = new CompanyRepository();
