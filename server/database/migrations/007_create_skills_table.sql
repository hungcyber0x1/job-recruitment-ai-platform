-- Migration 007: Bảng SKILLS
-- Danh mục kỹ năng (bảng độc lập)

CREATE TABLE IF NOT EXISTS skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100)
);
