/**
 * Candidate Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Table: candidate_profiles
 */

/**
 * @typedef {Object} CandidateRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} user_id - FK → users.id
 * @property {string|null} bio - Giới thiệu bản thân
 * @property {number|null} experience_years - Số năm kinh nghiệm
 * @property {string|null} current_job_title - Vị trí hiện tại
 * @property {string|null} education_level - Trình độ học vấn
 * @property {Array|null} education - Danh sách trường đã học (JSON)
 * @property {Array|null} experience - Danh sách kinh nghiệm (JSON)
 * @property {string|null} location - Địa điểm
 * @property {string|null} resume_url - Đường dẫn CV
 * @property {string|null} phone - Số điện thoại
 * @property {string|null} profile_visibility - public/private
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

const TABLE_NAME = 'candidate_profiles';

const BaseRepository = require('./Base');

class CandidateRepository extends BaseRepository {
  constructor() {
    super('candidate_profiles');
    this._tableColumnsCache = new Map();
  }

  getTableName() {
    return TABLE_NAME;
  }

  async _getTableColumns(tableName) {
    if (this._tableColumnsCache.has(tableName)) {
      return this._tableColumnsCache.get(tableName);
    }

    let rows;
    try {
      [rows] = await this.pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        const columns = new Set();
        this._tableColumnsCache.set(tableName, columns);
        return columns;
      }
      throw error;
    }

    const columns = new Set(rows.map((row) => row.Field));
    this._tableColumnsCache.set(tableName, columns);
    return columns;
  }

  async _hasColumn(tableName, columnName) {
    const columns = await this._getTableColumns(tableName);
    return columns.has(columnName);
  }

  async _getCandidateProfileJsonField(candidateId, columnName, fallbackValue) {
    if (!(await this._hasColumn(TABLE_NAME, columnName))) {
      return fallbackValue;
    }

    const [rows] = await this.pool.query(
      `SELECT \`${columnName}\` AS value FROM ${TABLE_NAME} WHERE id = ?`,
      [candidateId]
    );

    const value = rows[0]?.value;
    if (value === null || value === undefined || value === '') {
      return fallbackValue;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallbackValue;
      }
    }

    return value;
  }

  async _getCandidateSkillQueryMeta() {
    const candidateSkillColumns = await this._getTableColumns('candidate_skills');
    const skillColumns = await this._getTableColumns('skills');

    return {
      hasProficiencyLevel: candidateSkillColumns.has('proficiency_level'),
      hasYearsExperience: candidateSkillColumns.has('years_experience'),
      hasIsPrimary: candidateSkillColumns.has('is_primary'),
      hasSkillSlug: skillColumns.has('slug'),
    };
  }

  async filterSupportedFields(data = {}) {
    const columns = await this._getTableColumns(TABLE_NAME);
    return Object.fromEntries(
      Object.entries(data).filter(([key]) => columns.has(key))
    );
  }

  async _getCandidateSkillSelectClause() {
    const meta = await this._getCandidateSkillQueryMeta();

    return `
      SELECT
        ${meta.hasProficiencyLevel ? 'cs.proficiency_level' : 'NULL AS proficiency_level'},
        ${meta.hasYearsExperience ? 'cs.years_experience' : 'NULL AS years_experience'},
        ${meta.hasIsPrimary ? 'cs.is_primary' : '0 AS is_primary'},
        s.id,
        s.name,
        ${meta.hasSkillSlug ? 's.slug' : 'NULL AS slug'}
    `;
  }

  _normalizeCandidateSkill(row = {}) {
    return {
      ...row,
      is_primary: Boolean(Number(row.is_primary || 0)),
    };
  }

  async findByUserId(userId) {
    const query = `
      SELECT cp.*, u.email, u.first_name, u.last_name, u.avatar_url, u.gender, u.region,
             u.phone AS user_phone, u.address AS user_address
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ?
    `;
    let [rows] = await this.pool.query(query, [userId]);
    if (rows[0]) {
      return rows[0];
    }

    await this.pool.query('INSERT IGNORE INTO candidate_profiles (user_id) VALUES (?)', [userId]);
    [rows] = await this.pool.query(query, [userId]);
    return rows[0];
  }

  async findByIdWithSkills(candidateId) {
    const query = `
      SELECT cp.*, u.email, u.first_name, u.last_name, u.avatar_url, u.gender, u.region,
             u.phone AS user_phone, u.address AS user_address
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    const candidate = rows[0];

    if (!candidate) {
      return null;
    }

    const [skills] = await this.pool.query(
      `SELECT s.id, s.name, s.slug, cs.proficiency_level, cs.years_experience
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = ?`,
      [candidateId]
    );

    return {
      ...candidate,
      skills,
    };
  }

  async syncSkills(candidateId, skillNames) {
    const meta = await this._getCandidateSkillQueryMeta();
    if (!meta || !(await this._hasColumn('candidate_skills', 'candidate_id'))) return;
    await this.pool.query('DELETE FROM candidate_skills WHERE candidate_id = ?', [candidateId]);

    if (!skillNames || skillNames.length === 0) return;

    for (const name of skillNames) {
      const [existing] = await this.pool.query('SELECT id FROM skills WHERE name = ?', [name]);
      let skillId;
      if (existing.length > 0) {
        skillId = existing[0].id;
      } else {
        const [result] = await this.pool.query('INSERT INTO skills (name) VALUES (?)', [name]);
        skillId = result.insertId;
      }

      const columns = ['candidate_id', 'skill_id'];
      const placeholders = ['?', '?'];
      const values = [candidateId, skillId];

      if (meta.hasProficiencyLevel) {
        columns.push('proficiency_level');
        placeholders.push('?');
        values.push(null);
      }

      if (meta.hasYearsExperience) {
        columns.push('years_experience');
        placeholders.push('?');
        values.push(null);
      }

      await this.pool.query(
        `INSERT INTO candidate_skills (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         ON DUPLICATE KEY UPDATE skill_id = skill_id`,
        values
      );
    }
  }

  async getSavedJobs(candidateId) {
    const query = `
      SELECT j.id, j.title, j.slug, j.description, j.job_type,
             j.salary_min, j.salary_max, j.salary_display, j.status,
             j.deadline, j.published_at, j.created_at,
             j.address, j.featured, j.views, j.applications_count,
             co.company_name, co.company_logo,
             c.name AS category_name,
             l.name AS location,
             sj.created_at AS saved_at,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
      FROM saved_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      JOIN company_profiles co ON j.company_id = co.id
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN locations l ON j.location_id = l.id
      WHERE sj.candidate_id = ?
        AND j.deleted_at IS NULL
        AND co.deleted_at IS NULL
      ORDER BY sj.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }


  async saveJob(candidateId, jobId) {
    const query = `
      INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;
    await this.pool.query(query, [candidateId, jobId]);
    return true;
  }

  async unsaveJob(candidateId, jobId) {
    const [result] = await this.pool.query(
      'DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );
    return result.affectedRows > 0;
  }

  async isJobSaved(candidateId, jobId) {
    const [rows] = await this.pool.query(
      'SELECT id FROM saved_jobs WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );
    return rows.length > 0;
  }

  // ─── Saved Companies ────────────────────────────────────────────────────────

  async getSavedCompanies(candidateId) {
    const query = `
      SELECT co.id, co.company_name, co.company_logo, co.industry, co.company_size AS size,
             co.location, co.company_website AS website,
             sc.created_at AS saved_at,
             (SELECT COUNT(*) FROM jobs j WHERE j.company_id = co.id AND j.status = 'published' AND j.deleted_at IS NULL) AS open_jobs
      FROM saved_companies sc
      JOIN company_profiles co ON sc.company_id = co.id
      WHERE sc.candidate_id = ?
        AND co.deleted_at IS NULL
      ORDER BY sc.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }

  async saveCompany(candidateId, companyId) {
    await this.pool.query(
      'INSERT INTO saved_companies (candidate_id, company_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
      [candidateId, companyId]
    );
    return true;
  }

  async unsaveCompany(candidateId, companyId) {
    const [result] = await this.pool.query(
      'DELETE FROM saved_companies WHERE candidate_id = ? AND company_id = ?',
      [candidateId, companyId]
    );
    return result.affectedRows > 0;
  }

  async isCompanySaved(candidateId, companyId) {
    const [rows] = await this.pool.query(
      'SELECT id FROM saved_companies WHERE candidate_id = ? AND company_id = ?',
      [candidateId, companyId]
    );
    return rows.length > 0;
  }

  // ─── Phase 1.1: Full Profile ────────────────────────────────────────────────

  async findByIdFull(candidateId) {
    const query = `
      SELECT cp.*, u.email, u.first_name, u.last_name, u.avatar_url, u.gender, u.region,
             u.phone AS user_phone, u.address AS user_address
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows[0] || null;
  }

  // ─── Phase 1.1: Job Preferences ──────────────────────────────────────────────

  async updatePreferences(candidateId, preferences) {
    const allowedFields = [
      'job_search_status',
      'expected_salary_min',
      'expected_salary_max',
      'salary_currency',
      'preferred_job_types',
      'preferred_locations',
      'willing_to_relocate',
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(preferences)) {
      if (allowedFields.includes(key) && (await this._hasColumn(TABLE_NAME, key))) {
        fields.push(`${key} = ?`);
        if (['preferred_job_types', 'preferred_locations'].includes(key)) {
          values.push(
            value == null ? null : typeof value === 'string' ? value : JSON.stringify(value)
          );
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return;

    values.push(candidateId);
    await this.pool.query(
      `UPDATE candidate_profiles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // ─── Phase 1.1: Skills with Proficiency ────────────────────────────────────

  async getSkillsWithLevels(candidateId) {
    const meta = await this._getCandidateSkillQueryMeta();
    if (!(await this._hasColumn('candidate_skills', 'candidate_id')) || !meta) {
      return [];
    }

    const [rows] = await this.pool.query(
      `${await this._getCandidateSkillSelectClause()}
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = ?`,
      [candidateId]
    );
    return rows.map((row) => this._normalizeCandidateSkill(row));
  }

  async addSkill(candidateId, skillId, { proficiency_level = null, years_experience = null, is_primary = false } = {}) {
    const meta = await this._getCandidateSkillQueryMeta();
    if (!(await this._hasColumn('candidate_skills', 'candidate_id'))) {
      return null;
    }

    const columns = ['candidate_id', 'skill_id'];
    const placeholders = ['?', '?'];
    const values = [candidateId, skillId];
    const updates = ['skill_id = skill_id'];

    if (meta.hasProficiencyLevel) {
      columns.push('proficiency_level');
      placeholders.push('?');
      values.push(proficiency_level);
      updates.push('proficiency_level = VALUES(proficiency_level)');
    }

    if (meta.hasYearsExperience) {
      columns.push('years_experience');
      placeholders.push('?');
      values.push(years_experience);
      updates.push('years_experience = VALUES(years_experience)');
    }

    if (meta.hasIsPrimary) {
      columns.push('is_primary');
      placeholders.push('?');
      values.push(is_primary);
      updates.push('is_primary = VALUES(is_primary)');
    }

    await this.pool.query(
      `INSERT INTO candidate_skills (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
      values
    );
    return this.getSkillById(candidateId, skillId);
  }

  async removeSkill(candidateId, skillId) {
    const [result] = await this.pool.query(
      'DELETE FROM candidate_skills WHERE candidate_id = ? AND skill_id = ?',
      [candidateId, skillId]
    );
    return result.affectedRows > 0;
  }

  async updateSkill(candidateId, skillId, { proficiency_level, years_experience, is_primary } = {}) {
    const meta = await this._getCandidateSkillQueryMeta();
    if (!(await this._hasColumn('candidate_skills', 'candidate_id'))) {
      return;
    }

    const fields = [];
    const values = [];

    if (meta.hasProficiencyLevel && proficiency_level !== undefined) {
      fields.push('proficiency_level = ?');
      values.push(proficiency_level);
    }
    if (meta.hasYearsExperience && years_experience !== undefined) {
      fields.push('years_experience = ?');
      values.push(years_experience);
    }
    if (meta.hasIsPrimary && is_primary !== undefined) {
      fields.push('is_primary = ?');
      values.push(is_primary);
    }

    if (fields.length === 0) return;

    values.push(candidateId, skillId);
    await this.pool.query(
      `UPDATE candidate_skills SET ${fields.join(', ')} WHERE candidate_id = ? AND skill_id = ?`,
      values
    );
  }

  async getSkillById(candidateId, skillId) {
    if (!(await this._hasColumn('candidate_skills', 'candidate_id'))) {
      return null;
    }

    const [rows] = await this.pool.query(
      `${await this._getCandidateSkillSelectClause()}
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = ? AND cs.skill_id = ?`,
      [candidateId, skillId]
    );
    return rows[0] ? this._normalizeCandidateSkill(rows[0]) : null;
  }

  // ─── Phase 1.1: Education Items ─────────────────────────────────────────────

  async getEducation(candidateId) {
    const query = `
      SELECT education FROM candidate_profiles WHERE id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    if (!rows[0] || !rows[0].education) return [];
    try {
      const parsed = JSON.parse(rows[0].education);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async addEducation(candidateId, item) {
    const existing = await this.getEducation(candidateId);
    const newItem = {
      id: Date.now(),
      ...item,
      created_at: new Date().toISOString(),
    };
    existing.push(newItem);
    await this.pool.query(
      'UPDATE candidate_profiles SET education = ? WHERE id = ?',
      [JSON.stringify(existing), candidateId]
    );
    return newItem;
  }

  async updateEducation(candidateId, eduId, data) {
    const existing = await this.getEducation(candidateId);
    const idx = existing.findIndex((e) => String(e.id) === String(eduId));
    if (idx === -1) return null;
    existing[idx] = { ...existing[idx], ...data, updated_at: new Date().toISOString() };
    await this.pool.query(
      'UPDATE candidate_profiles SET education = ? WHERE id = ?',
      [JSON.stringify(existing), candidateId]
    );
    return existing[idx];
  }

  async deleteEducation(candidateId, eduId) {
    const existing = await this.getEducation(candidateId);
    const filtered = existing.filter((e) => String(e.id) !== String(eduId));
    if (filtered.length === existing.length) return false;
    await this.pool.query(
      'UPDATE candidate_profiles SET education = ? WHERE id = ?',
      [JSON.stringify(filtered), candidateId]
    );
    return true;
  }

  // ─── Phase 1.1: Experience Items ───────────────────────────────────────────

  async getExperience(candidateId) {
    const query = `
      SELECT experience FROM candidate_profiles WHERE id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    if (!rows[0] || !rows[0].experience) return [];
    try {
      const parsed = JSON.parse(rows[0].experience);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async addExperience(candidateId, item) {
    const existing = await this.getExperience(candidateId);
    const newItem = {
      id: Date.now(),
      ...item,
      created_at: new Date().toISOString(),
    };
    existing.push(newItem);
    await this.pool.query(
      'UPDATE candidate_profiles SET experience = ? WHERE id = ?',
      [JSON.stringify(existing), candidateId]
    );
    return newItem;
  }

  async updateExperience(candidateId, expId, data) {
    const existing = await this.getExperience(candidateId);
    const idx = existing.findIndex((e) => String(e.id) === String(expId));
    if (idx === -1) return null;
    existing[idx] = { ...existing[idx], ...data, updated_at: new Date().toISOString() };
    await this.pool.query(
      'UPDATE candidate_profiles SET experience = ? WHERE id = ?',
      [JSON.stringify(existing), candidateId]
    );
    return existing[idx];
  }

  async deleteExperience(candidateId, expId) {
    const existing = await this.getExperience(candidateId);
    const filtered = existing.filter((e) => String(e.id) !== String(expId));
    if (filtered.length === existing.length) return false;
    await this.pool.query(
      'UPDATE candidate_profiles SET experience = ? WHERE id = ?',
      [JSON.stringify(filtered), candidateId]
    );
    return true;
  }

  // ─── Phase 1.1: Languages & Certifications ─────────────────────────────────

  async getLanguages(candidateId) {
    const parsed = await this._getCandidateProfileJsonField(candidateId, 'languages', []);
    return Array.isArray(parsed) ? parsed : [];
  }

  async updateLanguages(candidateId, languages) {
    await this.pool.query(
      'UPDATE candidate_profiles SET languages = ? WHERE id = ?',
      [JSON.stringify(languages), candidateId]
    );
  }

  async getCertifications(candidateId) {
    const parsed = await this._getCandidateProfileJsonField(candidateId, 'certifications', []);
    return Array.isArray(parsed) ? parsed : [];
  }

  async updateCertifications(candidateId, certifications) {
    await this.pool.query(
      'UPDATE candidate_profiles SET certifications = ? WHERE id = ?',
      [JSON.stringify(certifications), candidateId]
    );
  }

  async getSocialLinks(candidateId) {
    const parsed = await this._getCandidateProfileJsonField(candidateId, 'social_links', {});
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  }

  async updateSocialLinks(candidateId, socialLinks) {
    await this.pool.query(
      'UPDATE candidate_profiles SET social_links = ? WHERE id = ?',
      [JSON.stringify(socialLinks), candidateId]
    );
  }

  async updateLastActive(candidateId) {
    if (!(await this._hasColumn(TABLE_NAME, 'last_active_at'))) {
      return;
    }

    await this.pool.query(
      'UPDATE candidate_profiles SET last_active_at = NOW() WHERE id = ?',
      [candidateId]
    );
  }

  // ─── Phase 1.1: Dashboard Stats ────────────────────────────────────────────

  async ensureEmployerSavedCandidatesTable() {
    if (this._employerSavedCandidatesReady) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS employer_saved_candidates (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_id INT UNSIGNED NOT NULL,
        recruiter_id INT UNSIGNED NULL,
        candidate_id INT UNSIGNED NOT NULL,
        folder VARCHAR(100) NOT NULL DEFAULT 'general',
        notes TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_employer_saved_candidate (company_id, candidate_id),
        INDEX idx_esc_company_folder (company_id, folder),
        INDEX idx_esc_candidate (candidate_id),
        CONSTRAINT fk_esc_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
        CONSTRAINT fk_esc_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_esc_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    this._employerSavedCandidatesReady = true;
  }

  _normalizeEmployerCandidateRow(row = {}) {
    const skills = String(row.skills_csv || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const fullName = String(row.name || '').trim();
    const fallbackName = String(row.email || '').split('@')[0] || 'Ứng viên';

    return {
      id: row.id,
      user_id: row.user_id,
      name: fullName || fallbackName,
      role: row.current_job_title || 'Chưa cập nhật vị trí',
      bio: row.bio || '',
      experience_years: Number(row.experience_years || 0),
      education_level: row.education_level || null,
      location: row.location || 'Chưa cập nhật',
      avatar_url: row.avatar_url || null,
      resume_url: row.resume_url || null,
      job_search_status: row.job_search_status || null,
      expected_salary_min: row.expected_salary_min,
      expected_salary_max: row.expected_salary_max,
      salary_currency: row.salary_currency || 'VND',
      last_active_at: row.last_active_at || row.updated_at || row.created_at,
      skills,
      skill_count: Number(row.skill_count || skills.length),
      application_count: Number(row.application_count || 0),
      application_id: row.application_id || null,
      is_saved: Boolean(Number(row.is_saved || row.saved_id || 0)),
      saved_id: row.saved_id || null,
      saved_folder: row.saved_folder || 'general',
      saved_notes: row.saved_notes || null,
      saved_at: row.saved_at || null,
      contact_unlocked: Boolean(row.application_id),
    };
  }

  _buildEmployerCandidateWhere(filters = {}) {
    const where = [
      "u.role = 'candidate'",
      'u.deleted_at IS NULL',
      "(u.status IS NULL OR u.status = 'active')",
      "cp.profile_visibility = 'public'",
    ];
    const params = [];

    const search = String(filters.search || '').trim();
    if (search) {
      const term = `%${search}%`;
      where.push(`(
        TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) LIKE ?
        OR cp.current_job_title LIKE ?
        OR cp.bio LIKE ?
        OR cp.location LIKE ?
        OR EXISTS (
          SELECT 1
          FROM candidate_skills cs_search
          JOIN skills s_search ON s_search.id = cs_search.skill_id
          WHERE cs_search.candidate_id = cp.id
            AND s_search.name LIKE ?
        )
      )`);
      params.push(term, term, term, term, term);
    }

    const skills = Array.isArray(filters.skills)
      ? filters.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];
    if (skills.length) {
      const skillConditions = skills.map(() => 's_filter.name LIKE ? OR s_filter.slug LIKE ?');
      where.push(`EXISTS (
        SELECT 1
        FROM candidate_skills cs_filter
        JOIN skills s_filter ON s_filter.id = cs_filter.skill_id
        WHERE cs_filter.candidate_id = cp.id
          AND (${skillConditions.join(' OR ')})
      )`);
      skills.forEach((skill) => {
        params.push(`%${skill}%`, `%${skill}%`);
      });
    }

    const location = String(filters.location || '').trim();
    if (location) {
      where.push('cp.location LIKE ?');
      params.push(`%${location}%`);
    }

    switch (filters.level) {
      case 'intern':
        where.push("(COALESCE(cp.experience_years, 0) <= 1 OR LOWER(cp.current_job_title) LIKE '%intern%' OR LOWER(cp.current_job_title) LIKE '%fresher%')");
        break;
      case 'junior':
        where.push('COALESCE(cp.experience_years, 0) BETWEEN 0 AND 2');
        break;
      case 'mid':
        where.push('COALESCE(cp.experience_years, 0) BETWEEN 2 AND 5');
        break;
      case 'senior':
        where.push("(COALESCE(cp.experience_years, 0) >= 5 OR LOWER(cp.current_job_title) LIKE '%senior%')");
        break;
      case 'lead':
        where.push("(COALESCE(cp.experience_years, 0) >= 6 OR LOWER(cp.current_job_title) LIKE '%lead%' OR LOWER(cp.current_job_title) LIKE '%manager%')");
        break;
      default:
        break;
    }

    switch (filters.salary) {
      case 'lt20m':
      case 'lt1000':
        where.push(`cp.expected_salary_max IS NOT NULL AND (
          (cp.salary_currency = 'USD' AND cp.expected_salary_max < 1000)
          OR (COALESCE(cp.salary_currency, 'VND') <> 'USD' AND cp.expected_salary_max < 20000000)
        )`);
        break;
      case '20m-40m':
      case '1000-2000':
        where.push(`cp.expected_salary_min IS NOT NULL AND cp.expected_salary_max IS NOT NULL AND (
          (cp.salary_currency = 'USD' AND cp.expected_salary_min <= 2000 AND cp.expected_salary_max >= 1000)
          OR (COALESCE(cp.salary_currency, 'VND') <> 'USD' AND cp.expected_salary_min <= 40000000 AND cp.expected_salary_max >= 20000000)
        )`);
        break;
      case '40m-80m':
      case '2000-4000':
        where.push(`cp.expected_salary_min IS NOT NULL AND cp.expected_salary_max IS NOT NULL AND (
          (cp.salary_currency = 'USD' AND cp.expected_salary_min <= 4000 AND cp.expected_salary_max >= 2000)
          OR (COALESCE(cp.salary_currency, 'VND') <> 'USD' AND cp.expected_salary_min <= 80000000 AND cp.expected_salary_max >= 40000000)
        )`);
        break;
      case 'gt80m':
      case 'gt4000':
        where.push(`cp.expected_salary_min IS NOT NULL AND (
          (cp.salary_currency = 'USD' AND cp.expected_salary_min > 4000)
          OR (COALESCE(cp.salary_currency, 'VND') <> 'USD' AND cp.expected_salary_min > 80000000)
        )`);
        break;
      default:
        break;
    }

    return {
      clause: `WHERE ${where.join(' AND ')}`,
      params,
    };
  }

  _getEmployerCandidateSelect() {
    return `
      SELECT
        cp.id,
        cp.user_id,
        TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS name,
        u.email,
        u.avatar_url,
        cp.bio,
        cp.experience_years,
        cp.current_job_title,
        cp.education_level,
        cp.location,
        cp.resume_url,
        cp.job_search_status,
        cp.expected_salary_min,
        cp.expected_salary_max,
        cp.salary_currency,
        cp.last_active_at,
        cp.created_at,
        cp.updated_at,
        (
          SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
          FROM candidate_skills cs
          JOIN skills s ON s.id = cs.skill_id
          WHERE cs.candidate_id = cp.id
        ) AS skills_csv,
        (
          SELECT COUNT(*)
          FROM candidate_skills cs_count
          WHERE cs_count.candidate_id = cp.id
        ) AS skill_count,
        (
          SELECT COUNT(*)
          FROM applications a_count
          WHERE a_count.candidate_id = cp.id
        ) AS application_count,
        (
          SELECT esc.id
          FROM employer_saved_candidates esc
          WHERE esc.company_id = ? AND esc.candidate_id = cp.id
          LIMIT 1
        ) AS saved_id,
        (
          SELECT esc.folder
          FROM employer_saved_candidates esc
          WHERE esc.company_id = ? AND esc.candidate_id = cp.id
          LIMIT 1
        ) AS saved_folder,
        (
          SELECT esc.notes
          FROM employer_saved_candidates esc
          WHERE esc.company_id = ? AND esc.candidate_id = cp.id
          LIMIT 1
        ) AS saved_notes,
        (
          SELECT esc.created_at
          FROM employer_saved_candidates esc
          WHERE esc.company_id = ? AND esc.candidate_id = cp.id
          LIMIT 1
        ) AS saved_at,
        (
          SELECT a.id
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          WHERE a.candidate_id = cp.id AND j.company_id = ?
          ORDER BY COALESCE(a.updated_at, a.created_at, a.applied_at) DESC
          LIMIT 1
        ) AS application_id
      FROM candidate_profiles cp
      JOIN users u ON u.id = cp.user_id
    `;
  }

  async searchPublicForEmployer(companyId, filters = {}) {
    await this.ensureEmployerSavedCandidatesTable();

    const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 12, 1), 50);
    const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    const { clause, params } = this._buildEmployerCandidateWhere(filters);
    const selectParams = [companyId, companyId, companyId, companyId, companyId];

    const [countRows] = await this.pool.query(
      `SELECT COUNT(*) AS total
         FROM candidate_profiles cp
         JOIN users u ON u.id = cp.user_id
       ${clause}`,
      params
    );

    const orderMap = {
      experience: 'COALESCE(cp.experience_years, 0) DESC, cp.updated_at DESC',
      recent: 'COALESCE(cp.last_active_at, cp.updated_at, cp.created_at) DESC',
      salary: 'COALESCE(cp.expected_salary_min, 999999999) ASC, cp.updated_at DESC',
    };
    const requestedSort = filters.sort === 'match' ? 'recent' : filters.sort;
    const orderBy = orderMap[requestedSort] || orderMap.recent;

    const [rows] = await this.pool.query(
      `${this._getEmployerCandidateSelect()}
       ${clause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...selectParams, ...params, limit, offset]
    );

    return {
      data: rows.map((row) => this._normalizeEmployerCandidateRow(row)),
      total: Number(countRows[0]?.total || 0),
      page,
      limit,
    };
  }

  async countEmployerSavedCandidates(companyId) {
    await this.ensureEmployerSavedCandidatesTable();
    const [rows] = await this.pool.query(
      `SELECT COUNT(*) AS total
         FROM employer_saved_candidates esc
         JOIN candidate_profiles cp ON cp.id = esc.candidate_id
         JOIN users u ON u.id = cp.user_id
        WHERE esc.company_id = ?
          AND u.role = 'candidate'
          AND u.deleted_at IS NULL
          AND (u.status IS NULL OR u.status = 'active')
          AND cp.profile_visibility = 'public'`,
      [companyId]
    );
    return Number(rows[0]?.total || 0);
  }

  async getEmployerSavedFolderCounts(companyId) {
    await this.ensureEmployerSavedCandidatesTable();
    const [rows] = await this.pool.query(
      `SELECT COALESCE(NULLIF(folder, ''), 'general') AS folder, COUNT(*) AS count
         FROM employer_saved_candidates esc
         JOIN candidate_profiles cp ON cp.id = esc.candidate_id
         JOIN users u ON u.id = cp.user_id
        WHERE esc.company_id = ?
          AND u.role = 'candidate'
          AND u.deleted_at IS NULL
          AND (u.status IS NULL OR u.status = 'active')
          AND cp.profile_visibility = 'public'
        GROUP BY COALESCE(NULLIF(folder, ''), 'general')
        ORDER BY count DESC, folder ASC`,
      [companyId]
    );
    return rows.map((row) => ({
      folder: row.folder || 'general',
      count: Number(row.count || 0),
    }));
  }

  async getEmployerSavedCandidates(companyId, filters = {}) {
    await this.ensureEmployerSavedCandidatesTable();

    const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 12, 1), 50);
    const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
    const offset = (page - 1) * limit;
    const where = [
      'esc.company_id = ?',
      "u.role = 'candidate'",
      'u.deleted_at IS NULL',
      "(u.status IS NULL OR u.status = 'active')",
      "cp.profile_visibility = 'public'",
    ];
    const params = [companyId];

    const folder = String(filters.folder || '').trim();
    if (folder && folder !== 'all') {
      where.push("COALESCE(NULLIF(esc.folder, ''), 'general') = ?");
      params.push(folder);
    }

    const search = String(filters.search || '').trim();
    if (search) {
      const term = `%${search}%`;
      where.push(`(
        TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) LIKE ?
        OR cp.current_job_title LIKE ?
        OR cp.location LIKE ?
        OR EXISTS (
          SELECT 1
          FROM candidate_skills cs_search
          JOIN skills s_search ON s_search.id = cs_search.skill_id
          WHERE cs_search.candidate_id = cp.id
            AND s_search.name LIKE ?
        )
      )`);
      params.push(term, term, term, term);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const [countRows] = await this.pool.query(
      `SELECT COUNT(*) AS total
         FROM employer_saved_candidates esc
         JOIN candidate_profiles cp ON cp.id = esc.candidate_id
         JOIN users u ON u.id = cp.user_id
        ${whereClause}`,
      params
    );

    const orderMap = {
      name: 'name ASC, esc.created_at DESC',
      experience: 'COALESCE(cp.experience_years, 0) DESC, esc.created_at DESC',
      recent: 'esc.created_at DESC',
    };
    const orderBy = orderMap[filters.sort] || orderMap.recent;
    const selectParams = [companyId, companyId, companyId, companyId, companyId];

    const [rows] = await this.pool.query(
      `${this._getEmployerCandidateSelect()}
       JOIN employer_saved_candidates esc ON esc.candidate_id = cp.id AND esc.company_id = ?
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...selectParams, companyId, ...params, limit, offset]
    );

    return {
      data: rows.map((row) => this._normalizeEmployerCandidateRow(row)),
      total: Number(countRows[0]?.total || 0),
      page,
      limit,
    };
  }

  async saveCandidateForEmployer({ companyId, recruiterId, candidateId, folder = 'general', notes = null }) {
    await this.ensureEmployerSavedCandidatesTable();

    const [candidateRows] = await this.pool.query(
      `SELECT cp.id
         FROM candidate_profiles cp
         JOIN users u ON u.id = cp.user_id
        WHERE cp.id = ?
          AND u.role = 'candidate'
          AND u.deleted_at IS NULL
          AND (u.status IS NULL OR u.status = 'active')
          AND cp.profile_visibility = 'public'
        LIMIT 1`,
      [candidateId]
    );

    if (!candidateRows.length) return null;

    const normalizedFolder = String(folder || 'general').trim().slice(0, 100) || 'general';
    await this.pool.query(
      `INSERT INTO employer_saved_candidates (company_id, recruiter_id, candidate_id, folder, notes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         recruiter_id = VALUES(recruiter_id),
         folder = VALUES(folder),
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [companyId, recruiterId, candidateId, normalizedFolder, notes || null]
    );

    return true;
  }

  async updateSavedCandidateForEmployer({ companyId, candidateId, folder, notes }) {
    await this.ensureEmployerSavedCandidatesTable();

    const fields = [];
    const params = [];
    if (folder !== undefined) {
      fields.push('folder = ?');
      params.push(String(folder || 'general').trim().slice(0, 100) || 'general');
    }
    if (notes !== undefined) {
      fields.push('notes = ?');
      params.push(notes ? String(notes).trim() : null);
    }

    if (!fields.length) return false;

    params.push(companyId, candidateId);
    const [result] = await this.pool.query(
      `UPDATE employer_saved_candidates
          SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ? AND candidate_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  async removeCandidateForEmployer(companyId, candidateId) {
    await this.ensureEmployerSavedCandidatesTable();
    const [result] = await this.pool.query(
      'DELETE FROM employer_saved_candidates WHERE company_id = ? AND candidate_id = ?',
      [companyId, candidateId]
    );
    return result.affectedRows > 0;
  }

  async getDashboardStats(candidateId) {
    const [applications] = await this.pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
         SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted,
         SUM(CASE WHEN status = 'interview_scheduled' THEN 1 ELSE 0 END) AS interview_scheduled,
         SUM(CASE WHEN status = 'interviewed' THEN 1 ELSE 0 END) AS interviewed,
         SUM(CASE WHEN status = 'offered' THEN 1 ELSE 0 END) AS offered,
         SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) AS hired,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) AS withdrawn,
         SUM(CASE WHEN status IN ('submitted','shortlisted') THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status IN ('interview_scheduled','interviewed') THEN 1 ELSE 0 END) AS interviewing,
         SUM(CASE WHEN status IN ('offered','hired') THEN 1 ELSE 0 END) AS successful,
         SUM(CASE WHEN status IN ('rejected','withdrawn') THEN 1 ELSE 0 END) AS closed,
         SUM(CASE WHEN status IN ('shortlisted','interview_scheduled','interviewed','offered','hired','rejected') THEN 1 ELSE 0 END) AS response_count
       FROM applications
       WHERE candidate_id = ?`,
      [candidateId]
    );

    const [savedCount] = await this.pool.query(
      'SELECT COUNT(*) AS count FROM saved_jobs WHERE candidate_id = ?',
      [candidateId]
    );

    const [recentApplications] = await this.pool.query(
      `SELECT a.id, a.status, a.applied_at,
              j.id AS job_id, j.title AS job_title,
              co.company_name, co.company_logo
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN company_profiles co ON j.company_id = co.id
       WHERE a.candidate_id = ?
         AND j.deleted_at IS NULL
         AND co.deleted_at IS NULL
       ORDER BY a.applied_at DESC
       LIMIT 5`,
      [candidateId]
    );

    return {
      applications: applications[0],
      savedJobsCount: savedCount[0]?.count || 0,
      recentApplications,
    };
  }

  async getProfileAnalyticsDashboard(candidateId) {
    const profile = await this.findByIdFull(candidateId);
    if (!profile) return null;

    const [applicationRows] = await this.pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status IN ('shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected') THEN 1 ELSE 0 END) AS responses,
         SUM(CASE WHEN status IN ('shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired') THEN 1 ELSE 0 END) AS recruiter_interest
       FROM applications
       WHERE candidate_id = ?`,
      [candidateId]
    );

    const [skillRows] = await this.pool.query(
      'SELECT COUNT(*) AS total FROM candidate_skills WHERE candidate_id = ?',
      [candidateId]
    );

    const stats = applicationRows[0] || {};
    const totalApplications = Number(stats.total || 0);
    const responses = Number(stats.responses || 0);
    const recruiterInterest = Number(stats.recruiter_interest || 0);
    const skillCount = Number(skillRows[0]?.total || 0);
    const responseRate = totalApplications > 0 ? Math.round((responses / totalApplications) * 100) : 0;

    const hasStructuredValue = (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return Boolean(trimmed && trimmed !== '[]' && trimmed !== '{}');
      }
      return Boolean(value);
    };

    const hasAvatar = Boolean(profile.avatar_url);
    const hasResume = Boolean(profile.resume_url);
    const hasHeadline = Boolean(profile.current_job_title);
    const hasBio = Boolean(profile.bio);
    const hasEducation = Boolean(profile.education_level) || hasStructuredValue(profile.education);
    const hasPortfolio = hasStructuredValue(profile.projects);

    return {
      profile_views: 0,
      previous_period_views: 0,
      total_applications: totalApplications,
      response_count: responses,
      skill_count: skillCount,
      recruiter_interest_score: recruiterInterest,
      recruiter_interest_change: 0,
      search_appearances: 0,
      search_change: 0,
      response_rate: responseRate,
      response_rate_change: 0,
      recent_viewers: [],
      suggestions: [
        !hasAvatar && {
          label: 'Cập nhật ảnh đại diện chuyên nghiệp',
          description: 'Phần nhận diện đầy đủ giúp recruiter tin tưởng hồ sơ nhanh hơn.',
          priority: 'high',
        },
        !hasHeadline && {
          label: 'Bổ sung vị trí mục tiêu',
          description: 'Tiêu đề nghề nghiệp rõ ràng giúp recruiter hiểu nhanh mức độ phù hợp.',
          priority: 'high',
        },
        skillCount < 5 && {
          label: 'Bổ sung kỹ năng trọng tâm',
          description: 'Nên có ít nhất năm kỹ năng liên quan để tăng chất lượng matching.',
          priority: 'medium',
        },
        !hasResume && {
          label: 'Tải lên CV mới nhất',
          description: 'CV hiện tại giúp recruiter có thêm ngữ cảnh trước khi liên hệ.',
          priority: 'medium',
        },
      ].filter(Boolean),
      strength_breakdown: [
        { label: 'Ảnh đại diện', score: hasAvatar ? 100 : 0 },
        { label: 'Tiêu đề nghề nghiệp', score: hasHeadline ? 100 : 35 },
        { label: 'Kỹ năng', score: Math.min(100, skillCount * 20) },
        { label: 'Tóm tắt hồ sơ', score: hasBio ? 100 : 25 },
        { label: 'Học vấn', score: hasEducation ? 100 : 30 },
        { label: 'Portfolio', score: hasPortfolio ? 100 : 20 },
      ],
    };
  }
}

module.exports = new CandidateRepository();
module.exports.CandidateRepository = CandidateRepository;
module.exports.TABLE_NAME = TABLE_NAME;
module.exports.getTableName = () => TABLE_NAME;
