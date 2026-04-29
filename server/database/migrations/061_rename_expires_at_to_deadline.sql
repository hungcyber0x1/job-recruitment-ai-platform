-- Migration: Đổi tên cột expires_at -> deadline trong bảng jobs
-- Đảm bảo tên cột nhất quán với code (deadline) và tương thích ngược

-- Thêm cột deadline nếu chưa có
ALTER TABLE jobs ADD COLUMN deadline DATE NULL DEFAULT NULL AFTER status;

-- Copy dữ liệu từ expires_at sang deadline (nếu expires_at có dữ liệu và deadline chưa có)
UPDATE jobs SET deadline = expires_at WHERE expires_at IS NOT NULL AND deadline IS NULL;

-- Thêm index cho deadline (nếu chưa có)
CREATE INDEX idx_job_deadline ON jobs(deadline);
