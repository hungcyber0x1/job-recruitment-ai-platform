-- Thông báo & quyền riêng tư hồ sơ ứng viên (trang Cài đặt)

ALTER TABLE users
  ADD COLUMN email_notifications TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Nhận email tuyển dụng, phỏng vấn',
  ADD COLUMN push_notifications TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Thông báo đẩy (chuẩn bị cho Web Push)',
  ADD COLUMN password_updated_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE candidates
  ADD COLUMN profile_visibility ENUM('public', 'private') NOT NULL DEFAULT 'public'
    COMMENT 'public: NTD tìm thấy; private: chỉ hiện khi đã ứng tuyển';
