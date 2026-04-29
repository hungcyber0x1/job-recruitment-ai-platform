const DEFAULT_FEATURE_CATALOG = {
  roleGroups: [
    {
      id: 'admin',
      eyebrow: 'Admin',
      title: 'Platform governance and operational control',
      summary:
        'Dashboard for users, jobs, applications, moderation, analytics, system health, and settings.',
      items: [
        'User, company, and application management',
        'Job moderation, categories, skills, and chatbot governance',
        'Analytics, support tickets, logs, service health, and system settings',
      ],
    },
    {
      id: 'employer',
      eyebrow: 'Employer',
      title: 'Recruitment execution and candidate coordination',
      summary:
        'A recruiter workspace for job posting, pipeline review, communication, and employer branding.',
      items: [
        'Job posting, role editing, and hiring pipeline control',
        'Candidate search, saved profiles, and direct messaging',
        'Interview scheduling and company profile management',
      ],
    },
    {
      id: 'candidate',
      eyebrow: 'Candidate',
      title: 'Career discovery, readiness, and AI guidance',
      summary:
        'A candidate workspace focused on profile depth, applications, AI guidance, and growth planning.',
      items: [
        'Profile, resume, and settings management',
        'Job discovery, saved jobs, and application tracking',
        'Notifications, company discovery, and career guidance tools',
      ],
    },
  ],
  publicTools: [
    {
      id: 'ai-cv-scanner',
      title: 'AI CV Scanner',
      description: 'Check resume alignment against job descriptions and surface improvement gaps.',
      path: '/ai-cv-scanner',
      settingKey: 'ai_resume_analysis',
      enabled: true,
    },
    {
      id: 'salary-predictor',
      title: 'Salary Predictor',
      description: 'Estimate compensation direction from skills, market signals, and role profile.',
      path: '/salary-predictor',
      enabled: true,
    },
  ],
  governanceSignals: [
    'Role-based dashboards',
    'Company verification',
    'Moderation workflow',
    'Service health monitoring',
    'Feature flags and settings',
    'AI guidance layer',
  ],
};

const toBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const isSupportedPublicTool = (tool) =>
  tool?.id !== 'career-roadmap' && tool?.path !== '/candidate/career-roadmap';

const buildFeatureCatalog = ({ settingsMap = {}, payload = null } = {}) => {
  const base =
    payload && typeof payload === 'object' ? payload : deepClone(DEFAULT_FEATURE_CATALOG);

  if (Array.isArray(base.publicTools)) {
    base.publicTools = base.publicTools
      .filter(isSupportedPublicTool)
      .map((tool) => ({
        ...tool,
        enabled:
          tool.settingKey && Object.prototype.hasOwnProperty.call(settingsMap, tool.settingKey)
            ? toBoolean(settingsMap[tool.settingKey], tool.enabled !== false)
            : tool.enabled !== false,
      }));
  }

  return base;
};

module.exports = {
  DEFAULT_FEATURE_CATALOG,
  buildFeatureCatalog,
};
