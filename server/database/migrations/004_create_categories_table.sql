-- Migration 004: Bảng CATEGORIES
-- Danh mục ngành nghề (bảng độc lập)

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255)
);
