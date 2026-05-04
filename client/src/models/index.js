/**
 * ============================================================
 * CANONICAL DATA MODELS — Single Source of Truth
 * ============================================================
 *
 * Mọi entity trong hệ thống phải được định nghĩa TẠI ĐÂY.
 * KHÔNG được định nghĩa entity/model ở bất kỳ nơi nào khác
 * (trừ constants/status.js và domain.js — các file này
 *  chỉ chứa labels/config, KHÔNG chứa model definition).
 *
 * Naming convention:
 *   - Field names: snake_case (backend-style)
 *   - Computed/alias fields: camelCase (front-end convenience)
 *   - Enum values: lowercase with underscores
 *
 * Sync rule:
 *   - server field = client field (không rename tùy ý)
 *   - Nếu backend đổi tên field → cập nhật TẠI ĐÂY
 *     rồi mới cập nhật các file consumer
 *
 * Canonical sources:
 *   - server/src/utils/constants.js   → enums & labels
 *   - client/src/constants/status.js  → status configs với Tailwind classes
 *   - client/src/utils/domain.js     → helpers (buildPayload, normalize)
 *   - THIS FILE                      → entity shape definitions
 *
 * ============================================================
 */

/**
 * @typedef {Object} CanonicalUser
 * @property {number|null} id
 * @property {string} email
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {string} full_name        — computed: first_name + last_name
 * @property {string} [fullName]       — camelCase alias for full_name
 * @property {string} [name]          — alias (used by some API responses)
 * @property {'candidate'|'employer'|'admin'} role
 * @property {'active'|'pending'|'inactive'|'banned'|'locked'} [status]
 * @property {string} [avatar_url]
 * @property {string} [avatar]        — alias for avatar_url
 * @property {string} [phone]
 * @property {string} [address]
 * @property {string} [location]      — alias for role-specific address
 * @property {string} [region]       — 'North'|'Central'|'South'|'Overseas'
 * @property {'male'|'female'|'other'} [gender]
 * @property {string} [company_name]  — for employers
 * @property {string} [company_logo] — for employers
 * @property {string} [company_description]
 * @property {string} [company_website]
 * @property {string} [company_size]
 * @property {string} [industry]
 * @property {string} [tax_code]
 * @property {boolean} [is_verified]
 * @property {boolean} [flagged]     — moderation flag
 * @property {string} [moderation_note]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [email_verified_at]
 * @property {string} [oauth_provider]
 * @property {boolean} [email_notifications]
 * @property {boolean} [push_notifications]
 * @property {boolean} [has_local_password]
 * @property {string} [password_updated_at]
 * @property {number} [application_count]   — admin view
 * @property {number} [job_count]          — admin view
 * @property {number} [employer_id]
 * @property {string} [current_job_title]
 * @property {string} [bio]
 * @property {string} [resume_url]
 */

/**
 * @typedef {Object} CanonicalCandidateProfile
 * @extends CanonicalUser
 * @property {number} [candidate_id]
 * @property {string} [bio]
 * @property {number} [experience_years]
 * @property {string} [current_job_title]
 * @property {'actively_looking'|'open_to_work'|'not_looking'|'employed'} [job_search_status]
 * @property {'high_school'|'college'|'bachelor'|'master'|'phd'|'other'} [education_level]
 * @property {CanonicalEducation[]} [education]
 * @property {CanonicalExperience[]} [experience]
 * @property {string} [resume_url]
 * @property {'public'|'private'} [profile_visibility]
 * @property {CanonicalProject[]} [projects]
 * @property {number} [expected_salary_min]
 * @property {number} [expected_salary_max]
 * @property {string} [salary_currency]
 * @property {string[]} [preferred_job_types]
 * @property {string[]} [preferred_locations]
 * @property {boolean} [willing_to_relocate]
 * @property {CanonicalLanguage[]} [languages]
 * @property {CanonicalCertification[]} [certifications]
 * @property {CanonicalSocialLinks} [social_links]
 * @property {CanonicalSkill[]} [skills]
 * @property {string} [last_active_at]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} CanonicalEducation
 * @property {number|string} [id]
 * @property {string} school
 * @property {string} degree
 * @property {string} [major]
 * @property {string} [year]
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {string} [description]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} CanonicalExperience
 * @property {number|string} [id]
 * @property {string} company
 * @property {string} title
 * @property {string} [period]
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {string} [description]
 * @property {boolean} [is_current]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} CanonicalProject
 * @property {number|string} [id]
 * @property {string} title
 * @property {string} [role]
 * @property {string} [image]
 * @property {string[]} [tags]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {string} [github_url]
 * @property {string} [project_url]
 * @property {string} [description]
 */

/**
 * @typedef {Object} CanonicalLanguage
 * @property {string} name
 * @property {'native'|'fluent'|'advanced'|'intermediate'|'basic'} [level]
 */

/**
 * @typedef {Object} CanonicalCertification
 * @property {string} name
 * @property {string} [issuer]
 * @property {string} [date_obtained]
 * @property {string} [expiry_date]
 * @property {string} [credential_url]
 * @property {string} [credential_id]
 */

/**
 * @typedef {Object} CanonicalSocialLinks
 * @property {string} [linkedin]
 * @property {string} [github]
 * @property {string} [portfolio]
 */

/**
 * @typedef {Object} CanonicalSkill
 * @property {number} id
 * @property {number} [skill_id]
 * @property {string} name
 * @property {string} [slug]
 * @property {'beginner'|'intermediate'|'advanced'|'expert'} [proficiency_level]
 * @property {number} [years_experience]
 * @property {boolean} [is_primary]
 */

/**
 * @typedef {Object} CanonicalCompany
 * @property {number|null} id
 * @property {string} company_name
 * @property {string} [name]           — alias for company_name
 * @property {string} [company_logo]
 * @property {string} [logo]            — alias for company_logo
 * @property {string} [company_description]
 * @property {string} [description]    — alias for company_description
 * @property {string} [company_website]
 * @property {string} [website]         — alias for company_website
 * @property {string} [location]
 * @property {string} [city]
 * @property {string} [address]
 * @property {string} [company_size]
 * @property {string} [size]            — alias for company_size
 * @property {string} [scale]           — alias for company_size
 * @property {string} [industry]
 * @property {string} [field]           — alias for industry
 * @property {string} [email]
 * @property {string} [contact_email]    — alias for email
 * @property {string} [phone]
 * @property {string} [tax_code]
 * @property {string} [region]
 * @property {string} [cover_image]
 * @property {boolean} [is_verified]
 * @property {boolean} [flagged]
 * @property {string} [moderation_note]
 * @property {string} [first_name]      — employer contact first name
 * @property {string} [last_name]       — employer contact last name
 * @property {'male'|'female'|'other'} [gender]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {number} [job_count]       — number of published jobs
 * @property {number} [open_positions]  — alias for job_count
 * @property {number} [open_jobs_count] — alias for job_count
 * @property {string} [category_name]  — industry category
 */

/**
 * @typedef {Object} CanonicalJob
 * @property {number|null} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [requirements]
 * @property {string} [benefits]
 * @property {string} [experience_required] — required experience description (DB field name)
 * @property {string} company_name
 * @property {string} [company_logo]
 * @property {string} [company_description]
 * @property {string} [company_website]
 * @property {string} location
 * @property {number} [category_id]
 * @property {string} [category_name]
 * @property {'full_time'|'part_time'|'contract'|'internship'|'remote'} type  — DB column job_type (underscore)
 * @property {'full_time'|'part_time'|'contract'|'internship'|'remote'} [type_db] — alias for type
 * @property {string} [salary_range]   — computed: "X triệu – Y triệu"
 * @property {number} [salary_min]
 * @property {number} [salary_max]
 * @property {boolean} [salary_negotiable]
 * @property {number} [vacancies]
 * @property {string} [salary_currency]
 * @property {string[]} [skills]       — required skill names (may need separate fetch)
 * @property {'draft'|'pending'|'published'|'rejected'|'closed'|'archived'|'expired'} status
 * @property {'draft'|'pending'|'published'|'rejected'|'closed'|'archived'|'expired'} [original_status] — pre-moderation status
 * @property {string} [type_label]      — computed display label
 * @property {string} [status_label]    — computed display label
 * @property {number} [views]
 * @property {number} [applicant_count]
 * @property {boolean} [is_flagged]
 * @property {boolean} [flagged]
 * @property {string} [moderation_note]
 * @property {string} [rejection_reason]
 * @property {string} [deadline]
 * @property {string} [education_required]  — required education level (DB field name)
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {number} [employer_id]
 * @property {number} [user_id]
 * @property {boolean} [is_hot]
 */

/**
 * @typedef {Object} CanonicalApplication
 * @property {number|null} id
 * @property {number} job_id
 * @property {number} [candidate_id]
 * @property {string} [candidate_name] — computed: first_name + last_name
 * @property {string} [candidate_email]
 * @property {string} [candidate_phone]
 * @property {string} [candidate_location]
 * @property {string} [candidate_title]
 * @property {string} job_title
 * @property {number} [employer_id]
 * @property {string} company_name
 * @property {string} [company_logo]
 * @property {'pending'|'reviewed'|'shortlisted'|'interviewing'|'offered'|'hired'|'rejected'|'accepted'|'withdrawn'} status
 * @property {string} [status_label]    — computed display label
 * @property {number} [score]          — AI match score 0-100
 * @property {string} [applied_at]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [cover_letter]
 * @property {string} [resume_url]
 * @property {string} [avatar_url]
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {string} [internal_notes]
 * @property {Object[]} [history]       — status change history
 * @property {Object[]} [notes]         — employer notes
 */

/**
 * @typedef {Object} CanonicalNotification
 * @property {number|null} id
 * @property {number} [user_id]
 * @property {'application'|'job'|'system'|'message'} type
 * @property {string} title
 * @property {string} message
 * @property {boolean} [is_read]
 * @property {boolean} [read]
 * @property {string} [created_at]
 * @property {Object} [data]           — payload tùy loại notification
 */

/**
 * @typedef {Object} CanonicalBlogPost
 * @property {number|null} id
 * @property {string} title
 * @property {string} [slug]
 * @property {string} [content]
 * @property {string} [excerpt]
 * @property {string} [featured_image]
 * @property {string} [thumbnail_url]
 * @property {string} [author_name]
 * @property {number} [author_id]
 * @property {number} [user_id]
 * @property {string} [category]
 * @property {string} [tags]
 * @property {'draft'|'published'|'archived'} [status]
 * @property {number} [view_count]
 * @property {boolean} [is_featured]
 * @property {boolean} [is_flagged]
 * @property {string} [moderation_note]
 * @property {string} [published_at]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} CanonicalSkillEntity
 * @property {number|null} id
 * @property {string} name
 * @property {string} [slug]
 * @property {string} [description]
 * @property {string} [category]
 * @property {number} [job_count]     — số job yêu cầu skill này
 * @property {number} [candidate_count]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} CanonicalInterviewSchedule
 * @property {number|null} id
 * @property {number} application_id
 * @property {number} [candidate_id]
 * @property {number} [employer_id]
 * @property {string} [candidate_name]
 * @property {string} [candidate_email]
 * @property {string} [job_title]
 * @property {string} [company_name]
 * @property {string} scheduled_at
 * @property {string} [end_time]
 * @property {number} [duration_minutes]
 * @property {'scheduled'|'in_progress'|'completed'|'cancelled'|'rescheduled'|'no_show'} status
 * @property {string} [meeting_link]
 * @property {string} [notes]
 * @property {string} [location]
 * @property {string} [interview_type]  — 'online'|'offline'|'phone'
 * @property {string} [interviewer_name]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} CanonicalAIAnalysis
 * @property {number|null} id
 * @property {number} [candidate_id]
 * @property {number} [job_id]
 * @property {number} [application_id]
 * @property {string} [resume_url]
 * @property {Object} [skill_match]
 * @property {Object} [experience_analysis]
 * @property {Object[]} [recommendations]
 * @property {string[]} [missing_skills]
 * @property {Object} [career_path]
 * @property {string} [summary]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} CanonicalResume
 * @property {number|null} id
 * @property {number} [candidate_id]
 * @property {string} [file_url]
 * @property {string} [original_filename]
 * @property {string} [file_type]
 * @property {number} [file_size]
 * @property {string} [parsed_text]
 * @property {Object} [parsed_data]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

// ─── Computed / convenience aliases ──────────────────────────────────────────
// Các alias này được tính toán trong utils/domain.js normalize* functions.
// Chúng được liệt kê ở đây để IDE autocomplete và documentation.

/**
 * @typedef {Object} CandidateDashboardStats
 * @property {Object} applications
 * @property {number} applications.total
 * @property {number} applications.pending
 * @property {number} applications.interviewing
 * @property {number} applications.offered
 * @property {number} applications.hired
 * @property {number} applications.rejected
 * @property {number} savedJobsCount
 * @property {CanonicalApplication[]} recentApplications
 */

/**
 * Barrel exports — dùng trong JSDoc type annotations.
 * @example
 * /** @type {CanonicalUser} * /
 * const user = normalizeUserEntity(rawUser);
 */
