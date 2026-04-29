-- Migration 070: Recruitment messaging
-- Creates application-scoped conversations between candidates and recruiters.

SET NAMES utf8mb4;

ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'application',
    'job',
    'interview',
    'message',
    'system',
    'moderation',
    'company',
    'report',
    'job_expiring'
  ) NOT NULL DEFAULT 'system';

CREATE TABLE IF NOT EXISTS recruitment_conversations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  candidate_user_id INT UNSIGNED NOT NULL,
  recruiter_user_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
  last_message_at DATETIME NULL,
  last_message_preview VARCHAR(500) NULL,
  last_read_candidate_at DATETIME NULL,
  last_read_recruiter_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_recruitment_conversation_application (application_id),
  INDEX idx_recruitment_conv_candidate (candidate_user_id, updated_at),
  INDEX idx_recruitment_conv_recruiter (recruiter_user_id, updated_at),
  INDEX idx_recruitment_conv_company (company_id, updated_at),
  INDEX idx_recruitment_conv_last_message (last_message_at),
  CONSTRAINT fk_recruitment_conv_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_candidate_user
    FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_recruiter_user
    FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_conv_company
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recruitment_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NULL,
  sender_role ENUM('candidate', 'recruiter', 'admin', 'system') NOT NULL DEFAULT 'system',
  body TEXT NOT NULL,
  message_type ENUM('text', 'system') NOT NULL DEFAULT 'text',
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recruitment_msg_conversation (conversation_id, created_at),
  INDEX idx_recruitment_msg_sender (sender_id, created_at),
  CONSTRAINT fk_recruitment_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES recruitment_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_recruitment_msg_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
