-- Migration 050: Chuẩn hóa tất cả status trong hệ thống
-- Thực thi sau khi đã chạy migration 042
-- Cập nhật ENUM cho jobs.status
-- Cập nhật ENUM cho applications.status
-- Cập nhật ENUM cho users.status
-- Lưu ý: Cần chạy script migration data trước khi thay đổi ENUM

-- ============================================
-- BƯỚC 1: Migration Data (chuyển đổi giá trị cũ sang mới)
-- ============================================

-- Jobs: chuyển 'active' → 'published', 'pending' → 'pending_review'
UPDATE jobs SET status = 'pending_review' WHERE status = 'pending';
UPDATE jobs SET status = 'published' WHERE status = 'active';

-- Applications: chuyển đổi status
-- pending → submitted
-- reviewed → shortlisted (hoặc screening tùy logic nghiệp vụ)
-- interviewing → interviewed
-- accepted → offered (candidate đã chấp nhận offer)
-- Note: 'reviewed' không có trong spec mới, có thể map sang 'shortlisted'

UPDATE applications SET status = 'submitted' WHERE status = 'pending';
UPDATE applications SET status = 'interviewed' WHERE status = 'interviewing';
-- reviewed → shortlisted (AI đã review và đưa vào danh sách rút gọn)
UPDATE applications SET status = 'shortlisted' WHERE status = 'reviewed';
-- accepted không còn là status riêng - khi candidate accept offer thì status là 'offered'
-- pending_verification đã là trạng thái mới cho user, không cần migrate cho application

-- Users: chuyển đổi status
-- pending → pending_verification
-- inactive → suspended
-- locked → suspended (gộp locked vào suspended vì cả hai đều là tạm ngưng)
UPDATE users SET status = 'pending_verification' WHERE status = 'pending';
UPDATE users SET status = 'suspended' WHERE status = 'inactive';
UPDATE users SET status = 'suspended' WHERE status = 'locked';

-- ============================================
-- BƯỚC 2: Cập nhật ENUM cho jobs.status
-- ============================================

ALTER TABLE jobs
MODIFY COLUMN status ENUM('draft', 'pending_review', 'approved', 'rejected', 'published', 'expired', 'closed', 'suspended') NOT NULL DEFAULT 'draft';

-- ============================================
-- BƯỚC 3: Cập nhật ENUM cho applications.status
-- ============================================

ALTER TABLE applications
MODIFY COLUMN status ENUM('submitted', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn') NOT NULL DEFAULT 'submitted';

-- ============================================
-- BƯỚC 4: Cập nhật ENUM cho users.status
-- ============================================

ALTER TABLE users
MODIFY COLUMN status ENUM('active', 'pending_verification', 'suspended', 'banned') NOT NULL DEFAULT 'active';

-- ============================================
-- BƯỚC 5: Cập nhật application_history (nếu có)
-- ============================================

-- Cập nhật các bản ghi history có status cũ
UPDATE application_history SET new_status = 'submitted' WHERE new_status = 'pending';
UPDATE application_history SET new_status = 'interviewed' WHERE new_status = 'interviewing';
UPDATE application_history SET new_status = 'shortlisted' WHERE new_status = 'reviewed';

-- Cập nhật old_status tương ứng
UPDATE application_history SET old_status = 'submitted' WHERE old_status = 'pending';
UPDATE application_history SET old_status = 'interviewed' WHERE old_status = 'interviewing';
UPDATE application_history SET old_status = 'shortlisted' WHERE old_status = 'reviewed';

-- ============================================
-- BƯỚC 6: Verify - Kiểm tra không còn giá trị cũ
-- ============================================

-- Check jobs
SELECT DISTINCT status FROM jobs WHERE status NOT IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'expired', 'closed', 'suspended');

-- Check applications
SELECT DISTINCT status FROM applications WHERE status NOT IN ('submitted', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn');

-- Check users
SELECT DISTINCT status FROM users WHERE status NOT IN ('active', 'pending_verification', 'suspended', 'banned');

-- ============================================
-- BƯỚC 7: Tạo indexes nếu chưa có
-- ============================================

CREATE INDEX idx_jobs_status_normalized ON jobs(status);
CREATE INDEX idx_applications_status_normalized ON applications(status);
CREATE INDEX idx_users_status_normalized ON users(status);
