/**
 * InterviewScheduleRepository
 * Quản lý lịch phỏng vấn của từng đơn ứng tuyển.
 * Table: interview_schedules
 */
const BaseRepository = require('./Base');

class InterviewScheduleRepository extends BaseRepository {
  constructor() {
    super('interview_schedules');
  }

  /**
   * Tạo lịch phỏng vấn mới cho một application.
   * Tự động tính số vòng (round) dựa trên lịch hiện có.
   */
  async create({ application_id, interview_type, scheduled_at, duration_minutes, location, candidate_note, interviewer_note, created_by }) {
    const [countRows] = await this.pool.query(
      'SELECT COUNT(*) as cnt FROM interview_schedules WHERE application_id = ?',
      [application_id]
    );
    const round = (countRows[0].cnt || 0) + 1;

    const [result] = await this.pool.query(
      `INSERT INTO interview_schedules
        (application_id, round, interview_type, scheduled_at, duration_minutes, location, candidate_note, interviewer_note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [application_id, round, interview_type, scheduled_at, duration_minutes ?? 60, location ?? null, candidate_note ?? null, interviewer_note ?? null, created_by ?? null]
    );
    return this.findById(result.insertId);
  }

  /**
   * Lấy tất cả lịch phỏng vấn của một đơn, mới nhất trước.
   */
  async findByApplication(applicationId) {
    const [rows] = await this.pool.query(
      `SELECT is2.*, u.first_name, u.last_name
       FROM interview_schedules is2
       LEFT JOIN users u ON is2.created_by = u.id
       WHERE is2.application_id = ?
       ORDER BY is2.scheduled_at DESC`,
      [applicationId]
    );
    return rows;
  }

  /**
   * Lấy toàn bộ lịch phỏng vấn của một công ty tuyển dụng.
   * Admin có thể truyền isAdmin=true để xem toàn hệ thống.
   */
  async findByCompany(companyId, filters = {}, isAdmin = false) {
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
      where.push('DATE(is2.scheduled_at) >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      where.push('DATE(is2.scheduled_at) <= ?');
      params.push(filters.end_date);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await this.pool.query(
      `SELECT
         is2.*,
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
       LEFT JOIN users creator ON creator.id = is2.created_by
       ${whereClause}
       ORDER BY is2.scheduled_at ASC, is2.id ASC`,
      params
    );
    return rows;
  }

  async findByCandidate(candidateId, filters = {}) {
    const where = ['cand.id = ?'];
    const params = [candidateId];

    if (filters.status && filters.status !== 'all') {
      where.push('is2.status = ?');
      params.push(filters.status);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const [rows] = await this.pool.query(
      `SELECT
         is2.*,
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
       ORDER BY is2.scheduled_at DESC, is2.id DESC`,
      params
    );
    return rows;
  }

  async findByIdWithDetails(id) {
    const [rows] = await this.pool.query(
      `SELECT
         is2.*,
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
    const [rows] = await this.pool.query(
      `SELECT * FROM interview_schedules
       WHERE application_id = ? AND status = 'scheduled'
       ORDER BY scheduled_at DESC LIMIT 1`,
      [applicationId]
    );
    return rows[0] || null;
  }

  /**
   * Cập nhật trạng thái lịch phỏng vấn (completed, cancelled, no_show).
   */
  async updateStatus(id, status) {
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
    const [result] = await this.pool.query(
      'DELETE FROM saved_companies WHERE company_id = ?',
      [companyId]
    );
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
