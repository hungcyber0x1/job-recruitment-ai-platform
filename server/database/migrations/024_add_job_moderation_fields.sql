-- Migration 024: Thêm tính năng kiểm duyệt AI cho tin tuyển dụng
ALTER TABLE jobs 
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN moderation_note TEXT;
