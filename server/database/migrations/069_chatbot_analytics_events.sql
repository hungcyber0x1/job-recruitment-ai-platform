-- Migration 069: Bảng CHATBOT_ANALYTICS_EVENTS
-- Ghi nhận sự kiện chi tiết cho phân tích chatbot (cấp message/event, không phải cấp ngày)
-- Migrations đã chạy thủ công:
--   1. ALTER TABLE chatbot_analytics ADD COLUMN conversation_id INT UNSIGNED NULL AFTER id
--   2. CREATE TABLE chatbot_analytics_events (...)

-- Bổ sung cột conversation_id vào chatbot_analytics (nếu chưa có)
ALTER TABLE chatbot_analytics ADD COLUMN conversation_id INT UNSIGNED NULL AFTER id;

-- Tạo bảng ghi sự kiện chi tiết
CREATE TABLE IF NOT EXISTS chatbot_analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NULL,
    session_id VARCHAR(64) NULL,
    user_id INT UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT 'message_sent, message_received, intent_detected, file_uploaded, conversation_created, message_feedback, ai_boundary_warning, summarization_triggered, rate_limit_exceeded',
    event_data JSON NULL COMMENT 'Dữ liệu bổ sung cho từng loại sự kiện',
    message_id INT UNSIGNED NULL COMMENT 'ID của tin nhắn liên quan (nếu có)',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_events_session (session_id),
    INDEX idx_events_conv (conversation_id),
    INDEX idx_events_user (user_id),
    INDEX idx_events_type (event_type),
    INDEX idx_events_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
