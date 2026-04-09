-- Seed 05: Tin tuyển dụng mẫu (published) — tra employer theo email user (ổn định hơn company_name)
-- Cần: 01_categories, 03_sample_users đã chạy

INSERT INTO jobs (
  employer_id, category_id, title, description, requirements, benefits,
  salary_min, salary_max, currency, location, experience_required, education_required,
  type, status, deadline
)
SELECT
  e.id,
  (SELECT id FROM categories WHERE name = 'Công nghệ thông tin' LIMIT 1),
  'Senior Full-stack Developer (React + Node)',
  'Tham gia phát triển nền tảng SaaS tuyển dụng AI. Làm việc với React, Node.js, MySQL, Docker.',
  '3+ năm kinh nghiệm frontend + backend. Thành thạo REST API, Git, CI/CD.',
  'BHXH, remote linh hoạt, review lương 6 tháng/lần.',
  20000000, 40000000, 'VND', 'Ha Noi', '3 years', 'bachelor',
  'full-time', 'published', DATE_ADD(CURDATE(), INTERVAL 45 DAY)
FROM employers e
INNER JOIN users u ON u.id = e.user_id
WHERE u.email = 'employer1@techcorp.vn'
  AND (SELECT id FROM categories WHERE name = 'Công nghệ thông tin' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jobs j WHERE j.employer_id = e.id AND j.title = 'Senior Full-stack Developer (React + Node)'
  )
LIMIT 1;

INSERT INTO jobs (
  employer_id, category_id, title, description, requirements, benefits,
  salary_min, salary_max, currency, location, experience_required, education_required,
  type, status, deadline
)
SELECT
  e.id,
  (SELECT id FROM categories WHERE name = 'Công nghệ thông tin' LIMIT 1),
  'DevOps Engineer (AWS / Kubernetes)',
  'Vận hành hạ tầng cloud, pipeline CI/CD, giám sát hiệu năng hệ thống.',
  'Kinh nghiệm AWS hoặc GCP, Kubernetes, Terraform.',
  'Lương cạnh tranh, học thêm chứng chỉ cloud.',
  18000000, 32000000, 'VND', 'Ha Noi', '2 years', 'bachelor',
  'full-time', 'published', DATE_ADD(CURDATE(), INTERVAL 30 DAY)
FROM employers e
INNER JOIN users u ON u.id = e.user_id
WHERE u.email = 'employer1@techcorp.vn'
  AND (SELECT id FROM categories WHERE name = 'Công nghệ thông tin' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jobs j WHERE j.employer_id = e.id AND j.title = 'DevOps Engineer (AWS / Kubernetes)'
  )
LIMIT 1;

INSERT INTO jobs (
  employer_id, category_id, title, description, requirements, benefits,
  salary_min, salary_max, currency, location, experience_required, education_required,
  type, status, deadline
)
SELECT
  e.id,
  (SELECT id FROM categories WHERE name = 'Marketing & Truyền thông' LIMIT 1),
  'Digital Marketing Lead',
  'Dẫn dắt chiến dịch performance marketing, quản lý ngân sách ads, báo cáo ROI.',
  '2+ năm Facebook/Google Ads, hiểu funnel B2B/B2C.',
  'Làm việc tại HCM, team trẻ, bonus theo KPI.',
  15000000, 25000000, 'VND', 'Ho Chi Minh', '2 years', 'bachelor',
  'full-time', 'published', DATE_ADD(CURDATE(), INTERVAL 60 DAY)
FROM employers e
INNER JOIN users u ON u.id = e.user_id
WHERE u.email = 'employer2@marketplus.vn'
  AND (SELECT id FROM categories WHERE name = 'Marketing & Truyền thông' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jobs j WHERE j.employer_id = e.id AND j.title = 'Digital Marketing Lead'
  )
LIMIT 1;

INSERT INTO jobs (
  employer_id, category_id, title, description, requirements, benefits,
  salary_min, salary_max, currency, location, experience_required, education_required,
  type, status, deadline
)
SELECT
  e.id,
  (SELECT id FROM categories WHERE name = 'Marketing & Truyền thông' LIMIT 1),
  'Content Marketing (B2B SaaS)',
  'Sản xuất nội dung blog, case study, email nurture cho sản phẩm phần mềm.',
  'Tiếng Việt chuẩn SEO, hiểu cơ bản về SaaS/HR tech là lợi thế.',
  'Hybrid, thứ 6 linh hoạt.',
  12000000, 18000000, 'VND', 'Ho Chi Minh', '1 years', 'bachelor',
  'full-time', 'published', DATE_ADD(CURDATE(), INTERVAL 40 DAY)
FROM employers e
INNER JOIN users u ON u.id = e.user_id
WHERE u.email = 'employer2@marketplus.vn'
  AND (SELECT id FROM categories WHERE name = 'Marketing & Truyền thông' LIMIT 1) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jobs j WHERE j.employer_id = e.id AND j.title = 'Content Marketing (B2B SaaS)'
  )
LIMIT 1;
