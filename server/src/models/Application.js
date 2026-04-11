/**
 * Application Model Schema — see migration 006_create_applications_table.sql
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
 */

/**
 * @typedef {Object} ApplicationRow
 * @property {number} id - Primary key, auto-increment
 * @property {number} candidate_id - FK → candidates.id
 * @property {number} job_id - FK → jobs.id
 * @property {string|null} resume_url - Đường dẫn CV đã upload
 * @property {string|null} cover_letter - Thư giới thiệu
 * @property {'pending'|'screening'|'shortlisted'|'interviewing'|'offered'|'hired'|'rejected'} status - Trạng thái
 * @property {string} applied_at - ISO timestamp
 */

/** Danh sách trạng thái pipeline */
const APPLICATION_STATUSES = [
  'pending',
  'screening',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
];

/** Tên bảng trong database */
const TABLE_NAME = 'applications';

module.exports = { APPLICATION_STATUSES, TABLE_NAME };

const BaseRepository = require('./Base');

class ApplicationRepository extends BaseRepository {
  constructor() {
    super('applications');
  }

  async findAll(filters = {}) {
    let query = `
      SELECT a.*, 
             CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
             u.email as candidate_email,
             j.title as job_title, j.type as employment_type,
             e.company_name
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR j.title LIKE ? OR e.company_name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters.status && filters.status !== 'all') {
      query += ` AND a.status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY a.applied_at DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ` OFFSET ?`;
      params.push(parseInt(filters.offset));
    }

    const [rows] = await this.pool.query(query, params);
    return rows;
  }

  async findByJobId(jobId) {
    const query = `
      SELECT a.*, c.bio, u.first_name, u.last_name, u.email, u.avatar_url
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE a.job_id = ?
    `;
    const [rows] = await this.pool.query(query, [jobId]);
    return rows;
  }

  async findByCandidateId(candidateId) {
    const query = `
      SELECT a.*, j.title as job_title, j.location, j.type as employment_type, e.company_name, e.company_logo
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }

  async findCandidateApplicationById(applicationId, candidateId) {
    const query = `
      SELECT a.*,
             j.title as job_title,
             j.description as job_description,
             j.location,
             j.type as employment_type,
             j.salary_min,
             j.salary_max,
             j.deadline,
             j.id as job_id,
             e.company_name,
             e.company_logo
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE a.id = ? AND a.candidate_id = ?
    `;
    const [rows] = await this.pool.query(query, [applicationId, candidateId]);
    return rows[0] || null;
  }

  async findByIdWithDetails(id) {
    const query = `
      SELECT a.*, 
             c.bio, c.experience, c.education,
             CONCAT(u.first_name, ' ', u.last_name) as candidate_name,
             u.email as candidate_email,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.address as location,
             j.title as job_title, j.employer_id, j.type as employment_type
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `;
    const [rows] = await this.pool.query(query, [id]);
    const application = rows[0];

    if (!application) return null;

    const [skills] = await this.pool.query(
      `SELECT s.id, s.name, s.category, cs.proficiency, cs.years_experience
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
        'SELECT status, score FROM applications WHERE id = ?',
        [id]
      );
      const oldStatus = oldRows[0]?.status;

      let updateQuery = 'UPDATE applications SET status = ?';
      const updateParams = [status];

      if (data && data.score !== undefined) {
        updateQuery += ', score = ?';
        updateParams.push(data.score);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(id);

      await connection.query(updateQuery, updateParams);

      await connection.query(
        'INSERT INTO application_history (application_id, changed_by, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)',
        [id, changedBy, oldStatus, status, notes]
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

  async getHistory(id) {
    const query = `
      SELECT h.*, u.first_name, u.last_name
      FROM application_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.application_id = ?
      ORDER BY h.created_at DESC
    `;
    const [rows] = await this.pool.query(query, [id]);
    return rows;
  }

  async addHistoryNote(applicationId, changedBy, currentStatus, notes) {
    const [result] = await this.pool.query(
      'INSERT INTO application_history (application_id, changed_by, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)',
      [applicationId, changedBy, currentStatus, currentStatus, notes]
    );

    const [rows] = await this.pool.query(
      `
        SELECT h.*, u.first_name, u.last_name
        FROM application_history h
        LEFT JOIN users u ON h.changed_by = u.id
        WHERE h.id = ?
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
          CONCAT('Bạn đã ứng tuyển vị trí "', j.title, '" tại ', e.company_name, '.') as message,
          a.applied_at as created_at,
          a.id as application_id,
          a.status as status,
          j.title as job_title,
          e.company_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN employers e ON j.employer_id = e.id
        WHERE a.candidate_id = ?

        UNION ALL

        SELECT
          CONCAT('history-', h.id) as id,
          'application' as type,
          CONCAT('Trạng thái hồ sơ: ', h.new_status) as title,
          COALESCE(
            h.notes,
            CONCAT('Hồ sơ "', j.title, '" tại ', e.company_name, ' đã được cập nhật sang ', h.new_status, '.')
          ) as message,
          h.created_at as created_at,
          a.id as application_id,
          h.new_status as status,
          j.title as job_title,
          e.company_name
        FROM application_history h
        JOIN applications a ON h.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        JOIN employers e ON j.employer_id = e.id
        WHERE a.candidate_id = ?
      ) notifications
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const [rows] = await this.pool.query(query, [candidateId, candidateId, parseInt(limit, 10)]);
    return rows;
  }

  async addScreeningResult(applicationId, question, answer = null, score = null, feedback = null) {
    await this.pool.query(
      'INSERT INTO screening_results (application_id, question_text, answer_text, ai_score, ai_feedback) VALUES (?, ?, ?, ?, ?)',
      [applicationId, question, answer, score, feedback]
    );

    if (score !== null) {
      await this.pool.query('UPDATE applications SET score = ? WHERE id = ?', [
        score,
        applicationId,
      ]);
    }
  }

  async getScreeningResults(applicationId) {
    const [rows] = await this.pool.query(
      'SELECT * FROM screening_results WHERE application_id = ? ORDER BY created_at ASC',
      [applicationId]
    );
    return rows;
  }
}

module.exports = new ApplicationRepository();
