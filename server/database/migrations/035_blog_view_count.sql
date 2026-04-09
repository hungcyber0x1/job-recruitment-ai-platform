-- Đếm lượt xem bài blog công khai — sắp xếp "Đọc nhiều"
-- Chạy sau 033_create_blog_posts.sql

ALTER TABLE blog_posts
  ADD COLUMN view_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER published_at;
