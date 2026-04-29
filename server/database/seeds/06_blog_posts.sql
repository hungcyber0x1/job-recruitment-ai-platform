-- ============================================
-- SEED 06: BLOG POSTS
-- Bài blog chất lượng cao, đa chủ đề
-- Schema: id, author_id, category_id, title, slug, excerpt, content(longtext), thumbnail_url,
--          featured_image, view_count, status(draft/pending/published/rejected),
--          published_at, author_type(admin/recruiter/candidate), tags(json),
--          seo_title, seo_description, created_at, updated_at, deleted_at,
--          is_flagged, flagged, moderation_note, ai_risk
-- ============================================

SET NAMES utf8mb4;

SET @ADMIN_ID = (SELECT id FROM users WHERE email = 'admin@hirebot.vn');
SET @CAT_CNTT = (SELECT id FROM categories WHERE slug = 'cntt');
SET @CAT_MK = (SELECT id FROM categories WHERE slug = 'marketing');
SET @CAT_TC = (SELECT id FROM categories WHERE slug = 'tai-chinh');
SET @CAT_NS = (SELECT id FROM categories WHERE slug = 'nhan-su');
SET @CAT_KD = (SELECT id FROM categories WHERE slug = 'kinh-doanh');

-- 1. Xu hướng IT
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_CNTT,
  'Thị trường tuyển dụng IT Việt Nam 2026: AI Engineer là vị trí được săn đón nhất',
  'thi-truong-tuyen-dung-it-viet-nam-2026-ai-engineer',
  'Nhu cầu tuyển AI Engineer tăng 200% trong năm 2025, trở thành vị trí hot nhất thị trường lao động công nghệ.',
  '<p class="lead">Thị trường tuyển dụng công nghệ thông tin Việt Nam năm 2026 chứng kiến sự bùng nổ của các vị trí liên quan đến trí tuệ nhân tạo. Theo báo cáo của HireBOT, nhu cầu tuyển AI Engineer đã tăng 200% so với năm 2024.</p><p>Các công ty công nghệ lớn như FPT Software, Viettel Solutions, và VNG đang chiêu mộ nhân sự AI với mức lương khởi điểm từ 35 triệu VNĐ/tháng, cao hơn 40% so với vị trí backend truyền thống.</p>',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
  2847, 'published', DATE_SUB(NOW(), INTERVAL 1 DAY), 'admin',
  '["ai","machine-learning","ituyen-dung","luong-2026"]',
  'Thị trường tuyển dụng IT Việt Nam 2026 - AI Engineer',
  'Nhu cầu tuyển AI Engineer tăng 200% trong năm 2025. Khám phá xu hướng tuyển dụng IT Việt Nam 2026.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 2. Hướng dẫn phỏng vấn
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_NS,
  '10 câu hỏi phỏng vấn HR phổ biến nhất năm 2026 và cách trả lời thông minh',
  '10-cau-hoi-phong-van-hr-2026',
  'Tổng hợp 10 câu hỏi phỏng vấn HR phổ biến nhất năm 2026 với gợi ý cách trả lời giúp bạn gây ấn tượng với nhà tuyển dụng.',
  '<p>Chuẩn bị cho vòng phỏng vấn HR là bước quan trọng để chinh phục công việc mơ ước. Dưới đây là 10 câu hỏi phổ biến nhất và cách trả lời hiệu quả.</p><h3>1. Giới thiệu về bản thân</h3><p>Nhà tuyển dụng muốn nghe về điểm mạnh và giá trị bạn mang lại, không phải lặp lại CV. Hãy dùng phương pháp STAR để kể một câu chuyện thành công.</p>',
  'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200',
  5621, 'published', DATE_SUB(NOW(), INTERVAL 3 DAY), 'admin',
  '["phong-van","hr","tu-van-nghe-nghiep","cao-thu"]',
  '10 câu hỏi phỏng vấn HR phổ biến 2026',
  'Tổng hợp 10 câu hỏi phỏng vấn HR phổ biến nhất năm 2026 kèm cách trả lời thông minh.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 3. Kỹ năng mềm
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_KD,
  'Tại sao kỹ năng giao tiếp quan trọng hơn kỹ năng kỹ thuật trong sự nghiệp?',
  'ky-nang-giao-tiep-quan-trong-hon-ky-nang-ky-thuat',
  'Nghiên cứu từ Harvard Business Review chỉ ra rằng 75% thành công trong sự nghiệp đến từ kỹ năng mềm, chỉ 25% từ kỹ năng kỹ thuật.',
  '<p>Trong thời đại AI và tự động hóa, kỹ năng kỹ thuật có thể bị thay thế bởi máy móc. Nhưng kỹ năng giao tiếp, lãnh đạo, và giải quyết vấn đề là những gì chỉ con người mới làm được.</p><h3>Tại sao giao tiếp quyết định sự thành công?</h3><p>Một developer giỏi code nhưng không biết trình bày ý tưởng sẽ khó thăng tiến. Một người bán hàng với kỹ năng giao tiếp xuất sắc có thể đạt doanh số cao hơn mà không cần hiểu biết sâu về sản phẩm.</p>',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
  3412, 'published', DATE_SUB(NOW(), INTERVAL 5 DAY), 'admin',
  '["ky-nang-mem","giao-tiep","su-nghiep","phat-trien"]',
  'Kỹ năng giao tiếp quan trọng hơn kỹ năng kỹ thuật',
  'Nghiên cứu từ Harvard Business Review chỉ ra kỹ năng mềm quyết định 75% thành công trong sự nghiệp.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 4. Remote work
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_CNTT,
  'Remote work: Những công ty IT Việt Nam nào đang tuyển dụng 100% từ xa?',
  'remote-work-cong-ty-it-viet-nam-tuyen-dung-100-tu-xa',
  'Danh sách các công ty công nghệ Việt Nam đang áp dụng chính sách làm việc từ xa hoàn toàn năm 2026.',
  '<p>Nhiều công ty công nghệ Việt Nam đã chuyển sang mô hình remote-first, cho phép nhân viên làm việc từ bất kỳ đâu. Dưới đây là danh sách các công ty đang tuyển vị trí remote.</p><h3>Lợi ích của Remote Work</h3><ul><li>Tiết kiệm 2-3 giờ di chuyển mỗi ngày</li><li>Linh hoạt về thời gian và không gian</li><li>Chi phí sinh hoạt giảm 20-30%</li></ul>',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
  7893, 'published', DATE_SUB(NOW(), INTERVAL 7 DAY), 'admin',
  '["remote-work","ituyen-dung","viec-lam-it","tu-xa"]',
  'Công ty IT Việt Nam tuyển dụng 100% remote 2026',
  'Danh sách các công ty công nghệ Việt Nam đang tuyển dụng vị trí remote work 100%.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 5. Lương IT
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_TC,
  'Bảng lương ngành IT Việt Nam 2026: Vị trí nào được trả cao nhất?',
  'bang-luong-it-viet-nam-2026',
  'Khảo sát mức lương ngành IT Việt Nam 2026 với dữ liệu từ hơn 10.000 ứng viên và nhà tuyển dụng trên HireBOT.',
  '<p>Theo khảo sát của HireBOT với 10.000+ ứng viên và nhà tuyển dụng, mức lương ngành IT Việt Nam năm 2026 có sự chênh lệch đáng kể giữa các vị trí.</p><h3>Top 5 vị trí được trả lương cao nhất</h3><ol><li>AI/ML Engineer: 35-80 triệu VNĐ/tháng</li><li>DevOps/SRE: 30-60 triệu VNĐ/tháng</li><li>Security Engineer: 28-55 triệu VNĐ/tháng</li><li>Data Engineer: 25-50 triệu VNĐ/tháng</li><li>Full-stack Developer (Senior): 25-45 triệu VNĐ/tháng</li></ol>',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200',
  9234, 'published', DATE_SUB(NOW(), INTERVAL 2 DAY), 'admin',
  '["luong-it","ituyen-dung","vi-tri-hot","2026"]',
  'Bảng lương ngành IT Việt Nam 2026',
  'Khảo sát mức lương ngành IT Việt Nam 2026. Top 5 vị trí được trả lương cao nhất.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 6. Marketing
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_MK,
  'Content Marketing 2026: Xu hướng nào giúp brand của bạn nổi bật?',
  'content-marketing-2026-xu-huong-noi-bat',
  'AI-generated content, video ngắn, và personalization đang thay đổi cách brands tiếp cận khách hàng trong năm 2026.',
  '<p>Năm 2026, content marketing đã bước sang một era mới với sự kết hợp giữa AI và sáng tạo con người. Những xu hướng nổi bật bao gồm:</p><h3>1. AI + Human Collaboration</h3><p>AI giúp tạo draft nhanh hơn, nhưng cái gì làm cho content trở nên viral vẫn là cảm xúc và sự sáng tạo của con người.</p><h3>2. Short-form Video</h3><p>Video dưới 60 giây trên TikTok, Instagram Reels, và YouTube Shorts đang chiếm 70% engagement.</p>',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200',
  4532, 'published', DATE_SUB(NOW(), INTERVAL 4 DAY), 'admin',
  '["content-marketing","digital-marketing","xu-huong-2026","branding"]',
  'Content Marketing 2026: Xu hướng nổi bật',
  'AI-generated content, video ngắn, và personalization đang thay đổi cách brands tiếp cận khách hàng năm 2026.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 7. Soft skills
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_KD,
  '5 soft skills giúp bạn thăng tiến nhanh hơn trong năm 2026',
  '5-soft-skills-thang-tien-nhanh-2026',
  'Leadership, critical thinking, và adaptability là những kỹ năng được nhà tuyển dụng săn đón nhất trong năm 2026.',
  '<p>Trong kỷ nguyên AI, những kỹ năng không thể thay thế bằng máy móc trở nên quý giá hơn bao giờ hết. Đây là 5 soft skills giúp bạn nổi bật.</p><h3>1. Critical Thinking</h3><p>Khả năng phân tích vấn đề từ nhiều góc độ và đưa ra quyết định dựa trên dữ liệu.</p><h3>2. Adaptability</h3><p>Thích ứng nhanh với thay đổi là kỹ năng sống còn trong thời đại công nghệ phát triển chóng mặt.</p><h3>3. Emotional Intelligence</h3><p>Hiểu và quản lý cảm xúc của bản thân và người khác giúp xây dựng relationships mạnh mẽ.</p>',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200',
  6127, 'published', DATE_SUB(NOW(), INTERVAL 6 DAY), 'admin',
  '["soft-skills","thang-tien","su-nghiep","phat-trien-ca-nhan"]',
  '5 soft skills giúp thăng tiến nhanh 2026',
  'Leadership, critical thinking, và adaptability - top soft skills nhà tuyển dụng săn đón năm 2026.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 8. IT trends
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_CNTT,
  'Top 10 công nghệ lập trình trending nhất năm 2026',
  'top-10-cong-nghe-lap-trinh-trending-2026',
  'Rust, WebAssembly, và GenAI frameworks đang dẫn đầu xu hướng công nghệ lập trình năm 2026.',
  '<p>Công nghệ lập trình không ngừng phát triển. Năm 2026, những ngôn ngữ và framework nào đang được săn đón?</p><h3>1. Rust</h3><p>Được Stack Overflow bình chọn là ngôn ngữ được yêu thích nhất 5 năm liên tiếp. Rust đang trở thành lựa chọn hàng đầu cho các hệ thống performance-critical.</p><h3>2. TypeScript</h3><p>Với sự phát triển của Next.js và các framework hiện đại, TypeScript đã trở thành standard cho web development.</p><h3>3. Python (AI/ML)</h3><p>Vẫn là ngôn ngữ số 1 cho AI và data science.</p>',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
  8765, 'published', DATE_SUB(NOW(), INTERVAL 1 DAY), 'admin',
  '["lap-trinh","cong-nghe","trending","2026","rust","typescript"]',
  'Top 10 công nghệ lập trình trending 2026',
  'Rust, WebAssembly, GenAI frameworks - top công nghệ lập trình được săn đón nhất năm 2026.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 9. Interview tips draft
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_NS,
  'Cách trả lời câu hỏi "Bạn có điểm yếu gì?" một cách thông minh',
  'cach-tra-loi-cau-hoi-diem-yeu-thong-minh',
  'Câu hỏi kinh điển này thường khiến ứng viên lúng túng. Hãy biến điểm yếu thành cơ hội thể hiện self-awareness.',
  '<p>"Điểm yếu của bạn là gì?" là câu hỏi mà nhiều ứng viên sợ nhất. Nhưng nếu trả lời đúng cách, đây là cơ hội để thể hiện sự trưởng thành và self-awareness.</p><h3>Phương pháp CORPT</h3><ul><li><strong>C</strong> = Current weakness (điểm yếu hiện tại)</li><li><strong>O</strong> = Obstacle it creates (rào cản nó tạo ra)</li><li><strong>R</strong> = Resolution (cách bạn đang khắc phục)</li><li><strong>P</strong> = Progress made (tiến bộ đã đạt được)</li><li><strong>T</strong> = Transferable learning (bài học chuyển giao)</li></ul>',
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1200',
  1203, 'published', DATE_SUB(NOW(), INTERVAL 10 DAY), 'admin',
  '["phong-van","tu-van","ky-nang-phong-van","chuan-bi"]',
  'Cách trả lời điểm yếu khi phỏng vấn',
  'Hướng dẫn trả lời thông minh câu hỏi "điểm yếu" trong phỏng vấn. Biến điểm yếu thành cơ hội.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 10. Career switch
INSERT INTO blog_posts (author_id, category_id, title, slug, excerpt, content, thumbnail_url, view_count, status, published_at, author_type, tags, seo_title, seo_description)
VALUES (@ADMIN_ID, @CAT_KD,
  'Hướng dẫn chuyển nghề sang IT cho người không có nền tảng kỹ thuật',
  'huong-dan-chuyen-nghe-sang-it-cho-nguoi-khong-co-ky-thuat',
  'Bạn có thể trở thành developer dù không học CNTT? Câu trả lời là CÓ, và đây là lộ trình chi tiết 12 tháng.',
  '<p>Không ít người đã thành công chuyển nghề sang IT sau 6-12 tháng học tập nghiêm túc. Không cần bằng cấp CNTT, chỉ cần quyết tâm và phương pháp đúng.</p><h3>Lộ trình 12 tháng</h3><p><strong>Tháng 1-3:</strong> Học HTML, CSS, JavaScript cơ bản. Xây dựng 3-5 landing pages.</p><p><strong>Tháng 4-6:</strong> Học một framework (React hoặc Vue.js). Làm 2-3 projects cá nhân.</p><p><strong>Tháng 7-9:</strong> Học backend cơ bản (Node.js hoặc Python). Hiểu cách APIs hoạt động.</p><p><strong>Tháng 10-12:</strong> Ôn luyện giải thuật, xây dựng portfolio, apply internships/fresher positions.</p>',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200',
  11234, 'published', DATE_SUB(NOW(), INTERVAL 8 DAY), 'admin',
  '["chuyen-nghe","it","lai-tao","carreer-switch","fresher"]',
  'Hướng dẫn chuyển nghề sang IT 2026',
  'Lộ trình chi tiết 12 tháng để chuyển nghề sang IT cho người không có nền tảng kỹ thuật.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

SELECT CONCAT('Đã tạo ', COUNT(*), ' bài blog') AS status FROM blog_posts WHERE status = 'published';
