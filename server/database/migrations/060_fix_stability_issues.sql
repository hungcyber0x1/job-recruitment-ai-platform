-- Migration 060: Stability Fixes
-- Addresses missing columns and table inconsistencies identified in error logs

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Fix company_profiles: Ensure flagged and moderation_note exist
ALTER TABLE company_profiles ADD COLUMN flagged TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE company_profiles ADD COLUMN moderation_note TEXT NULL;

-- 2. Fix jobs: Ensure flagged column exists for admin moderation
ALTER TABLE jobs ADD COLUMN flagged TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Fix users: Ensure gender ENUM is correctly set up
ALTER TABLE users MODIFY COLUMN gender ENUM('male', 'female', 'other') NULL DEFAULT NULL;

-- 4. Ensure email_logs table exists (matching current model requirements)
CREATE TABLE IF NOT EXISTS email_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NULL,
    status ENUM('pending', 'sent', 'failed', 'opened', 'clicked') DEFAULT 'pending',
    sent_at DATETIME NULL,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_user (user_id),
    INDEX idx_email_type (email_type),
    INDEX idx_email_status (status),
    INDEX idx_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
