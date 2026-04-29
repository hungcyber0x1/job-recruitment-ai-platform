-- Migration 050: Add company_id and supporting columns to blog_posts
-- Fixes 500 error on GET /api/employers/blog/posts
-- NOTE: Use the Node.js runner (addColumnIfMissing) for compatibility with older MySQL
-- This file documents the changes applied by 050 migration script.

-- Columns added (if not exist):
--   company_id     INT UNSIGNED NULL        — FK to company_profiles (employer posts)
--   is_published   TINYINT(1) DEFAULT 0     — convenience flag
--   is_featured    TINYINT(1) DEFAULT 0     — featured post flag  
--   rejection_reason TEXT NULL              — moderation reason
--   scheduled_at   DATETIME NULL            — scheduled publishing

-- Index added:
--   idx_blog_company (company_id)

SELECT 'Migration 050 documented' AS status;
