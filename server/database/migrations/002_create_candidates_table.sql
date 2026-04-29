-- Migration 002: Bảng CANDIDATES
-- Thông tin chi tiết ứng viên, phụ thuộc users

CREATE TABLE IF NOT EXISTS candidates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    bio TEXT,
    experience_years INT,
    current_job_title VARCHAR(255),
    education_level ENUM('high_school', 'college', 'bachelor', 'master', 'phd', 'other'),
    education JSON COMMENT '[{school, degree, major, year}]',
    experience JSON COMMENT '[{company, title, period, description}]',
    location VARCHAR(255),
    resume_url VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
