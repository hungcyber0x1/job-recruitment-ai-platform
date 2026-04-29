-- Migration 050: Candidate Profile Phase 1.1 — Data Foundation
-- Thêm các trường cho candidate profiles: job_search_status, salary, preferences, languages, certifications, social_links
-- Cập nhật candidate_skills junction table: proficiency_level, years_experience, is_primary

-- 1. Thêm các trường mới vào bảng candidate_profiles
ALTER TABLE candidate_profiles
  ADD COLUMN job_search_status ENUM('actively_looking', 'open_to_work', 'not_looking', 'employed') DEFAULT NULL AFTER profile_visibility,
  ADD COLUMN expected_salary_min INT UNSIGNED DEFAULT NULL AFTER job_search_status,
  ADD COLUMN expected_salary_max INT UNSIGNED DEFAULT NULL AFTER expected_salary_min,
  ADD COLUMN salary_currency VARCHAR(3) DEFAULT 'VND' AFTER expected_salary_max,
  ADD COLUMN preferred_job_types JSON DEFAULT NULL AFTER salary_currency,
  ADD COLUMN preferred_locations JSON DEFAULT NULL AFTER preferred_job_types,
  ADD COLUMN willing_to_relocate BOOLEAN DEFAULT FALSE AFTER preferred_locations,
  ADD COLUMN languages JSON DEFAULT NULL AFTER willing_to_relocate,
  ADD COLUMN certifications JSON DEFAULT NULL AFTER languages,
  ADD COLUMN social_links JSON DEFAULT NULL AFTER certifications,
  ADD COLUMN last_active_at TIMESTAMP NULL AFTER social_links;

-- 2. Cập nhật bảng candidate_skills với các trường mới
ALTER TABLE candidate_skills
  ADD COLUMN proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT NULL AFTER skill_id,
  ADD COLUMN years_experience TINYINT UNSIGNED DEFAULT NULL AFTER proficiency_level,
  ADD COLUMN is_primary BOOLEAN DEFAULT FALSE AFTER years_experience;

-- 3. Thêm index cho các trường mới để tối ưu truy vấn
CREATE INDEX idx_candidate_profiles_job_search_status ON candidate_profiles(job_search_status);
CREATE INDEX idx_candidate_profiles_last_active ON candidate_profiles(last_active_at);
CREATE INDEX idx_candidate_skills_proficiency ON candidate_skills(proficiency_level);
CREATE INDEX idx_candidate_skills_is_primary ON candidate_skills(is_primary);
