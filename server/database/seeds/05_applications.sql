-- ============================================
-- SEED 05: APPLICATIONS
-- Đơn ứng tuyển mẫu - phản ánh các trạng thái khác nhau
-- ============================================

SET NAMES utf8mb4;

-- ============================================
-- SETUP VARS (re-declare since each INSERT is independent)
-- ============================================

-- TechCorp Jobs
SET @JOB1 = (SELECT id FROM jobs WHERE slug = 'senior-fullstack-developer-react-node-techcorp' LIMIT 1);
SET @JOB2 = (SELECT id FROM jobs WHERE slug = 'devops-engineer-aws-k8s-techcorp' LIMIT 1);
SET @JOB3 = (SELECT id FROM jobs WHERE slug = 'ai-ml-engineer-techcorp' LIMIT 1);
SET @JOB4 = (SELECT id FROM jobs WHERE slug = 'frontend-developer-vuejs-techcorp' LIMIT 1);

-- Nextech Jobs
SET @JOB5 = (SELECT id FROM jobs WHERE slug = 'senior-java-developer-japan-nextech' LIMIT 1);
SET @JOB6 = (SELECT id FROM jobs WHERE slug = 'mobile-developer-react-native-nextech' LIMIT 1);

-- GreenLeaf Jobs
SET @JOB7 = (SELECT id FROM jobs WHERE slug = 'performance-marketing-manager-greenleaf' LIMIT 1);
SET @JOB8 = (SELECT id FROM jobs WHERE slug = 'content-marketing-specialist-greenleaf' LIMIT 1);
SET @JOB9 = (SELECT id FROM jobs WHERE slug = 'social-media-specialist-greenleaf' LIMIT 1);

-- HRPro Jobs
SET @JOB10 = (SELECT id FROM jobs WHERE slug = 'headhunting-consultant-it-hrpro' LIMIT 1);

-- EduFirst Jobs
SET @JOB11 = (SELECT id FROM jobs WHERE slug = 'instructional-designer-edufirst' LIMIT 1);
SET @JOB12 = (SELECT id FROM jobs WHERE slug = 'freelance-content-writer-english-edufirst' LIMIT 1);

-- Nextech Intern
SET @JOB13 = (SELECT id FROM jobs WHERE slug = 'software-engineer-intern-java-nextech' LIMIT 1);

-- MedHealth Jobs
SET @JOB14 = (SELECT id FROM jobs WHERE slug = 'healthcare-software-engineer-medhealth' LIMIT 1);

-- GreenLeaf Designer
SET @JOB15 = (SELECT id FROM jobs WHERE slug = 'senior-ui-ux-designer-greenleaf' LIMIT 1);

-- Negotiable salary jobs
SET @JOB16 = (SELECT id FROM jobs WHERE slug = 'technical-product-manager-ai-platform-techcorp' LIMIT 1);
SET @JOB17 = (SELECT id FROM jobs WHERE slug = 'creative-strategy-lead-greenleaf' LIMIT 1);
SET @JOB18 = (SELECT id FROM jobs WHERE slug = 'healthcare-product-owner-medhealth' LIMIT 1);

-- Candidate Profiles
SET @CAND1 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'hung.lee@gmail.com'));
SET @CAND2 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'nam.pham@gmail.com'));
SET @CAND3 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'lan.phan@gmail.com'));
SET @CAND4 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'my.nguyen@gmail.com'));
SET @CAND5 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'khoa.tran@gmail.com'));
SET @CAND6 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'linh.hoang@gmail.com'));
SET @CAND7 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'phuong.tran@gmail.com'));
SET @CAND8 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tu.ho@gmail.com'));
SET @CAND9 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'vy.nguyen@gmail.com'));
SET @CAND10 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'huy.dao@gmail.com'));
SET @CAND11 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tuan.vo@gmail.com'));
SET @CAND12 = (SELECT id FROM candidate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'nhi.le@gmail.com'));

-- Admin user for assessment
SET @ADMIN_USER = (SELECT id FROM users WHERE email = 'admin@hirebot.vn');

-- ============================================
-- APPLICATIONS - Full-stack Dev (Hùng)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND1, @JOB1, 'interview_scheduled', 'Tôi có 4 năm kinh nghiệm full-stack với React và Node.js. Đã xây dựng hệ thống SaaS cho 3 startup. Tôi rất hào hứng với dự án hướng sản phẩm AI của TechCorp và tin rằng kỹ năng của tôi phù hợp với team.', 87.5, 'Ứng viên rất phù hợp. 4 năm React/Node, có kinh nghiệm SaaS. Cover letter có số liệu cụ thể.', DATE_SUB(NOW(), INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND1, @JOB2, 'shortlisted', 'Tôi có kinh nghiệm với AWS và đã tự học Kubernetes. Muốn chuyển hướng từ development sang DevOps.', 72.0, DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND1, @JOB5, 'submitted', 'Dù không có kinh nghiệm Java chuyên sâu, tôi có nền tảng OOP vững và sẵn sàng học Spring Boot nhanh.', 68.5, DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Frontend Dev (Nam)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND2, @JOB4, 'interview_scheduled', 'Tôi chuyên về Vue.js trong 2 năm qua, xây dựng các dashboard phức tạp với Pinia. Rất thích culture của TechCorp.', 82.0, 'Ứng viên phù hợp với yêu cầu Vue.js. Đã làm dashboard với state management phức tạp.', DATE_SUB(NOW(), INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND2, @JOB15, 'shortlisted', 'Ngoài frontend, tôi cũng có kinh nghiệm UI/UX design. Portfolio của tôi có cả design và implementation.', 75.5, DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Digital Marketing (Lan)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND3, @JOB7, 'offered', 'Tôi đã quản lý ngân sách 200 triệu/tháng trên Google và Facebook, đạt ROAS 4.5x cho các chiến dịch e-commerce. Đây là vị trí tôi muốn phát triển lâu dài.', 91.0, 'Ứng viên xuất sắc. Có metrics rõ ràng với ROAS 4.5x. Rất phù hợp với vị trí Manager.', DATE_SUB(NOW(), INTERVAL 15 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND3, @JOB8, 'interview_scheduled', 'Tôi viết content SEO từ 2 năm, hiểu rõ cách viết cho SaaS và HR tech. Đã publish 50+ bài trên blog doanh nghiệp.', 79.0, DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND3, @JOB9, 'rejected', 'Tôi muốn thử sức với social media, dù kinh nghiệm chủ yếu là content.', 65.0, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Content Marketing (My)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND4, @JOB8, 'interview_scheduled', 'Tôi chuyên về SEO content và đã xây dựng content strategy cho 5 doanh nghiệp SaaS. Hiểu cách content drives growth.', 85.5, DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND4, @JOB12, 'submitted', 'Native English speaker với kinh nghiệm viết cho EdTech platform. Portfolio có các bài lesson plans và video scripts.', 88.0, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Accountant (Khoa)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND5, @JOB14, 'shortlisted', 'Kinh nghiệm 5 năm kế toán, muốn chuyển sang healthcare data vì thấy potential của ngành.', 71.0, DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - UI/UX Designer (Linh)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND6, @JOB15, 'interview_scheduled', '4 năm UI/UX, đã design cho 2 SaaS products và 1 app với 100K+ users. Portfolio: linhhoang.design', 89.0, 'Design portfolio ấn tượng với metrics rõ ràng. Có experience với SaaS products.', DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - HR (Phương)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND7, @JOB10, 'interview_scheduled', 'Làm HR 3 năm trong ngành IT, đã tuyển 50+ vị trí tech. Network IT rộng, sẵn sàng bán deal headhunting.', 83.5, DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND7, @JOB9, 'withdrawn', 'Sau khi nộp tôi nhận được offer khác phù hợp hơn.', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Data Analyst (Huy)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND10, @JOB14, 'submitted', 'Data Analyst muốn chuyển sang healthcare domain. Python, SQL, Tableau là các công cụ chính của tôi.', 76.5, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Fresher (Tuấn)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND11, @JOB13, 'interview_scheduled', 'Sinh viên CNTT Bách Khoa, đã làm 3 projects cá nhân với React và Node.js. Tôi học nhanh và nhiệt tình.', 78.0, DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND11, @JOB6, 'shortlisted', 'Dù kinh nghiệm React Native hạn chế, tôi có nền tảng React vững và sẵn sàng học RN nhanh chóng.', 69.0, DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - Marketing Intern (Nhi)
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND12, @JOB9, 'interview_scheduled', 'Sinh viên Marketing năm 4, đam mê social media và muốn học hỏi từ agency thực thụ. Tôi có personal blog với 5K followers.', 74.5, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND12, @JOB8, 'rejected', 'Tôi mới vào nghề, nhưng rất nhiệt tình và sẵn sàng học hỏi.', 58.0, DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATIONS - NEGOTIABLE SALARY JOBS
-- ============================================
INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND1, @JOB16, 'shortlisted', 'Tôi có kinh nghiệm phối hợp product, engineering và khách hàng enterprise trong các dự án SaaS. Phần khó nhất với tôi luôn là biến yêu cầu mơ hồ thành roadmap và spec đủ rõ để team triển khai.', 84.0, 'Ứng viên phù hợp với bối cảnh SaaS và khả năng làm việc đa phòng ban. Có thể tiếp tục đánh giá về kỹ năng product discovery.', DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, ai_summary, applied_at)
VALUES
  (@CAND3, @JOB17, 'interview_scheduled', 'Tôi đã phụ trách creative strategy cho nhiều chiến dịch performance và brand, đặc biệt mạnh ở việc biến insight thành concept có thể triển khai nhanh trên social và paid media.', 88.5, 'Ứng viên có định hướng chiến lược rõ, phù hợp với vai trò creative lead. Nên ưu tiên phỏng vấn để đánh giá portfolio thực chiến.', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO applications (candidate_id, job_id, status, cover_letter, ai_score, applied_at)
VALUES
  (@CAND10, @JOB18, 'submitted', 'Tôi muốn chuyển sâu vào mảng healthtech product và có thế mạnh về phân tích dữ liệu, phối hợp business và chuẩn hóa yêu cầu nghiệp vụ.', 77.0, DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- APPLICATION HISTORY SAMPLES
-- ============================================
INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes, created_at)
SELECT
  a.id, 'status_change', NULL, 'shortlisted', @ADMIN_USER, 'Ứng viên tiềm năng, đưa vào danh sách rút gọn', DATE_SUB(NOW(), INTERVAL 9 DAY)
FROM applications a WHERE a.status = 'shortlisted' LIMIT 1
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes, created_at)
SELECT
  a.id, 'status_change', 'shortlisted', 'interview_scheduled', @ADMIN_USER, 'Profile phù hợp, mời phỏng vấn', DATE_SUB(NOW(), INTERVAL 8 DAY)
FROM applications a WHERE a.status = 'interview_scheduled' LIMIT 1
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

INSERT INTO application_history (application_id, action, old_status, new_status, changed_by, notes, created_at)
SELECT
  a.id, 'status_change', 'interview_scheduled', 'offered', @ADMIN_USER, 'Phỏng vấn tốt, đề xuất offer', DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM applications a WHERE a.status = 'offered' LIMIT 1
ON DUPLICATE KEY UPDATE notes = VALUES(notes);

-- ============================================
-- SAVED JOBS
-- ============================================
INSERT INTO saved_jobs (candidate_id, job_id) VALUES
  (@CAND1, @JOB5),
  (@CAND2, @JOB15),
  (@CAND3, @JOB7),
  (@CAND6, @JOB7),
  (@CAND4, @JOB17),
  (@CAND10, @JOB18),
  (@CAND11, @JOB5),
  (@CAND11, @JOB1)
ON DUPLICATE KEY UPDATE created_at = VALUES(created_at);

-- ============================================
-- SKILL MATCHES (candidate_skills sample)
-- ============================================
SET @SK_JS = (SELECT id FROM skills WHERE slug = 'javascript');
SET @SK_REACT = (SELECT id FROM skills WHERE slug = 'reactjs');
SET @SK_NODE = (SELECT id FROM skills WHERE slug = 'nodejs');
SET @SK_TS = (SELECT id FROM skills WHERE slug = 'typescript');
SET @SK_PY = (SELECT id FROM skills WHERE slug = 'python');
SET @SK_SQL = (SELECT id FROM skills WHERE slug = 'postgresql');
SET @SK_AWS = (SELECT id FROM skills WHERE slug = 'aws');
SET @SK_DOCKER = (SELECT id FROM skills WHERE slug = 'docker');
SET @SK_VUE = (SELECT id FROM skills WHERE slug = 'vuejs');
SET @SK_SEO = (SELECT id FROM skills WHERE slug = 'seo');
SET @SK_GOOGLE_ADS = (SELECT id FROM skills WHERE slug = 'google-ads');
SET @SK_FB_ADS = (SELECT id FROM skills WHERE slug = 'facebook-ads');
SET @SK_CONTENT = (SELECT id FROM skills WHERE slug = 'content-marketing');
SET @SK_FIGMA = (SELECT id FROM skills WHERE slug = 'figma');
SET @SK_UIUX = (SELECT id FROM skills WHERE slug = 'ui-ux-design');
SET @SK_HR = (SELECT id FROM skills WHERE slug = 'tuyen-dung');
SET @SK_DATA = (SELECT id FROM skills WHERE slug = 'postgresql');
SET @SK_HTML_CSS = (SELECT id FROM skills WHERE slug = 'html-css');

INSERT INTO candidate_skills (candidate_id, skill_id, proficiency_level, years_experience) VALUES
  (@CAND1, @SK_JS, 'expert', 4),
  (@CAND1, @SK_REACT, 'advanced', 3),
  (@CAND1, @SK_NODE, 'advanced', 3),
  (@CAND1, @SK_TS, 'intermediate', 2),
  (@CAND1, @SK_SQL, 'advanced', 4),
  (@CAND1, @SK_DOCKER, 'intermediate', 2),
  (@CAND2, @SK_VUE, 'advanced', 2),
  (@CAND2, @SK_JS, 'advanced', 3),
  (@CAND2, @SK_TS, 'intermediate', 2),
  (@CAND2, @SK_HTML_CSS, 'expert', 3),
  (@CAND3, @SK_GOOGLE_ADS, 'advanced', 2),
  (@CAND3, @SK_FB_ADS, 'advanced', 2),
  (@CAND3, @SK_SEO, 'intermediate', 2),
  (@CAND3, @SK_CONTENT, 'advanced', 2),
  (@CAND4, @SK_CONTENT, 'expert', 3),
  (@CAND4, @SK_SEO, 'advanced', 3),
  (@CAND6, @SK_FIGMA, 'expert', 4),
  (@CAND6, @SK_UIUX, 'expert', 4),
  (@CAND6, @SK_HTML_CSS, 'advanced', 4),
  (@CAND7, @SK_HR, 'advanced', 3),
  (@CAND10, @SK_PY, 'intermediate', 2),
  (@CAND10, @SK_DATA, 'advanced', 2)
ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level);

SELECT CONCAT('Đã tạo ', COUNT(*), ' đơn ứng tuyển') AS status FROM applications;
