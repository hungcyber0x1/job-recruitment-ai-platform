-- ============================================
-- SEED 02: SKILLS
-- Kỹ năng phổ biến theo ngành
-- ============================================

SET NAMES utf8mb4;

-- Lấy category IDs
SET @cat_cntt = (SELECT id FROM categories WHERE slug = 'cntt');
SET @cat_marketing = (SELECT id FROM categories WHERE slug = 'marketing');
SET @cat_tc = (SELECT id FROM categories WHERE slug = 'tai-chinh');
SET @cat_kd = (SELECT id FROM categories WHERE slug = 'kinh-doanh');
SET @cat_ns = (SELECT id FROM categories WHERE slug = 'nhan-su');
SET @cat_kt = (SELECT id FROM categories WHERE slug = 'ky-thuat');
SET @cat_tk = (SELECT id FROM categories WHERE slug = 'thiet-ke');
SET @cat_gd = (SELECT id FROM categories WHERE slug = 'giao-duc');
SET @cat_yt = (SELECT id FROM categories WHERE slug = 'y-te');
SET @cat_pl = (SELECT id FROM categories WHERE slug = 'phap-ly');
SET @cat_lg = (SELECT id FROM categories WHERE slug = 'logistics');
SET @cat_bds = (SELECT id FROM categories WHERE slug = 'bat-dong-san');

-- ============================================
-- CÔNG NGHỆ THÔNG TIN
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
-- Ngôn ngữ lập trình
('JavaScript', 'javascript', @cat_cntt, 1),
('TypeScript', 'typescript', @cat_cntt, 1),
('Python', 'python', @cat_cntt, 1),
('Java', 'java', @cat_cntt, 1),
('C#', 'csharp', @cat_cntt, 1),
('C++', 'cpp', @cat_cntt, 1),
('Go', 'golang', @cat_cntt, 1),
('Rust', 'rust', @cat_cntt, 1),
('PHP', 'php', @cat_cntt, 1),
('Ruby', 'ruby', @cat_cntt, 1),
('Swift', 'swift', @cat_cntt, 1),
('Kotlin', 'kotlin', @cat_cntt, 1),
('Dart', 'dart', @cat_cntt, 1),
('Scala', 'scala', @cat_cntt, 1),
-- Frontend
('React.js', 'reactjs', @cat_cntt, 1),
('Vue.js', 'vuejs', @cat_cntt, 1),
('Angular', 'angular', @cat_cntt, 1),
('Next.js', 'nextjs', @cat_cntt, 1),
('Nuxt.js', 'nuxtjs', @cat_cntt, 1),
('Svelte', 'svelte', @cat_cntt, 1),
('HTML/CSS', 'html-css', @cat_cntt, 1),
('Tailwind CSS', 'tailwind-css', @cat_cntt, 1),
-- Backend
('Node.js', 'nodejs', @cat_cntt, 1),
('Express.js', 'expressjs', @cat_cntt, 1),
('NestJS', 'nestjs', @cat_cntt, 1),
('FastAPI', 'fastapi', @cat_cntt, 1),
('Django', 'django', @cat_cntt, 1),
('Flask', 'flask', @cat_cntt, 1),
('Spring Boot', 'spring-boot', @cat_cntt, 1),
('ASP.NET Core', 'aspnet-core', @cat_cntt, 1),
('Rails', 'rails', @cat_cntt, 1),
-- Database
('MySQL', 'mysql', @cat_cntt, 1),
('PostgreSQL', 'postgresql', @cat_cntt, 1),
('MongoDB', 'mongodb', @cat_cntt, 1),
('Redis', 'redis', @cat_cntt, 1),
('Elasticsearch', 'elasticsearch', @cat_cntt, 1),
('SQLite', 'sqlite', @cat_cntt, 1),
('DynamoDB', 'dynamodb', @cat_cntt, 1),
-- Cloud & DevOps
('Docker', 'docker', @cat_cntt, 1),
('Kubernetes', 'kubernetes', @cat_cntt, 1),
('AWS', 'aws', @cat_cntt, 1),
('Google Cloud', 'google-cloud', @cat_cntt, 1),
('Azure', 'azure', @cat_cntt, 1),
('Terraform', 'terraform', @cat_cntt, 1),
('CI/CD', 'ci-cd', @cat_cntt, 1),
('Jenkins', 'jenkins', @cat_cntt, 1),
('GitHub Actions', 'github-actions', @cat_cntt, 1),
-- Tools & Methods
('Git', 'git', @cat_cntt, 1),
('REST API', 'rest-api', @cat_cntt, 1),
('GraphQL', 'graphql', @cat_cntt, 1),
('gRPC', 'grpc', @cat_cntt, 1),
('Linux', 'linux', @cat_cntt, 1),
('Agile/Scrum', 'agile-scrum', @cat_cntt, 1),
('Jira', 'jira', @cat_cntt, 1),
-- AI/ML
('Machine Learning', 'machine-learning', @cat_cntt, 1),
('Deep Learning', 'deep-learning', @cat_cntt, 1),
('TensorFlow', 'tensorflow', @cat_cntt, 1),
('PyTorch', 'pytorch', @cat_cntt, 1),
('LangChain', 'langchain', @cat_cntt, 1),
('LLM / Generative AI', 'llm-generative-ai', @cat_cntt, 1),
('Prompt Engineering', 'prompt-engineering', @cat_cntt, 1),
('Computer Vision', 'computer-vision', @cat_cntt, 1),
('NLP', 'nlp', @cat_cntt, 1),
-- Security
('Cybersecurity', 'cybersecurity', @cat_cntt, 1),
('Penetration Testing', 'penetration-testing', @cat_cntt, 1),
('SOC/SIEM', 'soc-siem', @cat_cntt, 1),
-- Mobile
('React Native', 'react-native', @cat_cntt, 1),
('Flutter', 'flutter', @cat_cntt, 1),
('iOS Development', 'ios-development', @cat_cntt, 1),
('Android Development', 'android-development', @cat_cntt, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- MARKETING & TRUYỀN THÔNG
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('SEO', 'seo', @cat_marketing, 1),
('Google Ads', 'google-ads', @cat_marketing, 1),
('Facebook Ads', 'facebook-ads', @cat_marketing, 1),
('TikTok Ads', 'tiktok-ads', @cat_marketing, 1),
('LinkedIn Ads', 'linkedin-ads', @cat_marketing, 1),
('Content Marketing', 'content-marketing', @cat_marketing, 1),
('Email Marketing', 'email-marketing', @cat_marketing, 1),
('Social Media Management', 'social-media', @cat_marketing, 1),
('Influencer Marketing', 'influencer-marketing', @cat_marketing, 1),
('Marketing Automation', 'marketing-automation', @cat_marketing, 1),
('HubSpot', 'hubspot', @cat_marketing, 1),
('Salesforce CRM', 'salesforce-crm', @cat_marketing, 1),
('Google Analytics', 'google-analytics', @cat_marketing, 1),
('GA4', 'ga4', @cat_marketing, 1),
('Hotjar', 'hotjar', @cat_marketing, 1),
('A/B Testing', 'ab-testing', @cat_marketing, 1),
('Copywriting', 'copywriting', @cat_marketing, 1),
('Brand Strategy', 'brand-strategy', @cat_marketing, 1),
('PR & Media Relations', 'pr-media-relations', @cat_marketing, 1),
('Video Marketing', 'video-marketing', @cat_marketing, 1),
('CRO (Conversion Rate Optimization)', 'cro', @cat_marketing, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- KẾ TOÁN & TÀI CHÍNH
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('Excel', 'excel', @cat_tc, 1),
('Google Sheets', 'google-sheets', @cat_tc, 1),
('Kế toán tổng hợp', 'ke-toan-tong-hop', @cat_tc, 1),
('Kế toán chi tiết', 'ke-toan-chi-tiet', @cat_tc, 1),
('MISA', 'misa', @cat_tc, 1),
('FAST', 'fast', @cat_tc, 1),
('SAP', 'sap', @cat_tc, 1),
('Oracle ERP', 'oracle-erp', @cat_tc, 1),
('Power BI', 'power-bi', @cat_tc, 1),
('Financial Modeling', 'financial-modeling', @cat_tc, 1),
('Phân tích tài chính', 'phan-tich-tai-chinh', @cat_tc, 1),
('Lập Báo cáo tài chính', 'bao-cao-tai-chinh', @cat_tc, 1),
('Thuế', 'thue', @cat_tc, 1),
('Kiểm toán', 'kiem-toan', @cat_tc, 1),
('Quản trị rủi ro', 'quan-tri-rui-ro', @cat_tc, 1),
('Investment Banking', 'investment-banking', @cat_tc, 1),
('Fintech', 'fintech', @cat_tc, 1),
('Payment Systems', 'payment-systems', @cat_tc, 1),
('Compliance', 'compliance', @cat_tc, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- KINH DOANH & BÁN HÀNG
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('B2B Sales', 'b2b-sales', @cat_kd, 1),
('B2C Sales', 'b2c-sales', @cat_kd, 1),
('SaaS Sales', 'saas-sales', @cat_kd, 1),
('Account Management', 'account-management', @cat_kd, 1),
('Business Development', 'business-development', @cat_kd, 1),
('Lead Generation', 'lead-generation', @cat_kd, 1),
('Cold Calling', 'cold-calling', @cat_kd, 1),
('Negotiation', 'negotiation', @cat_kd, 1),
('Salesforce', 'salesforce', @cat_kd, 1),
('CRM', 'crm', @cat_kd, 1),
('Pipeline Management', 'pipeline-management', @cat_kd, 1),
('Customer Success', 'customer-success', @cat_kd, 1),
('Product Management', 'product-management', @cat_kd, 1),
('Market Research', 'market-research', @cat_kd, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- NHÂN SỰ & HÀNH CHÍNH
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('Tuyển dụng', 'tuyen-dung', @cat_ns, 1),
('Đào tạo & Phát triển', 'dao-tao-phat-trien', @cat_ns, 1),
('C&B (Compensation & Benefits)', 'cb-compensation', @cat_ns, 1),
('HRIS', 'hris', @cat_ns, 1),
('Labor Law', 'labor-law', @cat_ns, 1),
('Performance Management', 'performance-management', @cat_ns, 1),
('Employee Engagement', 'employee-engagement', @cat_ns, 1),
('Onboarding', 'onboarding', @cat_ns, 1),
('HR Analytics', 'hr-analytics', @cat_kd, 1),
('Facilitation', 'facilitation', @cat_ns, 1),
('Administrative', 'administrative', @cat_ns, 1),
('Project Coordination', 'project-coordination', @cat_ns, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- KỸ THUẬT & SẢN XUẤT
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('AutoCAD', 'autocad', @cat_kt, 1),
('SolidWorks', 'solidworks', @cat_kt, 1),
('PLC Programming', 'plc-programming', @cat_kt, 1),
('SCADA', 'scada', @cat_kt, 1),
('Electrical Design', 'electrical-design', @cat_kt, 1),
('Mechanical Design', 'mechanical-design', @cat_kt, 1),
('Lean Manufacturing', 'lean-manufacturing', @cat_kt, 1),
('Six Sigma', 'six-sigma', @cat_kt, 1),
('ISO Standards', 'iso-standards', @cat_kt, 1),
('Quality Control', 'quality-control', @cat_kt, 1),
('BOM Management', 'bom-management', @cat_kt, 1),
('CAD/CAM', 'cad-cam', @cat_kt, 1),
('Robot Programming', 'robot-programming', @cat_kt, 1),
('IoT', 'iot', @cat_kt, 1),
('Industrial Automation', 'industrial-automation', @cat_kt, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- THIẾT KẾ
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('Figma', 'figma', @cat_tk, 1),
('Adobe Photoshop', 'photoshop', @cat_tk, 1),
('Adobe Illustrator', 'illustrator', @cat_tk, 1),
('Adobe XD', 'adobe-xd', @cat_tk, 1),
('Sketch', 'sketch', @cat_tk, 1),
('UI/UX Design', 'ui-ux-design', @cat_tk, 1),
('Prototyping', 'prototyping', @cat_tk, 1),
('Design Systems', 'design-systems', @cat_tk, 1),
('Motion Design', 'motion-design', @cat_tk, 1),
('After Effects', 'after-effects', @cat_tk, 1),
('Premiere Pro', 'premiere-pro', @cat_tk, 1),
('Blender', 'blender', @cat_tk, 1),
('3D Modeling', '3d-modeling', @cat_tk, 1),
('Typography', 'typography', @cat_tk, 1),
('Branding', 'branding', @cat_tk, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- LOGISTICS & VẬN TẢI
-- ============================================
INSERT INTO skills (name, slug, category_id, is_active) VALUES
('WMS', 'wms', @cat_lg, 1),
('TMS', 'tms', @cat_lg, 1),
('Supply Chain Management', 'supply-chain', @cat_lg, 1),
('Inventory Management', 'inventory-management', @cat_lg, 1),
('Import/Export', 'import-export', @cat_lg, 1),
('Incoterms', 'incoterms', @cat_lg, 1),
('Customs Clearance', 'customs-clearance', @cat_lg, 1),
('Lean Logistics', 'lean-logistics', @cat_lg, 1),
('Route Optimization', 'route-optimization', @cat_lg, 1),
('Freight Management', 'freight-management', @cat_lg, 1),
('Last Mile Delivery', 'last-mile-delivery', @cat_lg, 1),
('Procurement', 'procurement', @cat_lg, 1),
('Vendor Management', 'vendor-management', @cat_lg, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- NGOẠI NGỮ & KỸ NĂNG MỀM (chung)
-- ============================================
INSERT INTO skills (name, slug, is_active) VALUES
('Tiếng Anh', 'tieng-anh', 1),
('Tiếng Nhật', 'tieng-nhat', 1),
('Tiếng Hàn', 'tieng-han', 1),
('Tiếng Trung', 'tieng-trung', 1),
('Tiếng Pháp', 'tieng-phap', 1),
('Tiếng Đức', 'tieng-duc', 1),
('Giao tiếp', 'giao-tiep', 1),
('Thuyết trình', 'thuyet-trinh', 1),
('Quản lý dự án', 'quan-ly-du-an', 1),
('Lãnh đạo nhóm', 'lanh-dao-nhom', 1),
('Giải quyết vấn đề', 'giai-quyet-van-de', 1),
('Tư duy phản biện', 'tu-duy-phan-bien', 1),
('Làm việc nhóm', 'lam-viec-nhom', 1),
('Quản lý thời gian', 'quan-ly-thoi-gian', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SELECT CONCAT('Đã tạo ', COUNT(*), ' skills') AS status FROM skills;
