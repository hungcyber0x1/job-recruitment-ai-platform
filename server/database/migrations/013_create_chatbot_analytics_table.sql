-- Migration 013: Bảng CHATBOT_ANALYTICS
-- Thống kê hoạt động chatbot AI

CREATE TABLE IF NOT EXISTS chatbot_analytics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED,
    user_id INT UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
