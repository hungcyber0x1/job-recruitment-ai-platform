const { pool } = require('../config/database.config');

/**
 * Repository for Interview Preparation Sessions
 */
class InterviewSessionRepository {
  async create(data) {
    const { candidate_id, session_type, difficulty_level } = data;

    const [result] = await pool.query(
      `INSERT INTO interview_sessions (
                candidate_id, session_type, difficulty_level
            ) VALUES (?, ?, ?)`,
      [candidate_id, session_type, difficulty_level]
    );

    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM interview_sessions WHERE id = ?', [id]);

    return rows.length > 0 ? rows[0] : null;
  }

  async findByCandidate(candidateId) {
    const [rows] = await pool.query(
      `SELECT * FROM interview_sessions 
             WHERE candidate_id = ? 
             ORDER BY started_at DESC`,
      [candidateId]
    );

    return rows;
  }

  async update(id, data) {
    const ALLOWED_COLUMNS = [
      'session_type',
      'difficulty_level',
      'status',
      'overall_score',
      'completed_at',
      'feedback',
      'notes',
    ];
    const updates = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (!ALLOWED_COLUMNS.includes(key)) return;
      updates.push(`\`${key}\` = ?`);
      values.push(data[key]);
    });

    if (updates.length === 0) return this.findById(id);

    values.push(id);

    await pool.query(`UPDATE interview_sessions SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async completeSession(id, overallScore) {
    await pool.query(
      `UPDATE interview_sessions 
             SET status = 'completed', overall_score = ?, completed_at = NOW()
             WHERE id = ?`,
      [overallScore, id]
    );
  }

  // Interview Q&A methods
  async createQuestion(sessionId, questionData) {
    const { question_number, question_text, question_category, difficulty, ideal_answer_points } =
      questionData;

    const [result] = await pool.query(
      `INSERT INTO interview_questions (
                session_id, question_number, question_text, 
                question_category, difficulty, ideal_answer_points
            ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        question_number,
        question_text,
        question_category,
        difficulty,
        JSON.stringify(ideal_answer_points),
      ]
    );

    return result.insertId;
  }

  async createAnswer(questionId, answerData) {
    const {
      answer_text,
      ai_feedback,
      score,
      strengths,
      improvements,
      key_points_covered,
      time_taken_seconds,
    } = answerData;

    const [result] = await pool.query(
      `INSERT INTO interview_answers (
                question_id, answer_text, ai_feedback, score,
                strengths, improvements, key_points_covered, time_taken_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionId,
        answer_text,
        ai_feedback,
        score,
        JSON.stringify(strengths),
        JSON.stringify(improvements),
        JSON.stringify(key_points_covered),
        time_taken_seconds,
      ]
    );

    return result.insertId;
  }

  async getSessionQuestions(sessionId) {
    const [questions] = await pool.query(
      `SELECT q.*, a.answer_text, a.score, a.ai_feedback
             FROM interview_questions q
             LEFT JOIN interview_answers a ON q.id = a.question_id
             WHERE q.session_id = ?
             ORDER BY q.question_number`,
      [sessionId]
    );

    return questions;
  }

  async countQuestions(sessionId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM interview_questions WHERE session_id = ?',
      [sessionId]
    );

    return rows[0].count;
  }

  async findQuestionById(questionId) {
    const [rows] = await pool.query(
      `SELECT q.*, a.answer_text, a.score, a.ai_feedback
       FROM interview_questions q
       LEFT JOIN interview_answers a ON q.id = a.question_id
       WHERE q.id = ?
       LIMIT 1`,
      [questionId]
    );

    return rows[0] || null;
  }
}

module.exports = new InterviewSessionRepository();
