-- Migration 072: remove career roadmap feature artifacts
DROP TABLE IF EXISTS skill_gaps;
DROP TABLE IF EXISTS career_paths;

DELETE FROM system_settings
WHERE setting_key = 'ai_career_roadmap';
