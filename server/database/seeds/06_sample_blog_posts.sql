-- Seed 06: Bài blog mẫu (admin) — cần user admin@hireai.vn từ seed 03
-- Chạy sau migration 033_create_blog_posts.sql

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at)
SELECT
  'chao-mung-den-hireai',
  'Chào mừng đến HireAI',
  'Nền tảng tuyển dụng thông minh: kết nối ứng viên và nhà tuyển dụng hiệu quả hơn.',
  '<p>Đây là bài viết mẫu do quản trị tạo. Bạn có thể sửa hoặc xóa trong <strong>Admin → Blog</strong>.</p><p>Nội dung HTML có thể dài; máy chủ đã được cấu hình để chấp nhận bài viết đầy đủ.</p>',
  NULL,
  'Technology',
  'admin',
  u.id,
  NULL,
  1,
  NOW()
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  is_published = VALUES(is_published),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO blog_posts
  (slug, title, excerpt, content, image_url, category, author_type, author_user_id, employer_id, is_published, published_at)
SELECT
  'meo-phong-van-star',
  'Mẹo phỏng vấn: khung STAR',
  'Trình bày câu trả lời theo Situation – Task – Action – Result.',
  '<p><strong>S</strong>ituation — <strong>T</strong>ask — <strong>A</strong>ction — <strong>R</strong>esult giúp bạn trả lời rõ ràng và có số liệu.</p>',
  NULL,
  'Career Tips',
  'admin',
  u.id,
  NULL,
  1,
  NOW()
FROM users u
WHERE u.email = 'admin@hireai.vn' AND u.role = 'admin'
LIMIT 1
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  is_published = VALUES(is_published),
  updated_at = CURRENT_TIMESTAMP;
