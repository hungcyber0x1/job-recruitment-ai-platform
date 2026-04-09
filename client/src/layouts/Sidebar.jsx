import PropTypes from 'prop-types';
import React from 'react';
import {
  Activity,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  FileSearch,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import Logo from '@/components/common/Logo';
import Navigation from './Navigation';

const navigationByRole = {
  candidate: [
    {
      title: 'Tổng quan cá nhân',
      items: [
        { path: '/candidate/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: 'Hồ sơ và tài khoản',
      items: [
        { path: '/candidate/profile', label: 'Hồ sơ cá nhân', icon: <UserCircle2 size={18} /> },
        { path: '/candidate/resume', label: 'CV / Resume', icon: <FileText size={18} /> },
        { path: '/candidate/settings', label: 'Cài đặt', icon: <Settings size={18} /> },
      ],
    },
    {
      title: 'Việc làm và ứng tuyển',
      items: [
        { path: '/candidate/jobs', label: 'Tìm việc làm', icon: <Briefcase size={18} /> },
        { path: '/candidate/saved-jobs', label: 'Việc đã lưu', icon: <HeartHandshake size={18} /> },
        { path: '/candidate/applications', label: 'Đơn ứng tuyển', icon: <FileSearch size={18} /> },
        { path: '/candidate/notifications', label: 'Thông báo', icon: <Target size={18} /> },
      ],
    },
    {
      title: 'AI và định hướng',
      items: [
        { path: '/candidate/chat', label: 'Chatbot AI', icon: <Sparkles size={18} /> },
        {
          path: '/candidate/career-roadmap',
          label: 'Lộ trình nghề nghiệp',
          icon: <Target size={18} />,
        },
      ],
    },
  ],
  employer: [
    {
      title: 'Tổng quan',
      items: [
        { path: '/employer/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: 'Vận hành tuyển dụng',
      items: [
        { path: '/employer/jobs', label: 'Quản lý tin tuyển dụng', icon: <Briefcase size={18} /> },
        { path: '/employer/jobs/post', label: 'Đăng tin mới', icon: <Sparkles size={18} /> },
        {
          path: '/employer/applications',
          label: 'Pipeline ứng viên',
          icon: <FileText size={18} />,
        },
      ],
    },
    {
      title: 'Ứng viên và phối hợp',
      items: [
        {
          path: '/employer/search-candidates',
          label: 'Tìm kiếm ứng viên',
          icon: <Search size={18} />,
        },
        { path: '/employer/saved-candidates', label: 'Ứng viên đã lưu', icon: <Users size={18} /> },
        { path: '/employer/messages', label: 'Tin nhắn', icon: <MessageSquare size={18} /> },
        {
          path: '/employer/interview-schedule',
          label: 'Lịch phỏng vấn',
          icon: <Activity size={18} />,
        },
      ],
    },
    {
      title: 'Thương hiệu và cài đặt',
      items: [
        {
          path: '/employer/company-profile',
          label: 'Hồ sơ công ty',
          icon: <Building2 size={18} />,
        },
        { path: '/employer/settings', label: 'Cài đặt', icon: <Settings size={18} /> },
      ],
    },
  ],
  admin: [
    {
      title: 'Tổng quan',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      title: 'Quản trị dữ liệu',
      items: [
        { path: '/admin/users', label: 'Người dùng', icon: <Users size={18} /> },
        { path: '/admin/companies', label: 'Doanh nghiệp', icon: <Building size={18} /> },
        { path: '/admin/applications', label: 'Đơn ứng tuyển', icon: <FileText size={18} /> },
        { path: '/admin/blog', label: 'Blog', icon: <BookOpen size={18} /> },
      ],
    },
    {
      title: 'Moderation và AI',
      items: [
        { path: '/admin/jobs', label: 'Việc làm (admin)', icon: <Briefcase size={18} /> },
        { path: '/admin/moderation', label: 'Kiểm duyệt', icon: <ShieldAlert size={18} /> },
        { path: '/admin/categories', label: 'Danh mục / Kỹ năng', icon: <Building2 size={18} /> },
        { path: '/admin/chatbot', label: 'Chatbot AI', icon: <Sparkles size={18} /> },
        { path: '/admin/analytics', label: 'Phân tích', icon: <Activity size={18} /> },
      ],
    },
    {
      title: 'Hỗ trợ và cấu hình',
      items: [
        { path: '/admin/support', label: 'Hỗ trợ', icon: <Users size={18} /> },
        { path: '/admin/logs', label: 'Logs và audit', icon: <FileSearch size={18} /> },
        { path: '/admin/service-health', label: 'Service health', icon: <ShieldCheck size={18} /> },
        { path: '/admin/feature-flags', label: 'Feature Flags', icon: <Sparkles size={18} /> },
        { path: '/admin/settings', label: 'Cài đặt hệ thống', icon: <Settings size={18} /> },
      ],
    },
  ],
};

const Sidebar = ({ role = 'candidate', mobileOpen = false, onMobileClose = null }) => {
  const items = navigationByRole[role] || navigationByRole.candidate;

  return (
    <>
      <aside className="relative hidden h-full w-80 flex-col overflow-hidden border-r border-border/80 bg-card/95 px-0 py-8 shadow-premium group lg:flex">
        <div className="absolute top-0 left-0 h-[1px] w-full bg-accent/20 animate-scanline pointer-events-none opacity-0 group-hover:opacity-100" />

        <div className="relative z-10 mb-12 flex flex-col items-center px-8 text-center">
          <Link to="/" className="group relative mb-8 block">
            <div className="absolute -inset-4 scale-75 border border-accent/20 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:rotate-6 group-hover:opacity-100" />
            <Logo className="relative h-16 w-16 grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0" />
          </Link>
          <div className="relative">
            <div className="flex items-center gap-1 text-2xl font-black italic tracking-tighter text-foreground">
              HIRE
              <span className="text-accent underline decoration-accent/30 decoration-4 underline-offset-4">
                AI
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="h-[2px] w-4 bg-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/80">
                {role}_TERMINAL
              </span>
              <span className="h-[2px] w-4 bg-accent" />
            </div>
          </div>
        </div>

        <div className="custom-scrollbar relative z-10 flex-1 overflow-y-auto px-6">
          <Navigation items={items} className="gap-8" />
        </div>

        <div className="relative z-10 mt-auto px-6 py-8">
          <div className="group/status relative overflow-hidden border border-border/60 bg-muted/30 p-4 transition-all hover:border-accent/40">
            <div className="absolute top-0 left-0 h-full w-1 bg-accent opacity-50" />
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center border border-accent/20 bg-accent/10 text-xs font-black text-accent animate-pulse">
                AI
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest leading-tight text-muted-foreground">
                  SYSTEM_STATUS
                </div>
                <div className="text-[11px] font-black uppercase tracking-wider text-foreground transition-colors group-hover/status:text-accent">
                  Engine_Online.sys
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => onMobileClose?.(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-[60] flex h-full w-[88%] max-w-xs flex-col border-r border-slate-800 bg-slate-950 py-8 transition-transform duration-500 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3" onClick={() => onMobileClose?.(false)}>
            <Logo className="h-11 w-11" />
            <div>
              <div className="text-lg font-black tracking-tight text-white">HireAI</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{role}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => onMobileClose?.(false)}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Dong menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6">
          <Navigation items={items} className="gap-4" />
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  role: PropTypes.string,
  mobileOpen: PropTypes.bool,
  onMobileClose: PropTypes.func,
};

export default Sidebar;
