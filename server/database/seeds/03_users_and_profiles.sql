-- ============================================
-- SEED 03: USERS, COMPANIES & CANDIDATES
-- Tài khoản mẫu để demo toàn bộ chức năng
-- Mật khẩu tất cả: Password@123
-- Hash bcrypt của "Password@123"
-- ============================================

SET NAMES utf8mb4;

-- Hash bcrypt của "Password@123" (rounds=10)
-- $2b$10$pL1xtA2x2Oi0jvajvXWFneYZAnKl5c7dMUVOvIFVsr5qqNhnkjP.K
SET @PASS_HASH = '$2b$10$pL1xtA2x2Oi0jvajvXWFneYZAnKl5c7dMUVOvIFVsr5qqNhnkjP.K';

-- ============================================
-- ADMIN USERS
-- ============================================
INSERT INTO users (email, password, role, first_name, last_name, phone, status, gender, region, avatar_url) VALUES
('admin@hirebot.vn', @PASS_HASH, 'admin', 'Admin', 'HireBOT', '0900000001', 'active', 'male', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=admin1'),
('superadmin@hirebot.vn', @PASS_HASH, 'admin', 'Super', 'Admin', '0900000002', 'active', 'female', 'Hà Nội', 'https://i.pravatar.cc/150?u=admin2')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  status = VALUES(status);

-- ============================================
-- EMPLOYER / RECRUITER USERS
-- ============================================
INSERT INTO users (email, password, role, first_name, last_name, phone, status, gender, region, avatar_url) VALUES
-- TechCorp Vietnam
('minh.nguyen@techcorp.vn', @PASS_HASH, 'recruiter', 'Minh', 'Nguyễn', '0912345001', 'active', 'male', 'Hà Nội', 'https://i.pravatar.cc/150?u=minh1'),
('linh.tran@techcorp.vn', @PASS_HASH, 'recruiter', 'Linh', 'Trần', '0912345002', 'active', 'female', 'Hà Nội', 'https://i.pravatar.cc/150?u=linh2'),
-- Nextech Solutions
('khanh.pham@nextech.vn', @PASS_HASH, 'recruiter', 'Khanh', 'Phạm', '0912345003', 'active', 'male', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=khanh3'),
-- GreenLeaf Agency
('uyen.nguyen@greenleaf.vn', @PASS_HASH, 'recruiter', 'UYên', 'Nguyễn', '0912345004', 'active', 'female', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=uyen4'),
-- HR Pro Services
('hieu.nguyen@hrpro.vn', @PASS_HASH, 'recruiter', 'Hiếu', 'Nguyễn', '0912345005', 'active', 'male', 'Hà Nội', 'https://i.pravatar.cc/150?u=hieu5'),
-- MedHealth Corp
('thao.le@medhealth.vn', @PASS_HASH, 'recruiter', 'Thảo', 'Lê', '0912345006', 'active', 'female', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=thao6'),
-- EduFirst
('duong.tran@edufirst.vn', @PASS_HASH, 'recruiter', 'Dương', 'Trần', '0912345007', 'active', 'male', 'Đà Nẵng', 'https://i.pravatar.cc/150?u=duong7'),
-- LogisticPro
('mai.hoang@logisticpro.vn', @PASS_HASH, 'recruiter', 'Mai', 'Hoàng', '0912345008', 'active', 'female', 'Hải Phòng', 'https://i.pravatar.cc/150?u=mai8')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  status = VALUES(status);

-- ============================================
-- CANDIDATE USERS
-- ============================================
INSERT INTO users (email, password, role, first_name, last_name, phone, status, gender, region, avatar_url) VALUES
-- Developer
('hung.lee@gmail.com', @PASS_HASH, 'candidate', 'Hùng', 'Lê', '0934567001', 'active', 'male', 'Hà Nội', 'https://i.pravatar.cc/150?u=hung1'),
('nam.pham@gmail.com', @PASS_HASH, 'candidate', 'Nam', 'Phạm', '0934567002', 'active', 'male', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=nam2'),
-- Marketing
('lan.phan@gmail.com', @PASS_HASH, 'candidate', 'Lan', 'Phạm', '0934567003', 'active', 'female', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=lan3'),
('my.nguyen@gmail.com', @PASS_HASH, 'candidate', 'My', 'Nguyễn', '0934567004', 'active', 'female', 'Hà Nội', 'https://i.pravatar.cc/150?u=my4'),
-- Finance
('khoa.tran@gmail.com', @PASS_HASH, 'candidate', 'Khoa', 'Trần', '0934567005', 'active', 'male', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=khoa5'),
-- Designer
('linh.hoang@gmail.com', @PASS_HASH, 'candidate', 'Linh', 'Hoàng', '0934567006', 'active', 'female', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=linh6'),
-- HR
('phuong.tran@gmail.com', @PASS_HASH, 'candidate', 'Phương', 'Trần', '0934567007', 'active', 'female', 'Hà Nội', 'https://i.pravatar.cc/150?u=phuong7'),
-- Engineer
('tu.ho@gmail.com', @PASS_HASH, 'candidate', 'Tú', 'Hồ', '0934567008', 'active', 'male', 'Đà Nẵng', 'https://i.pravatar.cc/150?u=tu8'),
-- Sales
('vy.nguyen@gmail.com', @PASS_HASH, 'candidate', 'Vy', 'Nguyễn', '0934567009', 'active', 'female', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=vy9'),
-- Data
('huy.dao@gmail.com', @PASS_HASH, 'candidate', 'Huy', 'Đào', '0934567010', 'active', 'male', 'TP. Hồ Chí Minh', 'https://i.pravatar.cc/150?u=huy10'),
-- Fresher
('tuan.vo@gmail.com', @PASS_HASH, 'candidate', 'Tuấn', 'Võ', '0934567011', 'active', 'male', 'Cần Thơ', 'https://i.pravatar.cc/150?u=tuan11'),
-- Intern
('nhi.le@gmail.com', @PASS_HASH, 'candidate', 'Nhi', 'Lê', '0934567012', 'active', 'female', 'Hà Nội', 'https://i.pravatar.cc/150?u=nhi12')
ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  status = VALUES(status);

-- ============================================
-- COMPANY PROFILES
-- ============================================
INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'TechCorp Vietnam', 'https://techcorp.vn',
  'Công ty công nghệ hàng đầu Việt Nam, chuyên phát triển giải pháp phần mềm doanh nghiệp, AI và cloud computing. TechCorp tự hào với hơn 500 nhân sự tại Hà Nội và TP.HCM, phục vụ khách hàng trong và ngoài nước.',
  '500-1000', 'Công nghệ thông tin', 'Hà Nội', '024-7100-1000', TRUE, 'approved'
FROM users WHERE email = 'minh.nguyen@techcorp.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'Nextech Solutions', 'https://nextech.vn',
  'Chuyên gia outsourcing phần mềm với 10 năm kinh nghiệm. Nextech cung cấp dịch vụ phát triển web, mobile và hệ thống nhúng cho các doanh nghiệp Nhật Bản và châu Âu.',
  '100-500', 'Công nghệ thông tin', 'TP. Hồ Chí Minh', '028-3800-2000', TRUE, 'approved'
FROM users WHERE email = 'khanh.pham@nextech.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'GreenLeaf Digital Agency', 'https://greenleaf.vn',
  'Agency marketing digital hàng đầu, chuyên về performance marketing, content và social media. GreenLeaf đã hỗ trợ hơn 200+ thương hiệu xây dựng chiến lược digital toàn diện.',
  '50-100', 'Marketing & Truyền thông', 'TP. Hồ Chí Minh', '028-7100-3000', TRUE, 'approved'
FROM users WHERE email = 'uyen.nguyen@greenleaf.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'HR Pro Services', 'https://hrpro.vn',
  'Công ty chuyên cung cấp dịch vụ HR consulting, headhunting và outsourcing nhân sự cho các doanh nghiệp FDI và startup. HR Pro đặt trụ sở tại Hà Nội với văn phòng tại TP.HCM.',
  '10-50', 'Nhân sự & Hành chính', 'Hà Nội', '024-7100-4000', TRUE, 'approved'
FROM users WHERE email = 'hieu.nguyen@hrpro.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'MedHealth Corp', 'https://medhealth.vn',
  'Doanh nghiệp y tế công nghệ cao, kết hợp telemedicine và quản lý bệnh viện thông minh. MedHealth đang mở rộng đội ngũ kỹ sư phần mềm và chuyên viên dữ liệu y tế.',
  '200-500', 'Y tế & Dược phẩm', 'TP. Hồ Chí Minh', '028-7100-5000', TRUE, 'approved'
FROM users WHERE email = 'thao.le@medhealth.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'EduFirst Vietnam', 'https://edufirst.vn',
  'Nền tảng EdTech tiên phong tại Việt Nam, kết hợp AI vào giáo dục. EduFirst phát triển khóa học trực tuyến, nền tảng LMS và công cụ học tập cá nhân hóa.',
  '50-100', 'Giáo dục & Đào tạo', 'Đà Nẵng', '0236-7100-6000', TRUE, 'approved'
FROM users WHERE email = 'duong.tran@edufirst.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO company_profiles (user_id, company_name, company_website, company_description, company_size, industry, location, phone, is_verified, verification_status)
SELECT id, 'LogisticPro Vietnam', 'https://logisticpro.vn',
  'Công ty logistics hàng đầu với hệ thống kho bãi thông minh và nền tảng WMS/TMS. LogisticPro phục vụ các doanh nghiệp sản xuất và bán lẻ trên toàn quốc.',
  '500-1000', 'Logistics & Vận tải', 'Hải Phòng', '0225-7100-7000', FALSE, 'pending'
FROM users WHERE email = 'mai.hoang@logisticpro.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- ============================================
-- CANDIDATE PROFILES
-- ============================================
INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Full-stack Developer với 4 năm kinh nghiệm. Chuyên React, Node.js và AWS. Đã làm việc trên các dự án SaaS quy mô lớn với hàng triệu người dùng.', 4, 'Senior Full-stack Developer', 'bachelor', 'Hà Nội', 'public'
FROM users WHERE email = 'hung.lee@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Frontend Developer đam mê UI/UX và performance. Kinh nghiệm với Vue.js, React và Next.js. Thích thử nghiệm CSS animation và micro-interactions.', 3, 'Frontend Developer', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'nam.pham@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Digital Marketing Specialist với 2 năm kinh nghiệm trong performance marketing. Thành thạo Facebook Ads, Google Ads và SEO. Đã quản lý ngân sách marketing hàng tháng trên 100 triệu đồng.', 2, 'Digital Marketing Specialist', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'lan.phan@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Content Creator và SEO Specialist. Viết content cho blog, social media và landing pages. Hiểu sâu về content marketing và inbound strategy.', 3, 'Content Marketing Lead', 'bachelor', 'Hà Nội', 'public'
FROM users WHERE email = 'my.nguyen@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Kế toán tổng hợp với 5 năm kinh nghiệm trong FMCG. Thành thạo MISA, Excel và Power BI. Đã lập báo cáo tài chính quý và năm cho công ty niêm yết.', 5, 'Senior Accountant', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'khoa.tran@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'UI/UX Designer với con mắt thẩm mỹ tinh tế. Kinh nghiệm với Figma, Adobe XD và prototyping. Đã thiết kế sản phẩm cho startup và enterprise.', 4, 'Senior UI/UX Designer', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'linh.hoang@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'HR Specialist với 3 năm kinh nghiệm trong tuyển dụng IT và headhunting. Kết nối hàng trăm ứng viên với các vị trí phù hợp tại các công ty công nghệ.', 3, 'HR Specialist', 'bachelor', 'Hà Nội', 'public'
FROM users WHERE email = 'phuong.tran@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Mechanical Engineer với kinh nghiệm thiết kế và bảo trì máy móc trong nhà máy sản xuất. Thành thạo AutoCAD, SolidWorks và ISO standards. Chú trọng lean manufacturing.', 6, 'Mechanical Engineer', 'bachelor', 'Đà Nẵng', 'public'
FROM users WHERE email = 'tu.ho@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Business Development Executive với track record trong việc đóng deals lớn. Kinh nghiệm ở cả B2B SaaS và traditional sales. Thuyết phục, chuyên nghiệp và kiên nhẫn.', 4, 'Business Development Manager', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'vy.nguyen@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Data Analyst với niềm đam mê biến dữ liệu thành insight. Kinh nghiệm Python, SQL và Tableau. Đã xây dựng dashboard cho team marketing và sales.', 2, 'Data Analyst', 'bachelor', 'TP. Hồ Chí Minh', 'public'
FROM users WHERE email = 'huy.dao@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Sinh viên CNTT mới tốt nghiệp ĐH Bách Khoa TP.HCM. Đã hoàn thành các dự án cá nhân với React và Node.js. Tìm kiếm vị trí fresher/intern để học hỏi và phát triển.', 0, 'Fresher Developer', 'bachelor', 'Cần Thơ', 'public'
FROM users WHERE email = 'tuan.vo@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidate_profiles (user_id, bio, experience_years, current_job_title, education_level, location, profile_visibility)
SELECT id, 'Sinh viên năm 4 ngành Marketing. Đang tìm kiếm vị trí thực tập để áp dụng kiến thức vào thực tế. Năng động, sáng tạo và ham học hỏi.', 0, 'Marketing Intern', 'college', 'Hà Nội', 'public'
FROM users WHERE email = 'nhi.le@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

-- ============================================
-- COMPANY MEMBERS (team members for companies)
-- ============================================
INSERT INTO company_members (company_id, user_id, role, can_post_job, can_edit_job, can_delete_job, can_approve_job, can_view_applications, can_manage_applications, can_send_email, can_view_salary, can_export_data, status)
SELECT
  (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'minh.nguyen@techcorp.vn')),
  (SELECT id FROM users WHERE email = 'minh.nguyen@techcorp.vn'),
  'owner', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'active'
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO company_members (company_id, user_id, role, can_post_job, can_edit_job, can_delete_job, can_approve_job, can_view_applications, can_manage_applications, can_send_email, can_view_salary, can_export_data, status)
SELECT
  (SELECT id FROM company_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'minh.nguyen@techcorp.vn')),
  (SELECT id FROM users WHERE email = 'linh.tran@techcorp.vn'),
  'recruiter', TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE, 'active'
ON DUPLICATE KEY UPDATE role = VALUES(role);

SELECT 'Đã tạo users, company_profiles, candidate_profiles và company_members' AS status;
