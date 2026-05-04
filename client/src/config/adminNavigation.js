/**
 * Admin Navigation - organized by the main admin operation blocks.
 */
import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Newspaper,
  Settings,
  Tags,
  UserRound,
  Users,
} from 'lucide-react';
import { ADMIN_PERMISSIONS, hasAdminPermission } from '@/utils/adminPermissions';

export const ADMIN_NAV_GROUPS = [
  {
    title: 'TỔNG QUAN',
    items: [{ path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard }],
  },
  {
    title: 'QUẢN LÝ TUYỂN DỤNG',
    items: [
      { path: '/admin/companies', label: 'Công ty', icon: Building2, badgeKey: 'companies' },
      { path: '/admin/jobs', label: 'Tin tuyển dụng', icon: Briefcase, badgeKey: 'jobs' },
      {
        path: '/admin/categories',
        label: 'Ngành nghề',
        icon: Tags,
        requiredPermission: ADMIN_PERMISSIONS.TAXONOMY_MANAGE,
      },
      { path: '/admin/applications', label: 'Ứng tuyển', icon: FileText, badgeKey: 'applications' },
    ],
  },
  {
    title: 'NỘI DUNG',
    items: [{ path: '/admin/blog', label: 'Blog', icon: Newspaper }],
  },
  {
    title: 'QUẢN TRỊ',
    items: [
      { path: '/admin/profile', label: 'Hồ sơ của tôi', icon: UserRound },
      { path: '/admin/users', label: 'Người dùng', icon: Users },
    ],
  },
  {
    title: 'BÁO CÁO',
    items: [{ path: '/admin/analytics', label: 'Báo cáo', icon: BarChart3 }],
  },
  {
    title: 'HỆ THỐNG',
    items: [{ path: '/admin/settings', label: 'Cài đặt', icon: Settings }],
  },
];

export const filterAdminNavGroups = (user) =>
  ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requiredPermission || hasAdminPermission(user, item.requiredPermission)
    ),
  })).filter((group) => group.items.length > 0);

export const flattenNavItems = (user) => filterAdminNavGroups(user).flatMap((group) => group.items);

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
