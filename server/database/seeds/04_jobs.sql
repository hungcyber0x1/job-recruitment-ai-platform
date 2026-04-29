-- ============================================
-- SEED 04: JOBS
-- Tin tuyển dụng mẫu - phân bổ theo ngành và vị trí
-- ============================================

SET NAMES utf8mb4;

-- Helper variables
SET @LOC_HN = (SELECT id FROM locations WHERE slug = 'ha-noi');
SET @LOC_HCM = (SELECT id FROM locations WHERE slug = 'ho-chi-minh');
SET @LOC_DN = (SELECT id FROM locations WHERE slug = 'da-nang');
SET @LOC_REMOTE = (SELECT id FROM locations WHERE slug = 'remote-toan-quoc');
SET @LOC_BD = (SELECT id FROM locations WHERE slug = 'binh-duong');
SET @LOC_HP = (SELECT id FROM locations WHERE slug = 'hai-phong');

SET @CAT_CNTT = (SELECT id FROM categories WHERE slug = 'cntt');
SET @CAT_MK = (SELECT id FROM categories WHERE slug = 'marketing');
SET @CAT_TC = (SELECT id FROM categories WHERE slug = 'tai-chinh');
SET @CAT_KD = (SELECT id FROM categories WHERE slug = 'kinh-doanh');
SET @CAT_NS = (SELECT id FROM categories WHERE slug = 'nhan-su');
SET @CAT_KT = (SELECT id FROM categories WHERE slug = 'ky-thuat');
SET @CAT_TK = (SELECT id FROM categories WHERE slug = 'thiet-ke');
SET @CAT_YT = (SELECT id FROM categories WHERE slug = 'y-te');
SET @CAT_LG = (SELECT id FROM categories WHERE slug = 'logistics');
SET @CAT_GD = (SELECT id FROM categories WHERE slug = 'giao-duc');

SET @COMP_TECH = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'minh.nguyen@techcorp.vn'));
SET @COMP_NEXTECH = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'khanh.pham@nextech.vn'));
SET @COMP_GREEN = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'uyen.nguyen@greenleaf.vn'));
SET @COMP_HRPRO = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'hieu.nguyen@hrpro.vn'));
SET @COMP_MED = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'thao.le@medhealth.vn'));
SET @COMP_EDU = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'duong.tran@edufirst.vn'));
SET @COMP_LOG = (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'mai.hoang@logisticpro.vn'));

SET @USER_MINH = (SELECT id FROM users WHERE email = 'minh.nguyen@techcorp.vn');
SET @USER_LINH = (SELECT id FROM users WHERE email = 'linh.tran@techcorp.vn');
SET @USER_KHANH = (SELECT id FROM users WHERE email = 'khanh.pham@nextech.vn');
SET @USER_UYEN = (SELECT id FROM users WHERE email = 'uyen.nguyen@greenleaf.vn');
SET @USER_HIEU = (SELECT id FROM users WHERE email = 'hieu.nguyen@hrpro.vn');
SET @USER_THAO = (SELECT id FROM users WHERE email = 'thao.le@medhealth.vn');
SET @USER_DUONG = (SELECT id FROM users WHERE email = 'duong.tran@edufirst.vn');
SET @USER_MAI = (SELECT id FROM users WHERE email = 'mai.hoang@logisticpro.vn');

-- ============================================
-- TECH JOBS (TechCorp Vietnam)
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_MINH, @CAT_CNTT,
  'Senior Full-stack Developer (React + Node.js)',
  'senior-fullstack-developer-react-node-techcorp',
  '<p>TechCorp đang tìm Senior Full-stack Developer để tham gia phát triển nền tảng SaaS tuyển dụng AI của chúng tôi. Bạn sẽ làm việc trong team 8 người, phát triển tính năng mới và tối ưu hệ thống hiện tại.</p><h3>Mô tả công việc</h3><ul><li>Phát triển các tính năng mới trên nền tảng web</li><li>Thiết kế và triển khai RESTful API</li><li>Tối ưu hiệu suất ứng dụng và database queries</li><li>Viết unit test và integration test</li><li>Review code của team members</li></ul>',
  '<ul><li>3+ năm kinh nghiệm với React và Node.js</li><li>Thành thạo TypeScript, PostgreSQL, Redis</li><li>Kinh nghiệm với Docker, CI/CD</li><li>Hiểu biết về cloud services (AWS/GCP)</li><li>Kỹ năng giải quyết vấn đề tốt</li></ul>',
  '<ul><li>Lương cạnh tranh: 25-45 triệu VNĐ</li><li>Review lương 2 lần/năm</li><li>BHXH, BHYT đầy đủ</li><li>Remote 2 ngày/tuần</li><li>Thứ 6 nghỉ buổi chiều</li><li>Learning budget: 15 triệu/năm</li></ul>',
  25000000, 45000000, '25 - 45 triệu VNĐ', @LOC_HN, 'Tầng 20, Tòa nhà Tech Tower, Quận Cầu Giấy, Hà Nội', 'full_time', 'senior', 'published', TRUE, 342, 12, DATE_ADD(CURDATE(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_MINH, @CAT_CNTT,
  'DevOps Engineer (AWS / Kubernetes)',
  'devops-engineer-aws-k8s-techcorp',
  '<p>Tham gia team Infrastructure để vận hành và phát triển hạ tầng cloud cho các sản phẩm của TechCorp. Bạn sẽ thiết lập CI/CD pipeline, giám sát hệ thống và đảm bảo uptime 99.9%.</p><h3>Trách nhiệm</h3><ul><li>Thiết kế và triển khai Kubernetes clusters</li><li>Xây dựng và tối ưu CI/CD pipelines</li><li>Giám sát logs và metrics với Prometheus/Grafana</li><li>Xử lý incidents và on-call rotation</li></ul>',
  '<ul><li>2+ năm kinh nghiệm với AWS hoặc GCP</li><li>Kinh nghiệm với Kubernetes, Terraform</li><li>Hiểu biết về networking, security</li><li>Chứng chỉ AWS Solution Architect là điểm cộng</li></ul>',
  '<ul><li>Lương: 22-38 triệu VNĐ</li><li>Remote hoàn toàn có thể thương lượng</li><li>Chứng chỉ cloud được sponsor</li><li>Team building hàng quý</li></ul>',
  22000000, 38000000, '22 - 38 triệu VNĐ', @LOC_HN, 'Remote / Hà Nội', 'full_time', 'mid', 'published', FALSE, 189, 5, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_LINH, @CAT_CNTT,
  'AI/ML Engineer',
  'ai-ml-engineer-techcorp',
  '<p>Xây dựng và triển khai các mô hình ML cho hệ thống matching ứng viên - việc làm. Nghiên cứu và áp dụng LLM, NLP để cải thiện trải nghiệm người dùng.</p>',
  '<ul><li>2+ năm kinh nghiệm Machine Learning</li><li>Thành thạo Python, TensorFlow/PyTorch</li><li>Hiểu biết về NLP, RAG, fine-tuning</li><li>Kin nghiệm với vector databases</li></ul>',
  '<ul><li>Lương: 30-55 triệu VNĐ</li><li>Research budget cho papers</li><li>Conference attendance</li><li>GPU computing budget</li></ul>',
  30000000, 55000000, '30 - 55 triệu VNĐ', @LOC_HN, 'Hà Nội / Remote', 'full_time', 'senior', 'published', TRUE, 276, 8, DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_LINH, @CAT_CNTT,
  'Frontend Developer (Vue.js)',
  'frontend-developer-vuejs-techcorp',
  '<p>TechCorp tìm Frontend Developer có kinh nghiệm Vue.js để phát triển giao diện người dùng cho nền tảng tuyển dụng.</p>',
  '<ul><li>1-3 năm kinh nghiệm Vue.js hoặc React</li><li>Thành thạo HTML, CSS, JavaScript</li><li>Kinh nghiệm với Pinia/Vuex</li><li>Hiểu về responsive design</li></ul>',
  '<ul><li>Lương: 15-25 triệu VNĐ</li><li>Hybrid, flexible hours</li><li>Mentorship từ senior devs</li></ul>',
  15000000, 25000000, '15 - 25 triệu VNĐ', @LOC_HN, 'Hà Nội', 'full_time', 'mid', 'published', FALSE, 98, 3, DATE_ADD(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- NEXTTECH JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Senior Java Developer (Nhật Bản)',
  'senior-java-developer-japan-nextech',
  '<p>Nextech Solutions cần Senior Java Developer cho dự án offshore với đối tác Nhật Bản. Cơ hội làm việc trực tiếp với khách hàng Nhật, phát triển hệ thống enterprise.</p><h3>Điểm đặc biệt</h3><ul><li>Làm việc với đối tác Nhật Bản</li><li>Cơ hội đi công tác Tokyo</li><li>Đào tạo tiếng Nhật miễn phí</li></ul>',
  '<ul><li>4+ năm kinh nghiệm Java (Spring Boot)</li><li>Thành thạo PostgreSQL, Redis</li><li>Có kinh nghiệm làm việc với khách hàng Nhật là điểm cộng</li><li>Tiếng Nhật N3 trở lên là lợi thế</li><li>Kỹ năng giao tiếp tốt</li></ul>',
  '<ul><li>Lương: 30-50 triệu VNĐ + allowance</li><li>Allowance Nhật ngữ: 3 triệu/tháng</li><li>Bảo hiểm cao cấp</li><li>Du lịch Nhật Bản 2 lần/năm</li><li>Đào tạo tiếng Nhật N1</li></ul>',
  30000000, 50000000, '30 - 50 triệu VNĐ + allowance', @LOC_HCM, 'Quận 7, TP. Hồ Chí Minh', 'full_time', 'senior', 'published', TRUE, 421, 15, DATE_ADD(CURDATE(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Mobile Developer (React Native)',
  'mobile-developer-react-native-nextech',
  '<p>Phát triển ứng dụng di động cross-platform cho khách hàng Nhật Bản và châu Âu.</p>',
  '<ul><li>2+ năm React Native</li><li>Thành thạo TypeScript, Redux</li><li>Kinh nghiệm App Store/Play Store deployment</li></ul>',
  '<ul><li>Lương: 18-30 triệu VNĐ</li><li>Project bonus</li><li>Đào tạo chuyên môn</li></ul>',
  18000000, 30000000, '18 - 30 triệu VNĐ', @LOC_HCM, 'Quận 7, TP. HCM', 'full_time', 'mid', 'published', FALSE, 156, 7, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Python Developer (Data Pipeline)',
  'python-developer-data-pipeline-nextech',
  '<p>Xây dựng và duy trì các data pipelines cho hệ thống enterprise của khách hàng.</p>',
  '<ul><li>2+ năm Python</li><li>Kinh nghiệm với Airflow, ETL</li><li>Thành thạo SQL, data modeling</li></ul>',
  '<ul><li>Lương: 20-32 triệu VNĐ</li><li>Remote possible</li></ul>',
  20000000, 32000000, '20 - 32 triệu VNĐ', @LOC_HCM, 'TP. Hồ Chí Minh', 'full_time', 'mid', 'published', FALSE, 87, 4, DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- GREENLEAF MARKETING JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_MK,
  'Performance Marketing Manager',
  'performance-marketing-manager-greenleaf',
  '<p>GreenLeaf Digital Agency tìm Performance Marketing Manager để dẫn dắt team ads và tối ưu chiến dịch cho 30+ khách hàng.</p><h3>Trách nhiệm chính</h3><ul><li>Quản lý và tối ưu chiến dịch Google Ads, Facebook Ads</li><li>Báo cáo ROI cho khách hàng</li><li>Mentor team 3 Performance Specialists</li><li>Đề xuất chiến lược media planning</li></ul>',
  '<ul><li>3+ năm Performance Marketing</li><li>Thành thạo Google Ads, Facebook Ads, TikTok Ads</li><li>Kinh nghiệm quản lý ngân sách từ 500 triệu/tháng</li><li>Chứng chỉ Google Ads là bắt buộc</li><li>Tư duy data-driven</li></ul>',
  '<ul><li>Lương: 20-35 triệu VNĐ + commission</li><li>Commission theo performance team</li><li>Team năng động, trẻ trung</li><li>Đào tạo chứng chỉ Google</li></ul>',
  20000000, 35000000, '20 - 35 triệu VNĐ + commission', @LOC_HCM, 'Quận 3, TP. Hồ Chí Minh', 'full_time', 'senior', 'published', TRUE, 534, 22, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_MK,
  'Content Marketing Specialist',
  'content-marketing-specialist-greenleaf',
  '<p>Tạo nội dung sáng tạo cho blog, social media và case study của khách hàng.</p>',
  '<ul><li>2+ năm Content Marketing</li><li>Kỹ năng viết SEO tốt</li><li>Hiểu biết về SaaS, HR Tech</li></ul>',
  '<ul><li>Lương: 12-18 triệu VNĐ</li><li>Hybrid</li><li>Creative freedom</li></ul>',
  12000000, 18000000, '12 - 18 triệu VNĐ', @LOC_HCM, 'TP. Hồ Chí Minh', 'full_time', 'mid', 'published', FALSE, 234, 9, DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_MK,
  'Social Media Specialist',
  'social-media-specialist-greenleaf',
  '<p>Quản lý và phát triển presence trên social media cho các thương hiệu khách hàng.</p>',
  '<ul><li>1-2 năm kinh nghiệm social media</li><li>Portfolio với content đã thực hiện</li><li>Khả năng copy ngắn, hài hước</li></ul>',
  '<ul><li>Lương: 10-15 triệu VNĐ</li><li>Thử việc 2 tháng</li></ul>',
  10000000, 15000000, '10 - 15 triệu VNĐ', @LOC_HCM, 'TP. Hồ Chí Minh', 'full_time', 'entry', 'published', FALSE, 189, 14, DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- HRPRO JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_HRPRO, @USER_HIEU, @CAT_NS,
  'Headhunting Consultant (IT)',
  'headhunting-consultant-it-hrpro',
  '<p>HR Pro Services tìm Headhunting Consultant chuyên tuyển dụng nhân sự cấp cao cho ngành IT. Đây là vị trí quan trọng trong team consulting của chúng tôi.</p><h3>Quyền lợi đặc biệt</h3><ul><li>Base salary + very high commission</li><li>Đào tạo headhunting skills chuyên nghiệp</li><li>Network với CIO/CTO các công ty lớn</li></ul>',
  '<ul><li>2+ năm kinh nghiệm headhunting hoặc recruiting cho IT</li><li>Network sẵn có trong ngành IT là điểm cộng lớn</li><li>Kỹ năng giao tiếp, negotiation xuất sắc</li><li>Tốt nghiệp đại học</li></ul>',
  '<ul><li>Lương base: 15-20 triệu + commission (15-30% deal)</li><li>Deal trung bình: 50-150 triệu/case</li><li>Full benefits</li><li>Flexible working hours</li></ul>',
  15000000, 20000000, '15 - 20 triệu + commission', @LOC_HN, 'Quận Ba Đình, Hà Nội', 'full_time', 'mid', 'published', FALSE, 312, 11, DATE_ADD(CURDATE(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_HRPRO, @USER_HIEU, @CAT_NS,
  'HRIS Implementation Specialist',
  'hris-implementation-specialist-hrpro',
  '<p>Triển khai và config HRIS cho khách hàng doanh nghiệp.</p>',
  '<ul><li>1-3 năm HRIS implementation</li><li>Kinh nghiệm với SAP SuccessFactors, Workday, hoặc HRMS</li><li>Kỹ năng training end users</li></ul>',
  '<ul><li>Lương: 18-25 triệu VNĐ</li><li>Remote 50%</li><li>Certification sponsor</li></ul>',
  18000000, 25000000, '18 - 25 triệu VNĐ', @LOC_HN, 'Hà Nội / Remote', 'full_time', 'mid', 'published', FALSE, 98, 4, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- MEDHEALTH JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_MED, @USER_THAO, @CAT_CNTT,
  'Healthcare Software Engineer',
  'healthcare-software-engineer-medhealth',
  '<p>MedHealth Corp đang tìm Software Engineer để phát triển nền tảng telemedicine và hệ thống quản lý bệnh viện thông minh.</p><h3>Tính chất công việc</h3><ul><li>Phát triển RESTful APIs cho ứng dụng y tế</li><li>Tích hợp với HIS/HMS systems</li><li>Tuân thủ HIPAA và các tiêu chuẩn y tế</li></ul>',
  '<ul><li>2+ năm backend development</li><li>Thành thạo Node.js hoặc Python</li><li>Kinh nghiệm với HL7 FHIR là điểm cộng</li><li>Hiểu biết về data privacy trong y tế</li></ul>',
  '<ul><li>Lương: 20-35 triệu VNĐ</li><li>Bảo hiểm sức khỏe cao cấp (gia đình)</li><li>Đào tạo healthcare IT standards</li><li>Remote 1-2 ngày/tuần</li></ul>',
  20000000, 35000000, '20 - 35 triệu VNĐ', @LOC_HCM, 'Quận Tân Bình, TP. Hồ Chí Minh', 'full_time', 'mid', 'published', FALSE, 267, 9, DATE_ADD(CURDATE(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_MED, @USER_THAO, @CAT_TC,
  'Medical Data Analyst',
  'medical-data-analyst-medhealth',
  '<p>Phân tích dữ liệu y tế để hỗ trợ quyết định lâm sàng và kinh doanh.</p>',
  '<ul><li>2+ năm data analysis</li><li>Thành thạo SQL, Python hoặc R</li><li>Kinh nghiệm healthcare data là điểm cộng</li><li>Hiểu biết về medical coding</li></ul>',
  '<ul><li>Lương: 18-28 triệu VNĐ</li><li>Full benefits</li></ul>',
  18000000, 28000000, '18 - 28 triệu VNĐ', @LOC_HCM, 'TP. Hồ Chí Minh', 'full_time', 'mid', 'published', FALSE, 145, 6, DATE_ADD(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- EDUFIRST JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_EDU, @USER_DUONG, @CAT_CNTT,
  'Instructional Designer',
  'instructional-designer-edufirst',
  '<p>EduFirst Vietnam tìm Instructional Designer để xây dựng khóa học trực tuyến chất lượng cao cho nền tảng EdTech.</p><h3>Trách nhiệm</h3><ul><li>Thiết kế curriculum và learning objectives</li><li>Viết scripts cho video bài giảng</li><li>Phối hợp với subject matter experts và video team</li></ul>',
  '<ul><li>2+ năm instructional design</li><li>Portfolio với các khóa học đã hoàn thành</li><li>Thành thạo Articulate, Camtasia</li><li>Hiểu LMS (Moodle, Canvas)</li></ul>',
  '<ul><li>Lương: 15-22 triệu VNĐ</li><li>Remote-first policy</li><li>Udemy/LinkedIn Learning subscription</li><li>Conference budget</li></ul>',
  15000000, 22000000, '15 - 22 triệu VNĐ', @LOC_DN, 'Đà Nẵng / Remote', 'full_time', 'mid', 'published', TRUE, 198, 7, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_EDU, @USER_DUONG, @CAT_CNTT,
  'LMS Administrator',
  'lms-administrator-edufirst',
  '<p>Quản trị và vận hành nền tảng LMS Moodle cho 10,000+ learners.</p>',
  '<ul><li>1-3 năm Moodle administration</li><li>Kinh nghiệm SCORM, xAPI</li><li>Basic PHP/SQL</li></ul>',
  '<ul><li>Lương: 12-18 triệu VNĐ</li><li>Hybrid</li></ul>',
  12000000, 18000000, '12 - 18 triệu VNĐ', @LOC_DN, 'Đà Nẵng', 'full_time', 'entry', 'published', FALSE, 87, 3, DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- LOGISTICPRO JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_LOG, @USER_MAI, @CAT_LG,
  'Warehouse Manager',
  'warehouse-manager-logisticpro',
  '<p>Quản lý kho hàng logistics quy mô lớn tại Hải Phòng. Quản lý team 30+ nhân viên kho.</p>',
  '<ul><li>5+ năm warehouse management</li><li>Kinh nghiệm với WMS (SAP EWM, Oracle WMS)</li><li>Hiểu lean warehouse operations</li><li>Chứng chỉ SCAM hoặc CSCMP là điểm cộng</li></ul>',
  '<ul><li>Lương: 25-40 triệu VNĐ</li><li>Housing allowance</li><li>Performance bonus</li><li>Full benefits</li></ul>',
  25000000, 40000000, '25 - 40 triệu VNĐ', @LOC_HP, 'Hải Phòng', 'full_time', 'senior', 'pending_review', FALSE, 76, 2, DATE_ADD(CURDATE(), INTERVAL 60 DAY), NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- DESIGN JOBS (via GreenLeaf - creative agency)
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_TK,
  'Senior UI/UX Designer',
  'senior-ui-ux-designer-greenleaf',
  '<p>GreenLeaf đang tìm Senior UI/UX Designer để dẫn dắt design cho các dự án digital marketing và web applications.</p>',
  '<ul><li>3+ năm UI/UX design</li><li>Thành thạo Figma, Adobe Suite</li><li>Portfolio với các dự án web/app đã ship</li><li>Hiểu design systems</li></ul>',
  '<ul><li>Lương: 18-28 triệu VNĐ</li><li>MacBook provided</li><li>Conference & workshop budget</li></ul>',
  18000000, 28000000, '18 - 28 triệu VNĐ', @LOC_HCM, 'TP. Hồ Chí Minh', 'full_time', 'senior', 'published', TRUE, 387, 16, DATE_ADD(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- SALES JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_HRPRO, @USER_HIEU, @CAT_KD,
  'Business Development Executive',
  'business-development-executive-hrpro',
  '<p>Phát triển kinh doanh dịch vụ HR consulting và headhunting cho HR Pro.</p>',
  '<ul><li>2+ năm B2B sales</li><li>Kinh nghiệm selling services/professional services</li><li>Network trong ngành HR hoặc FMCG</li></ul>',
  '<ul><li>Lương: 15-20 triệu + commission</li><li>OTE: 40-60 triệu VNĐ</li></ul>',
  15000000, 20000000, '15 - 20 triệu + commission', @LOC_HN, 'Hà Nội', 'full_time', 'mid', 'published', FALSE, 156, 8, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- INTERNSHIP / FRESHER JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Software Engineer Intern (Java)',
  'software-engineer-intern-java-nextech',
  '<p>Internship 6 tháng cho sinh viên/những người mới đi làm muốn học hỏi Java development trong môi trường outsourcing quốc tế.</p>',
  '<ul><li>Sinh viên năm 3-4 hoặc mới tốt nghiệp ngành CNTT</li><li>Biết Java cơ bản</li><li>Tinh thần học hỏi, chăm chỉ</li></ul>',
  '<ul><li>Stipend: 5-7 triệu VNĐ/tháng</li><li>Mentorship 1-1</li><li>Cơ hội convert thành FTE</li></ul>',
  5000000, 7000000, '5 - 7 triệu VNĐ/tháng', @LOC_HCM, 'Quận 7, TP. HCM', 'internship', 'entry', 'published', FALSE, 432, 45, DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_MK,
  'Marketing Intern',
  'marketing-intern-greenleaf',
  '<p>Internship marketing tại agency năng động, làm việc với các brand lớn.</p>',
  '<ul><li>Sinh viên năm 3-4 ngành Marketing/Kinh tế</li><li>Đam mê marketing và social media</li></ul>',
  '<ul><li>Stipend: 4-5 triệu VNĐ/tháng</li><li>Làm việc với team thực sự, không chỉ pha cà phê</li></ul>',
  4000000, 5000000, '4 - 5 triệu VNĐ/tháng', @LOC_HCM, 'TP. Hồ Chí Minh', 'internship', 'entry', 'published', FALSE, 287, 32, DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- PART-TIME / REMOTE JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, location_id, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_EDU, @USER_DUONG, @CAT_GD,
  'Freelance Content Writer (Tiếng Anh)',
  'freelance-content-writer-english-edufirst',
  '<p>EduFirst cần Content Writer freelance viết bài giảng tiếng Anh cho các khóa học EdTech.</p>',
  '<ul><li>Native English hoặc C2 level</li><li>Kinh nghiệm viết cho giáo dục hoặc corporate training</li><li>Có portfolio</li></ul>',
  '<ul><li>Rate: $0.10-0.20/word</li><li>Dự án dài hạn</li><li>Làm việc từ xa</li></ul>',
  0, 0, 'Rate: $0.10-0.20/word', @LOC_REMOTE, 'freelance', 'senior', 'published', FALSE, 134, 6, DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================
-- NEGOTIABLE SALARY JOBS
-- ============================================
INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_MINH, @CAT_CNTT,
  'Technical Product Manager (AI Platform)',
  'technical-product-manager-ai-platform-techcorp',
  '<p>TechCorp Vietnam tìm Technical Product Manager phụ trách roadmap cho nền tảng tuyển dụng ứng dụng AI. Vị trí phối hợp trực tiếp với engineering, data science và customer success để biến nhu cầu khách hàng thành sản phẩm có thể triển khai.</p><h3>Trách nhiệm</h3><ul><li>Xây dựng roadmap theo quý cho các module sàng lọc CV, phân tích hồ sơ và analytics</li><li>Làm việc với team kỹ thuật để đặc tả user story, acceptance criteria và ưu tiên backlog</li><li>Phân tích dữ liệu sử dụng sản phẩm để đề xuất cải tiến</li><li>Phối hợp với khách hàng doanh nghiệp trong giai đoạn pilot</li></ul>',
  '<ul><li>4+ năm kinh nghiệm Product Manager, Business Analyst hoặc Technical Lead</li><li>Hiểu quy trình phát triển phần mềm SaaS, ưu tiên có kinh nghiệm AI/HR Tech</li><li>Kỹ năng stakeholder management và viết tài liệu sản phẩm tốt</li><li>Có khả năng đọc hiểu API, dữ liệu và luồng tích hợp hệ thống</li></ul>',
  '<ul><li>Lương thỏa thuận theo năng lực và phạm vi phụ trách</li><li>ESOP cho vị trí chủ chốt</li><li>Hybrid 3 ngày/tuần, thiết bị làm việc đầy đủ</li><li>Ngân sách học tập và tham dự hội thảo sản phẩm/AI</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 2, @LOC_HN, 'Tầng 20, Tòa nhà Tech Tower, Quận Cầu Giấy, Hà Nội', 'full_time', 'manager', 'published', TRUE, 211, 4, DATE_ADD(CURDATE(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Data Engineering Lead',
  'data-engineering-lead-nextech',
  '<p>Nextech Solutions cần Data Engineering Lead dẫn dắt team xây dựng data platform cho khách hàng quốc tế trong lĩnh vực fintech và retail. Vai trò tập trung vào kiến trúc dữ liệu, chuẩn hóa pipeline và mentoring kỹ sư.</p>',
  '<ul><li>5+ năm kinh nghiệm data engineering hoặc backend data platform</li><li>Thành thạo Python/Scala, SQL, Airflow hoặc Kafka</li><li>Kinh nghiệm thiết kế data lake/warehouse trên cloud</li><li>Có kinh nghiệm dẫn dắt team từ 3 người trở lên</li></ul>',
  '<ul><li>Lương thỏa thuận theo seniority và kinh nghiệm dự án quốc tế</li><li>Project bonus theo milestone</li><li>Cơ hội làm việc trực tiếp với khách hàng Nhật Bản và châu Âu</li><li>Đào tạo cloud/data certification</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HCM, 'Quận 7, TP. Hồ Chí Minh', 'full_time', 'lead', 'published', TRUE, 176, 3, DATE_ADD(CURDATE(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_GREEN, @USER_UYEN, @CAT_MK,
  'Creative Strategy Lead',
  'creative-strategy-lead-greenleaf',
  '<p>GreenLeaf Digital Agency tuyển Creative Strategy Lead để định hướng big idea, brand campaign và performance creative cho nhóm khách hàng tăng trưởng nhanh.</p>',
  '<ul><li>4+ năm kinh nghiệm creative strategy, brand planning hoặc integrated marketing</li><li>Có portfolio campaign đã triển khai đa kênh</li><li>Hiểu performance metrics và cách chuyển insight thành creative brief</li><li>Kỹ năng trình bày, phản biện và dẫn dắt workshop tốt</li></ul>',
  '<ul><li>Lương thỏa thuận theo portfolio và năng lực dẫn dắt chiến dịch</li><li>Thưởng theo hiệu quả campaign</li><li>Không gian làm việc sáng tạo, ngân sách workshop hàng quý</li><li>Cơ hội làm việc với nhiều thương hiệu lớn</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 2, @LOC_HCM, 'Quận 3, TP. Hồ Chí Minh', 'full_time', 'lead', 'published', FALSE, 143, 5, DATE_ADD(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_HRPRO, @USER_HIEU, @CAT_KD,
  'Enterprise Account Executive',
  'enterprise-account-executive-hrpro',
  '<p>HR Pro Services tìm Enterprise Account Executive phụ trách phát triển khách hàng doanh nghiệp cho mảng HR consulting, recruitment outsourcing và executive search.</p>',
  '<ul><li>3+ năm kinh nghiệm B2B sales, ưu tiên SaaS hoặc professional services</li><li>Có khả năng xây dựng pipeline, quản lý deal cycle và đàm phán hợp đồng</li><li>Network với HR Director, Founder hoặc C-level là lợi thế</li><li>Tư duy consultative selling và chăm sóc khách hàng dài hạn</li></ul>',
  '<ul><li>Lương thỏa thuận gồm base, commission và bonus theo doanh số</li><li>Được hỗ trợ lead từ marketing và network nội bộ</li><li>Lộ trình lên Sales Manager/Business Unit Lead</li><li>Flexible working hours</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 3, @LOC_HN, 'Quận Ba Đình, Hà Nội', 'full_time', 'senior', 'published', FALSE, 118, 2, DATE_ADD(CURDATE(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_MED, @USER_THAO, @CAT_YT,
  'Healthcare Product Owner',
  'healthcare-product-owner-medhealth',
  '<p>MedHealth Corp tuyển Healthcare Product Owner cho nền tảng telemedicine và quản lý bệnh viện thông minh. Vị trí làm cầu nối giữa bác sĩ, vận hành bệnh viện và đội kỹ thuật.</p>',
  '<ul><li>3+ năm kinh nghiệm Product Owner, BA hoặc vận hành sản phẩm trong y tế</li><li>Hiểu quy trình khám chữa bệnh, đặt lịch, hồ sơ bệnh án hoặc billing</li><li>Có khả năng viết requirement rõ ràng và kiểm thử nghiệp vụ</li><li>Ưu tiên ứng viên từng làm với HIS/HMS hoặc healthtech</li></ul>',
  '<ul><li>Lương thỏa thuận theo kinh nghiệm healthtech</li><li>Bảo hiểm sức khỏe cao cấp cho gia đình</li><li>Đào tạo tiêu chuẩn dữ liệu y tế và bảo mật</li><li>Hybrid, phối hợp trực tiếp với chuyên gia y tế</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HCM, 'Quận Tân Bình, TP. Hồ Chí Minh', 'full_time', 'senior', 'published', TRUE, 164, 4, DATE_ADD(CURDATE(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_LOG, @USER_MAI, @CAT_LG,
  'Operations Excellence Manager',
  'operations-excellence-manager-logisticpro',
  '<p>LogisticPro Vietnam cần Operations Excellence Manager tối ưu quy trình kho vận, WMS/TMS và chỉ số vận hành tại các trung tâm phân phối lớn.</p>',
  '<ul><li>5+ năm kinh nghiệm logistics, supply chain hoặc operations excellence</li><li>Thành thạo lean, process mapping và cải tiến KPI vận hành</li><li>Kinh nghiệm triển khai WMS/TMS hoặc automation trong kho là lợi thế</li><li>Có khả năng dẫn dắt thay đổi với nhiều team vận hành</li></ul>',
  '<ul><li>Lương thỏa thuận theo kinh nghiệm quản lý vận hành</li><li>Performance bonus theo KPI cải tiến</li><li>Housing allowance cho ứng viên ngoài Hải Phòng</li><li>Được tham gia dự án chuyển đổi số logistics</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HP, 'Hải Phòng', 'full_time', 'manager', 'published', FALSE, 92, 1, DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_TECH, @USER_LINH, @CAT_CNTT,
  'Solutions Architect (AI Integration)',
  'solutions-architect-ai-integration-techcorp',
  '<p>TechCorp Vietnam cần Solutions Architect dẫn dắt các dự án tích hợp AI vào hệ thống tuyển dụng cho khách hàng enterprise. Vị trí này làm việc cùng sales, product và engineering để chốt kiến trúc triển khai phù hợp.</p>',
  '<ul><li>5+ năm kinh nghiệm solution architecture, pre-sales technical consulting hoặc enterprise integration</li><li>Hiểu API, SSO, data mapping và kiến trúc microservices</li><li>Có kinh nghiệm tư vấn giải pháp SaaS/AI cho khách hàng lớn</li><li>Kỹ năng trình bày kiến trúc và viết proposal tốt</li></ul>',
  '<ul><li>Lương thỏa thuận theo độ phức tạp dự án và kinh nghiệm triển khai</li><li>Thưởng theo deal thắng và dự án go-live</li><li>Thiết bị làm việc cao cấp, hybrid linh hoạt</li><li>Làm việc trực tiếp với khách hàng enterprise trong và ngoài nước</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HN, 'Cầu Giấy, Hà Nội', 'full_time', 'lead', 'draft', FALSE, 21, 0, DATE_ADD(CURDATE(), INTERVAL 45 DAY), NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_NEXTECH, @USER_KHANH, @CAT_CNTT,
  'Delivery Manager (Data Platforms)',
  'delivery-manager-data-platforms-nextech',
  '<p>Nextech Solutions đang hoàn thiện JD cho Delivery Manager phụ trách các dự án data platform cho khách hàng quốc tế. Vị trí chịu trách nhiệm điều phối delivery, chất lượng và tiến độ nhiều team liên chức năng.</p>',
  '<ul><li>5+ năm kinh nghiệm delivery/project management trong môi trường software outsourcing</li><li>Hiểu quy trình phát triển data platform, cloud migration hoặc analytics product</li><li>Kỹ năng quản lý scope, timeline và stakeholder tốt</li><li>Tiếng Anh làm việc với khách hàng quốc tế</li></ul>',
  '<ul><li>Lương thỏa thuận theo kinh nghiệm delivery quốc tế</li><li>Bonus theo hiệu quả dự án</li><li>Cơ hội dẫn dắt team đa quốc gia</li><li>Đào tạo quản lý dự án và lãnh đạo đội nhóm</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HCM, 'Quận 7, TP. Hồ Chí Minh', 'full_time', 'manager', 'pending_review', FALSE, 37, 0, DATE_ADD(CURDATE(), INTERVAL 50 DAY), NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_EDU, @USER_DUONG, @CAT_GD,
  'Enterprise Learning Consultant',
  'enterprise-learning-consultant-edufirst',
  '<p>EduFirst Vietnam từng mở vị trí Enterprise Learning Consultant để phát triển giải pháp đào tạo doanh nghiệp và hiện đã đóng sau khi hoàn tất vòng tuyển. Tin này được giữ lại để demo lịch sử quản lý job thỏa thuận.</p>',
  '<ul><li>3+ năm kinh nghiệm tư vấn đào tạo doanh nghiệp hoặc B2B learning solutions</li><li>Hiểu nhu cầu L&D, LMS và chương trình đào tạo nội bộ</li><li>Kỹ năng phân tích nhu cầu và đề xuất giải pháp tốt</li><li>Có kinh nghiệm làm việc với doanh nghiệp vừa và lớn</li></ul>',
  '<ul><li>Lương thỏa thuận theo kinh nghiệm tư vấn và quy mô khách hàng phụ trách</li><li>Thưởng theo hợp đồng triển khai thành công</li><li>Được tham gia thiết kế chương trình học doanh nghiệp</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_DN, 'Đà Nẵng / Hybrid', 'full_time', 'senior', 'closed', FALSE, 109, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 32 DAY))
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO jobs (company_id, recruiter_id, category_id, title, slug, description, requirements, benefits, salary_min, salary_max, salary_display, salary_negotiable, vacancies, location_id, address, job_type, experience_level, status, featured, views, applications_count, expires_at, published_at)
VALUES (@COMP_LOG, @USER_MAI, @CAT_LG,
  'Supply Chain Transformation Manager',
  'supply-chain-transformation-manager-logisticpro',
  '<p>LogisticPro Vietnam đang chuẩn bị đăng vị trí Supply Chain Transformation Manager cho chương trình tối ưu mạng lưới kho vận và chuẩn hóa quy trình across-region.</p>',
  '<ul><li>5+ năm kinh nghiệm supply chain transformation, operations excellence hoặc consulting</li><li>Có kinh nghiệm triển khai KPI, governance và cải tiến quy trình liên phòng ban</li><li>Hiểu logistics, procurement hoặc planning là lợi thế</li><li>Kỹ năng dẫn dắt thay đổi và làm việc với nhiều stakeholder</li></ul>',
  '<ul><li>Lương thỏa thuận theo phạm vi chuyển đổi phụ trách</li><li>Thưởng theo kết quả cải tiến vận hành</li><li>Hỗ trợ chỗ ở và đi lại khi làm việc tại Hải Phòng</li></ul>',
  NULL, NULL, 'Thỏa thuận', TRUE, 1, @LOC_HP, 'Hải Phòng', 'full_time', 'manager', 'draft', FALSE, 14, 0, DATE_ADD(CURDATE(), INTERVAL 60 DAY), NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);

SELECT CONCAT('Đã tạo ', COUNT(*), ' tin tuyển dụng') AS status FROM jobs;
