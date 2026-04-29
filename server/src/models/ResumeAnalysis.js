/**
 * Repository for AI Resume Analysis
 *
 * Table: ai_resume_analysis
 *
 * Cấu trúc mới:
 * - candidate_id: FK → candidate_profiles.id
 * - user_id: FK → users.id
 */

const { pool } = require('../config/database.config');

class ResumeAnalysisRepository {
  async create(data) {
    const {
      candidate_id,
      user_id,
      file_url,
      analysis_result,
      score,
      strengths,
      weaknesses,
      suggestions,
      analyzed_at,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO ai_resume_analysis (
        candidate_id, user_id, file_url, analysis_result, 
        score, strengths, weaknesses, suggestions, analyzed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidate_id,
        user_id,
        file_url || null,
        analysis_result ? JSON.stringify(analysis_result) : null,
        score || null,
        strengths || null,
        weaknesses || null,
        suggestions || null,
        analyzed_at || null,
      ]
    );

    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ra.*, cp.user_id as candidate_user_id
       FROM ai_resume_analysis ra
       JOIN candidate_profiles cp ON ra.candidate_id = cp.id
       WHERE ra.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return this._parseAnalysis(rows[0]);
  }

  async getLatest(candidateId) {
    const [rows] = await pool.query(
      `SELECT ra.*, cp.user_id as candidate_user_id
       FROM ai_resume_analysis ra
       JOIN candidate_profiles cp ON ra.candidate_id = cp.id
       WHERE ra.candidate_id = ?
       ORDER BY ra.created_at DESC 
       LIMIT 1`,
      [candidateId]
    );

    if (rows.length === 0) return null;
    return this._parseAnalysis(rows[0]);
  }

  async findByCandidate(candidateId) {
    const [rows] = await pool.query(
      `SELECT ra.*, cp.user_id as candidate_user_id
       FROM ai_resume_analysis ra
       JOIN candidate_profiles cp ON ra.candidate_id = cp.id
       WHERE ra.candidate_id = ? 
       ORDER BY ra.created_at DESC`,
      [candidateId]
    );

    return rows.map((row) => this._parseAnalysis(row));
  }

  async delete(id) {
    await pool.query('DELETE FROM ai_resume_analysis WHERE id = ?', [id]);
  }

  async deleteByCandidate(candidateId) {
    await pool.query('DELETE FROM ai_resume_analysis WHERE candidate_id = ?', [candidateId]);
  }

  async getTopCandidates(limit = 10) {
    const [rows] = await pool.query(
      `SELECT ra.*, cp.user_id, u.first_name, u.last_name, u.email
       FROM ai_resume_analysis ra
       JOIN candidate_profiles cp ON ra.candidate_id = cp.id
       JOIN users u ON cp.user_id = u.id
       ORDER BY ra.score DESC
       LIMIT ?`,
      [limit]
    );

    return rows.map((row) => this._parseAnalysis(row));
  }

  async getStatistics() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_analyses,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score
      FROM ai_resume_analysis
    `);

    return rows[0];
  }

  _parseAnalysis(row) {
    if (!row) return null;

    return {
      ...row,
      analysis_result: this._parseJSON(row.analysis_result),
      strengths: this._parseJSON(row.strengths),
      weaknesses: this._parseJSON(row.weaknesses),
      suggestions: this._parseJSON(row.suggestions),
    };
  }

  _parseJSON(field) {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return null;
      }
    }
    return field;
  }
}

module.exports = new ResumeAnalysisRepository();
