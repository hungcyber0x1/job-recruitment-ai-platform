-- Migration 028: Thêm cột score vào bảng applications
ALTER TABLE applications ADD COLUMN score INT DEFAULT NULL AFTER status;
