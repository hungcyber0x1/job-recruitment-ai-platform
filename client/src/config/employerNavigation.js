/**
 * Navigation cho Nha tuyen dung - Employer Navigation
 */
import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  GitBranch,
  Mail,
  Plus,
  Settings,
  Star,
  UserPlus,
} from 'lucide-react';

export const EMPLOYER_NAV_GROUPS = [
  {
    title: 'I. TONG QUAN',
    items: [{ path: '/employer/dashboard', label: 'Tổng quan', icon: Activity }],
  },
  {
    title: 'II. HO SO',
    items: [{ path: '/employer/company-profile', label: 'Ho so cong ty', icon: Building2 }],
  },
  {
    title: 'III. TUYEN DUNG',
    items: [
      { path: '/employer/jobs', label: 'Tin tuyen dung', icon: Briefcase, badgeKey: 'jobs' },
      { path: '/employer/jobs/post', label: 'Dang tin moi', icon: Plus },
    ],
  },
  {
    title: 'IV. PIPELINE',
    items: [
      {
        path: '/employer/applications',
        label: 'Kanban ung vien',
        icon: GitBranch,
        badgeKey: 'candidates',
      },
      { path: '/employer/interview-schedule', label: 'Lich phong van', icon: Calendar },
    ],
  },
  {
    title: 'V. NHAN SU',
    items: [
      { path: '/employer/saved-candidates', label: 'Talent Pool', icon: Star },
      { path: '/employer/search-candidates', label: 'Tim ung vien', icon: UserPlus },
    ],
  },
  {
    title: 'VI. LIEN LAC',
    items: [
      { path: '/employer/messages', label: 'Tin nhan / Email', icon: Mail, badgeKey: 'messages' },
    ],
  },
  {
    title: 'VII. BAO CAO',
    items: [{ path: '/employer/reports', label: 'Bao cao tuyen dung', icon: BarChart3 }],
  },
  {
    title: 'VIII. CAI DAT',
    items: [
      { path: '/employer/settings', label: 'Cai dat tai khoan', icon: Settings },
      { path: '/employer/blog', label: 'Blog', icon: BookOpen },
    ],
  },
];

export const flattenEmployerNavItems = () => EMPLOYER_NAV_GROUPS.flatMap((group) => group.items);

export const findEmployerNavItem = (path) => {
  for (const group of EMPLOYER_NAV_GROUPS) {
    const item = group.items.find((i) => {
      if (path === i.path) return true;
      if (i.path !== '/employer/dashboard' && path.startsWith(i.path)) return true;
      return false;
    });
    if (item) return { ...item, group: group.title };
  }
  return null;
};

export const getEmployerBadgeCount = (path, data = {}) => {
  const { jobs = 0, candidates = 0, messages = 0 } = data;

  switch (path) {
    case '/employer/jobs':
      return jobs;
    case '/employer/applications':
      return candidates;
    case '/employer/messages':
      return messages;
    default:
      return 0;
  }
};
