-- Seed 01: CATEGORIES — Danh mục ngành nghề tại Việt Nam

INSERT INTO categories (name, description, icon_url) VALUES
('Công nghệ thông tin', 'Lập trình, phần mềm, hệ thống, mạng', NULL),
('Marketing & Truyền thông', 'Digital marketing, PR, quảng cáo, branding', NULL),
('Kế toán & Tài chính', 'Kế toán, kiểm toán, tài chính doanh nghiệp', NULL),
('Kinh doanh & Bán hàng', 'Sales, business development, account manager', NULL),
('Nhân sự & Tuyển dụng', 'HR, tuyển dụng, đào tạo, C&B', NULL),
('Kỹ thuật & Sản xuất', 'Cơ khí, điện tử, tự động hóa', NULL),
('Thiết kế & Sáng tạo', 'UI/UX, graphic design, video, animation', NULL),
('Giáo dục & Đào tạo', 'Giảng viên, gia sư, đào tạo doanh nghiệp', NULL),
('Y tế & Dược phẩm', 'Bác sĩ, dược sĩ, điều dưỡng, y tá', NULL),
('Pháp lý & Luật', 'Luật sư, tư vấn pháp lý, tuân thủ', NULL),
('Logistics & Vận tải', 'Kho bãi, vận chuyển, chuỗi cung ứng', NULL),
('Khách sạn & Du lịch', 'Lễ tân, buồng phòng, hướng dẫn viên', NULL),
('Bất động sản', 'Môi giới, tư vấn, quản lý tòa nhà', NULL),
('Xây dựng & Kiến trúc', 'Kiến trúc sư, kỹ sư xây dựng, giám sát', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);
