const BaseRepository = require('./base');

function mergeEmployerRow(row) {
  if (!row) return row;
  if (row.role === 'employer') {
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

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findById(id) {
    const [rows] = await this.pool.query(
      `SELECT u.*,
              e.company_logo AS _employer_logo,
              e.company_name AS _employer_company_name
         FROM users u
         LEFT JOIN employers e ON e.user_id = u.id
        WHERE u.id = ? AND u.deleted_at IS NULL
        LIMIT 1`,
      [id]
    );
    return mergeEmployerRow(rows[0]);
  }

  async findByEmail(email) {
    const [rows] = await this.pool.query(
      `SELECT u.*,
              e.company_logo AS _employer_logo,
              e.company_name AS _employer_company_name
         FROM users u
         LEFT JOIN employers e ON e.user_id = u.id
        WHERE u.email = ? AND u.deleted_at IS NULL
        LIMIT 1`,
      [email]
    );
    return mergeEmployerRow(rows[0]);
  }

  async findByOAuthProvider(provider, providerId) {
    const [rows] = await this.pool.query(
      `SELECT u.*,
              e.company_logo AS _employer_logo,
              e.company_name AS _employer_company_name
         FROM users u
         LEFT JOIN employers e ON e.user_id = u.id
        WHERE u.oauth_provider = ? AND u.oauth_provider_id = ? AND u.deleted_at IS NULL
        LIMIT 1`,
      [provider, providerId]
    );
    return mergeEmployerRow(rows[0]);
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
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.address,
              u.avatar_url, u.created_at, u.updated_at,
              CASE
                WHEN u.status IS NOT NULL THEN u.status
                WHEN u.is_active = 1 THEN 'active'
                ELSE 'banned'
              END AS status,
              c.id AS candidate_id, c.bio, c.experience_years, c.current_job_title,
              c.education_level, c.location AS candidate_location, c.resume_url,
              e.id AS employer_id, e.company_name, e.company_website, e.company_logo,
              e.company_description, e.company_size, e.industry, e.location AS company_location,
              e.is_verified,
              (SELECT COUNT(*) FROM applications a
                 JOIN candidates c2 ON a.candidate_id = c2.id
                WHERE c2.user_id = u.id) AS application_count,
              (SELECT COUNT(*) FROM jobs j
                 JOIN employers e2 ON j.employer_id = e2.id
                 WHERE e2.user_id = u.id AND j.deleted_at IS NULL) AS job_count
         FROM users u
         LEFT JOIN candidates c ON c.user_id = u.id
         LEFT JOIN employers e ON e.user_id = u.id
        WHERE u.id = ?`,
      [id]
    );

    return rows[0];
  }

  async findAllWithFilters(filters = {}) {
    let query =
      'SELECT *, CONCAT(COALESCE(first_name, ""), " ", COALESCE(last_name, "")) AS full_name FROM users WHERE deleted_at IS NULL';
    const params = [];

    if (filters.search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        query += ' AND is_active = 1';
      } else if (filters.status === 'inactive' || filters.status === 'banned') {
        query += ' AND is_active = 0';
      }
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit, 10));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset, 10));
    }

    const [rows] = await this.pool.query(query, params);
    return rows.map((row) => ({
      ...row,
      status: row.is_active ? 'active' : 'inactive',
    }));
  }

  async updateStatus(id, status) {
    const isActive = status === 'active' ? 1 : 0;
    const [result] = await this.pool.query('UPDATE users SET is_active = ? WHERE id = ?', [
      isActive,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async countWithFilters(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL';
    const params = [];
    if (filters.search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        query += ' AND is_active = 1';
      } else if (filters.status === 'inactive' || filters.status === 'banned') {
        query += ' AND is_active = 0';
      }
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
    const [result] = await this.pool.query(
      'UPDATE users SET password = ?, password_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, id]
    );

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
