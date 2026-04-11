/**
 * Candidate Model Schema — see migration 002_create_candidates_table.sql
 *
 * Cung cấp JSDoc type definitions cho hệ thống không dùng ORM.
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
 * @property {string} created_at - ISO timestamp
 * @property {string} updated_at - ISO timestamp
 */

/** Tên bảng trong database */
const TABLE_NAME = 'candidates';

module.exports = { TABLE_NAME };

const BaseRepository = require('./Base');

class CandidateRepository extends BaseRepository {
  constructor() {
    super('candidates');
  }

  async findByUserId(userId) {
    const query = `
      SELECT c.*, u.email, u.first_name, u.last_name, u.avatar_url 
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
    `;
    const [rows] = await this.pool.query(query, [userId]);
    return rows[0];
  }

  async findByIdWithSkills(candidateId) {
    const query = `
      SELECT c.*, u.email, u.first_name, u.last_name, u.avatar_url
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    const candidate = rows[0];

    if (!candidate) {
      return null;
    }

    const [skills] = await this.pool.query(
      `SELECT s.id, s.name, s.category, cs.proficiency, cs.years_experience
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

  /**
   * Fetch candidates with DB-level pagination (no full-table load).
   * Used by job matching to safely limit candidate pool.
   */
  async findAllPaginated({ limit = 100, offset = 0 } = {}) {
    const [rows] = await this.pool.query('SELECT * FROM candidates LIMIT ? OFFSET ?', [
      limit,
      offset,
    ]);
    return rows;
  }

  async syncSkills(candidateId, skillNames) {
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
      await this.pool.query(
        `INSERT INTO candidate_skills (candidate_id, skill_id, proficiency, years_experience)
         VALUES (?, ?, NULL, NULL)
         ON DUPLICATE KEY UPDATE skill_id = skill_id`,
        [candidateId, skillId]
      );
    }
  }
}

module.exports = new CandidateRepository();
