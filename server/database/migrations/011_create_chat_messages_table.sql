-- Migration 011: Bảng CHAT_MESSAGES
-- Tin nhắn trong cuộc hội thoại chatbot

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    conversation_id INT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT FALSE,
    attachment_url VARCHAR(255),
    attachment_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
