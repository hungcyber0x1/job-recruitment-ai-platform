/**
 * Type definitions for the application using JSDoc
 * This provides IDE autocomplete and type checking without TypeScript
 * @module types
 *
 * ⚠️  CANONICAL SOURCE: client/src/models/index.js
 * Mọi entity model mới PHẢI định nghĩa trong models/index.js.
 * File này giữ lại các @typedef cũ để backward compatibility
 * với các file đang dùng @type {User}, @type {Job}, v.v.
 *
 * Khi thêm code mới, dùng @type {CanonicalUser}, @type {CanonicalJob}, v.v.
 * từ models/index.js.
 */

/// <reference path="../models/index.js" />

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email address
 * @property {string} name - User full name (computed from first_name + last_name)
 * @property {string} [full_name] - User full name alias
 * @property {string} [fullName] - Camel-case alias derived from full_name
 * @property {string} [first_name] - First name
 * @property {string} [last_name] - Last name
 * @property {'candidate'|'employer'|'admin'} role - User role
 * @property {string} [avatar] - Avatar URL (alias for avatar_url)
 * @property {string} [avatar_url] - Avatar URL
 * @property {'active'|'pending'|'inactive'|'banned'|'locked'} [status] - Account status
 * @property {string} [phone] - Contact phone number
 * @property {string} [address] - User contact address
 * @property {string} [location] - Display location alias for role-specific views
 * @property {string} [region] - User region
 * @property {string} [company_name] - Company name (for employers)
 * @property {string} [companyName] - Camel-case alias for company_name
 * @property {string} [company_logo] - Company logo URL (for employers)
 * @property {string} [companyLogo] - Camel-case alias for company_logo
 * @property {Date} created_at - Creation timestamp
 */

const APPLICATION_STATUSES = [
  'pending',
  'reviewed',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'accepted',
  'withdrawn',
];

const JOB_STATUSES = ['draft', 'pending', 'published', 'rejected', 'closed', 'archived', 'expired'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'remote'];
const USER_STATUSES = ['active', 'pending', 'inactive', 'banned', 'locked'];

// ─── Candidate Profile Phase 1.1 ───────────────────────────────────────────────

/**
 * @typedef {'actively_looking'|'open_to_work'|'not_looking'|'employed'} JobSearchStatus
 */

/**
 * @typedef {'beginner'|'intermediate'|'advanced'|'expert'} ProficiencyLevel
 */

/**
 * @typedef {'high_school'|'college'|'bachelor'|'master'|'phd'|'other'} EducationLevel
 */

/**
 * @typedef {Object} EducationItem
 * @property {number|string} [id] - Unique ID
 * @property {string} school - School name
 * @property {string} degree - Degree or qualification
 * @property {string} [major] - Major/specialization
 * @property {string} [year] - Graduation year
 * @property {string} [start_date] - Start date (ISO)
 * @property {string} [end_date] - End date (ISO)
 * @property {string} [description] - Additional details
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [updated_at] - Update timestamp
 */

/**
 * @typedef {Object} ExperienceItem
 * @property {number|string} [id] - Unique ID
 * @property {string} company - Company name
 * @property {string} title - Job title
 * @property {string} [period] - Period string (e.g. "Jan 2020 - Dec 2022")
 * @property {string} [start_date] - Start date (ISO)
 * @property {string} [end_date] - End date (ISO, null if current)
 * @property {string} [description] - Job description / responsibilities
 * @property {boolean} [is_current] - Currently working here
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [updated_at] - Update timestamp
 */

/**
 * @typedef {Object} ProjectItem
 * @property {number|string} [id] - Unique ID
 * @property {string} title - Project title
 * @property {string} [role] - Role in project
 * @property {string} [image] - Project image URL
 * @property {string[]} [tags] - Tech tags
 * @property {string} [startDate] - Start date
 * @property {string} [endDate] - End date
 * @property {string} [github_url] - GitHub URL
 * @property {string} [project_url] - Live URL
 * @property {string} [description] - Project description
 */

/**
 * @typedef {Object} LanguageItem
 * @property {string} name - Language name
 * @property {'native'|'fluent'|'advanced'|'intermediate'|'basic'} [level] - Proficiency level
 */

/**
 * @typedef {Object} CertificationItem
 * @property {string} name - Certification name
 * @property {string} [issuer] - Issuing organization
 * @property {string} [date_obtained] - Date obtained (ISO)
 * @property {string} [expiry_date] - Expiry date (ISO)
 * @property {string} [credential_url] - Credential URL
 * @property {string} [credential_id] - Credential ID
 */

/**
 * @typedef {Object} SocialLinks
 * @property {string} [linkedin] - LinkedIn profile URL
 * @property {string} [github] - GitHub profile URL
 * @property {string} [portfolio] - Portfolio website URL
 */

/**
 * @typedef {Object} CandidateSkill
 * @property {number} id - Skill ID
 * @property {number} skill_id - Skill ID (alias)
 * @property {string} name - Skill name
 * @property {string} [slug] - Skill slug
 * @property {ProficiencyLevel} [proficiency_level] - Proficiency level
 * @property {number} [years_experience] - Years of experience
 * @property {boolean} [is_primary] - Is primary skill
 */

/**
 * @typedef {Object} CandidateProfile
 * @property {number} id - Candidate profile ID
 * @property {number} user_id - User ID
 * @property {User} [user] - Associated user
 * @property {string} [bio] - Bio / self introduction
 * @property {number} [experience_years] - Years of experience
 * @property {string} [current_job_title] - Current job title
 * @property {EducationLevel} [education_level] - Education level
 * @property {EducationItem[]} [education] - Education history
 * @property {ExperienceItem[]} [experience] - Work experience
 * @property {string} [location] - Location
 * @property {string} [resume_url] - Resume URL
 * @property {string} [phone] - Phone number
 * @property {'public'|'private'} [profile_visibility] - Profile visibility
 * @property {ProjectItem[]} [projects] - Project portfolio
 * @property {JobSearchStatus} [job_search_status] - Job search status
 * @property {number} [expected_salary_min] - Minimum expected salary
 * @property {number} [expected_salary_max] - Maximum expected salary
 * @property {string} [salary_currency] - Salary currency (default VND)
 * @property {string[]} [preferred_job_types] - Preferred job types
 * @property {string[]} [preferred_locations] - Preferred work locations
 * @property {boolean} [willing_to_relocate] - Willing to relocate
 * @property {LanguageItem[]} [languages] - Languages spoken
 * @property {CertificationItem[]} [certifications] - Certifications
 * @property {SocialLinks} [social_links] - Social links
 * @property {CandidateSkill[]} [skills] - Skills with proficiency
 * @property {string} [last_active_at] - Last active timestamp
 * @property {string} [created_at] - Creation timestamp
 * @property {string} [updated_at] - Update timestamp
 */

/**
 * @typedef {Object} DashboardStats
 * @property {Object} applications - Application counts
 * @property {number} applications.total - Total applications
 * @property {number} applications.pending - Pending applications
 * @property {number} applications.interviewing - Interviewing count
 * @property {number} applications.offered - Offered count
 * @property {number} applications.hired - Hired count
 * @property {number} applications.rejected - Rejected count
 * @property {number} savedJobsCount - Saved jobs count
 * @property {Object[]} recentApplications - Recent application items
 */

/**
 * @typedef {Object} Job
 * @property {number} id - Job ID
 * @property {string} title - Job title
 * @property {string} description - Job description
 * @property {string} company_name - Company name
 * @property {string} [company_logo] - Company logo URL
 * @property {string} location - Job location
 * @property {'full-time'|'part-time'|'contract'|'internship'|'remote'} type - Job type
 * @property {string} [type_label] - Display label derived from canonical job type
 * @property {string} salary_range - Salary range (computed from salary_min/salary_max)
 * @property {number} [salary_min] - Minimum salary
 * @property {number} [salary_max] - Maximum salary
 * @property {boolean} [salary_negotiable] - Whether salary is negotiable
 * @property {number} [vacancies] - Number of open positions
 * @property {string[]} skills - Required skills (may need separate API call to fetch)
 * @property {'draft'|'published'|'closed'} status - Job status
 * @property {string} [status_label] - Display label derived from canonical job status
 * @property {number} [views] - View count
 * @property {number} [applicant_count] - Number of applicants
 * @property {boolean} [is_flagged] - Moderation flag
 * @property {string} [moderation_note] - Internal moderation note
 * @property {Date} created_at - Creation timestamp
 * @property {Date} [deadline] - Application deadline
 * @property {boolean} [is_hot] - Hot job indicator
 */

/**
 * @typedef {Object} Application
 * @property {number} id - Application ID
 * @property {number} job_id - Job ID
 * @property {number} candidate_id - Candidate ID
 * @property {string} job_title - Job title
 * @property {string} company_name - Company name
 * @property {string} [company_logo] - Company logo URL
 * @property {'pending'|'shortlisted'|'interviewing'|'offered'|'hired'|'rejected'} status - Application status
 * @property {string} [status_label] - Display label derived from canonical application status
 * @property {number} [score] - AI match score (0-100)
 * @property {Date} applied_at - Application timestamp
 * @property {string} [cover_letter] - Cover letter text
 * @property {string} [resume_url] - Resume file URL
 */

/**
 * @typedef {Object} Company
 * @property {number} id - Company ID
 * @property {string} company_name - Company name
 * @property {string} [company_logo] - Logo URL
 * @property {string} [company_description] - Company description
 * @property {string} [company_website] - Company website
 * @property {string} [location] - Company location
 * @property {string} [company_size] - Number of employees (use employee_count for frontend)
 * @property {number} [employee_count] - Number of employees (alias for company_size)
 * @property {string} [industry] - Industry type
 * @property {boolean} [is_verified] - Verification status
 * @property {boolean} [is_flagged] - Moderation flag
 * @property {string} [moderation_note] - Internal moderation note
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Notification
 * @property {number} id - Notification ID
 * @property {number} user_id - User ID
 * @property {'application'|'job'|'system'|'message'} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {boolean} read - Read status
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success - Request success status
 * @property {T} data - Response data
 * @property {string} [message] - Response message
 * @property {Object} [error] - Error details
 */

/**
 * @typedef {Object} PaginatedResponse
 * @template T
 * @property {boolean} success - Request success status
 * @property {T[]} data - Array of data items
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 */

/**
 * @typedef {Object} FormErrors
 * @template T
 * @property {Partial<Record<keyof T, string>>} errors - Field errors
 */


// Legacy type aliases (backward compat) — prefer Canonical* from models/index.js
export { APPLICATION_STATUSES, JOB_STATUSES, JOB_TYPES, USER_STATUSES };
