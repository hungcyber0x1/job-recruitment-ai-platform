const { pool } = require('../config/database.config');

/**
 * Repository for Career Paths
 * Handles career development roadmaps and milestones
 */
class CareerPathRepository {
  /**
   * Create new career path
   */
  async create(data) {
    const {
      candidate_id,
      current_role,
      target_role,
      timeline_months,
      milestones,
      skills_to_acquire,
      recommended_jobs,
      intermediate_roles,
      ai_confidence,
      notes,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO career_paths (
                candidate_id, current_role, target_role, timeline_months,
                milestones, skills_to_acquire, recommended_jobs,
                intermediate_roles, ai_confidence, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate_id,
        current_role,
        target_role,
        timeline_months,
        JSON.stringify(milestones),
        JSON.stringify(skills_to_acquire),
        JSON.stringify(recommended_jobs),
        JSON.stringify(intermediate_roles),
        ai_confidence,
        notes,
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM career_paths WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return this._parsePath(rows[0]);
  }

  /**
   * Get latest active career path for candidate
   */
  async getLatest(candidateId) {
    const [rows] = await pool.query(
      `SELECT * FROM career_paths 
             WHERE candidate_id = ? AND status = 'active'
             ORDER BY generated_at DESC 
             LIMIT 1`,
      [candidateId]
    );

    if (rows.length === 0) return null;
    return this._parsePath(rows[0]);
  }

  /**
   * Get all career paths for candidate
   */
  async findByCandidate(candidateId) {
    const [rows] = await pool.query(
      'SELECT * FROM career_paths WHERE candidate_id = ? ORDER BY generated_at DESC',
      [candidateId]
    );

    return rows.map((row) => this._parsePath(row));
  }

  /**
   * Update career path
   */
  async update(id, data) {
    const ALLOWED_COLUMNS = [
      'current_role',
      'target_role',
      'timeline_months',
      'milestones',
      'skills_to_acquire',
      'recommended_jobs',
      'intermediate_roles',
      'ai_confidence',
      'notes',
      'status',
    ];
    const JSON_COLUMNS = [
      'milestones',
      'skills_to_acquire',
      'recommended_jobs',
      'intermediate_roles',
    ];
    const updates = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (!ALLOWED_COLUMNS.includes(key)) return;
      updates.push(`\`${key}\` = ?`);
      values.push(JSON_COLUMNS.includes(key) ? JSON.stringify(data[key]) : data[key]);
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);

    await pool.query(`UPDATE career_paths SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  /**
   * Mark as completed
   */
  async markCompleted(id) {
    await pool.query('UPDATE career_paths SET status = ?, completed_at = NOW() WHERE id = ?', [
      'completed',
      id,
    ]);
  }

  /**
   * Delete career path
   */
  async delete(id) {
    await pool.query('DELETE FROM career_paths WHERE id = ?', [id]);
  }

  _parsePath(row) {
    if (!row) return null;

    return {
      ...row,
      milestones: this._parseJSON(row.milestones),
      skills_to_acquire: this._parseJSON(row.skills_to_acquire),
      recommended_jobs: this._parseJSON(row.recommended_jobs),
      intermediate_roles: this._parseJSON(row.intermediate_roles),
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

module.exports = new CareerPathRepository();
