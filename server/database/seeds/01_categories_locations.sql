-- ============================================
-- SEED 01: CATEGORIES & LOCATIONS
-- Danh mục ngành nghề và địa điểm tại Việt Nam
-- ============================================

SET NAMES utf8mb4;

-- ============================================
-- LOCATIONS
-- ============================================
INSERT INTO locations (name, slug, city, district, country, is_active) VALUES
-- TP. Hồ Chí Minh
('TP. Hồ Chí Minh', 'ho-chi-minh', 'TP. Hồ Chí Minh', NULL, 'Vietnam', 1),
('Quận 1', 'quan-1-hcm', 'TP. Hồ Chí Minh', 'Quận 1', 'Vietnam', 1),
('Quận 3', 'quan-3-hcm', 'TP. Hồ Chí Minh', 'Quận 3', 'Vietnam', 1),
('Quận 7', 'quan-7-hcm', 'TP. Hồ Chí Minh', 'Quận 7', 'Vietnam', 1),
('Quận Bình Thạnh', 'quan-binh-thanh-hcm', 'TP. Hồ Chí Minh', 'Quận Bình Thạnh', 'Vietnam', 1),
('Quận Phú Nhuận', 'quan-phu-nhuan-hcm', 'TP. Hồ Chí Minh', 'Quận Phú Nhuận', 'Vietnam', 1),
('Quận Tân Bình', 'quan-tan-binh-hcm', 'TP. Hồ Chí Minh', 'Quận Tân Bình', 'Vietnam', 1),
('Thủ Đức', 'thu-duc-hcm', 'TP. Hồ Chí Minh', 'Thủ Đức', 'Vietnam', 1),

-- Hà Nội
('Hà Nội', 'ha-noi', 'Hà Nội', NULL, 'Vietnam', 1),
('Quận Ba Đình', 'quan-ba-dinh-hn', 'Hà Nội', 'Quận Ba Đình', 'Vietnam', 1),
('Quận Đống Đa', 'quan-dong-da-hn', 'Hà Nội', 'Quận Đống Đa', 'Vietnam', 1),
('Quận Cầu Giấy', 'quan-cau-giay-hn', 'Hà Nội', 'Quận Cầu Giấy', 'Vietnam', 1),
('Quận Thanh Xuân', 'quan-thanh-xuan-hn', 'Hà Nội', 'Quận Thanh Xuân', 'Vietnam', 1),
('Quận Hoàng Mai', 'quan-hoang-mai-hn', 'Hà Nội', 'Quận Hoàng Mai', 'Vietnam', 1),
('Quận Hai Bà Trưng', 'quan-hai-ba-trung-hn', 'Hà Nội', 'Quận Hai Bà Trưng', 'Vietnam', 1),

-- Đà Nẵng
('Đà Nẵng', 'da-nang', 'Đà Nẵng', NULL, 'Vietnam', 1),
('Quận Hải Châu', 'quan-hai-chau-dn', 'Đà Nẵng', 'Quận Hải Châu', 'Vietnam', 1),
('Quận Thanh Khê', 'quan-thanh-khe-dn', 'Đà Nẵng', 'Quận Thanh Khê', 'Vietnam', 1),

-- Các tỉnh/thành khác
('Bình Dương', 'binh-duong', 'Bình Dương', NULL, 'Vietnam', 1),
('Đồng Nai', 'dong-nai', 'Đồng Nai', NULL, 'Vietnam', 1),
('Bắc Ninh', 'bac-ninh', 'Bắc Ninh', NULL, 'Vietnam', 1),
('Hải Phòng', 'hai-phong', 'Hải Phòng', NULL, 'Vietnam', 1),
('Cần Thơ', 'can-tho', 'Cần Thơ', NULL, 'Vietnam', 1),
('Hải Dương', 'hai-duong', 'Hải Dương', NULL, 'Vietnam', 1),
('Vũng Tàu', 'vung-tau', 'Bà Rịa - Vũng Tàu', NULL, 'Vietnam', 1),
('Khánh Hòa', 'khanh-hoa', 'Khánh Hòa', NULL, 'Vietnam', 1),
('Long An', 'long-an', 'Long An', NULL, 'Vietnam', 1),
('Tiền Giang', 'tien-giang', 'Tiền Giang', NULL, 'Vietnam', 1),

-- Remote / Khác
('Toàn quốc - Remote', 'remote-toan-quoc', NULL, NULL, 'Vietnam', 1),
('Nước ngoài', 'nuoc-ngoai', NULL, NULL, 'International', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- CATEGORIES (ngành nghề chính)
-- ============================================
INSERT INTO categories (name, slug, description, icon, sort_order, is_active) VALUES
('Công nghệ thông tin', 'cntt', 'Phần mềm, phần cứng, mạng, bảo mật, AI', 'code', 1, 1),
('Marketing & Truyền thông', 'marketing', 'Digital marketing, quảng cáo, PR, branding, nội dung', 'megaphone', 2, 1),
('Kế toán & Tài chính', 'tai-chinh', 'Kế toán, kiểm toán, tài chính doanh nghiệp, ngân hàng', 'chart-line', 3, 1),
('Kinh doanh & Bán hàng', 'kinh-doanh', 'Sales, business development, account manager, B2B, B2C', 'briefcase', 4, 1),
('Nhân sự & Hành chính', 'nhan-su', 'HR, tuyển dụng, đào tạo, C&B, hành chính', 'users', 5, 1),
('Kỹ thuật & Sản xuất', 'ky-thuat', 'Cơ khí, điện tử, tự động hóa, sản xuất, năng lượng', 'cogs', 6, 1),
('Thiết kế & Sáng tạo', 'thiet-ke', 'UI/UX, graphic design, video, animation, 3D', 'palette', 7, 1),
('Giáo dục & Đào tạo', 'giao-duc', 'Giảng viên, gia sư, instructional design, edtech', 'book', 8, 1),
('Y tế & Dược phẩm', 'y-te', 'Bác sĩ, dược sĩ, điều dưỡng, y tế công cộng', 'heart-pulse', 9, 1),
('Pháp lý & Tuân thủ', 'phap-ly', 'Luật sư, tư vấn pháp lý, compliance, thuế', 'scale', 10, 1),
('Logistics & Vận tải', 'logistics', 'Kho bãi, vận chuyển, chuỗi cung ứng, procurement', 'truck', 11, 1),
('Khách sạn & Du lịch', 'khach-san', 'Lễ tân, buồng phòng, hướng dẫn viên, quản lý khách sạn', 'hotel', 12, 1),
('Bất động sản & Xây dựng', 'bat-dong-san', 'Môi giới, tư vấn, quản lý tòa nhà, kiến trúc, xây dựng', 'building', 13, 1),
('Nông nghiệp & Môi trường', 'nong-nghiep', 'Nông nghiệp công nghệ cao, ESG, môi trường', 'leaf', 14, 1),
('Dịch vụ & Bảo trì', 'dich-vu', 'Bảo trì, vệ sinh, an ninh, giặt ủi, giặt thuê', 'wrench', 15, 1),
('Truyền thông & Báo chí', 'truyen-thong', 'Phóng viên, biên tập, PR, truyền thông nội bộ', 'newspaper', 16, 1),
('Khoa học & Nghiên cứu', 'khoa-hoc', 'Nghiên cứu, R&D, phòng thí nghiệm', 'flask', 17, 1),
('Tư vấn & Dịch vụ chuyên nghiệp', 'tu-van', 'Management consulting, audit, logistics, outsourcing', 'handshake', 18, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SELECT 'Đã tạo categories và locations' AS status;
