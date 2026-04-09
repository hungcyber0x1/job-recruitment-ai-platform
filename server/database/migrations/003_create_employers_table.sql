-- Migration 003: Bảng EMPLOYERS
-- Thông tin nhà tuyển dụng / doanh nghiệp, phụ thuộc users

CREATE TABLE IF NOT EXISTS employers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255),
    company_logo VARCHAR(255),
    company_description TEXT,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    location VARCHAR(255),
    phone VARCHAR(20),
    tax_code VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
