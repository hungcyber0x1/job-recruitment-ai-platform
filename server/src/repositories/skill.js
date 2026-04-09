const BaseRepository = require('./base');

class SkillRepository extends BaseRepository {
  constructor() {
    super('skills');
  }

  async findByName(name) {
    const [rows] = await this.pool.query('SELECT * FROM skills WHERE name = ?', [name]);
    return rows[0];
  }

  async findByCandidateId(candidateId) {
    const query = `
      SELECT s.* 
      FROM skills s
      JOIN candidate_skills cs ON s.id = cs.skill_id
      WHERE cs.candidate_id = ?
    `;
    const [rows] = await this.pool.query(query, [candidateId]);
    return rows;
  }

  async addSkillToCandidate(candidateId, skillId) {
    const query = 'INSERT IGNORE INTO candidate_skills (candidate_id, skill_id) VALUES (?, ?)';
    await this.pool.query(query, [candidateId, skillId]);
  }

  async removeSkillsFromCandidate(candidateId) {
    await this.pool.query('DELETE FROM candidate_skills WHERE candidate_id = ?', [candidateId]);
  }
}

module.exports = new SkillRepository();
