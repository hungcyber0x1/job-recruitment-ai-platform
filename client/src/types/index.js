/**
 * Type definitions for the application using JSDoc
 * This provides IDE autocomplete and type checking without TypeScript
 * @module types
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} email - User email address
 * @property {string} name - User full name
 * @property {'candidate'|'employer'|'admin'} role - User role
 * @property {string} [avatar] - Avatar URL
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Job
 * @property {number} id - Job ID
 * @property {string} title - Job title
 * @property {string} description - Job description
 * @property {string} company_name - Company name
 * @property {string} [company_logo] - Company logo URL
 * @property {string} location - Job location
 * @property {string} type - Job type (full-time, part-time, etc.)
 * @property {string} salary_range - Salary range
 * @property {string[]} skills - Required skills
 * @property {'draft'|'published'|'closed'|'expired'} status - Job status
 * @property {number} [views] - View count
 * @property {number} [applicant_count] - Number of applicants
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
 * @property {'pending'|'reviewed'|'shortlisted'|'interviewing'|'offered'|'hired'|'rejected'|'withdrawn'} status - Application status
 * @property {Date} applied_at - Application timestamp
 * @property {string} [cover_letter] - Cover letter text
 * @property {string} [resume_url] - Resume file URL
 */

/**
 * @typedef {Object} Company
 * @property {number} id - Company ID
 * @property {string} name - Company name
 * @property {string} [logo] - Logo URL
 * @property {string} [description] - Company description
 * @property {string} [website] - Company website
 * @property {string} [location] - Company location
 * @property {number} [employee_count] - Number of employees
 * @property {string} [industry] - Industry type
 * @property {boolean} [verified] - Verification status
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Notification
 * @property {number} id - Notification ID
 * @property {number} user_id - User ID
 * @property {'application'|'job'|'system'} type - Notification type
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

// Export all types for use throughout the application
export {};
