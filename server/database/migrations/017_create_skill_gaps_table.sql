-- Migration 017: Bảng SKILL_GAPS
-- Phân tích khoảng cách kỹ năng giữa ứng viên và yêu cầu công việc

CREATE TABLE IF NOT EXISTS skill_gaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    job_id INT,
    target_role VARCHAR(255),
    required_skills JSON,
    missing_skills JSON,
    matching_skills JSON,
    learning_paths JSON,
    priority_score DECIMAL(5,2),
    estimated_learning_time_weeks INT,
    status ENUM('active', 'in_progress', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);
