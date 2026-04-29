-- ============================================
-- DATABASE RESET - CLEAN SCHEMA MIGRATION
-- Job Recruitment AI Platform
-- Created: 2026-04-16
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- PHASE 1: DROP ALL TABLES
-- ============================================
DROP TABLE IF EXISTS ai_prompts;
DROP TABLE IF EXISTS chatbot_analytics;
DROP TABLE IF EXISTS interview_answers;
DROP TABLE IF EXISTS application_history;
DROP TABLE IF EXISTS interview_sessions;
DROP TABLE IF EXISTS interview_questions;
DROP TABLE IF EXISTS ai_resume_analysis;
DROP TABLE IF EXISTS saved_jobs;
DROP TABLE IF EXISTS candidate_skills;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS chatbot_messages;
DROP TABLE IF EXISTS chatbot_conversations;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS candidate_profiles;
DROP TABLE IF EXISTS company_profiles;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS content_pages;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS users;

-- ============================================
-- PHASE 2: CREATE CORE TABLES
-- ============================================

-- Users (single table for all roles)
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    oauth_provider VARCHAR(32) NULL,
    oauth_provider_id VARCHAR(255) NULL,
    role ENUM('admin', 'recruiter', 'candidate') NOT NULL DEFAULT 'candidate',
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL,
    last_login_at DATETIME NULL,
    email_verified_at DATETIME NULL,
    internal_notes TEXT NULL,
    gender ENUM('male', 'female', 'other') NULL,
    region VARCHAR(100) NULL,
    status ENUM('active', 'pending_verification', 'suspended', 'banned') NOT NULL DEFAULT 'pending_verification',
    locked_at DATETIME NULL,
    locked_by INT UNSIGNED NULL,
    permissions JSON NULL,
    email_notifications TINYINT(1) NOT NULL DEFAULT 1,
    push_notifications TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_email (email),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Profiles (replaces employers)
CREATE TABLE company_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255) NULL,
    company_logo VARCHAR(255) NULL,
    company_description TEXT NULL,
    company_size VARCHAR(50) NULL,
    industry VARCHAR(100) NULL,
    location VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    tax_code VARCHAR(20) NULL,
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    flagged TINYINT(1) NOT NULL DEFAULT 0,
    moderation_note TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_company_industry (industry),
    INDEX idx_company_verified (is_verified),
    INDEX idx_company_deleted (deleted_at),
    CONSTRAINT fk_company_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate Profiles
CREATE TABLE candidate_profiles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    bio TEXT NULL,
    experience_years INT NULL DEFAULT 0,
    current_job_title VARCHAR(255) NULL,
    education_level ENUM('high_school', 'college', 'bachelor', 'master', 'phd', 'other') NULL,
    education JSON NULL,
    experience JSON NULL,
    location VARCHAR(255) NULL,
    resume_url VARCHAR(255) NULL,
    projects JSON NULL,
    phone VARCHAR(20) NULL,
    profile_visibility ENUM('public', 'private') NOT NULL DEFAULT 'public',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_candidate_user (user_id),
    CONSTRAINT fk_candidate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    parent_id INT UNSIGNED NULL,
    icon VARCHAR(50) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_slug (slug),
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_active (is_active),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skills
CREATE TABLE skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category_id INT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_skill_slug (slug),
    INDEX idx_skill_category (category_id),
    CONSTRAINT fk_skill_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations
CREATE TABLE locations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'Vietnam',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location_slug (slug),
    INDEX idx_location_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs
CREATE TABLE jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    recruiter_id INT UNSIGNED NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NULL,
    benefits TEXT NULL,
    salary_min DECIMAL(12,2) NULL,
    salary_max DECIMAL(12,2) NULL,
    salary_display VARCHAR(100) NULL,
    salary_negotiable TINYINT(1) NOT NULL DEFAULT 0,
    vacancies INT UNSIGNED NOT NULL DEFAULT 1,
    location_id INT UNSIGNED NULL,
    address VARCHAR(255) NULL,
    job_type ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance') NOT NULL DEFAULT 'full_time',
    experience_level ENUM('entry', 'mid', 'senior', 'lead', 'manager', 'director') NULL,
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'published', 'expired', 'closed', 'suspended') NOT NULL DEFAULT 'draft',
    featured TINYINT(1) NOT NULL DEFAULT 0,
    views INT NOT NULL DEFAULT 0,
    applications_count INT NOT NULL DEFAULT 0,
    expires_at DATE NULL,
    published_at DATETIME NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_job_company (company_id),
    INDEX idx_job_recruiter (recruiter_id),
    INDEX idx_job_category (category_id),
    INDEX idx_job_status (status),
    INDEX idx_job_type (job_type),
    INDEX idx_job_slug (slug),
    INDEX idx_job_deleted (deleted_at),
    INDEX idx_job_featured (featured),
    CONSTRAINT fk_job_company FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_job_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Skills
CREATE TABLE job_skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    is_required TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_job_skill (job_id, skill_id),
    INDEX idx_job_skill_skill (skill_id),
    CONSTRAINT fk_job_skill_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate Skills
CREATE TABLE candidate_skills (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NOT NULL,
    skill_id INT UNSIGNED NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    years_experience INT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_candidate_skill (candidate_id, skill_id),
    INDEX idx_cand_skill_skill (skill_id),
    CONSTRAINT fk_cand_skill_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_cand_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Applications
CREATE TABLE applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    status ENUM('submitted', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn') NOT NULL DEFAULT 'submitted',
    cover_letter TEXT NULL,
    resume_url VARCHAR(255) NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assessed_by INT UNSIGNED NULL,
    assessed_at DATETIME NULL,
    notes TEXT NULL,
    ai_score DECIMAL(5,2) NULL,
    ai_summary TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app_candidate (candidate_id),
    INDEX idx_app_job (job_id),
    INDEX idx_app_status (status),
    INDEX idx_app_applied (applied_at),
    UNIQUE KEY uk_candidate_job (candidate_id, job_id),
    CONSTRAINT fk_app_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_assessed_by FOREIGN KEY (assessed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Application History
CREATE TABLE application_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NULL,
    changed_by INT UNSIGNED NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_history_app (application_id),
    INDEX idx_history_created (created_at),
    CONSTRAINT fk_history_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved Jobs
CREATE TABLE saved_jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NOT NULL,
    job_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_saved_job (candidate_id, job_id),
    CONSTRAINT fk_saved_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AI FEATURES TABLES
-- ============================================

-- AI Resume Analysis
CREATE TABLE ai_resume_analysis (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    file_url VARCHAR(255) NULL,
    analysis_result JSON NULL,
    score DECIMAL(5,2) NULL,
    strengths TEXT NULL,
    weaknesses TEXT NULL,
    suggestions TEXT NULL,
    analyzed_at DATETIME NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_resume_candidate (candidate_id),
    CONSTRAINT fk_resume_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--- Interview Sessions
CREATE TABLE interview_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    application_id INT UNSIGNED NOT NULL,
    candidate_id INT UNSIGNED NOT NULL,
    interviewer_id INT UNSIGNED NULL,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    interview_type ENUM('phone', 'video', 'onsite', 'technical') DEFAULT 'video',
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    meeting_link VARCHAR(500) NULL,
    notes TEXT NULL,
    feedback TEXT NULL,
    rating DECIMAL(3,2) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_interview_app (application_id),
    INDEX idx_interview_cand (candidate_id),
    INDEX idx_interview_scheduled (scheduled_at),
    CONSTRAINT fk_interview_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interview Questions
CREATE TABLE interview_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(100) NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    ideal_answer TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Conversations
CREATE TABLE chatbot_conversations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT UNSIGNED NULL,
    recruiter_id INT UNSIGNED NULL,
    session_type ENUM('career', 'job_search', 'application', 'interview', 'general') NOT NULL DEFAULT 'general',
    status ENUM('active', 'closed', 'escalated') DEFAULT 'active',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    context_data JSON NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conv_candidate (candidate_id),
    INDEX idx_conv_status (status),
    INDEX idx_conv_type (session_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Messages
CREATE TABLE chatbot_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NULL,
    sender_type ENUM('user', 'bot', 'system') NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'suggestion', 'action', 'system') DEFAULT 'text',
    metadata JSON NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_msg_conv (conversation_id),
    INDEX idx_msg_sender_type (sender_type),
    INDEX idx_msg_created (created_at),
    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BLOG & CONTENT TABLES
-- ============================================

-- Blog Posts
CREATE TABLE blog_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    thumbnail_url VARCHAR(255) NULL,
    featured_image VARCHAR(255) NULL,
    view_count INT NOT NULL DEFAULT 0,
    status ENUM('draft', 'pending', 'published', 'rejected') NOT NULL DEFAULT 'draft',
    published_at DATETIME NULL,
    author_type ENUM('admin', 'recruiter', 'candidate') DEFAULT 'admin',
    tags JSON NULL,
    seo_title VARCHAR(255) NULL,
    seo_description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_blog_author (author_id),
    INDEX idx_blog_category (category_id),
    INDEX idx_blog_status (status),
    INDEX idx_blog_slug (slug),
    INDEX idx_blog_published (published_at),
    UNIQUE KEY uk_blog_slug (slug),
    CONSTRAINT fk_blog_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SUPPORT & SYSTEM TABLES
-- ============================================

-- Support Tickets
CREATE TABLE support_tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    assigned_to INT UNSIGNED NULL,
    subject VARCHAR(255) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    category VARCHAR(100) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    INDEX idx_ticket_user (user_id),
    INDEX idx_ticket_assigned (assigned_to),
    INDEX idx_ticket_status (status),
    INDEX idx_ticket_priority (priority),
    CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Messages
CREATE TABLE support_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 0,
    attachments JSON NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_support_msg_ticket (ticket_id),
    INDEX idx_support_msg_sender (sender_id),
    CONSTRAINT fk_support_msg_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_support_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings
CREATE TABLE system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    group_name VARCHAR(50) DEFAULT 'general',
    description VARCHAR(255) NULL,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_setting_group (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs
CREATE TABLE activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT UNSIGNED NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_user (user_id),
    INDEX idx_log_action (action),
    INDEX idx_log_entity (entity_type, entity_id),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Logs
CREATE TABLE email_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NULL,
    status ENUM('pending', 'sent', 'failed', 'opened', 'clicked') DEFAULT 'pending',
    sent_at DATETIME NULL,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_user (user_id),
    INDEX idx_email_type (email_type),
    INDEX idx_email_status (status),
    INDEX idx_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Pages
CREATE TABLE content_pages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page_slug (slug),
    INDEX idx_page_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banners
CREATE TABLE banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NULL,
    target ENUM('all', 'candidate', 'recruiter') DEFAULT 'all',
    position VARCHAR(50) DEFAULT 'homepage',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_banner_active (is_active),
    INDEX idx_banner_target (target),
    INDEX idx_banner_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Prompts
CREATE TABLE ai_prompts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prompt_key VARCHAR(100) NOT NULL UNIQUE,
    prompt_type ENUM('career', 'resume', 'interview', 'chatbot', 'general') DEFAULT 'general',
    prompt_template TEXT NOT NULL,
    variables JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prompt_key (prompt_key),
    INDEX idx_prompt_type (prompt_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Analytics
CREATE TABLE chatbot_analytics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_conversations INT NOT NULL DEFAULT 0,
    total_messages INT NOT NULL DEFAULT 0,
    avg_session_duration INT DEFAULT 0,
    top_intents JSON NULL,
    satisfaction_score DECIMAL(3,2) NULL,
    escalation_rate DECIMAL(5,2) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_analytics_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Schema created successfully!' AS status;
