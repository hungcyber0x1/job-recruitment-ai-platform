-- Migration 020: Bảng INTERVIEW_ANSWERS
-- Câu trả lời của ứng viên và đánh giá AI

CREATE TABLE IF NOT EXISTS interview_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    answer_text TEXT,
    ai_feedback TEXT,
    score DECIMAL(5,2),
    strengths TEXT,
    improvements TEXT,
    key_points_covered JSON,
    time_taken_seconds INT,
    FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
);
