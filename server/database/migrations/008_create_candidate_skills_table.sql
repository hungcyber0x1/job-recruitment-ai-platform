-- Migration 008: Bảng CANDIDATE_SKILLS
-- Junction table: quan hệ N:N giữa candidates ↔ skills

CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (candidate_id, skill_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
