const { pool } = require('../config/database.config');

/**
 * Repository for AI Resume Analysis
 * Handles CRUD operations for resume analysis results
 */
class ResumeAnalysisRepository {
  /**
   * Create new resume analysis result
   */
  async create(data) {
    const {
      candidate_id,
      resume_text,
      resume_url,
      resume_embedding,
      overall_score,
      skill_score,
      experience_score,
      education_score,
      strengths,
      weaknesses,
      skill_matches,
      suggestions,
      keywords,
      role_level,
      expires_at,
    } = data;

    await pool.query('UPDATE ai_resume_analysis SET is_current = 0 WHERE candidate_id = ?', [
      candidate_id,
    ]);

    const [result] = await pool.query(
      `INSERT INTO ai_resume_analysis (
                candidate_id, is_current, resume_text, resume_url, resume_embedding, 
                overall_score, skill_score, experience_score, education_score,
                strengths, weaknesses, skill_matches, suggestions, 
                keywords, role_level, expires_at
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate_id,
        resume_text,
        resume_url,
        resume_embedding ? JSON.stringify(resume_embedding) : null,
        overall_score,
        skill_score,
        experience_score,
        education_score,
        JSON.stringify(strengths),
        JSON.stringify(weaknesses),
        JSON.stringify(skill_matches),
        JSON.stringify(suggestions),
        JSON.stringify(keywords),
        role_level,
        expires_at,
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find analysis by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM ai_resume_analysis WHERE id = ?', [id]);

    if (rows.length === 0) return null;
    return this._parseAnalysis(rows[0]);
  }

  /**
   * Get latest analysis for a candidate
   */
  async getLatest(candidateId) {
    const [rows] = await pool.query(
      `SELECT * FROM ai_resume_analysis 
             WHERE candidate_id = ?
             ORDER BY is_current DESC, analyzed_at DESC 
             LIMIT 1`,
      [candidateId]
    );

    if (rows.length === 0) return null;
    return this._parseAnalysis(rows[0]);
  }

  /**
   * Get all analyses for a candidate
   */
  async findByCandidate(candidateId) {
    const [rows] = await pool.query(
      `SELECT * FROM ai_resume_analysis 
             WHERE candidate_id = ? 
             ORDER BY analyzed_at DESC`,
      [candidateId]
    );

    return rows.map((row) => this._parseAnalysis(row));
  }

  /**
   * Check if analysis exists and is still valid (not expired)
   */
  async hasValidAnalysis(candidateId) {
    const [rows] = await pool.query(
      `SELECT id FROM ai_resume_analysis 
             WHERE candidate_id = ?
             AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY is_current DESC, analyzed_at DESC
             LIMIT 1`,
      [candidateId]
    );

    return rows.length > 0;
  }

  /**
   * Delete analysis
   */
  async delete(id) {
    await pool.query('DELETE FROM ai_resume_analysis WHERE id = ?', [id]);
  }

  /**
   * Get top candidates by overall score
   */
  async getTopCandidates(limit = 10) {
    const [rows] = await pool.query(
      `SELECT ra.*, c.user_id, u.first_name, u.last_name, u.email
             FROM ai_resume_analysis ra
             JOIN candidates c ON ra.candidate_id = c.id
             JOIN users u ON c.user_id = u.id
             WHERE ra.is_current = 1
             ORDER BY ra.overall_score DESC
             LIMIT ?`,
      [limit]
    );

    return rows.map((row) => this._parseAnalysis(row));
  }

  /**
   * Search resumes by keywords
   */
  async searchByKeywords(keywords, limit = 20) {
    if (!keywords || keywords.length === 0) return [];
    const keywordConditions = keywords.map(() => 'keywords LIKE ?').join(' OR ');
    const keywordParams = keywords.map((k) => `%"${k}"%`);

    const [rows] = await pool.query(
      `SELECT DISTINCT ra.*, c.user_id, u.first_name, u.last_name
             FROM ai_resume_analysis ra
             JOIN candidates c ON ra.candidate_id = c.id
             JOIN users u ON c.user_id = u.id
             WHERE ra.is_current = 1 AND (${keywordConditions})
             ORDER BY ra.overall_score DESC
             LIMIT ?`,
      [...keywordParams, limit]
    );

    return rows.map((row) => this._parseAnalysis(row));
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const [rows] = await pool.query(`
            SELECT 
                COUNT(*) as total_analyses,
                AVG(overall_score) as avg_overall_score,
                AVG(skill_score) as avg_skill_score,
                AVG(experience_score) as avg_experience_score,
                AVG(education_score) as avg_education_score,
                MAX(overall_score) as max_score,
                MIN(overall_score) as min_score
            FROM ai_resume_analysis
        `);

    return rows[0];
  }

  /**
   * Parse JSON fields in analysis result
   */
  _parseAnalysis(row) {
    if (!row) return null;

    return {
      ...row,
      strengths: this._parseJSON(row.strengths),
      weaknesses: this._parseJSON(row.weaknesses),
      skill_matches: this._parseJSON(row.skill_matches),
      suggestions: this._parseJSON(row.suggestions),
      keywords: this._parseJSON(row.keywords),
    };
  }

  /**
   * Safely parse JSON field
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

module.exports = new ResumeAnalysisRepository();
