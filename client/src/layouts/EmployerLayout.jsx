import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Grid3X3,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Users,
  Workflow,
} from 'lucide-react';
import { AccountHomeLink, Logo } from '@/components/common';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import messageService from '../services/messageService';

const isApplicationsListView = (location) =>
  location.pathname === '/employer/applications' &&
  new URLSearchParams(location.search).get('view') === 'list';

const isApplicationsPipelineView = (location) => {
  if (location.pathname.startsWith('/employer/applications/')) {
    return true;
  }

  return (
    location.pathname === '/employer/applications' &&
    new URLSearchParams(location.search).get('view') !== 'list'
  );
};

const isRecruiterNavItemActive = (item, location) => {
  if (typeof item.match === 'function') {
    return item.match(location);
  }

  if (item.path === '/employer/dashboard') {
    return location.pathname === item.path;
  }

  if (item.path === '/employer/jobs') {
    return (
      location.pathname.startsWith('/employer/jobs') &&
      !location.pathname.startsWith('/employer/jobs/post')
    );
  }

  return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
};

const navigationByRole = {
  recruiter: [
    {
      title: 'VẬN HÀNH',
      items: [
        { path: '/employer/dashboard', label: 'Tổng quan', icon: Grid3X3 },
        { path: '/employer/jobs/post', label: 'Đăng việc mới', icon: Plus },
        { path: '/employer/jobs', label: 'Quản lý việc', icon: Briefcase, badgeKey: 'jobs' },
        {
          path: '/employer/applications',
          label: 'Pipeline',
          icon: Workflow,
          match: isApplicationsPipelineView,
        },
      ],
    },
    {
      title: 'ỨNG VIÊN',
      items: [
        {
          path: '/employer/applications?view=list',
          label: 'Hồ sơ ứng viên',
          icon: Users,
          badgeKey: 'candidates',
          match: isApplicationsListView,
        },
        { path: '/employer/search-candidates', label: 'Tìm ứng viên', icon: Search },
        { path: '/employer/saved-candidates', label: 'Đã lưu', icon: Bookmark },
        {
          path: '/employer/messages',
          label: 'Tin nhắn',
          icon: MessageSquare,
          badgeKey: 'messages',
        },
        { path: '/employer/interview-schedule', label: 'Lịch phỏng vấn', icon: Calendar },
      ],
    },
    {
      title: 'THƯƠNG HIỆU',
      items: [
        { path: '/employer/company-profile', label: 'Hồ sơ công ty', icon: Building2 },
        { path: '/employer/blog', label: 'Blog & nội dung', icon: BookOpen },
        { path: '/employer/settings', label: 'Cài đặt tài khoản', icon: Settings },
      ],
    },
  ],
};

const EmployerSidebarContent = ({ role = 'recruiter', badgeCounts = {}, user }) => {
  const groups = navigationByRole[role] ?? navigationByRole.recruiter;
  const location = useLocation();

  const getBadgeVariant = (key) => {
    if (key === 'messages') return 'destructive';
    if (key === 'candidates') return 'secondary';
    return 'default';
  };

  const companyName = user?.company_name || user?.companyName || 'Doanh nghiệp';

  return (
    <div className="z-50 flex h-full flex-col border-r border-slate-800 bg-[#0B1120] text-slate-200">
      {/* Logo — nền nhẹ theo primary, tách lớp với nội dung chính */}
      <div className="border-b border-slate-800 bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent px-5 py-5">
        <Link
          to="/employer/dashboard"
          className="group flex w-full flex-col items-center gap-3 text-center"
        >
          <Logo
            asLink={false}
            className="mx-auto h-10 w-auto max-w-[172px] object-center transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <span className="hidden min-w-0 truncate text-lg font-black tracking-tight text-slate-50">
            Trung tâm
            <span className="text-primary"> Tuyển dụng</span>
          </span>
          <div className="space-y-1 text-center">
            <p className="text-base font-semibold text-slate-50">Nhà tuyển dụng</p>
            <p className="text-xs font-medium text-slate-400">Quản lý tuyển dụng và ứng viên</p>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-3 text-sm font-bold uppercase tracking-widest text-slate-500">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count = item.badgeKey ? badgeCounts[item.badgeKey] : null;
                  const active = isRecruiterNavItemActive(item, location);

                  return (
                    <NavLink
                      key={`${group.title}-${item.path}-${item.label}`}
                      to={item.path}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-all duration-200',
                        active
                          ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_hsl(var(--primary)_/_0.45)]"
                          aria-hidden
                        />
                      )}
                      <Icon
                        size={20}
                        className={cn(
                          'shrink-0 transition-transform duration-200 group-hover:scale-105',
                          active ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count != null && count > 0 && (
                        <Badge
                          variant={getBadgeVariant(item.badgeKey)}
                          className={cn(
                            'h-6 min-w-6 rounded-full px-2 text-sm font-semibold',
                            item.badgeKey === 'jobs' &&
                              'border border-primary/25 bg-primary/15 text-primary dark:bg-primary/20',
                            item.badgeKey === 'candidates' &&
                              'border border-primary/25 bg-primary/15 text-primary dark:bg-primary/20',
                            item.badgeKey === 'messages' &&
                              'border border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-red-400'
                          )}
                        >
                          {count > 99 ? '99+' : count}
                        </Badge>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Hồ sơ doanh nghiệp — thẻ nổi, hover đồng bộ primary */}
      <div className="border-t border-slate-800 p-4">
        <Link
          to="/employer/company-profile"
          className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm transition-transform group-hover:scale-[1.02]">
            {user?.avatar_url || user?.company_logo ? (
              <img
                src={resolveMediaUrl(user.avatar_url || user.company_logo)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-base font-bold text-primary">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-base font-semibold text-slate-100 transition-colors group-hover:text-primary">
              {companyName}
            </p>
            <p className="truncate text-base font-bold uppercase tracking-widest text-primary">
              Nhà tuyển dụng
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

EmployerSidebarContent.propTypes = {
  role: PropTypes.string,
  badgeCounts: PropTypes.shape({
    jobs: PropTypes.number,
    candidates: PropTypes.number,
    messages: PropTypes.number,
  }),
  user: PropTypes.object,
};

const EmployerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ jobs: 0, candidates: 0, messages: 0 });

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const jobsRes = await jobService.getMyJobs().catch(() => ({ data: { data: [] } }));
        const jobsData = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];
        const publishedCount = jobsData.filter((j) => j.status === 'published').length;
        setBadgeCounts((prev) => ({ ...prev, jobs: publishedCount || jobsData.length }));

        if (jobsData.length > 0) {
          const appResponses = await Promise.all(
            jobsData
              .slice(0, 20)
              .map((job) =>
                applicationService.getJobApplications(job.id).catch(() => ({ data: { data: [] } }))
              )
          );
          const total = appResponses.reduce(
            (sum, res) => sum + (Array.isArray(res.data?.data) ? res.data.data.length : 0),
            0
          );
          setBadgeCounts((prev) => ({ ...prev, candidates: total }));
        }

        const messageRes = await messageService
          .getConversations({ limit: 100 })
          .catch(() => ({ data: { data: { unread_total: 0 } } }));
        const messagePayload = messageRes.data?.data || messageRes.data || {};
        setBadgeCounts((prev) => ({
          ...prev,
          messages: Number(messagePayload.unread_total || 0),
        }));
      } catch {
        // keep default counts
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="role-recruiter-workspace-bg flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 w-64">
        <EmployerSidebarContent role="recruiter" badgeCounts={badgeCounts} user={user} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-md lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] w-64 border-r border-border bg-[hsl(var(--nav-bg))] transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <EmployerSidebarContent role="recruiter" badgeCounts={badgeCounts} user={user} />
      </aside>

      {/* Main Content */}
      <div className="role-recruiter-workspace-bg flex min-h-screen flex-1 flex-col text-foreground lg:pl-64">
        {/* Top Header - Admin Style */}
        <header className="sticky top-0 z-40 flex h-[4.25rem] items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên, công việc..."
                className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-base font-medium text-foreground placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = e.target.value?.trim();
                    if (q) navigate(`/employer/search-candidates?q=${encodeURIComponent(q)}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AccountHomeLink />
            <Link
              to="/blog"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
              title="Blog công khai — bổ sung cho Blog doanh nghiệp"
            >
              <BookOpen className="h-6 w-6" />
            </Link>

            <div className="relative">
              <Link
                to="/employer/notifications"
                className="block p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
                title="Thông báo tuyển dụng"
              >
                <Bell className="h-6 w-6" />
                {badgeCounts.messages > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l border-border ml-2 group transition-all">
                  <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20 transition-all group-hover:ring-emerald-500/50 active:scale-95">
                    <AvatarImage
                      src={resolveMediaUrl(user?.avatar_url || user?.company_logo) || undefined}
                    />
                    <AvatarFallback className="bg-emerald-600 text-base text-white">
                      {user?.company_name?.charAt(0) || user?.companyName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white dark:bg-slate-800 border-border text-foreground shadow-2xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-semibold">
                      {user?.company_name || user?.companyName || 'Doanh nghiệp'}
                    </p>
                    <p className="truncate text-base text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="hover:bg-primary/10 dark:hover:bg-emerald-500/10 focus:bg-primary/10 cursor-pointer p-3"
                >
                  <Link to="/employer/company-profile" className="w-full flex items-center">
                    <Building2 className="mr-2 h-4 w-4 text-emerald-500" />
                    Hồ sơ công ty
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="hover:bg-primary/10 dark:hover:bg-emerald-500/10 focus:bg-primary/10 cursor-pointer p-3"
                >
                  <Link to="/employer/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-emerald-500" />
                    Cài đặt tài khoản
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-3">
                  <Link to="/employer/interview-schedule" className="w-full flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-emerald-500" />
                    Lịch phỏng vấn
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer p-3 font-semibold text-red-600 hover:bg-destructive/10 focus:text-red-600 dark:text-red-400 dark:hover:bg-destructive/15"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="role-rounded-workspace flex-1 bg-transparent p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

EmployerLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default EmployerLayout;
