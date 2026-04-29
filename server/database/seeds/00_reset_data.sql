-- ============================================
-- SEED 00: RESET DATA
-- Xóa tất cả dữ liệu cũ để tạo lại từ đầu
-- Chạy TRƯỚC TÊN tất cả các seed khác
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa theo thứ tự phụ thuộc (con trước, cha sau)
DELETE FROM activity_logs WHERE 1=1;
DELETE FROM email_logs WHERE 1=1;
DELETE FROM support_messages WHERE 1=1;
DELETE FROM support_tickets WHERE 1=1;
DELETE FROM application_history WHERE 1=1;
DELETE FROM saved_jobs WHERE 1=1;
DELETE FROM interview_questions WHERE 1=1;
DELETE FROM interview_sessions WHERE 1=1;
DELETE FROM chatbot_messages WHERE 1=1;
DELETE FROM chatbot_conversations WHERE 1=1;
DELETE FROM ai_resume_analysis WHERE 1=1;
DELETE FROM applications WHERE 1=1;
DELETE FROM job_skills WHERE 1=1;
DELETE FROM candidate_skills WHERE 1=1;
DELETE FROM blog_posts WHERE 1=1;
DELETE FROM chatbot_analytics WHERE 1=1;
DELETE FROM homepage_partners WHERE 1=1;
DELETE FROM homepage_testimonials WHERE 1=1;
DELETE FROM homepage_stats WHERE 1=1;
DELETE FROM homepage_sections WHERE 1=1;
DELETE FROM banners WHERE 1=1;
DELETE FROM content_pages WHERE 1=1;
DELETE FROM system_settings WHERE 1=1;
DELETE FROM communication_audit WHERE 1=1;
DELETE FROM job_history WHERE 1=1;
DELETE FROM company_members WHERE 1=1;
DELETE FROM jobs WHERE 1=1;
DELETE FROM candidate_profiles WHERE 1=1;
DELETE FROM company_profiles WHERE 1=1;
DELETE FROM skills WHERE 1=1;
DELETE FROM categories WHERE 1=1;
DELETE FROM locations WHERE 1=1;
DELETE FROM users WHERE 1=1;

-- Reset AUTO_INCREMENT
ALTER TABLE activity_logs AUTO_INCREMENT = 1;
ALTER TABLE email_logs AUTO_INCREMENT = 1;
ALTER TABLE support_messages AUTO_INCREMENT = 1;
ALTER TABLE support_tickets AUTO_INCREMENT = 1;
ALTER TABLE application_history AUTO_INCREMENT = 1;
ALTER TABLE saved_jobs AUTO_INCREMENT = 1;
ALTER TABLE interview_questions AUTO_INCREMENT = 1;
ALTER TABLE interview_sessions AUTO_INCREMENT = 1;
ALTER TABLE chatbot_messages AUTO_INCREMENT = 1;
ALTER TABLE chatbot_conversations AUTO_INCREMENT = 1;
ALTER TABLE ai_resume_analysis AUTO_INCREMENT = 1;
ALTER TABLE applications AUTO_INCREMENT = 1;
ALTER TABLE job_skills AUTO_INCREMENT = 1;
ALTER TABLE candidate_skills AUTO_INCREMENT = 1;
ALTER TABLE blog_posts AUTO_INCREMENT = 1;
ALTER TABLE chatbot_analytics AUTO_INCREMENT = 1;
ALTER TABLE homepage_partners AUTO_INCREMENT = 1;
ALTER TABLE homepage_testimonials AUTO_INCREMENT = 1;
ALTER TABLE homepage_stats AUTO_INCREMENT = 1;
ALTER TABLE homepage_sections AUTO_INCREMENT = 1;
ALTER TABLE banners AUTO_INCREMENT = 1;
ALTER TABLE content_pages AUTO_INCREMENT = 1;
ALTER TABLE system_settings AUTO_INCREMENT = 1;
ALTER TABLE communication_audit AUTO_INCREMENT = 1;
ALTER TABLE job_history AUTO_INCREMENT = 1;
ALTER TABLE company_members AUTO_INCREMENT = 1;
ALTER TABLE jobs AUTO_INCREMENT = 1;
ALTER TABLE candidate_profiles AUTO_INCREMENT = 1;
ALTER TABLE company_profiles AUTO_INCREMENT = 1;
ALTER TABLE skills AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE locations AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Đã xóa toàn bộ dữ liệu cũ' AS status;
