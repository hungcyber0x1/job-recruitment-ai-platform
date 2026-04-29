-- ============================================
-- Migration: 073_include_remote_job_type
-- Description: Align jobs.job_type ENUM with client/business job type options
-- ============================================

ALTER TABLE jobs
  MODIFY COLUMN job_type ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance', 'remote') NOT NULL DEFAULT 'full_time';

SELECT 'Migration 073_include_remote_job_type completed' AS status;
