-- Employer Talent Pool
-- Stores candidates saved by a company/recruiter from the candidate search page.

CREATE TABLE IF NOT EXISTS employer_saved_candidates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  recruiter_id INT UNSIGNED NULL,
  candidate_id INT UNSIGNED NOT NULL,
  folder VARCHAR(100) NOT NULL DEFAULT 'general',
  notes TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_employer_saved_candidate (company_id, candidate_id),
  INDEX idx_esc_company_folder (company_id, folder),
  INDEX idx_esc_candidate (candidate_id),
  CONSTRAINT fk_esc_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_esc_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_esc_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
