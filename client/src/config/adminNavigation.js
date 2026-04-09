/**
 * Điều hướng admin — một nguồn duy nhất, khớp toàn bộ route trong MainRoutes (nhóm /admin/*).
 * Tránh lệch giữa trang công khai (/blog) và trang quản trị (/admin/blog).
 */
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  FileText,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

export const ADMIN_NAV_GROUPS = [
  {
    title: 'QUẢN TRỊ DỮ LIỆU',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/users', label: 'Người dùng', icon: Users },
      { path: '/admin/companies', label: 'Công ty', icon: Building },
      { path: '/admin/applications', label: 'Ứng tuyển', icon: FileText },
      { path: '/admin/jobs', label: 'Việc làm', icon: Briefcase },
      { path: '/admin/categories', label: 'Danh mục', icon: Building2 },
      { path: '/admin/blog', label: 'Blog', icon: BookOpen },
    ],
  },
  {
    title: 'KIỂM DUYỆT & AI',
    items: [
      { path: '/admin/moderation', label: 'Kiểm duyệt', icon: ShieldAlert },
      { path: '/admin/chatbot', label: 'Chatbot', icon: MessageSquare },
      { path: '/admin/analytics', label: 'Phân tích', icon: BarChart3 },
    ],
  },
  {
    title: 'HỖ TRỢ & HẠ TẦNG',
    items: [
      { path: '/admin/support', label: 'Hỗ trợ', icon: HelpCircle },
      { path: '/admin/logs', label: 'Nhật ký', icon: Search },
      { path: '/admin/service-health', label: 'Sức khỏe dịch vụ', icon: HeartPulse },
      { path: '/admin/feature-flags', label: 'Tính năng', icon: Sparkles },
      { path: '/admin/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
];
