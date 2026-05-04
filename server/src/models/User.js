/**
 * User Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 *
 * ⚠️  CHÍNH SÁCH STATUS:
 * - Nguồn trạng thái DUY NHẤT: cột `status` (active/pending_verification/suspended/banned)
 * - Cột `is_active` là LEGACY, chỉ dùng để đồng bộ DB, không dùng trong logic ứng dụng
 * - Tất cả kiểm tra status phải dùng cột `status`, không fallback về `is_active`
 */

/**
 * @typedef {Object} UserRow
 * @property {number} id - Primary key, auto-increment
 * @property {string} email - Email (unique)
 * @property {string} password - Mật khẩu đã hash (bcrypt)
 * @property {'admin'|'recruiter'|'candidate'} role - Vai trò trong hệ thống
 * @property {string|null} first_name - Họ
 * @property {string|null} last_name - Tên
 * @property {string|null} avatar_url - URL ảnh đại diện
 * @property {string} status - Trạng thái tài khoản (active/pending_verification/suspended/banned)
 * @property {number} is_active - [LEGACY] Chỉ dùng để đồng bộ DB, không dùng trong logic
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/** Danh sách vai trò hợp lệ */
const USER_ROLES = ['admin', 'recruiter', 'candidate'];

/** Tên bảng trong database */
const TABLE_NAME = 'users';

const USER_REGION_ALIASES = {
  North: ['North', 'Miền Bắc', 'Mien Bac'],
  Central: ['Central', 'Miền Trung', 'Mien Trung'],
  South: ['South', 'Miền Nam', 'Mien Nam'],
  Overseas: ['Overseas', 'Nước ngoài', 'Nuoc ngoai'],
};

const BaseRepository = require('./Base');
const { USER_STATUS } = require('../utils/constants');

const USER_EFFECTIVE_STATUS_SQL = `
  CASE
    WHEN u.status IS NOT NULL THEN u.status
    ELSE 'active'
  END
`;

const COMPANY_PROFILE_TABLE = 'company_profiles';
const PINNED_ADMIN_ORDER_SQL = `
  CASE
    WHEN u.role = 'admin' THEN 0
    ELSE 1
  END
`;

function mergeEmployerRow(row) {
  if (!row) return row;
  if (row.role === 'recruiter') {
    const logo = row._employer_logo;
    const cur = row.avatar_url;
    if (logo && (!cur || String(cur).trim() === '')) {
      row.avatar_url = logo;
    }
    if (row._employer_company_name) {
      row.company_name = row._employer_company_name;
    }
  }
  if (Object.prototype.hasOwnProperty.call(row, '_employer_logo')) delete row._employer_logo;
  if (Object.prototype.hasOwnProperty.call(row, '_employer_company_name')) {
    delete row._employer_company_name;
  }
  return row;
}

function normalizeRegionValue(region) {
  const normalized = String(region ?? '').trim();
  return (
    Object.entries(USER_REGION_ALIASES).find(([, aliases]) => aliases.includes(normalized))?.[0] ||
    normalized
  );
}

function getRegionFilterValues(region) {
  const normalizedRegion = normalizeRegionValue(region);
  return USER_REGION_ALIASES[normalizedRegion] || [normalizedRegion];
}

function getEffectiveStatusValue(row) {
  if (!row) return null;

  const rawStatus = String(row.status ?? '')
    .trim()
    .toLowerCase();

  if (rawStatus) {
    return rawStatus;
  }

  // Nếu không có status, mặc định là active
  return USER_STATUS.ACTIVE;
}

function normalizeUserStatus(row) {
  if (!row) return row;
  row.status = getEffectiveStatusValue(row);
  return row;
}

function normalizePasswordHash(row) {
  if (!row) return row;
  const password = row.password || row.password_hash || null;
  row.password = password;
  row.password_hash = password;
  return row;
}

function normalizeAuthUserRow(row) {
  return normalizeUserStatus(normalizePasswordHash(mergeEmployerRow(row)));
}

function isStatusAllowedByColumn(columnType, status) {
  if (!columnType) return true;
  return String(columnType).includes(`'${String(status).replace(/'/g, "''")}'`);
}

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async getColumnMap(executor = this.pool, tableName = TABLE_NAME) {
    const [rows] = await executor.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?`,
      [tableName]
    );

    return new Map(rows.map((row) => [row.COLUMN_NAME, row.COLUMN_TYPE]));
  }

  normalizeStatusForSchema(columns, status) {
    const normalizedStatus = String(status || USER_STATUS.ACTIVE)
      .trim()
      .toLowerCase();
    const statusColumnType = columns.get('status');

    if (isStatusAllowedByColumn(statusColumnType, normalizedStatus)) {
      return normalizedStatus;
    }

    if (
      normalizedStatus === USER_STATUS.PENDING_VERIFICATION &&
      isStatusAllowedByColumn(statusColumnType, 'pending')
    ) {
      return 'pending';
    }

    return USER_STATUS.ACTIVE;
  }

  async createAuthUser(connection, data = {}) {
    const columns = await this.getColumnMap(connection);
    const fields = [];
    const params = [];
    const addField = (field, value) => {
      if (!columns.has(field)) return;
      fields.push(field);
      params.push(value);
    };

    addField('email', data.email);

    if (columns.has('password')) {
      addField('password', data.passwordHash);
    }
    if (columns.has('password_hash')) {
      addField('password_hash', data.passwordHash);
    }

    if (!columns.has('password') && !columns.has('password_hash')) {
      throw new Error('Users table must contain password or password_hash column');
    }

    addField('role', data.role);
    addField('first_name', data.firstName);
    addField('last_name', data.lastName);
    addField('full_name', [data.firstName, data.lastName].filter(Boolean).join(' ').trim());

    const status = this.normalizeStatusForSchema(columns, data.status);
    addField('status', status);

    if (columns.has('is_active')) {
      addField(
        'is_active',
        [USER_STATUS.ACTIVE, USER_STATUS.PENDING_VERIFICATION, 'pending'].includes(status) ? 1 : 0
      );
    }

    const placeholders = fields.map(() => '?').join(', ');
    const [result] = await connection.query(
      `INSERT INTO ${TABLE_NAME} (${fields.join(', ')}) VALUES (${placeholders})`,
      params
    );

    return { insertId: result.insertId, status };
  }

  async queryUserWithCompanyProfile(whereClause, params = []) {
    return await this.pool.query(
      `SELECT u.*,
              cp.company_logo AS _employer_logo,
              cp.company_name AS _employer_company_name
         FROM users u
         LEFT JOIN ${COMPANY_PROFILE_TABLE} cp ON cp.user_id = u.id
        ${whereClause}
        LIMIT 1`,
      params
    );
  }

  async findById(id) {
    const [rows] = await this.queryUserWithCompanyProfile(
      'WHERE u.id = ? AND u.deleted_at IS NULL',
      [id]
    );
    return normalizeAuthUserRow(rows[0]);
  }

  async findByEmail(email) {
    const [rows] = await this.queryUserWithCompanyProfile(
      'WHERE u.email = ? AND u.deleted_at IS NULL',
      [email]
    );
    return normalizeAuthUserRow(rows[0]);
  }

  async findByOAuthProvider(provider, providerId) {
    const [rows] = await this.queryUserWithCompanyProfile(
      'WHERE u.oauth_provider = ? AND u.oauth_provider_id = ? AND u.deleted_at IS NULL',
      [provider, providerId]
    );
    return normalizeAuthUserRow(rows[0]);
  }

  async linkOAuth(userId, provider, providerId, avatarUrl) {
    await this.pool.query(
      `UPDATE users
          SET oauth_provider = ?,
              oauth_provider_id = ?,
              avatar_url = CASE
                WHEN avatar_url IS NULL OR TRIM(avatar_url) = '' THEN ?
                ELSE avatar_url
              END
        WHERE id = ?`,
      [provider, providerId, avatarUrl, userId]
    );
  }

  async findByIdWithDetails(id) {
    const [rows] = await this.pool.query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name,
              CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS full_name,
              u.phone, u.address,
              u.avatar_url, u.last_login_at, u.email_verified_at, u.internal_notes,
              u.gender, u.region, u.permissions, u.created_at, u.updated_at,
              ${USER_EFFECTIVE_STATUS_SQL} AS status,
              cp.id AS candidate_id, cp.bio, cp.experience_years, cp.current_job_title,
              cp.education_level, cp.location AS candidate_location, cp.resume_url,
              co.id AS company_id, co.company_name, co.company_website, co.company_logo,
              co.company_description, co.company_size, co.industry, co.location AS company_location,
              co.is_verified,
              (SELECT COUNT(*) FROM applications a
                 JOIN candidate_profiles cp2 ON a.candidate_id = cp2.id
                WHERE cp2.user_id = u.id) AS application_count,
              (SELECT COUNT(*) FROM jobs j
                 JOIN company_profiles co2 ON j.company_id = co2.id
                WHERE co2.user_id = u.id AND j.deleted_at IS NULL) AS job_count
         FROM users u
         LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
         LEFT JOIN company_profiles co ON co.user_id = u.id
        WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );

    return normalizeUserStatus(rows[0]);
  }

  async findAllWithFilters(filters = {}) {
    let whereClause =
      filters.status === 'deleted'
        ? ' WHERE u.deleted_at IS NOT NULL'
        : ' WHERE u.deleted_at IS NULL';
    let joinClause = '';
    const params = [];

    if (filters.search) {
      whereClause +=
        ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.internal_notes LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters.role) {
      whereClause += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status && filters.status !== 'all' && filters.status !== 'deleted') {
      whereClause += ` AND ${USER_EFFECTIVE_STATUS_SQL} = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      whereClause += ' AND u.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClause += ' AND u.created_at <= ?';
      params.push(filters.endDate);
    }

    if (filters.gender) {
      whereClause += ' AND u.gender = ?';
      params.push(filters.gender);
    }

    if (filters.region) {
      const regionValues = getRegionFilterValues(filters.region);
      whereClause += ` AND u.region IN (${regionValues.map(() => '?').join(', ')})`;
      params.push(...regionValues);
    }

    if (filters.isVerified !== undefined) {
      whereClause += ' AND u.id IN (SELECT user_id FROM company_profiles WHERE is_verified = ?)';
      params.push(filters.isVerified ? 1 : 0);
    }

    // Filter by skills (search candidates with specific skills)
    if (filters.skills && filters.skills.length > 0) {
      const skills = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
      const skillsParam = skills.map(() => '?').join(', ');
      whereClause += ` AND u.id IN (
        SELECT DISTINCT cp.user_id 
        FROM candidate_profiles cp
        JOIN candidate_skills cs ON cs.candidate_id = cp.id
        JOIN skills s ON s.id = cs.skill_id
        WHERE s.name IN (${skillsParam})
      )`;
      params.push(...skills);
    }

    // Count query
    const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u ${joinClause} ${whereClause}`;
    const [countResult] = await this.pool.query(countQuery, params);
    const total = countResult[0].total;

    // Data query
    let query = `SELECT DISTINCT u.*, 
      CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS full_name, 
      ${USER_EFFECTIVE_STATUS_SQL} AS effective_status 
    FROM users u ${joinClause} ${whereClause}`;

    const allowedSortFields = ['created_at', 'full_name', 'email', 'role', 'status'];
    const sortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const order = filters.order === 'ASC' ? 'ASC' : 'DESC';

    if (sortBy === 'full_name') {
      query += ` ORDER BY ${PINNED_ADMIN_ORDER_SQL} ASC, u.first_name ${order}, u.last_name ${order}, u.id ASC`;
    } else {
      // Keep the core admin accounts pinned before pagination, then apply the requested sort.
      query += ` ORDER BY ${PINNED_ADMIN_ORDER_SQL} ASC, u.${sortBy} ${order}, u.id ASC`;
    }

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit, 10));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset, 10));
    }

    const [rows] = await this.pool.query(query, params);
    const data = rows.map((row) => ({
      ...row,
      status: row.effective_status || getEffectiveStatusValue(row),
    }));

    return { data, total };
  }

  async updateStatus(id, status, _options = {}) {
    const [result] = await this.pool.query(
      `UPDATE users
          SET status = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  }

  async update(id, data) {
    const payload = { ...data };
    const fields = [];
    const params = [];

    if (payload.status !== undefined) {
      const normalizedStatus = String(payload.status).trim().toLowerCase();
      payload.status = normalizedStatus;
    }

    // Allowable fields for general user profile update.
    // IMPORTANT: 'permissions', 'role', 'status', 'locked_at', 'locked_by', 'internal_notes',
    // 'email_verified_at', 'email', and 'avatar_url' are excluded to prevent
    // privilege escalation, role changes, and unauthorized modifications.
    // Admin-only endpoints use updateByAdmin() for these sensitive fields.
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'address',
      'gender',
      'region',
      'email_notifications',
      'push_notifications',
    ];

    Object.entries(payload).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        // Force empty strings to null for certain fields to avoid DB truncation errors
        const sanitizedValue =
          value === '' && ['gender', 'region'].includes(key)
            ? null
            : key === 'region'
              ? normalizeRegionValue(value)
              : value;
        params.push(sanitizedValue);
      }
    });

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async updateAvatar(id, avatarUrl) {
    const [result] = await this.pool.query(
      `UPDATE users
          SET avatar_url = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL`,
      [avatarUrl, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Admin-only update: allows all fields including sensitive ones like permissions, role, status.
   * This method should ONLY be called from admin-service-level code, never from direct API routes.
   */
  async updateByAdmin(id, data) {
    const payload = { ...data };
    const fields = [];
    const params = [];

    if (payload.status !== undefined) {
      const normalizedStatus = String(payload.status).trim().toLowerCase();
      payload.status = normalizedStatus;
    }

    if (payload.permissions !== undefined) {
      payload.permissions =
        typeof payload.permissions === 'string'
          ? payload.permissions
          : JSON.stringify(payload.permissions);
    }

    const allowedFields = [
      'email',
      'first_name',
      'last_name',
      'phone',
      'address',
      'avatar_url',
      'role',
      'status',
      'internal_notes',
      'gender',
      'region',
      'email_verified_at',
      'email_notifications',
      'push_notifications',
      'locked_at',
      'locked_by',
      'permissions',
    ];

    Object.entries(payload).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        const sanitizedValue = value === '' && ['gender', 'region'].includes(key) ? null : value;
        params.push(sanitizedValue);
      }
    });

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async softDelete(id) {
    const [result] = await this.pool.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async hardDelete(id) {
    const [result] = await this.pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async restore(id) {
    const [result] = await this.pool.query('UPDATE users SET deleted_at = NULL WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async bulkUpdateStatus(ids, status) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const [result] = await this.pool.query(
      `UPDATE users
          SET status = ?,
              updated_at = CURRENT_TIMESTAMP
        WHERE id IN (?)`,
      [status, ids]
    );
    return result.affectedRows;
  }

  async bulkSoftDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const [result] = await this.pool.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)',
      [ids]
    );
    return result.affectedRows;
  }

  async bulkRestore(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const [result] = await this.pool.query('UPDATE users SET deleted_at = NULL WHERE id IN (?)', [
      ids,
    ]);
    return result.affectedRows;
  }

  async bulkUpdateRole(ids, role) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const [result] = await this.pool.query(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)',
      [role, ids]
    );
    return result.affectedRows;
  }

  async countWithFilters(filters = {}) {
    let query =
      filters.status === 'deleted'
        ? 'SELECT COUNT(*) as total FROM users u WHERE u.deleted_at IS NOT NULL'
        : 'SELECT COUNT(*) as total FROM users u WHERE u.deleted_at IS NULL';
    const params = [];

    if (filters.search) {
      query +=
        ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.internal_notes LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters.role) {
      query += ' AND u.role = ?';
      params.push(filters.role);
    }

    if (filters.status && filters.status !== 'all' && filters.status !== 'deleted') {
      query += ` AND ${USER_EFFECTIVE_STATUS_SQL} = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      query += ' AND u.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND u.created_at <= ?';
      params.push(filters.endDate);
    }

    if (filters.gender) {
      query += ' AND u.gender = ?';
      params.push(filters.gender);
    }

    if (filters.region) {
      const regionValues = getRegionFilterValues(filters.region);
      query += ` AND u.region IN (${regionValues.map(() => '?').join(', ')})`;
      params.push(...regionValues);
    }

    const [rows] = await this.pool.query(query, params);
    return rows[0].total;
  }

  async countAll() {
    const [rows] = await this.pool.query(
      'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL'
    );
    return rows[0].total;
  }

  async updatePassword(id, passwordHash) {
    const columns = await this.getColumnMap();
    const fields = [];
    const params = [];

    if (columns.has('password')) {
      fields.push('password = ?');
      params.push(passwordHash);
    }
    if (columns.has('password_hash')) {
      fields.push('password_hash = ?');
      params.push(passwordHash);
    }
    if (columns.has('password_updated_at')) {
      fields.push('password_updated_at = CURRENT_TIMESTAMP');
    }
    if (columns.has('password_changed_at')) {
      fields.push('password_changed_at = CURRENT_TIMESTAMP');
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  async recordSuccessfulLogin(id) {
    const columns = await this.getColumnMap();
    const fields = [];

    if (columns.has('last_login_at')) {
      fields.push('last_login_at = CURRENT_TIMESTAMP');
    }
    if (columns.has('failed_login_attempts')) {
      fields.push('failed_login_attempts = 0');
    }

    if (fields.length === 0) return false;

    const [result] = await this.pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [
      id,
    ]);

    return result.affectedRows > 0;
  }

  async unlinkOAuth(userId) {
    await this.pool.query(
      'UPDATE users SET oauth_provider = NULL, oauth_provider_id = NULL WHERE id = ?',
      [userId]
    );
  }
}

module.exports = new UserRepository();
module.exports.USER_ROLES = USER_ROLES;
module.exports.TABLE_NAME = TABLE_NAME;
module.exports.UserRepository = UserRepository;
