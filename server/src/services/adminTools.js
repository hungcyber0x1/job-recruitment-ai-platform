/**
 * Admin Tool Definitions for Chatbot
 * Cho phép chatbot thực hiện các thao tác quản trị khi được admin yêu cầu.
 *
 * CHI DÀNH CHO ADMIN:
 * - Chỉ exposed khi user.role === 'admin'
 * - Tất cả actions được audit log
 * - Confirm trước khi execute destructive actions
 */
const ADMIN_TOOLS = [
  // ── READ ONLY: Dashboard & Analytics ───────────────────────────────
  {
    name: 'get_dashboard_stats',
    description:
      'Lấy thống kê tổng quan platform: tổng users, jobs, applications, companies. Dùng làm dashboard overview.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_chart_stats',
    description:
      'Lấy dữ liệu biểu đồ: user growth (12 tháng), job stats, application distribution by job type, weekly UV/PV.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_platform_health',
    description:
      'Kiểm tra sức khỏe platform: active users, pending approvals, flagged content, recent errors.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ── READ ONLY: Users ──────────────────────────────────────────────
  {
    name: 'list_users',
    description:
      'Liệt kê danh sách users với filter: search, role (candidate/recruiter/admin), status (active/inactive/banned/pending), date range.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by name, email, phone' },
        role: {
          type: 'string',
          enum: ['candidate', 'recruiter', 'admin', ''],
          description: 'Filter by role',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'banned', 'locked', 'pending', 'suspended', ''],
          description: 'Filter by status',
        },
        page: { type: 'integer', description: 'Page number (default: 1)', default: 1 },
        limit: { type: 'integer', description: 'Items per page (default: 20)', default: 20 },
      },
    },
  },
  {
    name: 'get_user_detail',
    description: 'Lấy chi tiết 1 user: profile, statistics, recent activity. Cần user_id.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'User ID cần xem' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_user_activity',
    description: 'Lấy activity log của 1 user: login history, actions, application submissions.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'User ID' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
      required: ['user_id'],
    },
  },

  // ── WRITE: Users ─────────────────────────────────────────────────
  {
    name: 'update_user_status',
    description: 'Thay đổi trạng thái user: active, inactive, suspended, banned. Có thể kèm lý do.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'User ID' },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'suspended', 'banned'],
          description: 'New status',
        },
        reason: { type: 'string', description: 'Lý do thay đổi (ghi vào audit log)' },
      },
      required: ['user_id', 'status'],
    },
  },
  {
    name: 'lock_user',
    description: 'Khóa tài khoản user (không cho đăng nhập). Có thể thêm lý do.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'User ID' },
        reason: { type: 'string', description: 'Lý do khóa' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'unlock_user',
    description: 'Mở khóa tài khoản user đã bị khóa trước đó.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'User ID' },
      },
      required: ['user_id'],
    },
  },

  // ── READ ONLY: Jobs ───────────────────────────────────────────────
  {
    name: 'list_jobs',
    description:
      'Liệt kê tất cả jobs với filter: search, status, job_type, flagged, company. Dùng để review jobs.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search by title, company name' },
        status: { type: 'string', enum: ['active', 'pending', 'closed', 'draft', ''] },
        job_type: { type: 'string' },
        flagged: { type: 'boolean' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },
  {
    name: 'get_job_detail',
    description: 'Lấy chi tiết job: nội dung, số applications, employer info.',
    parameters: {
      type: 'object',
      properties: {
        job_id: { type: 'integer', description: 'Job ID' },
      },
      required: ['job_id'],
    },
  },

  // ── WRITE: Jobs ──────────────────────────────────────────────────
  {
    name: 'update_job_status',
    description: 'Thay đổi trạng thái job: active, pending, closed, draft.',
    parameters: {
      type: 'object',
      properties: {
        job_id: { type: 'integer', description: 'Job ID' },
        status: { type: 'string', enum: ['active', 'pending', 'closed', 'draft'] },
        reason: { type: 'string', description: 'Lý do (ghi vào audit log)' },
      },
      required: ['job_id', 'status'],
    },
  },
  {
    name: 'flag_job',
    description: 'Flag/Unflag job để review. Kèm ghi chú lý do.',
    parameters: {
      type: 'object',
      properties: {
        job_id: { type: 'integer', description: 'Job ID' },
        flagged: { type: 'boolean', description: 'true = flag (cần review), false = unflag' },
        reason: { type: 'string', description: 'Lý do flag' },
      },
      required: ['job_id', 'flagged'],
    },
  },

  // ── READ ONLY: Applications ──────────────────────────────────────
  {
    name: 'list_applications',
    description:
      'Liệt kê applications với filter: status, search. Dùng để theo dõi recruitment pipeline.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        status: {
          type: 'string',
          enum: [
            'submitted',
            'shortlisted',
            'interview_scheduled',
            'interviewed',
            'offered',
            'hired',
            'rejected',
            '',
          ],
        },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },
  {
    name: 'get_application_detail',
    description: 'Lấy chi tiết application: candidate info, job info, timeline, notes.',
    parameters: {
      type: 'object',
      properties: {
        application_id: { type: 'integer', description: 'Application ID' },
      },
      required: ['application_id'],
    },
  },

  // ── READ ONLY: Companies ──────────────────────────────────────────
  {
    name: 'list_companies',
    description: 'Liệt kê companies với filter: search, verified, flagged, page.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        verified: { type: 'boolean' },
        flagged: { type: 'boolean' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },

  // ── WRITE: Companies ─────────────────────────────────────────────
  {
    name: 'verify_company',
    description: 'Xác minh/huỷ xác minh company. Verified companies có badge trên platform.',
    parameters: {
      type: 'object',
      properties: {
        company_id: { type: 'integer' },
        verified: { type: 'boolean' },
        reason: { type: 'string', description: 'Lý do' },
      },
      required: ['company_id', 'verified'],
    },
  },
  {
    name: 'flag_company',
    description: 'Flag/Unflag company để investigate.',
    parameters: {
      type: 'object',
      properties: {
        company_id: { type: 'integer' },
        flagged: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['company_id', 'flagged'],
    },
  },

  // ── READ ONLY: Activity & Audit ──────────────────────────────────
  {
    name: 'get_activity_logs',
    description: 'Lấy admin activity logs: tất cả actions trên platform.',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'integer', description: 'Filter by admin user' },
        action: { type: 'string', description: 'Filter by action type' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 50 },
      },
    },
  },
  {
    name: 'get_audit_trail',
    description: 'Lấy audit trail chi tiết: thay đổi trên application, job, company.',
    parameters: {
      type: 'object',
      properties: {
        target_type: { type: 'string', enum: ['application', 'job', 'company', 'user'] },
        target_id: { type: 'integer' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 50 },
      },
    },
  },

  // ── READ ONLY: Support ────────────────────────────────────────────
  {
    name: 'list_support_tickets',
    description: 'Liệt kê support tickets: open, in_progress, resolved, closed.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },

  // ── READ ONLY: Chatbot Analytics ────────────────────────────────
  {
    name: 'get_chatbot_analytics',
    description:
      'Lấy chatbot analytics: conversations count, messages, active users, satisfaction, top intents.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_chatbot_conversations',
    description: 'Lấy danh sách chatbot conversations: user info, last message, timestamp.',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },
  {
    name: 'get_conversation_detail',
    description: 'Lấy chi tiết 1 conversation: toàn bộ messages giữa user và bot.',
    parameters: {
      type: 'object',
      properties: {
        conversation_id: { type: 'integer' },
      },
      required: ['conversation_id'],
    },
  },
  {
    name: 'get_chatbot_templates',
    description: 'Lấy danh sách chatbot prompt templates đang active.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ── WRITE: Chatbot Management ────────────────────────────────────
  {
    name: 'get_chatbot_config',
    description: 'Lấy cấu hình chatbot hiện tại: enabled features, limits, model settings.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_chatbot_config',
    description:
      'Cập nhật chatbot configuration: feature flags, limits, model. Ví dụ: bật/tắt features, thay đổi daily limit.',
    parameters: {
      type: 'object',
      properties: {
        config_key: {
          type: 'string',
          description: 'Config key cần update (ví dụ: ai_chatbot_daily_limit)',
        },
        config_value: { type: 'string', description: 'Giá trị mới' },
        reason: { type: 'string', description: 'Lý do thay đổi' },
      },
      required: ['config_key', 'config_value'],
    },
  },

  // ── READ ONLY: Settings & Content ────────────────────────────────
  {
    name: 'get_system_settings',
    description: 'Lấy tất cả system settings và feature flags.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_blog_posts',
    description: 'Liệt kê blog posts: title, status, author, created date.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['published', 'draft', 'archived'] },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'Liệt kê job categories: name, slug, count of jobs.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Mappings từ tool name → service/repository method
 * Tool executor sẽ dispatch đến đây
 * NOTE: Write operations cần thêm adminId, ip, userAgent được inject tự động
 */
const TOOL_EXECUTORS = {
  // Dashboard
  get_dashboard_stats: { service: 'AdminService', method: 'getDashboardStats', readOnly: true },
  get_chart_stats: { service: 'AdminService', method: 'getChartStats', readOnly: true },
  get_platform_health: { service: 'AdminService', method: 'getPlatformHealth', readOnly: true },

  // Users (read)
  list_users: { service: 'UserRepository', method: 'findAllWithFilters', readOnly: true },
  get_user_detail: { service: 'UserRepository', method: 'findByIdWithDetails', readOnly: true },
  get_user_activity: { service: 'ActivityLogRepository', method: 'findAll', readOnly: true },
  // Users (write) - adminId được inject tự động
  update_user_status: {
    service: 'AdminService',
    method: 'updateUserStatus',
    readOnly: false,
    args: ['adminId'],
  },
  lock_user: { service: 'AdminService', method: 'lockUser', readOnly: false, args: ['adminId'] },
  unlock_user: {
    service: 'AdminService',
    method: 'unlockUser',
    readOnly: false,
    args: ['adminId'],
  },

  // Jobs (read)
  list_jobs: { service: 'JobRepository', method: 'findWithDetails', readOnly: true },
  get_job_detail: { service: 'JobRepository', method: 'findByIdWithDetails', readOnly: true },
  // Jobs (write)
  update_job_status: {
    service: 'AdminService',
    method: 'updateJobStatus',
    readOnly: false,
    args: ['adminId'],
  },
  flag_job: {
    service: 'AdminService',
    method: 'updateJobFlag',
    readOnly: false,
    args: ['adminId'],
  },

  // Applications (read)
  list_applications: { service: 'ApplicationRepository', method: 'findAll', readOnly: true },
  get_application_detail: {
    service: 'ApplicationRepository',
    method: 'findByIdWithDetails',
    readOnly: true,
  },

  // Companies (read)
  list_companies: { service: 'CompanyRepository', method: 'findAllWithFilters', readOnly: true },
  // Companies (write)
  verify_company: {
    service: 'AdminService',
    method: 'verifyCompany',
    readOnly: false,
    args: ['adminId'],
  },
  flag_company: {
    service: 'AdminService',
    method: 'updateCompanyFlag',
    readOnly: false,
    args: ['adminId'],
  },

  // Logs (read)
  get_activity_logs: { service: 'ActivityLogRepository', method: 'findAll', readOnly: true },
  get_audit_trail: { service: 'AuditLogRepository', method: 'getAuditTrail', readOnly: true },

  // Support (read)
  list_support_tickets: { service: 'AdminService', method: 'getSupportTickets', readOnly: true },

  // Chatbot (read) - qua AdminChatbotService
  get_chatbot_analytics: { service: 'AdminChatbotService', method: 'getAnalytics', readOnly: true },
  get_chatbot_conversations: {
    service: 'AdminChatbotService',
    method: 'getConversations',
    readOnly: true,
  },
  get_conversation_detail: {
    service: 'AdminChatbotService',
    method: 'getConversationDetail',
    readOnly: true,
  },
  get_chatbot_templates: { service: 'AdminChatbotService', method: 'getTemplates', readOnly: true },
  get_chatbot_config: {
    service: 'AdminChatbotService',
    method: 'getConfigurations',
    readOnly: true,
  },
  update_chatbot_config: {
    service: 'AdminChatbotService',
    method: 'updateConfigurations',
    readOnly: false,
    args: ['adminId'],
  },

  // Settings & Content (read)
  get_system_settings: { service: 'SystemSettingsRepository', method: 'findAll', readOnly: true },
  list_blog_posts: { service: 'AdminService', method: 'getBlogPosts', readOnly: true },
  list_categories: { service: 'AdminService', method: 'getCategories', readOnly: true },
};

module.exports = {
  ADMIN_TOOLS,
  TOOL_EXECUTORS,
};
