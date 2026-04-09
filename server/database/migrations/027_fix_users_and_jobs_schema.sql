-- Migration 027: Sửa lỗi schema cho USERS và JOBS

-- 1. Thêm cột status vào bảng users nếu chưa có
-- Lưu ý: is_active đã có, nhưng status ENUM ('active', 'pending', 'banned') chưa có
ALTER TABLE users ADD COLUMN status ENUM('active', 'pending', 'banned') DEFAULT 'active' AFTER avatar_url;

-- 2. Cập nhật ENUM cho jobs.status để bao gồm 'pending' và 'rejected'
-- MySQL require thay đổi toàn bộ cột
ALTER TABLE jobs MODIFY COLUMN status ENUM('draft', 'pending', 'published', 'rejected', 'closed') DEFAULT 'draft';
