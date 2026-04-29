-- Migration 052: Homepage Content CMS
-- Quản lý nội dung homepage: stats, testimonials, partners

CREATE TABLE IF NOT EXISTS homepage_sections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'quick_stats|testimonials|trusted_by|how_it_works|categories',
    section_type VARCHAR(50) NOT NULL COMMENT 'stats|testimonials|logos|text_blocks',
    title VARCHAR(255),
    subtitle VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    metadata JSON COMMENT 'Additional config like layout, colors',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homepage_stats (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    section_id INT UNSIGNED NOT NULL,
    icon VARCHAR(100) DEFAULT 'users',
    display_value VARCHAR(100) NOT NULL COMMENT 'e.g. 50.000+',
    label VARCHAR(255) NOT NULL COMMENT 'e.g. ứng viên',
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
    rating INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
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
    logo_svg TEXT COMMENT 'SVG inline data',
    website_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (section_id) REFERENCES homepage_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_homepage_sections_key ON homepage_sections(section_key);
CREATE INDEX idx_homepage_sections_active ON homepage_sections(is_active);
CREATE INDEX idx_homepage_stats_section ON homepage_stats(section_id);
CREATE INDEX idx_homepage_testimonials_section ON homepage_testimonials(section_id);
CREATE INDEX idx_homepage_partners_section ON homepage_partners(section_id);
