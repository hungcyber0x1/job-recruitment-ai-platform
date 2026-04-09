-- Migration 005: Bảng JOBS
-- Tin tuyển dụng, phụ thuộc employers + categories

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    category_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_min INT,
    salary_max INT,
    currency VARCHAR(10) DEFAULT 'VND',
    location VARCHAR(100),
    experience_required VARCHAR(50),
    education_required ENUM('high_school', 'college', 'bachelor', 'master', 'phd', 'any') DEFAULT 'any',
    type ENUM('full-time', 'part-time', 'contract', 'internship', 'remote'),
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    deadline DATE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
