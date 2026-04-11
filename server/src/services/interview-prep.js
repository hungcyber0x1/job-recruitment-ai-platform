const AIService = require('./ai');
const InterviewSessionRepository = require('../models/InterviewSession');
const JobRepository = require('../models/Job');
const logger = require('../utils/logger');

/**
 * Service for AI-powered Interview Preparation
 * Mock interviews with AI-generated questions and feedback
 */
class InterviewPrepService {
  /**
   * Start a new interview session
   */
  async startSession(
    candidateId,
    sessionType = 'general',
    jobId = null,
    difficultyLevel = 'intermediate'
  ) {
    try {
      logger.info(`Starting interview session for candidate ${candidateId}, type: ${sessionType}`);

      const session = await InterviewSessionRepository.create({
        candidate_id: candidateId,
        job_id: jobId,
        session_type: sessionType,
        difficulty_level: difficultyLevel,
      });

      // Generate first question
      const firstQuestion = await this._generateNextQuestion(
        session.id,
        sessionType,
        difficultyLevel,
        1,
        jobId
      );

      return {
        session,
        firstQuestion,
      };
    } catch (error) {
      logger.error('Failed to start interview session:', error);
      throw new Error('Failed to start interview session');
    }
  }

  /**
   * Generate next interview question
   */
  async _generateNextQuestion(sessionId, sessionType, difficulty, questionNumber, jobId = null) {
    try {
      // Get job context if available
      let jobContext = '';
      if (jobId) {
        const job = await JobRepository.findById(jobId);
        if (job) {
          jobContext = `Job Title: ${job.title}\nJob Description: ${job.description?.substring(0, 300)}`;
        }
      }

      const prompt = `Generate an interview question:

Session Type: ${sessionType}
Difficulty: ${difficulty}
Question Number: ${questionNumber}
${jobContext ? `\n${jobContext}` : ''}

Generate a ${sessionType} interview question appropriate for ${difficulty} level.

Return ONLY valid JSON (no markdown):
{
  "question": "The interview question text",
  "category": "technical|behavioral|situational|problem_solving",
  "ideal_answer_points": ["point1", "point2", "point3"]
}`;

      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      const questionData = JSON.parse(cleanedResponse);

      // Save question to database
      const idealPoints = Array.isArray(questionData.ideal_answer_points)
        ? questionData.ideal_answer_points
        : [];

      const questionId = await InterviewSessionRepository.createQuestion(sessionId, {
        question_number: questionNumber,
        question_text: questionData.question,
        question_category: questionData.category || sessionType,
        difficulty: difficulty,
        ideal_answer_points: idealPoints,
      });

      return {
        id: questionId,
        question_number: questionNumber,
        question_text: questionData.question,
        category: questionData.category,
        ideal_answer_points: idealPoints,
      };
    } catch (error) {
      logger.error('Failed to generate question:', error);
      // Return a fallback question
      const fallbackQuestionId = await InterviewSessionRepository.createQuestion(sessionId, {
        question_number: questionNumber,
        question_text:
          'Tell me about a challenging project you worked on and how you overcame obstacles.',
        question_category: 'behavioral',
        difficulty: difficulty,
        ideal_answer_points: ['Context', 'Challenge', 'Actions taken', 'Results', 'Learnings'],
      });

      return {
        id: fallbackQuestionId,
        question_number: questionNumber,
        question_text:
          'Tell me about a challenging project you worked on and how you overcame obstacles.',
        category: 'behavioral',
        ideal_answer_points: ['Context', 'Challenge', 'Actions taken', 'Results', 'Learnings'],
      };
    }
  }

  /**
   * Submit answer and get AI feedback
   */
  async submitAnswer(questionId, answerText, timeTakenSeconds = 0) {
    try {
      logger.info(`Evaluating answer for question ${questionId}`);

      // Get question details
      const question = await InterviewSessionRepository.findQuestionById(questionId);

      if (!question) {
        throw new Error('Question not found');
      }

      // Get AI evaluation
      const evaluation = await this._evaluateAnswer(
        question.question_text,
        answerText,
        this._parseIdealAnswerPointsArray(question.ideal_answer_points)
      );

      // Save answer with feedback
      const answerId = await InterviewSessionRepository.createAnswer(questionId, {
        answer_text: answerText,
        ai_feedback: evaluation.feedback,
        score: evaluation.score,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        key_points_covered: evaluation.key_points_covered,
        time_taken_seconds: timeTakenSeconds,
      });

      return {
        id: answerId,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        key_points_covered: evaluation.key_points_covered,
      };
    } catch (error) {
      logger.error('Failed to evaluate answer:', error);
      throw new Error('Failed to evaluate answer');
    }
  }

  /**
   * Evaluate answer using AI
   */
  async _evaluateAnswer(questionText, answerText, idealPoints) {
    const prompt = `Evaluate this interview answer:

Question: ${questionText}

Ideal Answer Should Cover:
${idealPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Candidate's Answer:
${answerText}

Provide constructive feedback and a score. Return ONLY valid JSON (no markdown):
{
  "score": <0-10>,
  "feedback": "Overall constructive feedback (2-3 sentences)",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1 to improve", "area2 to improve"],
  "key_points_covered": ["point1", "point2"]
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      const evaluation = JSON.parse(cleanedResponse);

      return {
        score: evaluation.score || 5,
        feedback: evaluation.feedback || 'Thank you for your answer.',
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        key_points_covered: evaluation.key_points_covered || [],
      };
    } catch (error) {
      logger.error('AI evaluation failed:', error);
      // Return basic evaluation
      return {
        score: 6,
        feedback: 'Your answer has been recorded. Consider providing more specific examples.',
        strengths: ['Clear communication'],
        improvements: ['Add more specific examples', 'Elaborate on the impact'],
        key_points_covered: [],
      };
    }
  }

  /**
   * Get next question or complete session
   */
  async getNextQuestion(sessionId) {
    try {
      const session = await InterviewSessionRepository.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const questionCount = await InterviewSessionRepository.countQuestions(sessionId);

      // Limit to 10 questions per session
      if (questionCount >= 10) {
        return await this.completeSession(sessionId);
      }

      // Generate next question
      const nextQuestion = await this._generateNextQuestion(
        sessionId,
        session.session_type,
        session.difficulty_level,
        questionCount + 1,
        session.job_id
      );

      return {
        question: nextQuestion,
        isLastQuestion: questionCount + 1 >= 10,
      };
    } catch (error) {
      logger.error('Failed to get next question:', error);
      throw new Error('Failed to get next question');
    }
  }

  /**
   * Complete interview session
   */
  async completeSession(sessionId) {
    try {
      const questions = await InterviewSessionRepository.getSessionQuestions(sessionId);

      // Calculate average score
      const answeredQuestions = questions.filter((q) => q.score !== null);
      const avgScore =
        answeredQuestions.length > 0
          ? answeredQuestions.reduce((sum, q) => sum + parseFloat(q.score), 0) /
            answeredQuestions.length
          : 0;

      // Update session
      await InterviewSessionRepository.completeSession(sessionId, avgScore.toFixed(2));

      // Generate summary
      const summary = await this._generateSessionSummary(questions, avgScore);

      return {
        sessionId,
        status: 'completed',
        overall_score: avgScore.toFixed(2),
        total_questions: questions.length,
        questions_answered: answeredQuestions.length,
        summary,
      };
    } catch (error) {
      logger.error('Failed to complete session:', error);
      throw new Error('Failed to complete session');
    }
  }

  /**
   * Generate session summary with tips
   */
  async _generateSessionSummary(questions, avgScore) {
    const answeredQuestions = questions.filter((q) => q.answer_text);

    const prompt = `Analyze this interview performance:

Average Score: ${avgScore.toFixed(1)}/10
Questions Answered: ${answeredQuestions.length}

Performance Data:
${answeredQuestions
  .map(
    (q, i) => `
Q${i + 1}: ${q.question_text}
Score: ${q.score}/10
Feedback: ${q.ai_feedback}
`
  )
  .join('\n')}

Provide an overall assessment and top 3 improvement tips. Return ONLY valid JSON (no markdown):
{
  "overall_assessment": "2-3 sentences summarizing performance",
  "improvement_tips": [
    {"category": "communication|content|structure", "tip": "Specific tip"},
    {"category": "...", "tip": "..."},
    {"category": "...", "tip": "..."}
  ]
}`;

    try {
      const response = await AIService.generateContent(prompt);
      const cleanedResponse = this._cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.error('Failed to generate summary:', error);
      return {
        overall_assessment: `You completed ${answeredQuestions.length} questions with an average score of ${avgScore.toFixed(1)}/10.`,
        improvement_tips: [
          { category: 'content', tip: 'Provide more specific examples from your experience' },
          { category: 'structure', tip: 'Use the STAR method (Situation, Task, Action, Result)' },
          { category: 'communication', tip: 'Practice articulating your thoughts more clearly' },
        ],
      };
    }
  }

  /**
   * Get session history for candidate
   */
  async getSessionHistory(candidateId) {
    return await InterviewSessionRepository.findByCandidate(candidateId);
  }

  /**
   * Get session details with all Q&A
   */
  async getSessionDetails(sessionId) {
    const session = await InterviewSessionRepository.findById(sessionId);
    const questions = await InterviewSessionRepository.getSessionQuestions(sessionId);

    return {
      session,
      questions: questions.map((q) => ({
        ...q,
        ideal_answer_points: this._parseIdealAnswerPointsArray(q.ideal_answer_points),
      })),
    };
  }

  /**
   * Clean JSON response
   */
  _cleanJsonResponse(response) {
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    const jsonStart = cleaned.search(/[{[]/);
    const jsonEnd = cleaned.search(/[\]}]\s*$/) + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }

    return cleaned;
  }

  /**
   * Parse JSON safely
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

  /**
   * `ideal_answer_points` trong DB: JSON mảng chuỗi. Tránh crash khi JSON hỏng hoặc AI lưu object.
   */
  _parseIdealAnswerPointsArray(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const v = JSON.parse(field);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

module.exports = new InterviewPrepService();
