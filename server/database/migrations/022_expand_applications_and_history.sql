-- Migration 022: Mở rộng trạng thái đơn ứng tuyển và thêm bảng lịch sử
-- Bước 1: Cập nhật ENUM cho cột status trong bảng applications
-- Lưu ý: MySQL không cho phép thay đổi ENUM dễ dàng nếu có dữ liệu, nhưng ở đây chúng ta dùng bảng mới để lưu vết.

ALTER TABLE applications 
MODIFY COLUMN status ENUM('pending', 'screening', 'reviewed', 'shortlisted', 'interviewing', 'offered', 'rejected', 'hired', 'accepted', 'withdrawn') DEFAULT 'pending';

-- Bước 2: Tạo bảng application_history
CREATE TABLE IF NOT EXISTS application_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    changed_by INT NOT NULL, -- user_id (admin hoặc employer)
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
