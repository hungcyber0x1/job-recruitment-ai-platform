/**
 * InterviewScheduleRepository
 * Quản lý lịch phỏng vấn của từng đơn ứng tuyển.
 * Table: interview_schedules
 */
const BaseRepository = require('./Base');

const INTERVIEW_TYPE_ENUM =
  "ENUM('phone','online','offline','video','onsite','technical','hr','panel','assignment') NOT NULL DEFAULT 'online'";
const INTERVIEW_STATUS_ENUM =
  "ENUM('scheduled','confirmed','rescheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled'";

const LEGACY_INTERVIEW_TYPE_MAP = {
  online: 'video',
  offline: 'onsite',
  phone: 'phone',
};

function ident(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

function formatMysqlDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (part) => String(part).padStart(2, '0');
  return (
    [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join('-') +
    ` ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

function addMinutes(value, minutes) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Date(date.getTime() + minutes * 60 * 1000);
}

class InterviewScheduleRepository extends BaseRepository {
  constructor() {
    super('interview_schedules');
    this._columnCache = null;
    this._compatibilityPromise = null;
  }

  async _getColumns(refresh = false) {
    if (!refresh && this._columnCache) return this._columnCache;

    const [rows] = await this.pool.query(`SHOW COLUMNS FROM ${this.tableName}`);
    this._columnCache = new Map(rows.map((row) => [row.Field, row]));
    return this._columnCache;
  }

  async _safeSchemaQuery(sql, params = []) {
    try {
      await this.pool.query(sql, params);
    } catch {
      // Runtime schema alignment is best-effort. Query builders below still support
      // both the legacy migration schema and the current runtime schema.
    }
  }

  async _ensureRuntimeCompatibility() {
    if (!this._compatibilityPromise) {
      this._compatibilityPromise = (async () => {
        const columns = await this._getColumns(true);
        if (!columns.has('application_id')) return columns;

        await this._safeSchemaQuery(
          `ALTER TABLE ${ident(this.tableName)} MODIFY COLUMN ${ident('interview_type')} ${INTERVIEW_TYPE_ENUM}`
        );
        await this._safeSchemaQuery(
          `ALTER TABLE ${ident(this.tableName)} MODIFY COLUMN ${ident('status')} ${INTERVIEW_STATUS_ENUM}`
        );

        if (!columns.has('round')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('round')} INT UNSIGNED NOT NULL DEFAULT 1 AFTER ${ident('application_id')}`
          );
        }
        if (!columns.has('scheduled_at')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('scheduled_at')} DATETIME NULL AFTER ${ident('interview_type')}`
          );
        }
        if (!columns.has('duration_minutes')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('duration_minutes')} INT UNSIGNED NOT NULL DEFAULT 60 AFTER ${ident('scheduled_at')}`
          );
        }
        if (!columns.has('location')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('location')} VARCHAR(500) NULL AFTER ${ident('duration_minutes')}`
          );
        }
        if (!columns.has('candidate_note')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('candidate_note')} TEXT NULL AFTER ${ident('location')}`
          );
        }
        if (!columns.has('interviewer_note')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('interviewer_note')} TEXT NULL AFTER ${ident('candidate_note')}`
          );
        }
        if (!columns.has('created_by')) {
          await this._safeSchemaQuery(
            `ALTER TABLE ${ident(this.tableName)} ADD COLUMN ${ident('created_by')} BIGINT UNSIGNED NULL AFTER ${ident('status')}`
          );
        }

        const refreshed = await this._getColumns(true);

        if (refreshed.has('round') && refreshed.has('round_number')) {
          await this._safeSchemaQuery(
            `UPDATE ${ident(this.tableName)} SET ${ident('round')} = ${ident('round_number')} WHERE ${ident('round_number')} IS NOT NULL`
          );
        }
        if (refreshed.has('scheduled_at') && refreshed.has('scheduled_start_at')) {
          await this._safeSchemaQuery(
            `UPDATE ${ident(this.tableName)} SET ${ident('scheduled_at')} = ${ident('scheduled_start_at')} WHERE ${ident('scheduled_at')} IS NULL`
          );
        }
        if (
          refreshed.has('duration_minutes') &&
          refreshed.has('scheduled_start_at') &&
          refreshed.has('scheduled_end_at')
        ) {
          await this._safeSchemaQuery(
            `UPDATE ${ident(this.tableName)} SET ${ident('duration_minutes')} = TIMESTAMPDIFF(MINUTE, ${ident('scheduled_start_at')}, ${ident('scheduled_end_at')}) WHERE ${ident('duration_minutes')} IS NULL OR ${ident('duration_minutes')} = 0`
          );
        }
        if (refreshed.has('created_by') && refreshed.has('scheduled_by')) {
          await this._safeSchemaQuery(
            `UPDATE ${ident(this.tableName)} SET ${ident('created_by')} = ${ident('scheduled_by')} WHERE ${ident('created_by')} IS NULL`
          );
        }

        return this._getColumns(true);
      })();
    }

    return this._compatibilityPromise;
  }

  _columnTypeHas(columns, columnName, value) {
    const type = columns.get(columnName)?.Type || '';
    return type.includes(`'${value}'`);
  }

  _normalizeInterviewTypeForWrite(interviewType, columns) {
    if (!columns.has('interview_type')) return interviewType;
    if (this._columnTypeHas(columns, 'interview_type', interviewType)) return interviewType;
    return LEGACY_INTERVIEW_TYPE_MAP[interviewType] || interviewType;
  }

  _scheduledAtExpression(columns, alias = 'is2') {
    if (columns.has('scheduled_at') && columns.has('scheduled_start_at')) {
      return `COALESCE(${alias}.scheduled_at, ${alias}.scheduled_start_at)`;
    }
    if (columns.has('scheduled_at')) return `${alias}.scheduled_at`;
    if (columns.has('scheduled_start_at')) return `${alias}.scheduled_start_at`;
    return 'NULL';
  }

  _durationExpression(columns, alias = 'is2') {
    if (columns.has('duration_minutes')) return `${alias}.duration_minutes`;
    if (columns.has('scheduled_start_at') && columns.has('scheduled_end_at')) {
      return `TIMESTAMPDIFF(MINUTE, ${alias}.scheduled_start_at, ${alias}.scheduled_end_at)`;
    }
    return '60';
  }

  _roundExpression(columns, alias = 'is2') {
    if (columns.has('round') && columns.has('round_number')) {
      return `COALESCE(${alias}.round, ${alias}.round_number)`;
    }
    if (columns.has('round')) return `${alias}.round`;
    if (columns.has('round_number')) return `${alias}.round_number`;
    return '1';
  }

  _createdByExpression(columns, alias = 'is2') {
    if (columns.has('created_by') && columns.has('scheduled_by')) {
      return `COALESCE(${alias}.created_by, ${alias}.scheduled_by)`;
    }
    if (columns.has('created_by')) return `${alias}.created_by`;
    if (columns.has('scheduled_by')) return `${alias}.scheduled_by`;
    return 'NULL';
  }

  _interviewTypeExpression(columns, alias = 'is2') {
    if (!columns.has('interview_type')) return 'NULL';
    return `CASE ${alias}.interview_type WHEN 'video' THEN 'online' WHEN 'onsite' THEN 'offline' ELSE ${alias}.interview_type END`;
  }

  _normalizedScheduleSelect(columns, alias = 'is2') {
    return `
         ${alias}.*,
         ${this._roundExpression(columns, alias)} AS round,
         ${this._interviewTypeExpression(columns, alias)} AS interview_type,
         ${this._scheduledAtExpression(columns, alias)} AS scheduled_at,
         ${this._durationExpression(columns, alias)} AS duration_minutes,
         ${this._createdByExpression(columns, alias)} AS created_by`;
  }

  _buildInsertPayload(
    {
      application_id,
      round,
      interview_type,
      scheduled_at,
      duration_minutes,
      location,
      candidate_note,
      interviewer_note,
      created_by,
    },
    columns
  ) {
    const duration = Number.isInteger(Number(duration_minutes)) ? Number(duration_minutes) : 60;
    const scheduledStart = formatMysqlDateTime(scheduled_at);
    const scheduledEnd = formatMysqlDateTime(addMinutes(scheduled_at, duration));
    const storedInterviewType = this._normalizeInterviewTypeForWrite(interview_type, columns);
    const payload = { application_id };

    if (columns.has('round')) payload.round = round;
    if (columns.has('round_number')) payload.round_number = round;
    if (columns.has('title')) payload.title = `Phỏng vấn vòng ${round}`;
    if (columns.has('interview_type')) payload.interview_type = storedInterviewType;
    if (columns.has('scheduled_at')) payload.scheduled_at = scheduledStart;
    if (columns.has('scheduled_start_at')) payload.scheduled_start_at = scheduledStart;
    if (columns.has('scheduled_end_at')) payload.scheduled_end_at = scheduledEnd;
    if (columns.has('timezone')) payload.timezone = 'Asia/Ho_Chi_Minh';
    if (columns.has('duration_minutes')) payload.duration_minutes = duration;
    if (columns.has('location')) payload.location = location ?? null;
    if (columns.has('meeting_url'))
      payload.meeting_url = interview_type === 'online' ? (location ?? null) : null;
    if (columns.has('meeting_provider')) {
      payload.meeting_provider =
        interview_type === 'phone'
          ? 'phone'
          : interview_type === 'offline'
            ? 'onsite'
            : location
              ? 'other'
              : null;
    }
    if (columns.has('candidate_note')) payload.candidate_note = candidate_note ?? null;
    if (columns.has('interviewer_note')) payload.interviewer_note = interviewer_note ?? null;
    if (columns.has('created_by')) payload.created_by = created_by ?? null;
    if (columns.has('scheduled_by')) payload.scheduled_by = created_by ?? null;

    return payload;
  }

  /**
   * Tạo lịch phỏng vấn mới cho một application.
   * Tự động tính số vòng (round) dựa trên lịch hiện có.
   */
  async create({
    application_id,
    interview_type,
    scheduled_at,
    duration_minutes,
    location,
    candidate_note,
    interviewer_note,
    created_by,
  }) {
    const columns = await this._ensureRuntimeCompatibility();
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const [countRows] = await connection.query(
        'SELECT COUNT(*) as cnt FROM interview_schedules WHERE application_id = ? FOR UPDATE',
        [application_id]
      );
      const round = (countRows[0].cnt || 0) + 1;
      const payload = this._buildInsertPayload(
        {
          application_id,
          round,
          interview_type,
          scheduled_at,
          duration_minutes,
          location,
          candidate_note,
          interviewer_note,
          created_by,
        },
        columns
      );
      const keys = Object.keys(payload);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((key) => payload[key]);

      const [result] = await connection.query(
        `INSERT INTO interview_schedules (${keys.map(ident).join(', ')}) VALUES (${placeholders})`,
        values
      );

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy tất cả lịch phỏng vấn của một đơn, mới nhất trước.
   */
  async findByApplication(applicationId) {
    const columns = await this._ensureRuntimeCompatibility();
    const scheduledAt = this._scheduledAtExpression(columns);
    const createdBy = this._createdByExpression(columns);
    const [rows] = await this.pool.query(
      `SELECT ${this._normalizedScheduleSelect(columns)}, u.first_name, u.last_name
       FROM interview_schedules is2
       LEFT JOIN users u ON u.id = ${createdBy}
       WHERE is2.application_id = ?
       ORDER BY ${scheduledAt} DESC`,
      [applicationId]
    );
    return rows;
  }

  /**
   * Lấy toàn bộ lịch phỏng vấn của một công ty tuyển dụng.
   * Admin có thể truyền isAdmin=true để xem toàn hệ thống.
   */
  async findByCompany(companyId, filters = {}, isAdmin = false) {
    const columns = await this._ensureRuntimeCompatibility();
    const scheduledAt = this._scheduledAtExpression(columns);
    const createdBy = this._createdByExpression(columns);
    const where = [];
    const params = [];

    if (!isAdmin) {
      where.push('j.company_id = ?');
      params.push(companyId);
    }

    if (filters.status && filters.status !== 'all') {
      where.push('is2.status = ?');
      params.push(filters.status);
    }

    if (filters.start_date) {
      where.push(`DATE(${scheduledAt}) >= ?`);
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      where.push(`DATE(${scheduledAt}) <= ?`);
      params.push(filters.end_date);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await this.pool.query(
      `SELECT
         ${this._normalizedScheduleSelect(columns)},
         a.status AS application_status,
         a.resume_url,
         a.applied_at,
         cand.id AS candidate_id,
         cand.current_job_title,
         cand.experience_years,
         cand.location AS candidate_location,
         u.id AS candidate_user_id,
         u.first_name,
         u.last_name,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS candidate_name,
         u.email AS candidate_email,
         u.phone AS candidate_phone,
         u.avatar_url,
         j.id AS job_id,
         j.title AS job_title,
         cp.id AS company_id,
         cp.company_name,
         creator.first_name AS creator_first_name,
         creator.last_name AS creator_last_name
       FROM interview_schedules is2
       JOIN applications a ON a.id = is2.application_id
       JOIN jobs j ON j.id = a.job_id
       JOIN company_profiles cp ON cp.id = j.company_id
       JOIN candidate_profiles cand ON cand.id = a.candidate_id
       JOIN users u ON u.id = cand.user_id
       LEFT JOIN users creator ON creator.id = ${createdBy}
       ${whereClause}
       ORDER BY ${scheduledAt} ASC, is2.id ASC`,
      params
    );
    return rows;
  }

  async findByCandidate(candidateId, filters = {}) {
    const columns = await this._ensureRuntimeCompatibility();
    const scheduledAt = this._scheduledAtExpression(columns);
    const where = ['cand.id = ?'];
    const params = [candidateId];

    if (filters.status && filters.status !== 'all') {
      where.push('is2.status = ?');
      params.push(filters.status);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const [rows] = await this.pool.query(
      `SELECT
         ${this._normalizedScheduleSelect(columns)},
         a.status AS application_status,
         a.id AS application_id,
         a.resume_url,
         a.applied_at,
         j.id AS job_id,
         j.title AS job_title,
         cp.id AS company_id,
         cp.company_name,
         cp.company_logo,
         u.id AS candidate_user_id,
         u.first_name,
         u.last_name,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS candidate_name
       FROM interview_schedules is2
       JOIN applications a ON a.id = is2.application_id
       JOIN jobs j ON j.id = a.job_id
       JOIN company_profiles cp ON cp.id = j.company_id
       JOIN candidate_profiles cand ON cand.id = a.candidate_id
       JOIN users u ON u.id = cand.user_id
       ${whereClause}
       ORDER BY ${scheduledAt} DESC, is2.id DESC`,
      params
    );
    return rows;
  }

  async findByIdWithDetails(id) {
    const columns = await this._ensureRuntimeCompatibility();
    const [rows] = await this.pool.query(
      `SELECT
         ${this._normalizedScheduleSelect(columns)},
         a.status AS application_status,
         a.resume_url,
         a.applied_at,
         cand.id AS candidate_id,
         cand.current_job_title,
         cand.experience_years,
         cand.location AS candidate_location,
         u.id AS candidate_user_id,
         u.first_name,
         u.last_name,
         TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS candidate_name,
         u.email AS candidate_email,
         u.phone AS candidate_phone,
         u.avatar_url,
         j.id AS job_id,
         j.title AS job_title,
         cp.id AS company_id,
         cp.company_name
       FROM interview_schedules is2
       JOIN applications a ON a.id = is2.application_id
       JOIN jobs j ON j.id = a.job_id
       JOIN company_profiles cp ON cp.id = j.company_id
       JOIN candidate_profiles cand ON cand.id = a.candidate_id
       JOIN users u ON u.id = cand.user_id
       WHERE is2.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Lấy lịch phỏng vấn gần nhất (round cao nhất = scheduled).
   */
  async findLatestByApplication(applicationId) {
    const columns = await this._ensureRuntimeCompatibility();
    const scheduledAt = this._scheduledAtExpression(columns);
    const [rows] = await this.pool.query(
      `SELECT ${this._normalizedScheduleSelect(columns)}
       FROM interview_schedules is2
       WHERE is2.application_id = ? AND is2.status = 'scheduled'
       ORDER BY ${scheduledAt} DESC LIMIT 1`,
      [applicationId]
    );
    return rows[0] || null;
  }

  /**
   * Cập nhật trạng thái lịch phỏng vấn (completed, cancelled, no_show).
   */
  async updateStatus(id, status) {
    await this._ensureRuntimeCompatibility();
    const [result] = await this.pool.query(
      'UPDATE interview_schedules SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  async bulkDeleteByCompany(companyId) {
    const [result] = await this.pool.query(
      `DELETE is FROM interview_schedules is
       JOIN applications a ON is.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = ?`,
      [companyId]
    );
    return result.affectedRows;
  }

  async bulkDeleteSavedJobsByCompany(companyId) {
    const [result] = await this.pool.query(
      `DELETE sj FROM saved_jobs sj
       JOIN jobs j ON sj.job_id = j.id
       WHERE j.company_id = ?`,
      [companyId]
    );
    return result.affectedRows;
  }

  async bulkDeleteSavedCompanies(companyId) {
    const [result] = await this.pool.query('DELETE FROM saved_companies WHERE company_id = ?', [
      companyId,
    ]);
    return result.affectedRows;
  }

  async bulkDeleteEmployerSavedCandidatesByCompany(companyId) {
    const [result] = await this.pool.query(
      'DELETE FROM employer_saved_candidates WHERE company_id = ?',
      [companyId]
    );
    return result.affectedRows;
  }
}

module.exports = new InterviewScheduleRepository();
module.exports.InterviewScheduleRepository = InterviewScheduleRepository;
