-- Migration 052: Remove candidate profile readiness/completion database artifacts
-- Drops the old readiness completion fields and index if they exist.

SET @current_database = DATABASE();

SET @profile_completion_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @current_database
    AND table_name = 'candidate_profiles'
    AND index_name = 'idx_candidate_profiles_profile_completion'
);
SET @drop_profile_completion_index_sql = IF(
  @profile_completion_index_exists > 0,
  'ALTER TABLE candidate_profiles DROP INDEX idx_candidate_profiles_profile_completion',
  'SELECT 1'
);
PREPARE drop_profile_completion_index_stmt FROM @drop_profile_completion_index_sql;
EXECUTE drop_profile_completion_index_stmt;
DEALLOCATE PREPARE drop_profile_completion_index_stmt;

SET @profile_completion_score_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @current_database
    AND table_name = 'candidate_profiles'
    AND column_name = 'profile_completion_score'
);
SET @drop_profile_completion_score_sql = IF(
  @profile_completion_score_exists > 0,
  'ALTER TABLE candidate_profiles DROP COLUMN profile_completion_score',
  'SELECT 1'
);
PREPARE drop_profile_completion_score_stmt FROM @drop_profile_completion_score_sql;
EXECUTE drop_profile_completion_score_stmt;
DEALLOCATE PREPARE drop_profile_completion_score_stmt;

SET @profile_completed_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @current_database
    AND table_name = 'candidate_profiles'
    AND column_name = 'profile_completed_at'
);
SET @drop_profile_completed_at_sql = IF(
  @profile_completed_at_exists > 0,
  'ALTER TABLE candidate_profiles DROP COLUMN profile_completed_at',
  'SELECT 1'
);
PREPARE drop_profile_completed_at_stmt FROM @drop_profile_completed_at_sql;
EXECUTE drop_profile_completed_at_stmt;
DEALLOCATE PREPARE drop_profile_completed_at_stmt;
