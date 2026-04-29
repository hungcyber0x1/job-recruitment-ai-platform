-- Migration 042: Cập nhật luồng trạng thái Job và thêm lý do từ chối
-- Thêm các trạng thái: pending, rejected, archived, expired
-- Thêm cột rejection_reason để lưu lý do khi admin từ chối job

ALTER TABLE jobs 
MODIFY COLUMN status ENUM('draft', 'pending', 'published', 'rejected', 'closed', 'archived', 'expired') NOT NULL DEFAULT 'draft';

ALTER TABLE jobs
ADD COLUMN rejection_reason TEXT NULL DEFAULT NULL AFTER moderation_note,
ADD COLUMN archived_at DATETIME NULL DEFAULT NULL AFTER deleted_at;

-- Thêm index cho tìm kiếm status nhanh hơn (nếu chưa có hoặc để đảm bảo)
CREATE INDEX idx_jobs_status_enhanced ON jobs(status);
