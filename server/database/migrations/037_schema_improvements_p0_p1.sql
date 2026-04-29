-- Migration 037: Cải tiến schema (P0–P1)
-- - application_history.changed_by: NULL + ON DELETE SET NULL
-- - blog_posts.author_user_id: NULL + ON DELETE SET NULL
-- - Soft delete: users.deleted_at, jobs.deleted_at
-- - candidate_skills: proficiency, years_experience
-- - job_skills (N:N jobs ↔ skills)
-- - ai_resume_analysis.is_current + index
-- - conversations.application_id → applications
-- - applications.score → DECIMAL(5,2)
-- - Chỉ mục tổ hợp cho truy vấn thường gặp

SET NAMES utf8mb4;

-- ========== application_history: FK changed_by SET NULL ==========
SET @fk_ah := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'application_history'
    AND COLUMN_NAME = 'changed_by'
    AND REFERENCED_TABLE_NAME = 'users'
  LIMIT 1
);
SET @sql_ah := IF(
  @fk_ah IS NOT NULL,
  CONCAT('ALTER TABLE application_history DROP FOREIGN KEY `', @fk_ah, '`'),
  'SELECT 1'
);
PREPARE stmt_ah FROM @sql_ah;
EXECUTE stmt_ah;
DEALLOCATE PREPARE stmt_ah;

ALTER TABLE application_history MODIFY COLUMN changed_by INT UNSIGNED NULL;

ALTER TABLE application_history
  ADD CONSTRAINT fk_application_history_changed_by
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========== blog_posts: giữ bài khi xóa user (tác giả NULL) ==========
ALTER TABLE blog_posts DROP FOREIGN KEY fk_blog_author_user;

ALTER TABLE blog_posts MODIFY COLUMN author_user_id INT UNSIGNED NULL;

ALTER TABLE blog_posts
  ADD CONSTRAINT fk_blog_author_user FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ========== Soft delete ==========
ALTER TABLE users
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Xóa mềm tài khoản' AFTER updated_at,
  ADD INDEX idx_users_deleted_at (deleted_at);

ALTER TABLE jobs
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Xóa mềm tin tuyển dụng' AFTER updated_at,
  ADD INDEX idx_jobs_deleted_at (deleted_at);

-- ========== candidate_skills: mức độ / số năm ==========
ALTER TABLE candidate_skills
  ADD COLUMN proficiency VARCHAR(50) NULL DEFAULT NULL COMMENT 'VD: beginner, intermediate, advanced' AFTER skill_id,
  ADD COLUMN years_experience INT NULL DEFAULT NULL COMMENT 'Số năm kinh nghiệm kỹ năng' AFTER proficiency;

-- ========== job_skills: kỹ năng yêu cầu theo tin ==========
CREATE TABLE IF NOT EXISTS job_skills (
  job_id INT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = bắt buộc, 0 = ưu tiên',
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_job_skills_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== ai_resume_analysis: bản phân tích hiện tại ==========
ALTER TABLE ai_resume_analysis
  ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = bản mới nhất dùng cho matching' AFTER candidate_id,
  ADD INDEX idx_resume_candidate_current (candidate_id, is_current);

UPDATE ai_resume_analysis SET is_current = 0;

UPDATE ai_resume_analysis ra
INNER JOIN (
  SELECT candidate_id, MAX(id) AS max_id FROM ai_resume_analysis GROUP BY candidate_id
) latest ON ra.id = latest.max_id
SET ra.is_current = 1;

-- ========== conversations: gắn đơn ứng tuyển (tùy chọn) ==========
ALTER TABLE conversations
  ADD COLUMN application_id INT UNSIGNED NULL DEFAULT NULL AFTER user_id,
  ADD INDEX idx_conversations_application (application_id),
  ADD CONSTRAINT fk_conversations_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL;

-- ========== applications.score: đồng nhất với điểm AI ==========
ALTER TABLE applications MODIFY COLUMN score DECIMAL(5,2) NULL DEFAULT NULL;

-- ========== Chỉ mục tổ hợp ==========
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at);
CREATE INDEX idx_jobs_employer_status ON jobs (employer_id, status);
CREATE INDEX idx_apps_job_status ON applications (job_id, status);
CREATE INDEX idx_apps_candidate_applied ON applications (candidate_id, applied_at);
CREATE INDEX idx_chat_msg_conv_created ON chat_messages (conversation_id, created_at);