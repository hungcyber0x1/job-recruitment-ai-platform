CREATE TABLE IF NOT EXISTS system_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
  ('site_name', 'HireBOT - Nền tảng tuyển dụng thông minh'),
  ('site_description', 'Kết nối nhà tuyển dụng và ứng viên thông qua công nghệ AI hiện đại'),
  ('contact_email', 'contact@hirebot.vn'),
  ('support_email', 'support@hirebot.vn'),
  ('maintenance_mode', 'false'),
  ('allow_registration', 'true'),
  ('default_language', 'vi'),
  ('ai_chatbot', 'true'),
  ('ai_resume_analysis', 'true'),
  ('ai_moderation', 'true');
