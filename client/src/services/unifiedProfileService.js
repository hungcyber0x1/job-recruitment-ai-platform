/**
 * Unified Profile Service - Liên thông dữ liệu ứng viên
 *
 * Mục đích: Đảm bảo AI chatbot, job matching, CV parsing, application history
 * đều dùng chung một nguồn dữ liệu hồ sơ.
 *
 * Nguồn chuẩn: candidate profile (skills, experience, education, preferences)
 * được dùng bởi:
 *  - AI Career Assistant (chatbot, suggestions, CV tips)
 *  - Job Matching Engine (match score)
 *  - Application Service (auto-fill when applying)
 *  - Saved Jobs (behavior-based recommendations)
 */
import api from './api';

const unifiedProfileService = {

  // ─── Full unified profile ────────────────────────────────────────────
  /**
   * Lấy toàn bộ profile để dùng chung cho cả AI, matching và apply.
   * Đây là nguồn dữ liệu THỰC duy nhất.
   */
  getFullProfile: () => api.get('candidates/unified-profile'),

  // ─── AI-driven data extraction ────────────────────────────────────────
  /**
   * Parse CV → trích xuất skills, experience, education tự động.
   * Kết quả gắn vào profile thật.
   */
  parseCvToProfile: (cvId) => api.post('candidates/parse-cv', { cv_id: cvId }),

  /**
   * AI phân tích profile → gợi ý jobs.
   * Dùng cùng data source với khi apply.
   */
  getAiRecommendedJobs: () => api.get('candidates/ai-recommendations/jobs'),

  /**
   * AI phân tích CV theo job description → trả về score + tips.
   */
  matchCvToJob: (cvId, jobId) =>
    api.post('candidates/ai-recommendations/match-cv', { cv_id: cvId, job_id: jobId }),

  /**
   * AI tips tối ưu CV dựa trên job description.
   */
  getCvOptimizationTips: (jobId) =>
    api.get('candidates/ai-recommendations/cv-tips', { params: { job_id: jobId } }),

  // ─── Application auto-fill ─────────────────────────────────────────────
  /**
   * Lấy dữ liệu từ profile để điền sẵn khi apply.
   * Dùng data từ unified profile (skills, experience).
   */
  getApplicationDraft: (jobId) =>
    api.get('candidates/application-draft', { params: { job_id: jobId } }),

  /**
   * Lưu application draft (profile data đã được chọn).
   */
  saveApplicationDraft: (data) =>
    api.post('candidates/application-draft', data),

  // ─── Saved behavior & recommendations ─────────────────────────────────
  /**
   * Lưu hành vi ứng viên để cải thiện recommendations.
   * Dùng khi ứng viên click, save, apply hoặc dismiss job.
   */
  recordBehavior: (data) =>
    api.post('candidates/behavior', data),

  /**
   * Lấy recommended jobs dựa trên hành vi + profile.
   */
  getPersonalizedJobs: () =>
    api.get('candidates/personalized-jobs'),

  /**
   * Lấy salary range gợi ý dựa trên profile + market data.
   */
  getSalarySuggestion: (jobTitle, skills) =>
    api.post('candidates/salary-suggestion', { job_title: jobTitle, skills }),

  // ─── Interview preparation ─────────────────────────────────────────────
  /**
   * AI tạo danh sách câu hỏi phỏng vấn dựa trên job + profile.
   */
  getPredictedQuestions: (jobId) =>
    api.get('candidates/interview-prediction/questions', { params: { job_id: jobId } }),

  /**
   * AI đánh giá câu trả lời phỏng vấn practice.
   */
  evaluateInterviewAnswer: (questionId, answer) =>
    api.post('candidates/interview-prediction/evaluate', {
      question_id: questionId,
      answer,
    }),

};

export default unifiedProfileService;
