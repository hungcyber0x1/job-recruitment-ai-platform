-- Migration 014: Bảng AI_JOB_MATCHES
-- Kết quả AI matching ứng viên ↔ công việc

CREATE TABLE IF NOT EXISTS ai_job_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    match_score DECIMAL(5,2),
    skill_match_score DECIMAL(5,2),
    experience_match_score DECIMAL(5,2),
    matching_skills JSON,
    missing_skills JSON,
    match_details JSON COMMENT '{education_score, location_score, extra_skills, strengths, concerns}',
    recommendation_reason TEXT,
    recommendation_type VARCHAR(50),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    UNIQUE KEY uq_match_candidate_job (candidate_id, job_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
