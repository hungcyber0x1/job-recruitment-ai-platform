-- Migration 012: Bảng AI_PROMPTS
-- Mẫu câu hỏi gợi ý cho chatbot (bảng độc lập)

CREATE TABLE IF NOT EXISTS ai_prompts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    prompt_template TEXT NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
