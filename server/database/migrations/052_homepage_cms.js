/**
 * Quick migration runner for homepage CMS tables
 * Run: node database/migrations/052_homepage_cms.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const sql = `
-- Migration 052: Homepage Content CMS
CREATE TABLE IF NOT EXISTS homepage_sections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'quick_stats|testimonials|trusted_by',
    section_type VARCHAR(50) NOT NULL COMMENT 'stats|testimonials|logos',
    title VARCHAR(255),
    subtitle VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_stats (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id INT UNSIGNED NOT NULL,
    icon VARCHAR(100) DEFAULT 'users',
    display_value VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    value_type ENUM('number','percentage','currency','text') DEFAULT 'text',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_testimonials (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id INT UNSIGNED NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    author_avatar VARCHAR(500),
    content TEXT NOT NULL,
    rating INT DEFAULT 5,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_partners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    logo_svg TEXT,
    website_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_homepage_sections_key ON homepage_sections(section_key);
CREATE INDEX idx_homepage_sections_active ON homepage_sections(is_active);
`;

const seedSql = `
-- Seed data
INSERT INTO homepage_sections (section_key, section_type, title, subtitle, is_active, display_order) VALUES
('quick_stats', 'stats', 'Thống kê nền tảng', 'HireBOT kết nối hàng ngàn ứng viên và doanh nghiệp mỗi ngày', 1, 1),
('testimonials', 'testimonials', 'Phản hồi từ người dùng', 'Hàng ngàn ứng viên và nhà tuyển dụng đã kết nối thành công', 1, 3),
('trusted_by', 'logos', 'Được tin dùng bởi các đơn vị hàng đầu', NULL, 1, 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

SET @stats_id = (SELECT id FROM homepage_sections WHERE section_key = 'quick_stats');
SET @testimonials_id = (SELECT id FROM homepage_sections WHERE section_key = 'testimonials');
SET @partners_id = (SELECT id FROM homepage_sections WHERE section_key = 'trusted_by');

INSERT INTO homepage_stats (section_id, icon, display_value, label, value_type, display_order) VALUES
(@stats_id, 'users', '50.000+', 'ứng viên', 'number', 1),
(@stats_id, 'building', '1.000+', 'doanh nghiệp', 'number', 2),
(@stats_id, 'check_circle', '95%', 'vị trí hoàn thành', 'percentage', 3)
ON DUPLICATE KEY UPDATE display_value=VALUES(display_value);

INSERT INTO homepage_testimonials (section_id, author_name, author_role, author_avatar, content, rating, display_order) VALUES
(@testimonials_id, 'Nguyễn Văn Nam', 'Sinh viên IT - ĐH Bách Khoa', 'https://i.pravatar.cc/150?u=nam1', 'Nhờ HireBOT, em đã tìm được thực tập sinh phù hợp chỉ sau 1 tuần. Trợ lý AI gợi ý lộ trình học và chỉnh sửa CV rất thực tế. Rất đáng trải nghiệm!', 5, 1),
(@testimonials_id, 'Trần Ngọc Hà', 'HR Manager - VNG Corp', 'https://i.pravatar.cc/150?u=ha2', 'Hệ thống đánh giá ứng viên của HireBOT giúp team mình tiết kiệm 60% thời gian sàng lọc hồ sơ. AI lọc rất chuẩn các kĩ năng chuyên sâu.', 5, 2),
(@testimonials_id, 'Phạm Minh Tuấn', 'Senior Developer - Tiki', 'https://i.pravatar.cc/150?u=tuan3', 'Mình thích tính năng phân tích độ fit của CV với JD. Giao diện cực kỳ thân thiện, tìm việc không còn là nỗi ám ảnh nữa.', 5, 3)
ON DUPLICATE KEY UPDATE content=VALUES(content);

INSERT INTO homepage_partners (section_id, name, logo_url, logo_svg, website_url, display_order) VALUES
(@partners_id, 'FPT Software', 'https://commons.wikimedia.org/wiki/Special:FilePath/FPT%20Software%20logo.svg', NULL, 'https://fpt.com.vn', 1),
(@partners_id, 'Viettel Solutions', 'https://commons.wikimedia.org/wiki/Special:FilePath/Viettel%20logo%202021.svg', NULL, 'https://viettelsolutions.vn', 2),
(@partners_id, 'VNG Corporation', 'https://commons.wikimedia.org/wiki/Special:FilePath/VNG%20Corp.%20logo.svg', NULL, 'https://vng.com.vn', 3),
(@partners_id, 'CMC Corporation', 'https://commons.wikimedia.org/wiki/Special:FilePath/CMC%20logo%202018.png', NULL, 'https://cmc.com.vn', 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);
`;

async function migrate() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    const DB_NAME = process.env.DB_NAME || 'recruitment_db';
    await connection.query(`USE \`${DB_NAME}\``);
    
    console.log('📦 Creating homepage CMS tables...');
    await connection.query(sql);
    console.log('✅ Tables created successfully');
    
    console.log('🌱 Seeding default data...');
    await connection.query(seedSql);
    console.log('✅ Default data seeded');
    
    console.log('🎉 Homepage CMS migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
