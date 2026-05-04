/**
 * Application Model Schema
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 * Table: applications
 *
 * Cấu trúc mới:
 * - candidate_id: FK → candidate_profiles.id
 * - job_id: FK → jobs.id
 */

/**
 * @typedef {Object} ApplicationRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} candidate_id - FK → candidate_profiles.id
 * @property {number} job_id - FK → jobs.id
 * @property {string|null} resume_url - Đường dẫn CV đã upload
 * @property {string|null} cover_letter - Thư giới thiệu
 * @property {'submitted'|'shortlisted'|'interview_scheduled'|'interviewed'|'offered'|'hired'|'rejected'|'withdrawn'} status
 * @property {string} applied_at - ISO timestamp
 * @property {number|null} assessed_by - FK → users.id
 * @property {string|null} assessed_at - Thời điểm đánh giá
 * @property {string|null} notes - Ghi chú nội bộ
 * @property {number|null} ai_score - Điểm AI
 * @property {string|null} ai_summary - Tóm tắt AI
 */

const APPLICATION_STATUSES = [
  'submitted',
  'shortlisted',
  'interview_scheduled',
  'interviewed',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

const APPLICATION_STATUS_GROUPS = {
  applied: ['submitted'],
  screening: ['shortlisted'],
  interview: ['interview_scheduled', 'interviewed'],
  hired: ['hired'],
  rejected: ['rejected'],
};

function buildStatusFilterValues(status) {
  if (!status || status === 'all') {
    return null;
  }

  const requestedStatuses = Array.isArray(status)
    ? status
    : String(status)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const values = requestedStatuses.flatMap((item) => APPLICATION_STATUS_GROUPS[item] || [item]);

  return [...new Set(values.filter((item) => APPLICATION_STATUSES.includes(item)))];
}

const TABLE_NAME = 'applications';

const BaseRepository = require('./Base');

class ApplicationRepository extends BaseRepository {
  constructor() {
    super('applications');
    this._tableColumnsCache = new Map();
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

  async _tableExists(tableName) {
    const columns = await this._getTableColumns(tableName);
    return columns.size > 0;
  }

  _selectColumn(tableAlias, columnName, alias, availableColumns, fallback = 'NULL') {
    return availableColumns.has(columnName)
      ? `${tableAlias}.${columnName} AS ${alias}`
      : `${fallback} AS ${alias}`;
  }

  _selectFirstAvailableColumn(tableAlias, columnNames, alias, availableColumns, fallback = 'NULL') {
    const columnName = columnNames.find((name) => availableColumns.has(name));
    return columnName ? `${tableAlias}.${columnName} AS ${alias}` : `${fallback} AS ${alias}`;
  }

  async _buildCandidateApplicationReadMeta() {
    const [applicationColumns, jobColumns, companyColumns, interviewColumns] = await Promise.all([
      this._getTableColumns('applications'),
      this._getTableColumns('jobs'),
      this._getTableColumns('company_profiles'),
      this._getTableColumns('interview_schedules'),
    ]);

    const hasInterviewSchedules =
      interviewColumns.has('id') &&
      interviewColumns.has('application_id') &&
      interviewColumns.has('scheduled_at');

    return {
      applicationColumns,
      jobColumns,
      companyColumns,
      interviewColumns,
      hasInterviewSchedules,
    };
  }

  async _buildFindByJobIdQueryMeta() {
    const [candidateColumns, userColumns, candidateSkillColumns, skillColumns] = await Promise.all([
      this._getTableColumns('candidate_profiles'),
      this._getTableColumns('users'),
      this._getTableColumns('candidate_skills'),
      this._getTableColumns('skills'),
    ]);

    return {
      candidateColumns,
      userColumns,
      candidateSkillColumns,
      skillColumns,
    };
  }

  _buildFiltersQuery(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.search) {
      whereClause += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR j.title LIKE ? OR cp.company_name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    const statusValues = buildStatusFilterValues(filters.status);
    if (statusValues) {
      if (statusValues.length === 0) {
        whereClause += ' AND 1 = 0';
      } else if (statusValues.length === 1) {
        whereClause += ' AND a.status = ?';
        params.push(statusValues[0]);
      } else {
        whereClause += ` AND a.status IN (${statusValues.map(() => '?').join(', ')})`;
        params.push(...statusValues);
      }
    }

    if (filters.candidate_id) {
      whereClause += ` AND a.candidate_id = ?`;
      params.push(filters.candidate_id);
    }

    if (filters.job_id) {
      whereClause += ` AND a.job_id = ?`;
      params.push(filters.job_id);
    }

    return { whereClause, params };
  }

  async findAll(filters = {}) {
    const { whereClause, params } = this._buildFiltersQuery(filters);
    let query = `
      SELECT a.*,
             CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
             u.email as candidate_email,
             j.title as job_title, j.job_type,
             cp.company_name
      FROM applications a
      JOIN candidate_profiles cand ON a.candidate_id = cand.id
      JOIN users u ON cand.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles cp ON j.company_id = cp.id
      ${whereClause}
    `;

    query += ` ORDER BY a.applied_at DESC`;

    const queryParams = [...params];
    if (filters.limit) {
      query += ` LIMIT ?`;
      queryParams.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ` OFFSET ?`;
      queryParams.push(parseInt(filters.offset));
    }

    const [rows] = await this.pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM applications a
      JOIN candidate_profiles cand ON a.candidate_id = cand.id
      JOIN users u ON cand.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles cp ON j.company_id = cp.id
      ${whereClause}
    `;
    const [countResult] = await this.pool.query(countQuery, params);

    return { data: rows, total: countResult[0].total };
  }

  async findByJobId(jobId) {
    const { candidateColumns, userColumns, candidateSkillColumns, skillColumns } =
      await this._buildFindByJobIdQueryMeta();

    const selectColumn = (tableAlias, columnName, alias, availableColumns, fallback = 'NULL') =>
      availableColumns.has(columnName)
        ? `${tableAlias}.${columnName} AS ${alias}`
        : `${fallback} AS ${alias}`;
    const hasCandidateSkills =
      candidateSkillColumns.has('candidate_id') &&
      candidateSkillColumns.has('skill_id') &&
      skillColumns.has('id') &&
      skillColumns.has('name');
    const query = `
      SELECT
        a.*,
        ${selectColumn('cand', 'bio', 'bio', candidateColumns)},
        ${selectColumn('cand', 'current_job_title', 'current_job_title', candidateColumns)},
        ${selectColumn('cand', 'experience_years', 'experience_years', candidateColumns)},
        ${selectColumn('cand', 'location', 'candidate_location', candidateColumns)},
        ${
          candidateColumns.has('resume_url')
            ? 'cand.resume_url AS candidate_resume_url'
            : 'a.resume_url AS candidate_resume_url'
        },
        ${selectColumn('u', 'first_name', 'first_name', userColumns)},
        ${selectColumn('u', 'last_name', 'last_name', userColumns)},
        TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS candidate_name,
        ${selectColumn('u', 'email', 'email', userColumns)},
        ${selectColumn('u', 'avatar_url', 'avatar_url', userColumns)},
        j.title AS job_title,
        ${
          hasCandidateSkills
            ? `
        (
          SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
          FROM candidate_skills cs
          JOIN skills s ON s.id = cs.skill_id
          WHERE cs.candidate_id = cand.id
        ) AS skills_csv
              `
            : 'NULL AS skills_csv'
        }
      FROM applications a
      JOIN candidate_profiles cand ON a.candidate_id = cand.id
      JOIN users u ON cand.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.job_id = ?
      ORDER BY COALESCE(a.ai_score, 0) DESC, a.applied_at DESC
    `;
    const [rows] = await this.pool.query(query, [jobId]);
    return rows;
  }

  async findByCandidateId(candidateId) {
    const { jobColumns, companyColumns, interviewColumns, hasInterviewSchedules } =
      await this._buildCandidateApplicationReadMeta();
    const interviewSelect = hasInterviewSchedules
      ? `
        latest_interview.scheduled_at AS interview_scheduled_at,
        DATE_FORMAT(latest_interview.scheduled_at, '%Y-%m-%d') AS interview_date,
        DATE_FORMAT(latest_interview.scheduled_at, '%H:%i') AS interview_time,
        ${this._selectColumn('latest_interview', 'interview_type', 'interview_type', interviewColumns)},
        ${this._selectColumn('latest_interview', 'status', 'interview_status', interviewColumns)},
        ${this._selectColumn('latest_interview', 'location', 'interview_location', interviewColumns)},
        ${
          interviewColumns.has('interview_type') && interviewColumns.has('location')
            ? `CASE
          WHEN latest_interview.interview_type = 'online' THEN latest_interview.location
          ELSE NULL
        END AS meeting_link`
            : 'NULL AS meeting_link'
        },
        ${this._selectColumn('latest_interview', 'candidate_note', 'candidate_note', interviewColumns)},
        ${this._selectColumn('latest_interview', 'round', 'interview_round', interviewColumns)}
      `
      : `
        NULL AS interview_scheduled_at,
        NULL AS interview_date,
        NULL AS interview_time,
        NULL AS interview_type,
        NULL AS interview_status,
        NULL AS interview_location,
        NULL AS meeting_link,
        NULL AS candidate_note,
        NULL AS interview_round
      `;
    const interviewJoin = hasInterviewSchedules
      ? `LEFT JOIN interview_schedules latest_interview ON latest_interview.id = (
        SELECT is2.id
        FROM interview_schedules is2
        WHERE is2.application_id = a.id
        ORDER BY is2.scheduled_at DESC, is2.id DESC
        LIMIT 1
      )`
      : '';

    const query = `
      SELECT
        a.*,
        ${this._selectColumn('j', 'title', 'job_title', jobColumns, "'Vị trí đang cập nhật'")},
        ${this._selectFirstAvailableColumn('j', ['address', 'location'], 'location', jobColumns)},
        ${this._selectFirstAvailableColumn('j', ['job_type', 'type'], 'job_type', jobColumns)},
        ${this._selectColumn('cp', 'company_name', 'company_name', companyColumns, "'Công ty đang cập nhật'")},
        ${this._selectColumn('cp', 'company_logo', 'company_logo', companyColumns)},
        ${interviewSelect}
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles cp ON j.company_id = cp.id
      ${interviewJoin}
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }

  async findCandidateApplicationById(applicationId, candidateId) {
    const { jobColumns, companyColumns } = await this._buildCandidateApplicationReadMeta();
    const query = `
      SELECT a.*,
             ${this._selectColumn('j', 'title', 'job_title', jobColumns, "'Vị trí đang cập nhật'")},
             ${this._selectColumn('j', 'description', 'job_description', jobColumns)},
             ${this._selectFirstAvailableColumn('j', ['address', 'location'], 'location', jobColumns)},
             ${this._selectFirstAvailableColumn('j', ['job_type', 'type'], 'job_type', jobColumns)},
             ${this._selectColumn('j', 'salary_min', 'salary_min', jobColumns)},
             ${this._selectColumn('j', 'salary_max', 'salary_max', jobColumns)},
             ${this._selectColumn('j', 'salary_negotiable', 'salary_negotiable', jobColumns, '0')},
             ${this._selectColumn('j', 'vacancies', 'vacancies', jobColumns, '1')},
             ${this._selectFirstAvailableColumn('j', ['deadline', 'expires_at'], 'deadline', jobColumns)},
             j.id as job_id,
             cand.user_id AS user_id,
             ${this._selectColumn('cp', 'company_name', 'company_name', companyColumns, "'Công ty đang cập nhật'")},
             ${this._selectColumn('cp', 'company_logo', 'company_logo', companyColumns)}
      FROM applications a
      JOIN candidate_profiles cand ON a.candidate_id = cand.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles cp ON j.company_id = cp.id
      WHERE a.id = ? AND a.candidate_id = ?
    `;
    const [rows] = await this.pool.query(query, [applicationId, candidateId]);
    return rows[0] || null;
  }

  async findByIdWithDetails(id) {
    const query = `
      SELECT a.*,
             cand.bio, cand.experience, cand.education,
             CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
             u.id as user_id,
             u.email as candidate_email,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.address as location,
             j.title as job_title, j.recruiter_id, j.job_type, j.id as job_id,
             cp.id as company_id, cp.company_name
      FROM applications a
      JOIN candidate_profiles cand ON a.candidate_id = cand.id
      JOIN users u ON cand.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles cp ON j.company_id = cp.id
      WHERE a.id = ?
    `;
    const [rows] = await this.pool.query(query, [id]);
    const application = rows[0];

    if (!application) return null;

    const [skills] = await this.pool.query(
      `SELECT s.id, s.name, s.slug, cs.proficiency_level, cs.years_experience
       FROM candidate_skills cs
       JOIN skills s ON s.id = cs.skill_id
       WHERE cs.candidate_id = ?`,
      [application.candidate_id]
    );

    return { ...application, skills };
  }

  async findByCandidateAndJob(candidateId, jobId) {
    const [rows] = await this.pool.query(
      'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );
    return rows[0] || null;
  }

  async deleteByCandidateId(applicationId, candidateId) {
    const relatedTableNames = [
      'interview_schedules',
      'application_offers',
      'application_history',
      'communication_audit',
      'recruitment_conversations',
    ];
    const relatedTables = Object.fromEntries(
      await Promise.all(
        relatedTableNames.map(async (tableName) => [tableName, await this._tableExists(tableName)])
      )
    );

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [applicationRows] = await connection.query(
        'SELECT id FROM applications WHERE id = ? AND candidate_id = ? FOR UPDATE',
        [applicationId, candidateId]
      );

      if (!applicationRows.length) {
        await connection.rollback();
        return false;
      }

      if (relatedTables.interview_schedules) {
        await connection.query('DELETE FROM interview_schedules WHERE application_id = ?', [
          applicationId,
        ]);
      }
      if (relatedTables.application_offers) {
        await connection.query('DELETE FROM application_offers WHERE application_id = ?', [
          applicationId,
        ]);
      }
      if (relatedTables.application_history) {
        await connection.query('DELETE FROM application_history WHERE application_id = ?', [
          applicationId,
        ]);
      }
      if (relatedTables.communication_audit) {
        await connection.query(
          'UPDATE communication_audit SET application_id = NULL WHERE application_id = ?',
          [applicationId]
        );
      }
      if (relatedTables.recruitment_conversations) {
        await connection.query('DELETE FROM recruitment_conversations WHERE application_id = ?', [
          applicationId,
        ]);
      }

      const [result] = await connection.query(
        'DELETE FROM applications WHERE id = ? AND candidate_id = ?',
        [applicationId, candidateId]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async countAll() {
    const [rows] = await this.pool.query('SELECT COUNT(*) as total FROM applications');
    return rows[0].total;
  }

  async countByStatus() {
    const [rows] = await this.pool.query(
      'SELECT status, COUNT(*) AS total FROM applications GROUP BY status'
    );
    return rows.reduce((accumulator, row) => {
      accumulator[row.status] = row.total;
      return accumulator;
    }, {});
  }

  async updateStatus(id, status, changedBy, notes = null, data = {}) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [oldRows] = await connection.query(
        'SELECT status, ai_score FROM applications WHERE id = ?',
        [id]
      );
      const oldStatus = oldRows[0]?.status;

      let updateQuery = 'UPDATE applications SET status = ?';
      const updateParams = [status];

      if (data && data.ai_score !== undefined) {
        updateQuery += ', ai_score = ?';
        updateParams.push(data.ai_score);
      }

      if (data && data.ai_summary !== undefined) {
        updateQuery += ', ai_summary = ?';
        updateParams.push(data.ai_summary);
      }

      if (changedBy) {
        updateQuery += ', assessed_by = ?, assessed_at = NOW()';
        updateParams.push(changedBy);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(id);

      await connection.query(updateQuery, updateParams);

      await connection.query(
        'INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [id, 'status_change', oldStatus, status, changedBy, notes]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateInternalNote(id, note) {
    const [result] = await this.pool.query('UPDATE applications SET notes = ? WHERE id = ?', [
      note,
      id,
    ]);
    return result.affectedRows > 0;
  }

  async bulkUpdateStatus(ids, status, changedBy, notes = null) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      let affectedCount = 0;
      for (const id of ids) {
        const [oldRows] = await connection.query('SELECT status FROM applications WHERE id = ?', [
          id,
        ]);
        const oldStatus = oldRows[0]?.status;

        await connection.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

        await connection.query(
          'INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            id,
            'bulk_status_change',
            oldStatus,
            status,
            changedBy,
            notes || `Cập nhật trạng thái hàng loạt sang ${status}`,
          ]
        );
        affectedCount++;
      }

      await connection.commit();
      return affectedCount;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Khi ứng viên được HIRED, tự động reject các đơn đang pending của cùng ứng viên đó
   * ở các job khác, để tránh ứng viên bị "treo" ở nhiều pipeline.
   * @param {number} candidateId
   * @param {number} excludeApplicationId - Application vừa hired, không reject cái này
   */
  async rejectOtherApplications(candidateId, excludeApplicationId) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy các đơn đang active (chưa kết thúc) của ứng viên, trừ đơn vừa hired
      const [pendingApps] = await connection.query(
        `SELECT id, status FROM applications
         WHERE candidate_id = ?
           AND id != ?
           AND status IN ('submitted','shortlisted','interview_scheduled')`,
        [candidateId, excludeApplicationId]
      );

      for (const app of pendingApps) {
        await connection.query('UPDATE applications SET status = ? WHERE id = ?', [
          'rejected',
          app.id,
        ]);
        await connection.query(
          `INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes)
           VALUES (?, 'auto_rejected', ?, 'rejected', NULL, 'Tự động từ chối do ứng viên đã được tuyển ở vị trí khác.')`,
          [app.id, app.status]
        );
      }

      await connection.commit();
      return pendingApps.length;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getHistory(id) {
    const query = `
      SELECT ah.*, u.first_name, u.last_name
      FROM application_history ah
      LEFT JOIN users u ON ah.changed_by = u.id
      WHERE ah.application_id = ?
      ORDER BY ah.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [id]);
    return rows;
  }

  async addHistoryNote(applicationId, changedBy, currentStatus, notes) {
    const [result] = await this.pool.query(
      'INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [applicationId, 'note_added', currentStatus, currentStatus, changedBy, notes]
    );

    const [rows] = await this.pool.query(
      `
        SELECT ah.*, u.first_name, u.last_name
        FROM application_history ah
        LEFT JOIN users u ON ah.changed_by = u.id
        WHERE ah.id = ?
      `,
      [result.insertId]
    );

    return rows[0];
  }

  async getCandidateNotifications(candidateId, limit = 50) {
    const query = `
      SELECT *
      FROM (
        SELECT
          CONCAT('applied-', a.id) as id,
          'application' as type,
          'Đã nộp đơn ứng tuyển' as title,
          CONCAT('Bạn đã ứng tuyển vị trí "', j.title, '" tại ', cp.company_name, '.') as message,
          a.applied_at as created_at,
          a.id as application_id,
          a.status as status,
          j.title as job_title,
          cp.company_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN company_profiles cp ON j.company_id = cp.id
        WHERE a.candidate_id = ?

        UNION ALL

        SELECT
          CONCAT('history-', ah.id) as id,
          'application' as type,
          CONCAT('Trạng thái hồ sơ: ', ah.new_status) as title,
          COALESCE(
            ah.notes,
            CONCAT('Hồ sơ "', j.title, '" tại ', cp.company_name, ' đã được cập nhật sang ', ah.new_status, '.')
          ) as message,
          ah.created_at as created_at,
          a.id as application_id,
          ah.new_status as status,
          j.title as job_title,
          cp.company_name
        FROM application_history ah
        JOIN applications a ON ah.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        JOIN company_profiles cp ON j.company_id = cp.id
        WHERE a.candidate_id = ?
      ) notifications
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [rows] = await this.pool.query(query, [candidateId, candidateId, parseInt(limit, 10)]);
    return rows;
  }
}

module.exports = new ApplicationRepository();
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
module.exports.TABLE_NAME = TABLE_NAME;
module.exports.ApplicationRepository = ApplicationRepository;
module.exports.getTableName = () => TABLE_NAME;
