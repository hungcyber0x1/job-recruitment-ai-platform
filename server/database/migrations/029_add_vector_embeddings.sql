-- Add vector embedding columns to support semantic matching
-- embeddings are stored as JSON arrays of floats

ALTER TABLE ai_resume_analysis 
ADD COLUMN resume_embedding JSON DEFAULT NULL 
AFTER resume_text;

ALTER TABLE jobs 
ADD COLUMN job_embedding JSON DEFAULT NULL 
AFTER description;
