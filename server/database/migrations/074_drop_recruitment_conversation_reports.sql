-- Migration 074: Gỡ bỏ bảng báo cáo hội thoại tuyển dụng
-- Tính năng báo cáo trong khung chat đã bị loại bỏ khỏi API/UI.

SET NAMES utf8mb4;

DROP TABLE IF EXISTS recruitment_conversation_reports;
