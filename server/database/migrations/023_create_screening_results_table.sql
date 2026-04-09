-- Migration 023: Thêm bảng lưu kết quả sàng lọc sơ bộ bằng AI
CREATE TABLE IF NOT EXISTS screening_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    ai_score INT, -- 0-100
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
