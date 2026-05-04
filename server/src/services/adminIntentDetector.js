/**
 * Admin Intent Detector
 * Phân tích message của admin để detect muốn thực hiện admin actions.
 * Dùng pattern matching + AI extraction thay vì native tool-calling.
 *
 * Flow: message → detect intent → extract params → execute tool → embed result
 */
const logger = require('../utils/logger');

// ── Intent Patterns ─────────────────────────────────────────────────────────
const ADMIN_INTENTS = {
  // Dashboard & Stats
  DASHBOARD_STATS: {
    patterns: [
      /dashboard|thống kê|tổng quan|overview|tổng số|stats/i,
      /bao nhiêu (user|người|job|việc|ứng viên|application)/i,
      /tình trạng platform|platform health|hoạt động/i,
    ],
    tool: 'get_dashboard_stats',
    label: 'Lấy dashboard stats',
  },
  CHART_STATS: {
    patterns: [
      /biểu đồ|chart|growth|growth|curve|đồ thị/i,
      /user growth|tăng trưởng|tỷ lệ/i,
      /thống kê (theo|chi tiết)/i,
    ],
    tool: 'get_chart_stats',
    label: 'Lấy chart stats',
  },
  PLATFORM_HEALTH: {
    patterns: [
      /platform health|sức khỏe|hoạt động|healthy|trạng thái platform/i,
      /có vấn đề|issue|problem|error|bug/i,
      /active user|user đang online|đang hoạt động/i,
    ],
    tool: 'get_platform_health',
    label: 'Kiểm tra platform health',
  },

  // Users
  LIST_USERS: {
    patterns: [
      /danh sách (user|người dùng|tài khoản)/i,
      /xem user|list user|tất cả user/i,
      /tìm user|search user|tìm kiếm user/i,
      /quản lý user|manage user/i,
    ],
    tool: 'list_users',
    label: 'Liệt kê users',
  },
  GET_USER: {
    patterns: [
      /user\s+#?\d+|người dùng\s+#?\d+/i,
      /chi tiết (user|người dùng)\s+#?\d+/i,
      /xem thông tin user\s+#?\d+/i,
    ],
    tool: 'get_user_detail',
    label: 'Chi tiết user',
  },
  UPDATE_USER_STATUS: {
    patterns: [
      /(đổi|thay đổi|update|set).*(status|trạng thái).*(user|người dùng)/i,
      /(active|inactive|banned|suspended|khóa|mở khóa).*(user|người dùng)/i,
      /(ban|unban|lock|unlock).*(user|account)/i,
    ],
    tool: 'update_user_status',
    label: 'Cập nhật trạng thái user',
  },

  // Jobs
  LIST_JOBS: {
    patterns: [
      /danh sách (job|việc làm|tin tuyển dụng)/i,
      /xem job|tất cả job|xem tin tuyển dụng/i,
      /review job|kiểm tra job/i,
    ],
    tool: 'list_jobs',
    label: 'Liệt kê jobs',
  },
  GET_JOB: {
    patterns: [/job\s+#?\d+|việc\s+#?\d+/i, /chi tiết (job|việc)\s+#?\d+/i],
    tool: 'get_job_detail',
    label: 'Chi tiết job',
  },
  UPDATE_JOB_STATUS: {
    patterns: [
      /(đổi|thay đổi|update).*(status|trạng thái).*(job|việc)/i,
      /(đóng|mở|khóa|active|pending|closed).*(job|việc)/i,
      /(approve|reject|duyệt|từ chối).*(job|việc)/i,
    ],
    tool: 'update_job_status',
    label: 'Cập nhật trạng thái job',
  },

  // Applications
  LIST_APPLICATIONS: {
    patterns: [
      /danh sách (application|đơn ứng tuyển|ứng viên)/i,
      /xem (application|đơn)|tất cả application/i,
      /pipeline|recruitment funnel|quy trình tuyển dụng/i,
    ],
    tool: 'list_applications',
    label: 'Liệt kê applications',
  },
  GET_APPLICATION: {
    patterns: [/application\s+#?\d+|đơn\s+#?\d+/i, /chi tiết (application|đơn)\s+#?\d+/i],
    tool: 'get_application_detail',
    label: 'Chi tiết application',
  },

  // Companies
  LIST_COMPANIES: {
    patterns: [/danh sách (company|công ty)/i, /xem company|tất cả company/i, /quản lý company/i],
    tool: 'list_companies',
    label: 'Liệt kê companies',
  },
  VERIFY_COMPANY: {
    patterns: [
      /(verify|xác minh|duyệt).*(company|công ty)/i,
      /(bỏ duyệt|unverify|huỷ verify).*(company|công ty)/i,
    ],
    tool: 'verify_company',
    label: 'Xác minh company',
  },

  // Logs
  GET_ACTIVITY_LOGS: {
    patterns: [
      /activity log|nhật ký|log hoạt động/i,
      /ai đã làm gì|những gì đã xảy ra/i,
      /lịch sử action|action log/i,
    ],
    tool: 'get_activity_logs',
    label: 'Lấy activity logs',
  },
  GET_AUDIT_TRAIL: {
    patterns: [
      /audit trail|nhật ký kiểm toán/i,
      /thay đổi.*application|thay đổi.*job/i,
      /ai đã thay đổi gì/i,
    ],
    tool: 'get_audit_trail',
    label: 'Lấy audit trail',
  },

  // Support
  LIST_TICKETS: {
    patterns: [
      /support ticket|ticket| vé hỗ trợ/i,
      /danh sách ticket|kiểm tra ticket/i,
      /(open|resolved|closed).*ticket/i,
    ],
    tool: 'list_support_tickets',
    label: 'Liệt kê tickets',
  },

  // Chatbot Management
  CHATBOT_ANALYTICS: {
    patterns: [
      /chatbot analytics|thống kê chatbot/i,
      /chatbot (stats|performance|hoạt động)/i,
      /bao nhiêu cuộc trò chuyện|user dùng chatbot/i,
    ],
    tool: 'get_chatbot_analytics',
    label: 'Chatbot analytics',
  },
  CHATBOT_CONVERSATIONS: {
    patterns: [
      /chatbot conversations|cuộc trò chuyện chatbot/i,
      /xem chat|conversation.*chatbot/i,
      /danh sách chat|ai.*đã chat.*ai/i,
    ],
    tool: 'get_chatbot_conversations',
    label: 'Xem chatbot conversations',
  },
  CHATBOT_CONFIG: {
    patterns: [
      /chatbot config|cấu hình chatbot/i,
      /(bật|tắt|enable|disable).*chatbot/i,
      /thay đổi chatbot|chatbot setting/i,
    ],
    tool: 'get_chatbot_config',
    label: 'Xem chatbot config',
  },
  CHATBOT_TEMPLATES: {
    patterns: [
      /chatbot template|prompt template/i,
      /xem prompt|cấu hình prompt/i,
      /chatbot (instruction|system)/i,
    ],
    tool: 'get_chatbot_templates',
    label: 'Xem chatbot templates',
  },

  // Settings
  SYSTEM_SETTINGS: {
    patterns: [
      /system setting|cài đặt hệ thống/i,
      /feature flag|feature toggle/i,
      /(bật|tắt).*feature|enable.*feature/i,
    ],
    tool: 'get_system_settings',
    label: 'Xem system settings',
  },

  // Blog
  LIST_BLOG: {
    patterns: [/danh sách blog|blog post|xem blog/i, /quản lý blog|iểm duyệt blog/i],
    tool: 'list_blog_posts',
    label: 'Liệt kê blog posts',
  },

  // Categories
  LIST_CATEGORIES: {
    patterns: [/danh sách (category|tag|chủ đề|ngành)/i, /category.*management|xem category/i],
    tool: 'list_categories',
    label: 'Liệt kê categories',
  },
};

/**
 * Detect admin intents from a message.
 * Returns array of detected intents with their tools and extracted parameters.
 * @param {string} message - The user's message
 * @returns {Array} Detected intents [{intent, tool, params, confidence}]
 */
function detectAdminIntents(message) {
  if (!message || typeof message !== 'string') return [];

  const results = [];
  const msg = message.trim();

  for (const [intentName, intentDef] of Object.entries(ADMIN_INTENTS)) {
    for (const pattern of intentDef.patterns) {
      if (pattern.test(msg)) {
        const params = extractParams(intentName, msg);
        results.push({
          intent: intentName,
          tool: intentDef.tool,
          label: intentDef.label,
          params,
          confidence: 0.9,
        });
        break;
      }
    }
  }

  // Sort by confidence, deduplicate
  const seen = new Set();
  return results
    .filter((r) => {
      if (seen.has(r.tool)) return false;
      seen.add(r.tool);
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Extract parameters from message based on intent type.
 */
function extractParams(intentName, message) {
  const params = {};
  const msg = message;

  // Extract IDs: job #123, user 456, application 789
  const idPatterns = {
    get_user_detail: /user\s*#?(\d+)|người dùng\s*#?(\d+)/i,
    get_job_detail: /job\s*#?(\d+)|việc\s*#?(\d+)/i,
    get_application_detail: /application\s*#?(\d+)|đơn\s*#?(\d+)/i,
    update_user_status: /user\s*#?(\d+)|người dùng\s*#?(\d+)/i,
    update_job_status: /job\s*#?(\d+)|việc\s*#?(\d+)/i,
    verify_company: /company\s*#?(\d+)|công ty\s*#?(\d+)/i,
    flag_company: /company\s*#?(\d+)|công ty\s*#?(\d+)/i,
    flag_job: /job\s*#?(\d+)/i,
    get_conversation_detail: /conversation\s*#?(\d+)|chat\s*#?(\d+)/i,
  };

  if (idPatterns[intentName]) {
    const match = msg.match(idPatterns[intentName]);
    if (match) {
      const id = parseInt(match[1] || match[2], 10);
      if (intentName.includes('user')) params.user_id = id;
      if (intentName.includes('job')) params.job_id = id;
      if (intentName.includes('application')) params.application_id = id;
      if (intentName.includes('company')) params.company_id = id;
      if (intentName.includes('conversation')) params.conversation_id = id;
    }
  }

  // Extract status
  const statusPatterns = [
    { name: 'active', pattern: /\bactive\b|đang hoạt động|active\b/i },
    { name: 'inactive', pattern: /\binactive\b|không hoạt động/i },
    { name: 'banned', pattern: /\bbanned\b|cấm\b/i },
    { name: 'suspended', pattern: /\bsuspended\b|tạm ngưng/i },
    { name: 'pending', pattern: /\bpending\b|đang chờ/i },
    { name: 'closed', pattern: /\bclosed\b|đã đóng/i },
    { name: 'draft', pattern: /\bdraft\b|nháp\b/i },
    { name: 'published', pattern: /\bpublished\b|đã đăng\b/i },
    { name: 'verified', pattern: /\bverified\b|đã xác minh\b/i },
  ];

  for (const sp of statusPatterns) {
    if (sp.pattern.test(msg)) {
      if (intentName.includes('user') || intentName.includes('status')) {
        params.status = sp.name;
      }
      if (intentName.includes('company') && intentName.includes('verify')) {
        params.verified = sp.name === 'verified';
      }
      break;
    }
  }

  // Extract boolean flags
  if (/\bf(?!ile)\b/.test(msg)) {
    params.flagged = true;
  }
  if (/\bunflag|un-?flag|bỏ flag/.test(msg)) {
    params.flagged = false;
  }

  // Extract search queries
  const searchMatch = msg.match(/(?:search|tìm|search for)\s+["']?([^"']+)["']?/i);
  if (searchMatch) {
    params.search = searchMatch[1].trim();
  }

  // Extract pagination
  const pageMatch = msg.match(/page\s*(\d+)|trang\s*(\d+)/i);
  if (pageMatch) {
    params.page = parseInt(pageMatch[1] || pageMatch[2], 10);
  }

  // Extract reason/note
  const reasonMatch = msg.match(/(?:reason|vì|lý do|ghi chú|note)[:\s]+["']?([^"'\n]+)["']?/i);
  if (reasonMatch) {
    params.reason = reasonMatch[1].trim();
  }

  // Extract config key/value
  if (intentName === 'update_chatbot_config') {
    const keyMatch = msg.match(/(?:key|config)[:\s]+["']?(\S+)["']?/i);
    const valueMatch = msg.match(/(?:value|giá trị)[:\s]+["']?(\S+)["']?/i);
    if (keyMatch) params.config_key = keyMatch[1];
    if (valueMatch) params.config_value = valueMatch[1];
  }

  // Extract target_type for audit trail
  if (intentName === 'get_audit_trail') {
    if (/application/i.test(msg)) params.target_type = 'application';
    else if (/job|việc/i.test(msg)) params.target_type = 'job';
    else if (/company|công ty/i.test(msg)) params.target_type = 'company';
    else if (/user|người dùng/i.test(msg)) params.target_type = 'user';
  }

  // Extract target_type for support tickets
  if (intentName === 'list_support_tickets') {
    if (/open|mở/i.test(msg)) params.status = 'open';
    else if (/resolved|đã giải quyết/i.test(msg)) params.status = 'resolved';
    else if (/closed|đã đóng/i.test(msg)) params.status = 'closed';
  }

  return params;
}

/**
 * Build a context string from tool results for AI consumption.
 * This is appended to the user message when calling the AI.
 */
function buildToolContext(results) {
  if (!results || results.length === 0) return '';

  const sections = results.map((r) => {
    const tool = r.tool || r.executedTool;
    const data = r.result;

    if (!r.success) {
      return `[TOOL: ${tool}]\n❌ Error: ${r.error || r.result}`;
    }

    if (data === null || data === undefined) {
      return `[TOOL: ${tool}]\nKhông có dữ liệu.`;
    }

    const body = typeof data === 'object' ? formatDataForAI(tool, data) : String(data);
    return `[TOOL: ${tool}]\n${body}`;
  });

  return `\n\n=== REAL-TIME DATA FROM DATABASE ===\n${sections.join('\n\n')}\n=== END DATA ===\n\n*Numbers above are live from database - use them accurately. Do NOT guess or estimate.*`;
}

/**
 * Format data object for AI consumption - compact and readable
 * @param {string} toolName - Tool name for tool-specific formatting
 * @param {any} data - Data to format
 */
function formatDataForAI(toolName, data) {
  // Special formatting per tool type
  switch (toolName) {
    case 'get_dashboard_stats': {
      const summary = data.summary || {};
      const appStats = data.applicationStats || {};
      const lines = [
        '## Platform Summary (REAL NUMBERS)',
        `  Total Applications: ${summary.totalApplications !== undefined ? summary.totalApplications.toLocaleString('vi-VN') : 'N/A'}`,
        `  Total Users: ${summary.totalUsers !== undefined ? summary.totalUsers.toLocaleString('vi-VN') : 'N/A'}`,
        `  Total Jobs: ${summary.totalJobs !== undefined ? summary.totalJobs.toLocaleString('vi-VN') : 'N/A'}`,
        `  Total Companies: ${summary.totalCompanies !== undefined ? summary.totalCompanies.toLocaleString('vi-VN') : 'N/A'}`,
      ];
      if (appStats.total !== undefined) {
        lines.push(`  Total Applications: ${appStats.total.toLocaleString('vi-VN')}`);
      }
      if (appStats.distribution && appStats.distribution.length > 0) {
        lines.push('  Applications by job type:');
        appStats.distribution.forEach((d) => {
          lines.push(`    - ${d.name}: ${Number(d.value).toLocaleString('vi-VN')}`);
        });
      }
      return lines.join('\n');
    }

    case 'get_chart_stats': {
      const lines = [];
      if (data.summary) {
        lines.push(`Total Applications: ${data.summary.totalApplications}`);
      }
      if (data.applicationStats?.distribution) {
        lines.push('Applications by type:');
        data.applicationStats.distribution.forEach((d) => {
          lines.push(`  ${d.name}: ${Number(d.value).toLocaleString('vi-VN')}`);
        });
      }
      return lines.join('\n') || 'No data';
    }

    case 'list_users': {
      if (data.total === 0) return 'Không có user nào.';
      const lines = [`Total: ${data.total.toLocaleString('vi-VN')} users`];
      data.items.forEach((u) => {
        lines.push(`  #${u.id} | ${u.name || u.email} | ${u.role} | ${u.status}`);
      });
      if (data.hasMore) lines.push(`  ... và ${data.total - data.items.length} users khác`);
      return lines.join('\n');
    }

    case 'list_jobs': {
      if (data.total === 0) return 'Không có job nào.';
      const lines = [`Total: ${data.total.toLocaleString('vi-VN')} jobs`];
      data.items.forEach((j) => {
        lines.push(
          `  #${j.id} | ${j.title} | ${j.status} | ${j.applications} apps | ${j.company || ''}`
        );
      });
      if (data.hasMore) lines.push(`  ... và ${data.total - data.items.length} jobs khác`);
      return lines.join('\n');
    }

    case 'list_applications': {
      if (data.total === 0) return 'Không có application nào.';
      const lines = [`Total: ${data.total.toLocaleString('vi-VN')} applications`];
      data.items.forEach((a) => {
        lines.push(
          `  #${a.id} | ${a.candidate || 'N/A'} | ${a.job || 'N/A'} | ${a.status} | ${a.applied}`
        );
      });
      if (data.hasMore) lines.push(`  ... và ${data.total - data.items.length} applications khác`);
      return lines.join('\n');
    }

    case 'get_chatbot_analytics': {
      const lines = [
        `Total Conversations: ${data.totalConversations !== undefined ? Number(data.totalConversations).toLocaleString('vi-VN') : 'N/A'}`,
        `Total Messages: ${data.totalMessages !== undefined ? Number(data.totalMessages).toLocaleString('vi-VN') : 'N/A'}`,
        `Active Users: ${data.activeUsers !== undefined ? Number(data.activeUsers).toLocaleString('vi-VN') : 'N/A'}`,
      ];
      if (data.topIntents && data.topIntents.length > 0) {
        lines.push('Top Intents:');
        data.topIntents.forEach((i) => lines.push(`  - ${i.intent}: ${i.count}`));
      }
      return lines.join('\n');
    }

    case 'get_system_settings': {
      const lines = [];
      Object.entries(data).forEach(([category, settings]) => {
        lines.push(`${category}:`);
        if (Array.isArray(settings)) {
          settings.forEach((s) => {
            const val =
              typeof s.value === 'string' && s.value.length > 100
                ? s.value.slice(0, 100) + '...'
                : s.value;
            lines.push(`  ${s.key}: ${val}`);
          });
        }
      });
      return lines.join('\n');
    }

    default: {
      // Generic object formatting
      if (Array.isArray(data)) {
        if (data.length === 0) return 'Không có dữ liệu.';
        const lines = data.slice(0, 15).map((item, i) => {
          const fields = Object.entries(item || {})
            .filter(
              ([k]) =>
                !['password', 'hashedPassword', 'token', 'secret', 'ip', 'user_agent'].includes(k)
            )
            .slice(0, 5)
            .map(([k, v]) => `${k}=${formatValue(v)}`)
            .join(', ');
          return `${i + 1}. ${fields}`;
        });
        let out = lines.join('\n');
        if (data.length > 15) out += `\n... và ${data.length - 15} mục khác`;
        return out;
      }
      // Object
      const entries = Object.entries(data || {})
        .filter(
          ([k]) =>
            !['password', 'hashedPassword', 'token', 'secret', 'ip', 'user_agent'].includes(k)
        )
        .map(([k, v]) => `  ${k}: ${formatValue(v)}`);
      return entries.join('\n') || 'No data';
    }
  }
}

/**
 * Format a single value for AI
 */
function formatValue(val) {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    if (Array.isArray(val)) return `[${val.length} items]`;
    return JSON.stringify(val).slice(0, 100);
  }
  return String(val).slice(0, 200);
}

module.exports = {
  detectAdminIntents,
  extractParams,
  buildToolContext,
  formatDataForAI,
};
