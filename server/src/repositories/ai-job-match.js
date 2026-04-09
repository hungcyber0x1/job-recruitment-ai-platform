const { pool } = require('../config/database.config');

/**
 * Repository for AI Job Matching
 * Handles job-candidate matching scores and recommendations
 */
class AIJobMatchRepository {
  /**
   * Create or update job match
   */
  async upsert(data) {
    const {
      candidate_id,
      job_id,
      match_score,
      skill_match_score,
      experience_match_score,
      education_match_score,
      location_match_score,
      matching_skills,
      missing_skills,
      extra_skills,
      recommendation_reason,
      strengths,
      concerns,
      recommendation_type,
      expires_at,
    } = data;

    // Try to update first
    const [updateResult] = await pool.query(
      `UPDATE ai_job_matches SET
                match_score = ?,
                skill_match_score = ?,
                experience_match_score = ?,
                education_match_score = ?,
                location_match_score = ?,
                matching_skills = ?,
                missing_skills = ?,
                extra_skills = ?,
                recommendation_reason = ?,
                strengths = ?,
                concerns = ?,
                recommendation_type = ?,
                calculated_at = NOW(),
                expires_at = ?
             WHERE candidate_id = ? AND job_id = ?`,
      [
        match_score,
        skill_match_score,
        experience_match_score,
        education_match_score,
        location_match_score,
        JSON.stringify(matching_skills),
        JSON.stringify(missing_skills),
        JSON.stringify(extra_skills),
        recommendation_reason,
        JSON.stringify(strengths),
        JSON.stringify(concerns),
        recommendation_type,
        expires_at,
        candidate_id,
        job_id,
      ]
    );

    if (updateResult.affectedRows > 0) {
      return this.findMatch(candidate_id, job_id);
    }

    // Insert if no update
    const [insertResult] = await pool.query(
      `INSERT INTO ai_job_matches (
                candidate_id, job_id, match_score, skill_match_score,
                experience_match_score, education_match_score, location_match_score,
                matching_skills, missing_skills, extra_skills,
                recommendation_reason, strengths, concerns,
                recommendation_type, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate_id,
        job_id,
        match_score,
        skill_match_score,
        experience_match_score,
        education_match_score,
        location_match_score,
        JSON.stringify(matching_skills),
        JSON.stringify(missing_skills),
        JSON.stringify(extra_skills),
        recommendation_reason,
        JSON.stringify(strengths),
        JSON.stringify(concerns),
        recommendation_type,
        expires_at,
      ]
    );

    return this.findById(insertResult.insertId);
  }

  /**
   * Find match by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM ai_job_matches WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return this._parseMatch(rows[0]);
  }

  /**
   * Find specific candidate-job match
   */
  async findMatch(candidateId, jobId) {
    const [rows] = await pool.query(
      'SELECT * FROM ai_job_matches WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (rows.length === 0) return null;
    return this._parseMatch(rows[0]);
  }

  /**
   * Get all matches for a candidate (sorted by score)
   */
  async findByCandidate(candidateId, limit = 20) {
    const [rows] = await pool.query(
      `SELECT m.*, j.title, j.type, j.location, j.salary_min, j.salary_max,
                    e.company_name, e.company_logo
             FROM ai_job_matches m
             JOIN jobs j ON m.job_id = j.id
             JOIN employers e ON j.employer_id = e.id
             WHERE m.candidate_id = ? AND j.status = 'published' AND j.deleted_at IS NULL
             ORDER BY m.match_score DESC
             LIMIT ?`,
      [candidateId, limit]
    );

    return rows.map((row) => this._parseMatch(row));
  }

  /**
   * Get all matches for a job (sorted by score)
   */
  async findByJob(jobId, limit = 50) {
    const [rows] = await pool.query(
      `SELECT m.*, c.id as candidate_id, c.current_job_title,
                    u.first_name, u.last_name, u.email, u.avatar_url,
                    c.experience_years, c.location
             FROM ai_job_matches m
             JOIN candidates c ON m.candidate_id = c.id
             JOIN users u ON c.user_id = u.id
             WHERE m.job_id = ?
             ORDER BY m.match_score DESC
             LIMIT ?`,
      [jobId, limit]
    );

    return rows.map((row) => this._parseMatch(row));
  }

  /**
   * Get top matches for a candidate by recommendation type
   */
  async getTopRecommendations(candidateId, type = 'perfect_match', limit = 10) {
    const [rows] = await pool.query(
      `SELECT m.*, j.title, j.description, j.type, j.location,
                    e.company_name, e.company_logo
             FROM ai_job_matches m
             JOIN jobs j ON m.job_id = j.id
             JOIN employers e ON j.employer_id = e.id
             WHERE m.candidate_id = ? 
             AND m.recommendation_type = ?
             AND j.status = 'published' AND j.deleted_at IS NULL
             ORDER BY m.match_score DESC
             LIMIT ?`,
      [candidateId, type, limit]
    );

    return rows.map((row) => this._parseMatch(row));
  }

  /**
   * Check if valid (non-expired) match exists
   */
  async hasValidMatch(candidateId, jobId) {
    const [rows] = await pool.query(
      `SELECT id FROM ai_job_matches 
             WHERE candidate_id = ? AND job_id = ?
             AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1`,
      [candidateId, jobId]
    );

    return rows.length > 0;
  }

  /**
   * Delete match
   */
  async delete(candidateId, jobId) {
    await pool.query('DELETE FROM ai_job_matches WHERE candidate_id = ? AND job_id = ?', [
      candidateId,
      jobId,
    ]);
  }

  /**
   * Delete all matches for a candidate
   */
  async deleteByCandidate(candidateId) {
    await pool.query('DELETE FROM ai_job_matches WHERE candidate_id = ?', [candidateId]);
  }

  /**
   * Delete expired matches
   */
  async deleteExpired() {
    const [result] = await pool.query('DELETE FROM ai_job_matches WHERE expires_at < NOW()');
    return result.affectedRows;
  }

  /**
   * Get match statistics for a candidate
   */
  async getCandidateStats(candidateId) {
    const [rows] = await pool.query(
      `
            SELECT 
                COUNT(*) as total_matches,
                AVG(match_score) as avg_match_score,
                MAX(match_score) as best_match_score,
                SUM(CASE WHEN recommendation_type = 'perfect_match' THEN 1 ELSE 0 END) as perfect_matches,
                SUM(CASE WHEN recommendation_type = 'strong_match' THEN 1 ELSE 0 END) as strong_matches
            FROM ai_job_matches
            WHERE candidate_id = ?
        `,
      [candidateId]
    );

    return rows[0];
  }

  /**
   * Parse JSON fields
   */
  _parseMatch(row) {
    if (!row) return null;

    return {
      ...row,
      matching_skills: this._parseJSON(row.matching_skills),
      missing_skills: this._parseJSON(row.missing_skills),
      extra_skills: this._parseJSON(row.extra_skills),
      strengths: this._parseJSON(row.strengths),
      concerns: this._parseJSON(row.concerns),
    };
  }

  /**
   * Safely parse JSON
   */
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

module.exports = new AIJobMatchRepository();
