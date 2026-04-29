-- Migration 052: Nâng cấp nhắn tin tuyển dụng ứng viên ↔ nhà tuyển dụng
-- - Điều kiện nhắn theo hồ sơ ứng tuyển / NTD chủ động / chat tự do
-- - File đính kèm CV/portfolio, trạng thái đã gửi/đã nhận/đã xem
-- - Lưu trữ/xóa mềm/chặn theo từng người tham gia
-- - Lọc theo tin tuyển dụng và bảo mật quyền đọc/gửi ở tầng dữ liệu

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS recruitment_conversations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NULL,
  job_id INT UNSIGNED NULL,
  candidate_user_id INT UNSIGNED NOT NULL,
  recruiter_user_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  conversation_type ENUM('application', 'recruiter_initiated', 'free_chat') NOT NULL DEFAULT 'application',
  initiated_by_user_id INT UNSIGNED NULL,
  status ENUM('active', 'closed', 'blocked') NOT NULL DEFAULT 'active',
  last_message_at DATETIME NULL,
  last_message_preview VARCHAR(500) NULL,
  last_read_candidate_at DATETIME NULL,
  last_read_recruiter_at DATETIME NULL,
  candidate_archived_at DATETIME NULL,
  recruiter_archived_at DATETIME NULL,
  candidate_deleted_at DATETIME NULL,
  recruiter_deleted_at DATETIME NULL,
  candidate_blocked_at DATETIME NULL,
  recruiter_blocked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_recruitment_conversation_application (application_id),
  INDEX idx_recruitment_conv_candidate (candidate_user_id, updated_at),
  INDEX idx_recruitment_conv_recruiter (recruiter_user_id, updated_at),
  INDEX idx_recruitment_conv_company (company_id, updated_at),
  INDEX idx_recruitment_conv_job (job_id, updated_at),
  INDEX idx_recruitment_conv_last_message (last_message_at),
  CONSTRAINT fk_recruitment_conv_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_recruitment_conv_candidate_user
    FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_recruiter_user
    FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_company
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_initiator
    FOREIGN KEY (initiated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recruitment_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NULL,
  sender_role ENUM('candidate', 'recruiter', 'admin', 'system') NOT NULL DEFAULT 'system',
  body TEXT NOT NULL,
  message_type ENUM('text', 'file', 'interview_invite', 'job_info', 'system') NOT NULL DEFAULT 'text',
  metadata JSON NULL,
  attachment_url VARCHAR(1000) NULL,
  attachment_name VARCHAR(255) NULL,
  attachment_mime VARCHAR(160) NULL,
  attachment_size INT UNSIGNED NULL,
  status ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent',
  delivered_at DATETIME NULL,
  seen_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recruitment_msg_conversation (conversation_id, created_at),
  INDEX idx_recruitment_msg_sender (sender_id, created_at),
  INDEX idx_recruitment_msg_status (status, created_at),
  CONSTRAINT fk_recruitment_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES recruitment_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_msg_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cho phép application_id rỗng khi NTD chủ động liên hệ hoặc bật chat tự do.
ALTER TABLE recruitment_conversations
  MODIFY COLUMN application_id INT UNSIGNED NULL;

-- Bổ sung các cột còn thiếu nếu DB đã có bảng recruitment_* từ phiên bản cũ.
SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'job_id') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN job_id INT UNSIGNED NULL AFTER application_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'conversation_type') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN conversation_type ENUM(''application'', ''recruiter_initiated'', ''free_chat'') NOT NULL DEFAULT ''application'' AFTER company_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'initiated_by_user_id') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN initiated_by_user_id INT UNSIGNED NULL AFTER conversation_type', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'candidate_archived_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN candidate_archived_at DATETIME NULL AFTER last_read_recruiter_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'recruiter_archived_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN recruiter_archived_at DATETIME NULL AFTER candidate_archived_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'candidate_deleted_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN candidate_deleted_at DATETIME NULL AFTER recruiter_archived_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'recruiter_deleted_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN recruiter_deleted_at DATETIME NULL AFTER candidate_deleted_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'candidate_blocked_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN candidate_blocked_at DATETIME NULL AFTER recruiter_deleted_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND COLUMN_NAME = 'recruiter_blocked_at') = 0,
  'ALTER TABLE recruitment_conversations ADD COLUMN recruiter_blocked_at DATETIME NULL AFTER candidate_blocked_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'attachment_url') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN attachment_url VARCHAR(1000) NULL AFTER metadata', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'attachment_name') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'attachment_mime') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN attachment_mime VARCHAR(160) NULL AFTER attachment_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'attachment_size') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN attachment_size INT UNSIGNED NULL AFTER attachment_mime', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'status') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN status ENUM(''sent'', ''delivered'', ''seen'') NOT NULL DEFAULT ''sent'' AFTER attachment_size', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'delivered_at') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN delivered_at DATETIME NULL AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND COLUMN_NAME = 'seen_at') = 0,
  'ALTER TABLE recruitment_messages ADD COLUMN seen_at DATETIME NULL AFTER delivered_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Chuẩn hóa ENUM sau khi các cột chắc chắn đã tồn tại.
ALTER TABLE recruitment_conversations
  MODIFY COLUMN conversation_type ENUM('application', 'recruiter_initiated', 'free_chat') NOT NULL DEFAULT 'application';

ALTER TABLE recruitment_conversations
  MODIFY COLUMN status ENUM('active', 'closed', 'blocked') NOT NULL DEFAULT 'active';

ALTER TABLE recruitment_messages
  MODIFY COLUMN message_type ENUM('text', 'file', 'interview_invite', 'job_info', 'system') NOT NULL DEFAULT 'text';

ALTER TABLE recruitment_messages
  MODIFY COLUMN status ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent';

-- Đồng bộ job_id cho các hội thoại ứng tuyển cũ.
UPDATE recruitment_conversations c
JOIN applications a ON a.id = c.application_id
SET c.job_id = a.job_id,
    c.conversation_type = 'application'
WHERE c.application_id IS NOT NULL
  AND c.job_id IS NULL;

-- Bổ sung index nếu chưa có.
SET @sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_conversations' AND INDEX_NAME = 'idx_recruitment_conv_job') = 0,
  'CREATE INDEX idx_recruitment_conv_job ON recruitment_conversations (job_id, updated_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recruitment_messages' AND INDEX_NAME = 'idx_recruitment_msg_status') = 0,
  'CREATE INDEX idx_recruitment_msg_status ON recruitment_messages (status, created_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
