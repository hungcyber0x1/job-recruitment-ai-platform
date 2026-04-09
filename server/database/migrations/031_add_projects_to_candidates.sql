-- Migration 031: Thêm cột projects (JSON) vào bảng candidates cho dự án tiêu biểu
-- Thêm cột projects (JSON) cho dự án tiêu biểu của ứng viên
ALTER TABLE candidates
ADD COLUMN projects JSON DEFAULT NULL COMMENT '[{id, title, role, image, tags, startDate, endDate, github_url, project_url, description}]'
AFTER resume_url;
