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
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Users,
  Workflow,
} from 'lucide-react';
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
import { jobService, applicationService } from '../services';

const navigationByRole = {
  employer: [
    {
      title: 'VẬN HÀNH',
      items: [
        { path: '/employer/dashboard', label: 'Dashboard', icon: Grid3X3 },
        { path: '/employer/jobs/post', label: 'Đăng việc mới', icon: Plus },
        { path: '/employer/jobs', label: 'Quản lý việc', icon: Briefcase, badgeKey: 'jobs' },
        { path: '/employer/applications', label: 'Pipeline AI', icon: Workflow },
      ],
    },
    {
      title: 'ỨNG VIÊN',
      items: [
        {
          path: '/employer/applications',
          label: 'Hồ sơ ứng viên',
          icon: Users,
          badgeKey: 'candidates',
        },
        { path: '/employer/search-candidates', label: 'Tìm ứng viên AI', icon: Search },
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

const EmployerSidebarContent = ({ role = 'employer', badgeCounts = {}, user }) => {
  const groups = navigationByRole[role] ?? navigationByRole.employer;
  const location = useLocation();

  const getBadgeVariant = (key) => {
    if (key === 'messages') return 'destructive';
    if (key === 'candidates') return 'secondary';
    return 'default';
  };

  const companyName = user?.company_name || user?.companyName || 'Doanh nghiệp';

  return (
    <div className="flex flex-col h-full bg-white text-foreground border-r border-border z-50">
      {/* Logo Section - Admin Style */}
      <div className="p-6 border-b border-border">
        <Link to="/employer/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-emerald-600 dark:text-emerald-500">
            Recruiter Hub
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count = item.badgeKey ? badgeCounts[item.badgeKey] : null;
                  const active =
                    location.pathname === item.path ||
                    (item.path !== '/employer/dashboard' &&
                      location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={`${group.title}-${item.path}-${item.label}`}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative group',
                        active
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/5'
                          : 'text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400'
                      )}
                    >
                      <Icon
                        size={18}
                        className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count != null && count > 99 ? '99+' : count}
                      {count != null && count > 0 && (
                        <Badge
                          variant={getBadgeVariant(item.badgeKey)}
                          className={cn(
                            'h-5 min-w-5 rounded-full px-1.5 text-xs font-semibold',
                            item.badgeKey === 'jobs' &&
                              'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
                            item.badgeKey === 'candidates' &&
                              'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
                            item.badgeKey === 'messages' &&
                              'bg-red-500/20 text-red-500 border-red-500/30'
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

      {/* Profile Section at Bottom - Admin Style */}
      <div className="p-4 border-t border-border">
        <Link
          to="/employer/company-profile"
          className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:border-emerald-100 dark:hover:border-emerald-500/20 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-sm">
            {user?.avatar_url || user?.company_logo ? (
              <img
                src={resolveMediaUrl(user.avatar_url || user.company_logo)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-emerald-600">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {companyName}
            </p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
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
  const [badgeCounts, setBadgeCounts] = useState({ jobs: 0, candidates: 0, messages: 5 });

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
      } catch {
        // keep default counts
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 w-64">
        <EmployerSidebarContent role="employer" badgeCounts={badgeCounts} user={user} />
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
          'fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-border transition-transform duration-300 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <EmployerSidebarContent role="employer" badgeCounts={badgeCounts} user={user} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-background text-foreground">
        {/* Top Header - Admin Style */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên, công việc..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-border text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
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
            <Link
              to="/"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
              title="Xem trang chủ"
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              to="/blog"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
              title="Blog công khai — bổ sung cho Blog doanh nghiệp"
            >
              <BookOpen className="h-5 w-5" />
            </Link>

            <div className="relative">
              <button
                type="button"
                className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all hover:scale-110 active:scale-95"
              >
                <Bell className="h-5 w-5" />
                {badgeCounts.messages > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l border-border ml-2 group transition-all">
                  <Avatar className="h-9 w-9 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all active:scale-95">
                    <AvatarImage
                      src={resolveMediaUrl(user?.avatar_url || user?.company_logo) || undefined}
                    />
                    <AvatarFallback className="bg-emerald-600 text-white text-sm">
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
                    <p className="text-sm font-semibold">
                      {user?.company_name || user?.companyName || 'Doanh nghiệp'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
                  className="text-red-500 focus:text-red-600 hover:bg-destructive/10 dark:hover:bg-destructive/100/10 cursor-pointer p-3 font-semibold"
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
        <main className="flex-1 p-6 lg:p-8">
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
