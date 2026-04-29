-- Migration 051: Tạo bảng notifications cho notification center
-- Hỗ trợ tất cả roles: candidate, recruiter, admin

-- ============================================
-- BẢNG NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL COMMENT 'Người nhận thông báo',
    type ENUM(
        'application',      -- Thông báo ứng tuyển (candidate)
        'job',              -- Thông báo tin tuyển dụng (candidate)
        'interview',        -- Thông báo phỏng vấn (candidate, recruiter)
        'system',           -- Thông báo hệ thống (tất cả)
        'moderation',       -- Thông báo kiểm duyệt (admin)
        'company',          -- Thông báo công ty (recruiter, admin)
        'report',           -- Báo cáo vi phạm (admin)
        'job_expiring'      -- Tin sắp hết hạn (recruiter)
    ) NOT NULL DEFAULT 'system',
    category VARCHAR(50) DEFAULT NULL COMMENT 'Phân loại chi tiết: application_status, new_applicant, job_expiring, etc.',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSON DEFAULT NULL COMMENT 'Dữ liệu bổ sung: {application_id, job_id, company_id, etc.}',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_user_type_read (user_id, type, is_read),
    
    -- Foreign keys
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông báo cho tất cả roles';

-- ============================================
-- MIGRATE DỮ LIỆU CŨ (nếu có)
-- ============================================
-- Chuyển dữ liệu từ application_history sang notifications cho candidate
-- (Chỉ migrate những notification quan trọng, không phải tất cả)

-- Sau khi chạy migration này, application_history vẫn được giữ nguyên
-- để phục vụ cho audit trail

-- ============================================
-- INDEX BỔ SUNG
-- ============================================
CREATE INDEX idx_notifications_user_category ON notifications(user_id, category);
