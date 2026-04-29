-- Migration 053: Company Members & Roles - Team Recruitment Management
-- Cho phép nhiều recruiter trong cùng một công ty
-- Với quyền khác nhau: owner, admin, recruiter

CREATE TABLE IF NOT EXISTS company_members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    role ENUM('owner', 'admin', 'recruiter') NOT NULL DEFAULT 'recruiter',
    -- Permissions
    can_post_job BOOLEAN NOT NULL DEFAULT TRUE,
    can_edit_job BOOLEAN NOT NULL DEFAULT TRUE,
    can_delete_job BOOLEAN NOT NULL DEFAULT FALSE,
    can_approve_job BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_applications BOOLEAN NOT NULL DEFAULT TRUE,
    can_manage_applications BOOLEAN NOT NULL DEFAULT TRUE,
    can_send_email BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_salary BOOLEAN NOT NULL DEFAULT FALSE,
    can_export_data BOOLEAN NOT NULL DEFAULT FALSE,
    -- Meta
    invited_by INT UNSIGNED,
    invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'pending_invite') DEFAULT 'active',
    UNIQUE KEY unique_company_user (company_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_company (company_id),
    FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật bảng jobs: thêm approved_by, approved_at cho approval workflow
ALTER TABLE jobs
ADD COLUMN approved_by INT UNSIGNED AFTER status,
ADD COLUMN approved_at DATETIME AFTER approved_by,
ADD COLUMN submitted_at DATETIME AFTER approved_at,
ADD COLUMN submission_notes TEXT AFTER submitted_at;

ALTER TABLE jobs
ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Bảng job_history: lưu lịch sử thay đổi JD
CREATE TABLE IF NOT EXISTS job_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'created|updated|status_changed|cloned|archived',
    old_values JSON,
    new_values JSON,
    notes TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job (job_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created (created_at),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng communication_audit: log tất cả email/message gửi
CREATE TABLE IF NOT EXISTS communication_audit (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED,
    job_id INT UNSIGNED,
    sent_by INT UNSIGNED NOT NULL,
    template_type ENUM('interview_invite', 'rejection', 'offer', 'custom', 'bulk') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body_preview TEXT,
    status ENUM('sent', 'failed', 'pending', 'bounced') DEFAULT 'pending',
    error_message TEXT,
    email_log_id INT UNSIGNED,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application (application_id),
    INDEX idx_sent_by (sent_by),
    INDEX idx_sent_at (sent_at),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật bảng application_history: thêm action cụ thể
ALTER TABLE application_history
MODIFY COLUMN action VARCHAR(100) NOT NULL COMMENT 'status_change|note_added|email_sent|schedule_interview|shortlisted|rejected|withdrawn|moved_stage',
ADD COLUMN old_values JSON AFTER notes,
ADD COLUMN new_values JSON AFTER old_values,
ADD COLUMN ip_address VARCHAR(45) AFTER new_values;
