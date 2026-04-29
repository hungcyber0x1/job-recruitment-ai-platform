-- ============================================================
-- Migration 063: interview_schedules & application_offers
-- Tách riêng metadata phỏng vấn và offer khỏi bảng applications
-- Hỗ trợ nhiều vòng phỏng vấn (nhiều row cho 1 application)
-- ============================================================

-- Bảng lịch phỏng vấn
CREATE TABLE IF NOT EXISTS interview_schedules (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id   INT UNSIGNED NOT NULL,
  round            TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Vòng phỏng vấn (1, 2, 3...)',
  interview_type   ENUM('online','offline','phone') NOT NULL DEFAULT 'online',
  scheduled_at     DATETIME NOT NULL COMMENT 'Ngày giờ phỏng vấn',
  duration_minutes SMALLINT UNSIGNED NULL DEFAULT 60,
  location         VARCHAR(500) NULL COMMENT 'Địa điểm hoặc link meet',
  interviewer_note TEXT NULL COMMENT 'Ghi chú nội bộ',
  candidate_note   TEXT NULL COMMENT 'Hướng dẫn gửi cho ứng viên',
  status           ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
  created_by       INT UNSIGNED NULL COMMENT 'FK → users.id (recruiter tạo lịch)',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_application_id (application_id),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng thông tin offer
CREATE TABLE IF NOT EXISTS application_offers (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id   INT UNSIGNED NOT NULL UNIQUE COMMENT 'Mỗi đơn chỉ có 1 offer tại 1 thời điểm',
  salary_offered   BIGINT UNSIGNED NULL COMMENT 'Mức lương đề nghị (VND)',
  salary_currency  VARCHAR(10) NOT NULL DEFAULT 'VND',
  response_deadline DATE NULL COMMENT 'Hạn chót ứng viên phản hồi',
  start_date       DATE NULL COMMENT 'Ngày dự kiến bắt đầu làm việc',
  benefits         TEXT NULL COMMENT 'Các phúc lợi kèm theo (JSON hoặc text)',
  offer_letter_url VARCHAR(2000) NULL COMMENT 'Link file offer letter',
  notes            TEXT NULL COMMENT 'Ghi chú nội bộ của recruiter',
  candidate_response ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  responded_at     DATETIME NULL,
  created_by       INT UNSIGNED NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_application_id (application_id),
  INDEX idx_response_deadline (response_deadline),
  INDEX idx_candidate_response (candidate_response)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
