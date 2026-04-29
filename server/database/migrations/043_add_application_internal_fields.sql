-- Migration 043: Thêm các trường ghi chú nội bộ và chi tiết offer cho đơn ứng tuyển
ALTER TABLE applications 
ADD COLUMN internal_notes TEXT NULL AFTER status,
ADD COLUMN offer_details JSON NULL AFTER internal_notes;

-- Cập nhật lịch sử ứng tuyển để hỗ trợ ghi chú phong phú hơn nếu cần
-- (Hiện tại bảng application_history đã có cột notes TEXT nên không cần thay đổi cấu trúc bảng đó)
