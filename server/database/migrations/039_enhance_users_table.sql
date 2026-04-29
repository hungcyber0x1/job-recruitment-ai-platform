-- Migration 039: Bổ sung các trường thông tin cho Quản lý Người dùng
-- Thêm thông tin đăng nhập, xác minh và quản trị nội bộ

SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN last_login_at DATETIME NULL DEFAULT NULL COMMENT 'Lần đăng nhập gần nhất' AFTER avatar_url,
  ADD COLUMN email_verified_at DATETIME NULL DEFAULT NULL COMMENT 'Thời gian xác minh email' AFTER last_login_at,
  ADD COLUMN internal_notes TEXT NULL DEFAULT NULL COMMENT 'Ghi chú nội bộ dành cho Admin' AFTER email_verified_at,
  ADD COLUMN gender ENUM('male', 'female', 'other') NULL DEFAULT NULL COMMENT 'Giới tính' AFTER internal_notes,
  ADD COLUMN region VARCHAR(100) NULL DEFAULT NULL COMMENT 'Khu vực/Vùng miền' AFTER gender;

-- Thêm các chỉ mục để tối ưu hóa việc lọc nâng cao
CREATE INDEX idx_users_last_login ON users (last_login_at);
CREATE INDEX idx_users_email_verified ON users (email_verified_at);
CREATE INDEX idx_users_gender ON users (gender);
CREATE INDEX idx_users_region ON users (region);
CREATE INDEX idx_users_role_status ON users (role, status);
