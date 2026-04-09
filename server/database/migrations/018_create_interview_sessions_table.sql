-- Migration 018: Bảng INTERVIEW_SESSIONS
-- Phiên luyện phỏng vấn AI

CREATE TABLE IF NOT EXISTS interview_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    session_type VARCHAR(50),
    topic VARCHAR(255),
    difficulty_level VARCHAR(20),
    status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
    overall_score DECIMAL(5,2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
