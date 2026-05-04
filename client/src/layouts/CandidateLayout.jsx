import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Clock,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Send,
  Settings,
  User,
  X,
} from 'lucide-react';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { AccountHomeLink, Logo } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

const SIDEBAR_NAV = [
  {
    title: 'HỒ SƠ',
    items: [
      { path: '/candidate/profile', label: 'Hồ sơ cá nhân', icon: User },
      { path: '/candidate/resume', label: 'CV & Portfolio', icon: FileText },
      { path: '/candidate/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
  {
    title: 'VIỆC LÀM',
    items: [
      { path: '/candidate/dashboard', label: 'Tổng quan', icon: Briefcase },
      { path: '/candidate/jobs', label: 'Việc làm', icon: Briefcase },
      { path: '/candidate/saved-jobs', label: 'Việc đã lưu', icon: Bookmark },
      { path: '/candidate/saved-companies', label: 'Công ty đã lưu', icon: Building2 },
      { path: '/candidate/applications', label: 'Ứng tuyển', icon: Send },
      { path: '/candidate/messages', label: 'Tin nhắn', icon: MessageSquare },
      { path: '/candidate/notifications', label: 'Thông báo', icon: Bell },
    ],
  },
  {
    title: 'AI & CHIẾN LƯỢC',
    items: [
      { path: '/candidate/chat', label: 'Chatbot AI', icon: MessageSquare },
      { path: '/blog', label: 'Blog kiến thức', icon: BookOpen },
    ],
  },
];

const isCandidateNavActive = (pathname, path) => {
  if (path === '/candidate/dashboard') return pathname === '/candidate/dashboard';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const SidebarContent = ({ onMobileClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';
  const avatarSrc = resolveMediaUrl(user?.avatar_url) || undefined;

  return (
    <div className="z-50 flex h-full flex-col border-r border-slate-800 bg-[#0B1120] text-slate-200">
      <div className="border-b border-slate-800 bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent px-5 py-5">
        <div className="relative">
          <Link
            to="/candidate/dashboard"
            className="group flex w-full min-w-0 flex-col items-center gap-3 text-center"
            onClick={() => onMobileClose?.()}
          >
            <Logo
              asLink={false}
              className="mx-auto h-10 w-auto max-w-[172px] object-center transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="hidden min-w-0 truncate text-lg font-black tracking-tight text-slate-50">
              Ứng viên
              <span className="text-primary"> Hub</span>
            </span>
            <div className="space-y-1 text-center">
              <p className="text-base font-semibold text-slate-50">Ứng viên</p>
              <p className="text-xs font-medium text-slate-400">Hồ sơ và cơ hội việc làm</p>
            </div>
          </Link>
          {onMobileClose ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 shrink-0 text-muted-foreground lg:hidden"
              onClick={onMobileClose}
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {SIDEBAR_NAV.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-3 text-sm font-bold uppercase tracking-widest text-slate-500">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCandidateNavActive(location.pathname, item.path);
                  return (
                    <NavLink
                      key={item.path + item.label}
                      to={item.path}
                      end={item.path === '/candidate/dashboard'}
                      onClick={() => onMobileClose?.()}
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
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-800 p-4">
        <Link
          to="/candidate/profile"
          className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10"
          onClick={() => onMobileClose?.()}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm transition-transform group-hover:scale-[1.02]">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">
                {(displayName.charAt(0) || 'U').toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-base font-semibold text-slate-100 transition-colors group-hover:text-primary">
              {displayName}
            </p>
            <p className="truncate text-base font-bold uppercase tracking-widest text-primary">
              Tài khoản ứng viên
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="hidden h-11 w-full justify-start rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4 shrink-0" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
};

SidebarContent.propTypes = {
  onMobileClose: PropTypes.func,
};

const formatNotificationTime = (dateStr) => {
  if (!dateStr) return 'Vừa xong';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Vừa xong';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffMs < 60000) return 'Vừa xong';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} phút trước`;
  if (diffDays === 0)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

const CandidateLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await notificationService.getNotifications({ limit: 10 });
        const payload = res.data?.data ?? res.data ?? {};
        const raw = Array.isArray(payload.notifications) ? payload.notifications : [];
        const items = raw.map((item, idx) => ({
          id: item.id,
          title: item.title || item.message?.slice(0, 50) || 'Thông báo',
          message: item.message || item.body || '',
          time: item.created_at || item.createdAt,
          type: item.type || 'application',
          data:
            typeof item.data === 'string'
              ? (() => {
                  try {
                    return JSON.parse(item.data);
                  } catch {
                    return {};
                  }
                })()
              : item.data || {},
          isRead: item.read ?? item.is_read ?? idx > 2,
        }));
        setNotifications(items);
      } catch {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationLink = (notification) => {
    const data = notification?.data || {};
    if (notification?.type === 'message' && data.conversation_id) {
      return `/candidate/messages?conversationId=${data.conversation_id}`;
    }
    if (data.application_id) {
      return `/candidate/applications?applicationId=${data.application_id}`;
    }
    return '/candidate/notifications';
  };

  const getPageTitle = () => {
    for (const group of SIDEBAR_NAV) {
      const item = group.items.find(
        (i) =>
          location.pathname === i.path ||
          (i.path !== '/candidate/dashboard' && location.pathname.startsWith(i.path))
      );
      if (item) return item.label;
    }
    return 'Tổng quan';
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';

  return (
    <div className="candidate-applications-typography role-admin-workspace-bg flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="z-20 hidden w-64 lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-md lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onMobileClose={() => setIsMobileSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="role-admin-workspace-bg flex min-h-screen min-w-0 flex-1 flex-col text-foreground lg:pl-64">
        {/* Compact top bar - pale blue-grey, Search + Notification */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur dark:bg-slate-950/95 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600 dark:text-slate-400"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
              {getPageTitle()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AccountHomeLink />
            {/* Search - rounded-square container */}
            <DropdownMenu open={searchOpen} onOpenChange={setSearchOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-muted/60 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 ease-out active:scale-95"
                  aria-label="Tìm kiếm việc làm"
                >
                  <Search className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-0"
                onOpenAutoFocus={(e) => {
                  e.preventDefault();
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Tìm việc làm, công ty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const q = searchQuery.trim();
                          setSearchOpen(false);
                          navigate(
                            q ? `/candidate/jobs?q=${encodeURIComponent(q)}` : '/candidate/jobs'
                          );
                          setSearchQuery('');
                        }
                      }}
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      const q = searchQuery.trim();
                      setSearchOpen(false);
                      navigate(
                        q ? `/candidate/jobs?q=${encodeURIComponent(q)}` : '/candidate/jobs'
                      );
                      setSearchQuery('');
                    }}
                  >
                    Tìm kiếm
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell - red badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-muted/60 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200 ease-out active:scale-95"
                  aria-label="Thông báo"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#F8FAFC] dark:border-slate-950" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0" sideOffset={8}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-base font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <Link
                    to="/candidate/notifications"
                    className="text-base font-medium text-primary hover:text-primary/80"
                  >
                    Xem tất cả
                  </Link>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-8 text-center text-slate-400 text-base">Đang tải...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-base">Chưa có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {notifications.slice(0, 5).map((n, i) => (
                        <Link
                          key={n.id ?? `notif-${i}`}
                          to={getNotificationLink(n)}
                          className={cn(
                            'block p-4 hover:bg-muted/35 dark:hover:bg-slate-800/50 transition-colors',
                            !n.isRead && 'bg-primary/5'
                          )}
                        >
                          <div className="flex gap-3">
                            <div
                              className={cn(
                                'mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                n.type === 'application' &&
                                  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                                n.type === 'system' &&
                                  'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
                                (n.type === 'message' ||
                                  !['application', 'system'].includes(n.type)) &&
                                  'bg-primary/10 text-primary'
                              )}
                            >
                              {n.type === 'application' && <Check size={14} />}
                              {n.type === 'system' && <Clock size={14} />}
                              {n.type === 'message' && <MessageSquare size={14} />}
                              {!['application', 'system', 'message'].includes(n.type) && (
                                <Bell size={14} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4
                                className={cn(
                                  'text-base',
                                  !n.isRead
                                    ? 'font-bold text-slate-900 dark:text-white'
                                    : 'font-medium text-slate-700 dark:text-slate-300'
                                )}
                              >
                                {n.title}
                              </h4>
                              <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-base text-slate-400 mt-1.5">
                                {formatNotificationTime(n.time)}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-xl hover:bg-primary/10 transition-all hover:scale-105 active:scale-95 p-0"
                >
                  <Avatar className="h-8 w-8 shadow-sm">
                    <AvatarImage src={user?.avatar_url} alt={displayName} />
                    <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-base font-bold">
                      {displayName.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white dark:bg-slate-800 border-border text-foreground shadow-2xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-semibold leading-none">{displayName}</p>
                    <p className="truncate text-base leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="hover:bg-primary/10 dark:hover:bg-emerald-500/10 focus:bg-primary/10 cursor-pointer p-3"
                >
                  <Link to="/candidate/profile" className="w-full flex items-center">
                    <User className="mr-2 h-4 w-4 text-emerald-500" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="hover:bg-primary/10 dark:hover:bg-emerald-500/10 focus:bg-primary/10 cursor-pointer p-3"
                >
                  <Link to="/candidate/settings" className="w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-emerald-500" />
                    Cài đặt
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

        <main className="role-rounded-workspace flex-1 bg-transparent p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

CandidateLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CandidateLayout;
