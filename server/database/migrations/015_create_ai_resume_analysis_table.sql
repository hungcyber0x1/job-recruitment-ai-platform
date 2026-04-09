-- Migration 015: Bảng AI_RESUME_ANALYSIS
-- Kết quả phân tích CV bằng AI

CREATE TABLE IF NOT EXISTS ai_resume_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    resume_text TEXT,
    resume_url VARCHAR(255),
    overall_score DECIMAL(5,2),
    skill_score DECIMAL(5,2),
    experience_score DECIMAL(5,2),
    education_score DECIMAL(5,2),
    strengths JSON,
    weaknesses JSON,
    skill_matches JSON,
    suggestions JSON,
    keywords JSON,
    role_level VARCHAR(50),
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
