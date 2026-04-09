-- Migration 016: Bảng CAREER_PATHS
-- Lộ trình nghề nghiệp do AI gợi ý

CREATE TABLE IF NOT EXISTS career_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    current_role VARCHAR(255),
    target_role VARCHAR(255),
    timeline_months INT,
    milestones JSON,
    skills_to_acquire JSON,
    recommended_jobs JSON,
    intermediate_roles JSON,
    ai_confidence DECIMAL(5,2),
    notes TEXT,
    status ENUM('active', 'completed') DEFAULT 'active',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);
