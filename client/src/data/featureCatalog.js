export const fallbackFeatureCatalog = {
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
      description:
        'Candidate-facing resume check (keywords, ATS-style signals) before applying on HireBOT.',
      path: '/ai-cv-scanner',
      enabled: true,
    },
    {
      id: 'salary-predictor',
      title: 'Salary Predictor',
      description:
        'Reference salary band by role, experience, industry, and location for offer discussions.',
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
