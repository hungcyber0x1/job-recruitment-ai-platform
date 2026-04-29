/**
 * Admin Navigation - organized by the main admin operation blocks.
 */
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  HelpCircle,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { ADMIN_PERMISSIONS, hasAdminPermission } from '@/utils/adminPermissions';

export const ADMIN_NAV_GROUPS = [
  {
    title: 'A. TONG QUAN',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'B. NGUOI DUNG & PHAN QUYEN',
    items: [
      { path: '/admin/users', label: 'Tai khoan', icon: Users },
      {
        path: '/admin/permissions',
        label: 'Phan quyen',
        icon: KeyRound,
        requiredPermission: ADMIN_PERMISSIONS.ADMIN_PERMISSIONS,
      },
    ],
  },
  {
    title: 'C. DOANH NGHIEP & TUYEN DUNG',
    items: [
      { path: '/admin/companies', label: 'Doanh nghiep', icon: Building2, badgeKey: 'companies' },
      { path: '/admin/jobs', label: 'Tin tuyen dung', icon: Briefcase, badgeKey: 'jobs' },
      { path: '/admin/applications', label: 'Ung tuyen', icon: FileText, badgeKey: 'applications' },
      { path: '/admin/interviews', label: 'Lich phong van', icon: Calendar },
    ],
  },
  {
    title: 'D. NOI DUNG PUBLIC',
    items: [
      { path: '/admin/blog', label: 'Blog', icon: BookOpen },
      { path: '/admin/homepage', label: 'Homepage CMS', icon: Home },
    ],
  },
  {
    title: 'E. TAXONOMY DU LIEU',
    items: [
      { path: '/admin/categories', label: 'Nganh nghe', icon: Layers },
    ],
  },
  {
    title: 'F. CHATBOT & CONG CU',
    items: [
      { path: '/admin/chatbot', label: 'Chatbot', icon: MessageSquare },
      { path: '/admin/ai-tools', label: 'Cong cu AI', icon: BrainCircuit },
    ],
  },
  {
    title: 'G. BAO CAO & VAN HANH',
    items: [
      { path: '/admin/analytics', label: 'Phan tich', icon: BarChart3 },
      {
        path: '/admin/settings',
        label: 'Cai dat he thong',
        icon: Settings,
        requiredPermission: ADMIN_PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        path: '/admin/feature-flags',
        label: 'Tinh nang',
        icon: Sparkles,
        requiredPermission: ADMIN_PERMISSIONS.SETTINGS_MANAGE,
      },
      { path: '/admin/support', label: 'Ho tro', icon: HelpCircle },
      { path: '/admin/notifications', label: 'Thong bao', icon: Bell, badgeKey: 'notifications' },
    ],
  },
];

export const filterAdminNavGroups = (user) =>
  ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requiredPermission || hasAdminPermission(user, item.requiredPermission)
    ),
  })).filter((group) => group.items.length > 0);

export const flattenNavItems = (user) =>
  filterAdminNavGroups(user).flatMap((group) => group.items);

export const findNavItem = (path, user) => {
  for (const group of filterAdminNavGroups(user)) {
    const item = group.items.find((i) => {
      if (path === i.path) return true;
      if (i.path !== '/admin/dashboard' && path.startsWith(i.path)) return true;
      return false;
    });
    if (item) return { ...item, group: group.title };
  }
  return null;
};

export const getAdminBadgeCount = (path, data = {}) => {
  const { users = 0, companies = 0, jobs = 0, applications = 0 } = data;
  switch (path) {
    case '/admin/users':
      return users;
    case '/admin/companies':
      return companies;
    case '/admin/jobs':
      return jobs;
    case '/admin/applications':
      return applications;
    default:
      return 0;
  }
};
