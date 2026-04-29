-- Migration 062: Saved Companies
-- Cho phép ứng viên lưu công ty yêu thích

CREATE TABLE IF NOT EXISTS saved_companies (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT UNSIGNED NOT NULL,
  company_id   INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_company (candidate_id, company_id),
  CONSTRAINT fk_sc_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sc_company   FOREIGN KEY (company_id)   REFERENCES company_profiles(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
