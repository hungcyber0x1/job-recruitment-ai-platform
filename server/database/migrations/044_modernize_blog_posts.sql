-- Migration 044: Add moderation and scheduling fields to blog_posts
-- Adds status management, flagging, featuring, and scheduling capabilities.

ALTER TABLE blog_posts
ADD COLUMN status ENUM('pending', 'published', 'rejected', 'archived') DEFAULT 'published',
ADD COLUMN rejection_reason TEXT,
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN scheduled_at TIMESTAMP NULL;

-- Create index for status-based filtering (important for admin moderation queue)
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX idx_blog_posts_scheduled ON blog_posts(scheduled_at);
