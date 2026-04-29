-- ============================================
-- Migration: 071_add_job_negotiable_and_vacancies
-- Description: Add salary_negotiable and vacancies columns to jobs table
-- Date: 2026-04-25
-- ============================================

DROP PROCEDURE IF EXISTS migrate_071_job_salary_fields;

CREATE PROCEDURE migrate_071_job_salary_fields()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'jobs'
      AND COLUMN_NAME = 'salary_negotiable'
  ) THEN
    ALTER TABLE jobs
      ADD COLUMN salary_negotiable TINYINT(1) NOT NULL DEFAULT 0 AFTER salary_max;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'jobs'
      AND COLUMN_NAME = 'vacancies'
  ) THEN
    ALTER TABLE jobs
      ADD COLUMN vacancies INT UNSIGNED NOT NULL DEFAULT 1 AFTER salary_negotiable;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'jobs'
      AND COLUMN_NAME = 'vacancies'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'jobs'
      AND INDEX_NAME = 'idx_job_vacancies'
  ) THEN
    ALTER TABLE jobs ADD INDEX idx_job_vacancies (vacancies);
  END IF;
END;

CALL migrate_071_job_salary_fields();

DROP PROCEDURE IF EXISTS migrate_071_job_salary_fields;

SELECT 'Migration 071_add_job_negotiable_and_vacancies completed' AS status;
