-- Migration 021: TẠO INDEXES
-- Tăng tốc độ truy vấn cho các cột thường xuyên filter/search
-- Lưu ý: Nếu bảng đã có index, chạy lại sẽ báo lỗi ER_DUP_KEYNAME (bình thường)

-- Core: Jobs
CREATE INDEX idx_jobs_title      ON jobs(title);
CREATE INDEX idx_jobs_location   ON jobs(location);
CREATE INDEX idx_jobs_status     ON jobs(status);
CREATE INDEX idx_jobs_employer   ON jobs(employer_id);
CREATE INDEX idx_jobs_category   ON jobs(category_id);

-- Core: Applications
CREATE INDEX idx_apps_candidate  ON applications(candidate_id);
CREATE INDEX idx_apps_job        ON applications(job_id);
CREATE INDEX idx_apps_status     ON applications(status);

-- Core: Saved Jobs
CREATE INDEX idx_saved_candidate ON saved_jobs(candidate_id);

-- Chatbot
CREATE INDEX idx_conv_user       ON conversations(user_id);
CREATE INDEX idx_msg_conv        ON chat_messages(conversation_id);
CREATE INDEX idx_analytics_conv  ON chatbot_analytics(conversation_id);
CREATE INDEX idx_analytics_event ON chatbot_analytics(event_type);

-- AI Features
CREATE INDEX idx_match_score     ON ai_job_matches(match_score);
CREATE INDEX idx_resume_cand     ON ai_resume_analysis(candidate_id);
CREATE INDEX idx_career_cand     ON career_paths(candidate_id);
CREATE INDEX idx_gap_candidate   ON skill_gaps(candidate_id);

-- Interview
CREATE INDEX idx_interview_cand  ON interview_sessions(candidate_id);
CREATE INDEX idx_question_sess   ON interview_questions(session_id);

-- Full-text Search (tìm kiếm việc làm)
ALTER TABLE jobs ADD FULLTEXT INDEX ft_jobs_search (title, description);

