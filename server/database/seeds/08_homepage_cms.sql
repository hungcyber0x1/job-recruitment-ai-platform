-- ============================================
-- SEED 08: HOMEPAGE CMS
-- Homepage content for sections, stats, testimonials, and partners
-- ============================================

SET NAMES utf8mb4;

SET @ADMIN_USER = (SELECT id FROM users WHERE email = 'admin@hirebot.vn');

-- ============================================
-- HOMEPAGE SECTIONS
-- ============================================
INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('hero', 'hero',
 'Find Your Next Great Job',
 'Explore 10,000+ open roles from leading companies across Vietnam',
 TRUE, 1,
 '{"cta_primary": "Find jobs", "cta_secondary": "Post a job", "search_placeholder": "Search jobs, skills, companies..."}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('features', 'features',
 'Why HireBOT',
 'An AI-powered hiring platform for candidates and employers',
 TRUE, 2,
 '{"items": ["High-quality candidate profiles", "Automated resume analysis", "Actionable career guidance", "24/7 assistance"]}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('how_it_works', 'how_it_works',
 'Get hired in 3 simple steps',
 'Move from profile setup to application in minutes',
 TRUE, 3,
 '{"step1": {"title": "Create your profile", "desc": "Upload your CV or complete your profile"}, "step2": {"title": "Get AI recommendations", "desc": "Receive job matches tailored to your profile"}, "step3": {"title": "Apply instantly", "desc": "Submit your application in one click"}}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('testimonials', 'testimonials',
 'How candidates found their next role',
 'Stories from successful candidates on HireBOT',
 TRUE, 4,
 '{"total_testimonials": 5}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('stats', 'stats',
 NULL, NULL, TRUE, 5, '{"title": "Platform at a glance"}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('partners', 'partners',
 'Được tin tưởng bởi',
 '500+ leading companies in Vietnam',
 TRUE, 6, '{}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order, metadata)
VALUES
('cta', 'cta',
 'Ready to get started?',
 'Create your free profile and discover better-fit opportunities today',
 TRUE, 7,
 '{"cta_primary": "Create a free account", "cta_secondary": "Learn more"}')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- HOMEPAGE STATS
-- ============================================
SET @STATS_SEC = (SELECT id FROM homepage_sections WHERE section_key = 'stats');

INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order, is_active)
VALUES
  (@STATS_SEC, 'briefcase', '10,247+', 'Open jobs', 'number', 1, TRUE)
ON DUPLICATE KEY UPDATE display_value = VALUES(display_value);

INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order, is_active)
VALUES
  (@STATS_SEC, 'building', '500+', 'Trusted companies', 'number', 2, TRUE)
ON DUPLICATE KEY UPDATE display_value = VALUES(display_value);

INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order, is_active)
VALUES
  (@STATS_SEC, 'users', '50,000+', 'Successful candidates', 'number', 3, TRUE)
ON DUPLICATE KEY UPDATE display_value = VALUES(display_value);

INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order, is_active)
VALUES
  (@STATS_SEC, 'trending-up', '85%', 'Interview success rate', 'percentage', 4, TRUE)
ON DUPLICATE KEY UPDATE display_value = VALUES(display_value);

-- ============================================
-- TESTIMONIALS
-- ============================================
SET @TESTI_SEC = (SELECT id FROM homepage_sections WHERE section_key = 'testimonials');

INSERT INTO homepage_testimonials (section_id, author_name, author_role, author_avatar, content, rating, display_order, is_active)
VALUES
  (@TESTI_SEC, 'Nguyen Van Hung', 'Senior Full-Stack Developer at FPT Software',
   'https://i.pravatar.cc/150?u=hung_fpt',
   'I landed my dream job within two weeks of using HireBOT. The platform surfaced relevant roles quickly and made it easy to focus on the best-fit opportunities.',
   5, 1, TRUE)
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO homepage_testimonials (section_id, author_name, author_role, author_avatar, content, rating, display_order, is_active)
VALUES
  (@TESTI_SEC, 'Tran Thi Lan', 'Performance Marketing Manager at TechCorp',
   'https://i.pravatar.cc/150?u=lan_tech',
   'The resume analysis feature helped me improve my CV quickly. I received three offers within a month. Highly recommended.',
   5, 2, TRUE)
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT INTO homepage_testimonials (section_id, author_name, author_role, author_avatar, content, rating, display_order, is_active)
VALUES
  (@TESTI_SEC, 'Le Hoang Nam', 'Frontend Developer (React)',
   'https://i.pravatar.cc/150?u=nam_frontend',
   'The experience is easy to use and fast. I especially like the saved jobs flow and notifications when new matching jobs are published.',
   4, 3, TRUE)
ON DUPLICATE KEY UPDATE content = VALUES(content);

-- ============================================
-- PARTNERS / BRANDS
-- ============================================
SET @PARTNER_SEC = (SELECT id FROM homepage_sections WHERE section_key = 'partners');

INSERT INTO homepage_partners (section_id, name, logo_url, website_url, display_order, is_active)
VALUES
  (@PARTNER_SEC, 'FPT Software', 'https://commons.wikimedia.org/wiki/Special:FilePath/FPT%20Software%20logo.svg', 'https://fpt.com.vn', 1, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO homepage_partners (section_id, name, logo_url, website_url, display_order, is_active)
VALUES
  (@PARTNER_SEC, 'Viettel Solutions', 'https://commons.wikimedia.org/wiki/Special:FilePath/Viettel%20logo%202021.svg', 'https://viettelsolutions.vn', 2, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO homepage_partners (section_id, name, logo_url, website_url, display_order, is_active)
VALUES
  (@PARTNER_SEC, 'VNG Corporation', 'https://commons.wikimedia.org/wiki/Special:FilePath/VNG%20Corp.%20logo.svg', 'https://vng.com.vn', 3, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO homepage_partners (section_id, name, logo_url, website_url, display_order, is_active)
VALUES
  (@PARTNER_SEC, 'CMC Corporation', 'https://commons.wikimedia.org/wiki/Special:FilePath/CMC%20logo%202018.png', 'https://cmc.com.vn', 4, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SELECT CONCAT('Homepage CMS seeded: ',
  (SELECT COUNT(*) FROM homepage_sections), ' sections, ',
  (SELECT COUNT(*) FROM homepage_stats), ' stats, ',
  (SELECT COUNT(*) FROM homepage_testimonials), ' testimonials, ',
  (SELECT COUNT(*) FROM homepage_partners), ' partners') AS status;
