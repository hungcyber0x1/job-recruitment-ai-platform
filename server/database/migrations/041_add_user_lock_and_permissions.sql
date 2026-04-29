-- Migration 041: Thêm trường khóa/mở khóa tài khoản và quyền admin
-- Hỗ trợ các trạng thái: Hoạt động, Chờ duyệt, Bị khóa

SET NAMES utf8mb4;

-- 1. Cập nhật ENUM status để bao gồm 'locked'
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'pending', 'inactive', 'banned', 'locked') DEFAULT 'active';

-- 2. Thêm trường locked_at để lưu thời gian khóa
ALTER TABLE users ADD COLUMN locked_at DATETIME NULL DEFAULT NULL COMMENT 'Thời gian bị khóa' AFTER status;

-- 3. Thêm trường locked_by để lưu admin đã thực hiện khóa
ALTER TABLE users ADD COLUMN locked_by INT NULL DEFAULT NULL COMMENT 'Admin đã khóa tài khoản' AFTER locked_at;

-- 4. Thêm trường permissions JSON để lưu quyền của admin
ALTER TABLE users ADD COLUMN permissions JSON NULL DEFAULT NULL COMMENT 'Quyền hạn của Admin (dashboard, users, jobs, etc.)' AFTER locked_by;

-- 5. Thêm chỉ mục cho locked_at
CREATE INDEX idx_users_locked_at ON users (locked_at);
