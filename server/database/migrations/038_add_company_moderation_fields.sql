ALTER TABLE employers
ADD COLUMN flagged BOOLEAN DEFAULT FALSE AFTER is_verified,
ADD COLUMN moderation_note TEXT NULL AFTER flagged;
