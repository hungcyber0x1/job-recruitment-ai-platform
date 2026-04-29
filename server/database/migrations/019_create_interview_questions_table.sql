-- Migration 019: Bảng INTERVIEW_QUESTIONS
-- Câu hỏi phỏng vấn do AI tạo trong từng phiên

CREATE TABLE IF NOT EXISTS interview_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL,
    question_number INT,
    question_text TEXT NOT NULL,
    question_category VARCHAR(100),
    difficulty VARCHAR(20),
    ideal_answer_points JSON,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);
