const BaseRepository = require('./base');

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
