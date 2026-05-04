/**
 * Dieu huong ung vien.
 */
import {
  Activity,
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  GitBranch,
  GraduationCap,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';

export const CANDIDATE_NAV_GROUPS = [
  {
    title: 'I. TONG QUAN',
    items: [{ path: '/candidate/dashboard', label: 'Tổng quan', icon: Activity }],
  },
  {
    title: 'II. VIEC LAM',
    items: [
      { path: '/candidate/jobs', label: 'Viec lam', icon: Briefcase },
      { path: '/candidate/saved-jobs', label: 'Viec da luu', icon: Bookmark },
      { path: '/candidate/companies', label: 'Cong ty', icon: Building2 },
      { path: '/candidate/saved-companies', label: 'Cong ty da luu', icon: Bookmark },
    ],
  },
  {
    title: 'III. UNG TUYEN',
    items: [
      { path: '/candidate/applications', label: 'Pipeline ung tuyen', icon: GitBranch },
      { path: '/candidate/messages', label: 'Tin nhan', icon: MessageSquare, badgeKey: 'messages' },
      { path: '/candidate/interviews', label: 'Lich phong van', icon: Calendar },
      { path: '/candidate/interview-prep', label: 'Luyen phong van', icon: GraduationCap },
    ],
  },
  {
    title: 'IV. HO SO',
    items: [
      { path: '/candidate/profile', label: 'Ho so ca nhan', icon: User },
      { path: '/candidate/resume', label: 'Quan ly CV', icon: FileText },
    ],
  },
  {
    title: 'V. CHATBOT & CONG CU',
    items: [{ path: '/candidate/chat', label: 'Chatbot nghe nghiep', icon: MessageSquare }],
  },
  {
    title: 'VI. KHAC',
    items: [
      {
        path: '/candidate/notifications',
        label: 'Thong bao',
        icon: Bell,
        badgeKey: 'notifications',
      },
      { path: '/candidate/settings', label: 'Cai dat tai khoan', icon: Settings },
    ],
  },
  {
    title: 'VII. CONG KHAI',
    items: [{ path: '/blog', label: 'Blog', icon: BookOpen }],
  },
];

export const CANDIDATE_COMMAND_ITEMS = CANDIDATE_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    category: group.title.replace(/^[IVX]+\.\s*/, ''),
  }))
);

export const flattenCandidateNavItems = () => CANDIDATE_NAV_GROUPS.flatMap((group) => group.items);

export const findCandidateNavItem = (path) => {
  for (const group of CANDIDATE_NAV_GROUPS) {
    const item = group.items.find((i) => {
      if (path === i.path) return true;
      if (i.path !== '/candidate/dashboard' && path.startsWith(i.path)) return true;
      return false;
    });
    if (item) return { ...item, group: group.title };
  }
  return null;
};

export const getNavItemBadgeCount = (path, data = {}) => {
  const { notifications = 0, messages = 0 } = data;

  switch (path) {
    case '/candidate/messages':
      return messages;
    case '/candidate/notifications':
      return notifications;
    default:
      return 0;
  }
};
