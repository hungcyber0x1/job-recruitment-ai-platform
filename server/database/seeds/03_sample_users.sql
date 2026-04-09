-- Seed 03: SAMPLE USERS — Tài khoản mẫu để demo
-- Mật khẩu cho tất cả users mẫu: "Password@123"
-- Hash bcrypt (rounds=10) của "Password@123":

INSERT INTO users (email, password, role, first_name, last_name, phone, is_active) VALUES

-- Admin
('admin@hireai.vn',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'admin', 'Admin', 'HireAI', '0900000001', TRUE),

-- Employer 1 — Công ty CNTT
('employer1@techcorp.vn',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'employer', 'Minh', 'Nguyễn', '0912345678', TRUE),

-- Employer 2 — Công ty Marketing
('employer2@marketplus.vn',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'employer', 'Thảo', 'Trần', '0923456789', TRUE),

-- Candidate 1 — Lập trình viên
('candidate1@gmail.com',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'candidate', 'Hùng', 'Lê', '0934567890', TRUE),

-- Candidate 2 — Marketing
('candidate2@gmail.com',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'candidate', 'Lan', 'Phạm', '0945678901', TRUE),

-- Candidate 3 — Sinh viên mới ra trường
('candidate3@gmail.com',
 '$2b$10$siJcH34wae7ihv6.jph8s.xOeTsEKjofeI0wUvV4Is7VrGHxP.W8m',
 'candidate', 'Tuấn', 'Vũ', '0956789012', TRUE)

ON DUPLICATE KEY UPDATE
password = VALUES(password),
role = VALUES(role),
first_name = VALUES(first_name),
last_name = VALUES(last_name),
phone = VALUES(phone),
is_active = VALUES(is_active);

-- ----------------------------------------
-- Tạo hồ sơ employer cho 2 employer users
-- ----------------------------------------
INSERT INTO employers (user_id, company_name, company_website, company_description, company_size, industry, location, is_verified)
SELECT id, 'TechCorp Việt Nam', 'https://techcorp.vn',
       'Công ty phần mềm hàng đầu Việt Nam, chuyên giải pháp AI và cloud computing.',
       '100-500', 'Công nghệ thông tin', 'Hà Nội', TRUE
FROM users WHERE email = 'employer1@techcorp.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO employers (user_id, company_name, company_website, company_description, company_size, industry, location, is_verified)
SELECT id, 'MarketPlus Agency', 'https://marketplus.vn',
       'Agency marketing digital chuyên nghiệp, phục vụ 200+ doanh nghiệp toàn quốc.',
       '10-50', 'Marketing & Truyền thông', 'TP. Hồ Chí Minh', TRUE
FROM users WHERE email = 'employer2@marketplus.vn'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- ----------------------------------------
-- Tạo hồ sơ candidate
-- ----------------------------------------
INSERT INTO candidates (user_id, bio, experience_years, current_job_title, education_level, location)
SELECT id,
       'Lập trình viên Full-stack với 3 năm kinh nghiệm. Đam mê React và Node.js.',
       3, 'Full-stack Developer', 'bachelor', 'Hà Nội'
FROM users WHERE email = 'candidate1@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidates (user_id, bio, experience_years, current_job_title, education_level, location)
SELECT id,
       'Chuyên viên Marketing với kinh nghiệm 2 năm trong lĩnh vực digital marketing.',
       2, 'Digital Marketing Specialist', 'bachelor', 'TP. Hồ Chí Minh'
FROM users WHERE email = 'candidate2@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);

INSERT INTO candidates (user_id, bio, experience_years, current_job_title, education_level, location)
SELECT id,
       'Sinh viên CNTT mới tốt nghiệp, tìm kiếm cơ hội intern/fresher.',
       0, 'Fresher Developer', 'bachelor', 'Đà Nẵng'
FROM users WHERE email = 'candidate3@gmail.com'
ON DUPLICATE KEY UPDATE bio = VALUES(bio);
