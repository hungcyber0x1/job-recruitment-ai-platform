-- Migration 050: Remove legacy job matching feature artifacts

DROP TABLE IF EXISTS ai_job_matches;

DELETE FROM system_settings WHERE setting_key = 'ai_job_matching';
DELETE FROM ai_prompts WHERE prompt_key = 'job_matching';
