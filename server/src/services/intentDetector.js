/**
 * Intent Detection Service
 * Analyzes user messages to detect career-related intents
 * and routes to specialized prompts/workflows.
 */

/**
 * Career-related intent categories
 */
const INTENT_CATEGORIES = {
  JOB_SEARCH: 'job_search',
  CV_RESUME: 'cv_resume',
  INTERVIEW: 'interview',
  SALARY: 'salary',
  CAREER_PLAN: 'career_plan',
  SKILLS: 'skills',
  COMPANIES: 'companies',
  RECRUITMENT: 'recruitment',
  ANALYTICS: 'analytics',
  PLATFORM_MANAGEMENT: 'platform_management',
  CANDIDATE_SOURCING: 'candidate_sourcing',
  GENERAL: 'general',
};

/**
 * Keyword patterns for each intent category
 */
const INTENT_PATTERNS = {
  [INTENT_CATEGORIES.JOB_SEARCH]: [
    /tìm việc|find job|kiếm việc|job search|tuyển dụng|recruit|ứng tuyển|apply/i,
    /việc làm|job opportunity|job vacancy|công việc|job position/i,
    /job\s/i, /công ty\s/i, /job\s+description/i,
    /hiring|job opening|open position/i,
    /lương|salary|thu nhập|income/i,
    /job\s*match/i,
  ],

  [INTENT_CATEGORIES.CV_RESUME]: [
    /cv|resume|hồ sơ|curriculum/i,
    /cover letter|thư ứng tuyển/i,
    /cải thiện|improvement|optimize/i,
    /profile|profile|bio|hồ sơ cá nhân/i,
    /trích xuất|extract|parse|phân tích cv/i,
    /phân tích cv|analyze cv/i,
  ],

  [INTENT_CATEGORIES.INTERVIEW]: [
    /phỏng vấn|interview|round\s*\d/i,
    /chuẩn bị|prepare|thực hành|practice/i,
    /câu hỏi|question|trả lời|answer/i,
    /star method|behavioral|situational/i,
    /casing|case interview/i,
    /technical interview|whiteboard/i,
  ],

  [INTENT_CATEGORIES.SALARY]: [
    /lương|salary|thu nhập|income|compensation/i,
    /đàm phán|negotiate|thương lượng/i,
    /bonus|thưởng|phúc lợi|benefit/i,
    /raise|tăng lương|promotion/i,
    /offer letter|đề nghị tuyển dụng/i,
  ],

  [INTENT_CATEGORIES.CAREER_PLAN]: [
    /lộ trình|career path|roadmap|kế hoạch/i,
    /phát triển|develop|growth|progress/i,
    /chuyển nghề|switch career|pivot/i,
    /mục tiêu|goal|objective|target/i,
    /future|tương lai|hướng đi/i,
    /five year|10 year|dài hạn|long term/i,
  ],

  [INTENT_CATEGORIES.SKILLS]: [
    /kỹ năng|skill|technical|certification/i,
    /học|learn|study|course|training/i,
    /certificat|chứng chỉ|credential/i,
    /tool|framework|library|technology/i,
    /aws|react|python|java|sql/i,
    /gap|thiếu|missing|missing skill/i,
  ],

  [INTENT_CATEGORIES.COMPANIES]: [
    /công ty|company|doanh nghiệp|enterprise/i,
    /môi trường|workplace|culture|team/i,
    /remote|hybrid|wfh|office/i,
    /startup|big tech|faang|unicorn/i,
    /review|đánh giá|feedback|tips/i,
    /glassdoor|linkedin company/i,
  ],

  [INTENT_CATEGORIES.RECRUITMENT]: [
    /tuyển dụng|recruit|hiring|đăng tin tuyển/i,
    /viết tin tuyển|job posting|nội dung tuyển/i,
    /mô tả công việc|job description|jd/i,
    /quy trình tuyển|process|nào hiệu quả/i,
    /bulk hire|tuyển số lượng|large scale/i,
  ],

  [INTENT_CATEGORIES.CANDIDATE_SOURCING]: [
    /tìm ứng viên|source candidate|search candidate/i,
    /headhunter|recruiter|agency/i,
    /candidate pool|talent pool|hồ sơ ứng viên/i,
    /passive candidate|nhàn rỗi|tìm kiếm chủ động/i,
  ],

  [INTENT_CATEGORIES.ANALYTICS]: [
    /báo cáo|report|thống kê|analytics/i,
    /dashboard|biểu đồ|metrics|kpi/i,
    /xu hướng|trend|so sánh|compare/i,
    /conversion|funnel|tỷ lệ|rate/i,
    /usage|engagement|tương tác|người dùng/i,
  ],

  [INTENT_CATEGORIES.PLATFORM_MANAGEMENT]: [
    /cấu hình|config|setting|thiết lập/i,
    /user management|quản lý người dùng|phân quyền/i,
    /moderat|kiểm duyệt|flag|report|nội dung xấu/i,
    /feature flag|toggle|bật tắt|enable disable/i,
    /system health|health check|monitor|giám sát/i,
    /api key|quota|limit|giới hạn/i,
    /update system|cập nhật|upgrade|deploy/i,
  ],
};

/**
 * Specialized prompts for each intent
 */
const INTENT_PROMPTS = {
  [INTENT_CATEGORIES.JOB_SEARCH]: {
    greeting: 'Bạn đang tìm kiếm việc làm? Tôi có thể giúp!',
    system_addition: `When user intent is JOB_SEARCH:
- Ask clarifying questions about desired role, location, salary range
- Consider user's skills and experience level
- Mention relevant job search strategies (networking, LinkedIn optimization)
- If user shares a job description, analyze match and suggest improvements`,
  },

  [INTENT_CATEGORIES.CV_RESUME]: {
    greeting: 'Bạn muốn cải thiện CV? Tôi có thể giúp đánh giá và đề xuất!',
    system_addition: `When user intent is CV_RESUME:
- Be specific about strengths and areas for improvement
- Use actionable language: "Consider adding...", "Stronger if you..."
- Reference the job description when evaluating fit
- Suggest ATS-friendly formatting tips`,
  },

  [INTENT_CATEGORIES.INTERVIEW]: {
    greeting: 'Chuẩn bị phỏng vấn? Tôi có thể giúp bạn thực hành!',
    system_addition: `When user intent is INTERVIEW:
- Encourage STAR method for behavioral questions
- Suggest research on company before interview
- Offer to do mock Q&A sessions
- Provide body language and communication tips
- Reference common interview formats (phone, video, onsite)`,
  },

  [INTENT_CATEGORIES.SALARY]: {
    greeting: 'Về lương và đàm phán? Đây là chủ đề tôi có thể hỗ trợ bạn!',
    system_addition: `When user intent is SALARY:
- Provide market data context when possible (mention "based on general market data")
- Never make definitive salary promises
- Suggest research tools: Glassdoor, Payscale, Levels.fyi
- Offer negotiation scripts and techniques
- Mention benefits beyond base salary`,
  },

  [INTENT_CATEGORIES.CAREER_PLAN]: {
    greeting: 'Lập kế hoạch nghề nghiệp? Tôi có thể giúp bạn xác định hướng đi!',
    system_addition: `When user intent is CAREER_PLAN:
- Ask about current role, target role, and timeline
- Break down milestones into actionable steps
- Consider skill gaps between current and target
- Mention industry trends and future outlook
- Keep suggestions realistic and time-bound`,
  },

  [INTENT_CATEGORIES.SKILLS]: {
    greeting: 'Về kỹ năng? Tôi có thể giúp bạn định hướng học tập!',
    system_addition: `When user intent is SKILLS:
- Recommend skills based on current market demand
- Suggest learning resources (courses, certifications, projects)
- Differentiate between must-have vs nice-to-have skills
- Consider both technical and soft skills
- Mention skill combinations that are especially valuable`,
  },

  [INTENT_CATEGORIES.COMPANIES]: {
    greeting: 'Nghiên cứu công ty? Tôi có thể giúp bạn tìm hiểu!',
    system_addition: `When user intent is COMPANIES:
- Encourage research on company culture and values
- Suggest questions to ask in interviews about company
- Provide general frameworks for evaluating companies
- Never make definitive claims about specific companies
- Suggest using LinkedIn, Glassdoor, and direct networking`,
  },

  [INTENT_CATEGORIES.RECRUITMENT]: {
    greeting: 'Bạn cần hỗ trợ tuyển dụng? Tôi sẽ giúp bạn!',
    system_addition: `When user intent is RECRUITMENT (Employer):
- Help craft compelling, clear job descriptions that attract the right candidates
- Suggest best practices for job posting structure and format
- Recommend salary ranges based on market data (always with caveat: "based on general market data")
- Guide on creating effective screening criteria
- Do NOT access or discuss any specific candidate's personal data`,
  },

  [INTENT_CATEGORIES.CANDIDATE_SOURCING]: {
    greeting: 'Tìm kiếm ứng viên phù hợp? Để tôi hỗ trợ!',
    system_addition: `When user intent is CANDIDATE_SOURCING (Employer):
- Suggest effective sourcing strategies and channels
- Guide on writing outreach messages to passive candidates
- Recommend screening questions based on role requirements
- Help identify red flags in candidate profiles
- Do NOT make definitive judgments about individual candidates`,
  },

  [INTENT_CATEGORIES.ANALYTICS]: {
    greeting: 'Phân tích dữ liệu tuyển dụng? Tôi có thể giúp!',
    system_addition: `When user intent is ANALYTICS (Employer/Admin):
- Help interpret recruitment metrics and KPIs
- Suggest ways to improve conversion funnels
- Guide on building effective reporting dashboards
- Always provide context and caveats for data interpretations`,
  },

  [INTENT_CATEGORIES.PLATFORM_MANAGEMENT]: {
    greeting: 'Quản lý nền tảng? Tôi sẽ hỗ trợ bạn!',
    system_addition: `When user intent is PLATFORM_MANAGEMENT (Admin):
- Provide guidance on platform configuration options
- Suggest security and performance best practices
- Help interpret system logs and monitoring data
- Recommend feature enablement strategies
- Always prioritize data privacy and security
- Do NOT make automated decisions on sensitive admin actions — flag for human review`,
  },
};

/**
 * Detect intent from user message
 * @param {string} message - User's message
 * @returns {object} { intent, confidence, keywords }
 */
function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return { intent: INTENT_CATEGORIES.GENERAL, confidence: 0, keywords: [] };
  }

  const lowerMessage = message.toLowerCase();
  const scores = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    const matchedPatterns = [];

    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        score += 1;
        matchedPatterns.push(pattern.source);
      }
    }

    scores[intent] = { score, matchedPatterns };
  }

  let bestIntent = INTENT_CATEGORIES.GENERAL;
  let bestScore = 0;

  for (const [intent, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestIntent = intent;
    }
  }

  const confidence = Math.min(bestScore / 3, 1.0);
  const keywords = scores[bestIntent]?.matchedPatterns || [];

  return { intent: bestIntent, confidence, keywords };
}

/**
 * Get specialized system instruction additions based on intent
 * @param {string} intent - Detected intent
 * @returns {string} Additional system instructions
 */
function getIntentSystemAddition(intent) {
  const intentConfig = INTENT_PROMPTS[intent];
  return intentConfig?.system_addition || '';
}

/**
 * Get greeting for detected intent
 * @param {string} intent - Detected intent
 * @returns {string} Personalized greeting
 */
function getIntentGreeting(intent) {
  const intentConfig = INTENT_PROMPTS[intent];
  return intentConfig?.greeting || '';
}

/**
 * Get contextual suggested questions based on intent and role
 * @param {string} intent - Detected intent
 * @param {string} role - User role ('candidate', 'employer', 'admin', etc.)
 * @returns {string[]} Array of suggested questions
 */
function getIntentSuggestedQuestions(intent, role) {
  const roleNormalized = (role || 'candidate').toLowerCase().trim();

  const roleDefaultQuestions = {
    recruiter: [
      'Viết tin tuyển dụng hấp dẫn cho vị trí IT',
      'Cách sàng lọc ứng viên hiệu quả',
      'Benchmark lương cho lập trình viên 2025',
      'Câu hỏi phỏng vấn behavioral tốt nhất',
    ],
    admin: [
      'Tổng quan chatbot usage metrics',
      'Cấu hình feature flags cho platform',
      'Cách kiểm duyệt nội dung hiệu quả',
      'Báo cáo platform health hàng tuần',
    ],
    candidate: [
      'Gợi ý cải thiện CV cho vị trí IT',
      'Kỹ năng nào đang được săn đón?',
      'Chuẩn bị phỏng vấn hiệu quả',
      'Lộ trình phát triển sự nghiệp IT',
    ],
  };

  const roleBasedDefault = roleDefaultQuestions[roleNormalized] || roleDefaultQuestions['candidate'];

  const questions = {
    [INTENT_CATEGORIES.JOB_SEARCH]: [
      'Tìm việc IT ở TP.HCM lương 20-30 triệu',
      'Cách viết email ứng tuyển hiệu quả',
      'Job hopping có ảnh hưởng CV không?',
      'Tìm việc remote cho lập trình viên',
    ],
    [INTENT_CATEGORIES.CV_RESUME]: [
      'Cải thiện CV để qua ATS',
      'Viết resume cho fresher IT',
      'Cover letter mẫu cho vị trí DevOps',
      'CV tiếng Anh hay tiếng Việt tốt hơn?',
    ],
    [INTENT_CATEGORIES.INTERVIEW]: [
      'Câu hỏi phỏng vấn thường gặp cho IT',
      'Cách trả lời "Tell me about yourself"',
      'Thực hành STAR method',
      'Chuẩn bị phỏng vấn technical',
    ],
    [INTENT_CATEGORIES.SALARY]: [
      'Đàm phán lương khi nhận offer',
      'Lương lập trình viên Python 2025',
      'Khi nào nên từ chối offer vì lương',
      'Cách đề nghị tăng lương',
    ],
    [INTENT_CATEGORIES.CAREER_PLAN]: [
      'Lộ trình từ Junior lên Senior Dev',
      'Chuyển từ Backend sang Frontend',
      'Nên học AI từ đâu?',
      '5 năm tới ngành IT sẽ ra sao?',
    ],
    [INTENT_CATEGORIES.SKILLS]: [
      'Kỹ năng cần cho Product Manager',
      'Học Docker từ đâu hiệu quả?',
      'Certifications có giá trị cho DevOps?',
      'Soft skills quan trọng cho developer',
    ],
    [INTENT_CATEGORIES.COMPANIES]: [
      'Cách research công ty trước phỏng vấn',
      'Startup vs big tech - nên chọn gì?',
      'Công ty outsource có nên vào không?',
      'Cách hỏi về văn hóa công ty',
    ],
    [INTENT_CATEGORIES.RECRUITMENT]: [
      'Viết tin tuyển dụng hấp dẫn cho vị trí IT',
      'Mô tả công việc (JD) chuẩn cho Senior Dev',
      'Cách đặt lương cạnh tranh trong tin tuyển',
      'Tối ưu quy trình tuyển dụng 30 ngày',
    ],
    [INTENT_CATEGORIES.CANDIDATE_SOURCING]: [
      'Cách tìm candidate hiệu quả trên LinkedIn',
      'Sàng lọc CV: red flags cần chú ý',
      'Viết outreach message thu hút ứng viên',
      'Xây dựng talent pool cho công ty',
    ],
    [INTENT_CATEGORIES.ANALYTICS]: [
      'Các KPI tuyển dụng quan trọng nhất',
      'Cách đọc recruitment funnel dashboard',
      'So sánh channel tuyển dụng hiệu quả',
      'Benchmark thời gian tuyển dụng industry',
    ],
    [INTENT_CATEGORIES.PLATFORM_MANAGEMENT]: [
      'Cách bật/tắt chatbot feature flag',
      'Review chatbot quota và usage reports',
      'Best practice cấu hình AI moderation',
      'Giám sát platform health metrics',
    ],
    [INTENT_CATEGORIES.GENERAL]: roleBasedDefault,
  };

  return questions[intent] || roleBasedDefault;
}

/**
 * Enhance user message with intent context
 * @param {string} message - Original message
 * @param {object} intent - Detected intent object
 * @param {object} userData - User data for context
 * @returns {string} Enhanced message with intent context
 */
function enhanceMessageWithIntent(message, intent, userData) {
  const greeting = getIntentGreeting(intent.intent);
  const intentAddition = getIntentSystemAddition(intent.intent);

  let contextPrefix = '';
  if (intent.intent !== INTENT_CATEGORIES.GENERAL && intent.confidence > 0.3) {
    contextPrefix = `[Intent detected: ${intent.intent.toUpperCase()}] `;
  }

  return `${contextPrefix}${message}`;
}

module.exports = {
  INTENT_CATEGORIES,
  detectIntent,
  getIntentSystemAddition,
  getIntentGreeting,
  getIntentSuggestedQuestions,
  enhanceMessageWithIntent,
};
