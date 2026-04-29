-- Blog: admin và nhà tuyển dụng đăng bài; public chỉ xem bài đã publish

CREATE TABLE IF NOT EXISTS blog_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(320) NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content LONGTEXT,
    image_url VARCHAR(800),
    category VARCHAR(100) NOT NULL DEFAULT 'Technology',
    author_type ENUM('admin', 'employer') NOT NULL,
    author_user_id INT UNSIGNED NOT NULL,
    employer_id INT UNSIGNED NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_blog_posts_slug (slug),
    KEY idx_blog_published (is_published, published_at),
    KEY idx_blog_employer (employer_id),
    CONSTRAINT fk_blog_author_user FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_blog_employer FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
