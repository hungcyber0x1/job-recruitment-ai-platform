-- Migration: 068_chatbot_daily_quotas
-- Per-user daily message quotas for the chatbot

CREATE TABLE IF NOT EXISTS chatbot_daily_quotas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    quota_date DATE NOT NULL,
    messages_used INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, quota_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chatbot_quotas_date ON chatbot_daily_quotas(quota_date);
CREATE INDEX idx_chatbot_quotas_user ON chatbot_daily_quotas(user_id);
