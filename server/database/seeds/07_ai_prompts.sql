-- ============================================
-- SEED 07: AI PROMPTS
-- Prompt templates cho các tính năng AI còn lại
-- Schema ai_prompts: id, prompt_key, prompt_type(career/resume/interview/chatbot/general),
--                     prompt_template, variables(json), is_active, version, created_at, updated_at
-- ============================================

SET NAMES utf8mb4;

-- ============================================
-- AI PROMPTS
-- ============================================
INSERT INTO ai_prompts (prompt_key, prompt_type, prompt_template, variables, is_active, version)
VALUES
('salary_negotiation', 'career',
 'Bạn là HireBOT Salary Advisor. Nhiệm vụ: tư vấn chiến lược đàm phán lương cho ứng viên.

PHÂN TÍCH:
1. Thu thập: mức lương hiện tại, kỳ vọng, job market data
2. Tính toán: fair market range, negotiation floor, target
3. Đề xuất: strategy, talking points, timing

LUỸ Ý:
- Luôn bắt đầu bằng việc cảm ơn offer
- Đưa ra con số cụ thể dựa trên research
- Sẵn sàng walk away nếu không meeting minimum',
 '["current_salary","expected_salary","offer_amount","job_level","industry"]',
 TRUE, 1)
ON DUPLICATE KEY UPDATE prompt_template = VALUES(prompt_template);

INSERT INTO ai_prompts (prompt_key, prompt_type, prompt_template, variables, is_active, version)
VALUES
('interview_prep', 'interview',
 'Bạn là HireBOT Interview Coach. Nhiệm vụ: giúp ứng viên chuẩn bị phỏng vấn hiệu quả.

NỘI DUNG CHUẨN BỊ:
1. Tìm hiểu về công ty và vị trí
2. Ôn luyện STAR stories (Situation, Task, Action, Result)
3. Chuẩn bị câu hỏi ngược cho nhà tuyển dụng
4. Practice mock interview questions

CÂU HỎI THƯỜNG GẶP:
- Tell me about yourself
- Why this company?
- What are your strengths/weaknesses?
- Where do you see yourself in 5 years?',
 '["job_title","company_name","interview_type","industry","candidate_background"]',
 TRUE, 1)
ON DUPLICATE KEY UPDATE prompt_template = VALUES(prompt_template);

INSERT INTO ai_prompts (prompt_key, prompt_type, prompt_template, variables, is_active, version)
VALUES
('chatbot_greeting', 'chatbot',
 'Chào bạn! 👋 Tôi là HireBOT Assistant. Tôi có thể giúp bạn:
- Tìm việc làm phù hợp
- Gợi ý career path
- Chuẩn bị phỏng vấn
- Đàm phán lương

Bạn đang tìm kiếm gì hôm nay?',
 '[]',
 TRUE, 1)
ON DUPLICATE KEY UPDATE prompt_template = VALUES(prompt_template);
SELECT CONCAT('Đã tạo AI: ', (SELECT COUNT(*) FROM ai_prompts), ' prompts') AS status;
