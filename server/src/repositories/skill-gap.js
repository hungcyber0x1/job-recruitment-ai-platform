const { pool } = require('../config/database.config');

/**
 * Repository for Skill Gap Analysis
 */
class SkillGapRepository {
  async create(data) {
    const {
      candidate_id,
      job_id,
      target_role,
      required_skills,
      missing_skills,
      matching_skills,
      learning_paths,
      priority_score,
      estimated_learning_time_weeks,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO skill_gaps (
                candidate_id, job_id, target_role, required_skills,
                missing_skills, matching_skills, learning_paths,
                priority_score, estimated_learning_time_weeks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate_id,
        job_id,
        target_role,
        JSON.stringify(required_skills),
        JSON.stringify(missing_skills),
        JSON.stringify(matching_skills),
        JSON.stringify(learning_paths),
        priority_score,
        estimated_learning_time_weeks,
      ]
    );

    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM skill_gaps WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return this._parseGap(rows[0]);
  }

  async findByCandidate(candidateId) {
    const [rows] = await pool.query(
      `SELECT * FROM skill_gaps 
             WHERE candidate_id = ? 
             ORDER BY priority_score DESC, created_at DESC`,
      [candidateId]
    );

    return rows.map((row) => this._parseGap(row));
  }

  async findByJob(candidateId, jobId) {
    const [rows] = await pool.query(
      'SELECT * FROM skill_gaps WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (rows.length === 0) return null;
    return this._parseGap(rows[0]);
  }

  async update(id, data) {
    const { status, missing_skills, learning_paths } = data;

    await pool.query(
      `UPDATE skill_gaps 
             SET status = ?, missing_skills = ?, learning_paths = ?
             WHERE id = ?`,
      [status, JSON.stringify(missing_skills), JSON.stringify(learning_paths), id]
    );

    return this.findById(id);
  }

  _parseGap(row) {
    if (!row) return null;

    return {
      ...row,
      required_skills: this._parseJSON(row.required_skills),
      missing_skills: this._parseJSON(row.missing_skills),
      matching_skills: this._parseJSON(row.matching_skills),
      learning_paths: this._parseJSON(row.learning_paths),
    };
  }

  _parseJSON(field) {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return field;
  }
}

module.exports = new SkillGapRepository();
