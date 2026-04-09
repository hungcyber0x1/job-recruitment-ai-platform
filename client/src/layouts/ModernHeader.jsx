import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  Check,
  Clock,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Briefcase,
  Home,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import applicationService from '../services/applicationService';
import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AIToolsDropdown } from '@/components/common';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const navLinks = [
  { label: 'Trang chủ', path: '/', icon: Home },
  { label: 'Việc làm', path: '/jobs', icon: Briefcase },
  { label: 'Công ty', path: '/companies', icon: Building2 },
  { label: 'Blog', path: '/blog', icon: FileText },
];

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

/** Avatar tròn + chấm xanh “đang hoạt động” góc dưới-phải (như mẫu UI phổ biến). */
const UserAvatarWithStatus = ({ src, name, size = 'sm', className }) => {
  const isMd = size === 'md';
  return (
    <div className={cn('relative shrink-0', isMd ? 'h-11 w-11' : 'h-8 w-8')} title="Đang hoạt động">
      <Avatar
        size={size}
        src={src}
        name={name}
        className={cn(
          isMd ? 'size-11' : 'size-8',
          'shadow-sm ring-2 ring-background dark:ring-slate-950',
          className
        )}
      />
      <span
        className={cn(
          'pointer-events-none absolute z-10 rounded-full bg-emerald-500 ring-2 ring-background dark:ring-slate-950',
          isMd ? 'bottom-0.5 right-0.5 h-3 w-3' : 'bottom-0 right-0 h-2.5 w-2.5'
        )}
        aria-hidden
      />
    </div>
  );
};

const ModernHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'candidate') return;
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const res = await applicationService.getMyNotifications();
        const raw = res.data?.data ?? [];
        const items = raw.map((item, idx) => ({
          id: item.id,
          title: item.title || item.message?.slice(0, 50) || 'Thông báo',
          message: item.message || item.body || '',
          time: item.created_at || item.createdAt,
          type: item.type || 'application',
          isRead: item.read ?? item.is_read ?? idx > 2,
          applicationId: item.application_id ?? item.applicationId,
        }));
        setNotifications(items);
      } catch {
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    fetchNotifications();
  }, [isAuthenticated, user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role ? `/${user.role}/dashboard` : '/';

  const rawAvatar = user?.avatar_url || user?.company_logo;
  const avatarSrc = resolveMediaUrl(rawAvatar) || undefined;
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    String(user?.full_name || user?.name || '').trim() ||
    (user?.role === 'employer' ? String(user?.company_name || '').trim() : '') ||
    user?.email ||
    '';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out',
        isScrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm'
          : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/40 dark:border-slate-800/40 py-1.5'
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl w-full items-center justify-between px-6 py-3"
        aria-label="Điều hướng chính"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 rounded-xl transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98]"
          aria-label="Về trang chủ HireAI"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:shadow-primary/35 motion-safe:group-hover:scale-105">
            <span className="text-white font-black text-xl" aria-hidden="true">
              H
            </span>
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">
            HireAI<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold rounded-xl',
                  'transition-[color,background-color] duration-200 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200 hover:bg-muted/55 dark:hover:bg-slate-800/60'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}

          <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />

          <AIToolsDropdown />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="hidden sm:block text-sm font-semibold px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-[0.98] transition-[transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Thông báo"
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                  >
                    <Bell size={20} aria-hidden="true" />
                    {notifications.filter((n) => !n.isRead).length > 0 && (
                      <span
                        className="absolute top-1 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0" sideOffset={8}>
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-primary" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Thông báo</h3>
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {notifications.filter((n) => !n.isRead).length}
                        </span>
                      )}
                    </div>
                    <Link
                      to={
                        user?.role === 'employer'
                          ? '/employer/messages'
                          : '/candidate/notifications'
                      }
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có thông báo mới</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {notifications.slice(0, 5).map((n, i) => (
                          <Link
                            key={n.id ?? `notif-${i}`}
                            to={
                              user?.role === 'candidate' && n.applicationId
                                ? `/candidate/applications?applicationId=${n.applicationId}`
                                : user?.role === 'employer'
                                  ? '/employer/messages'
                                  : '/candidate/notifications'
                            }
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
                                {(n.type === 'message' ||
                                  !['application', 'system'].includes(n.type)) && (
                                  <Bell size={14} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4
                                  className={cn(
                                    'text-sm',
                                    !n.isRead
                                      ? 'font-bold text-slate-900 dark:text-white'
                                      : 'font-medium text-slate-700 dark:text-slate-300'
                                  )}
                                >
                                  {n.title}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1.5">
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

              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                    <UserAvatarWithStatus size="sm" src={avatarSrc} name={displayName} />
                    <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 mt-2 p-2 border-border/50 shadow-premium rounded-2xl"
                >
                  <div className="mb-2 flex items-center gap-3 px-3 py-4">
                    <UserAvatarWithStatus size="md" src={avatarSrc} name={displayName} />
                    <div className="min-w-0">
                      <p className="truncate font-black tracking-tight text-foreground">
                        {displayName}
                      </p>
                      <p className="truncate text-xs font-medium text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem asChild>
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-3 py-3 rounded-xl cursor-pointer"
                    >
                      <LayoutDashboard size={18} className="text-muted-foreground" />
                      <span className="font-bold text-sm">Bảng điều khiển</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={user?.role ? `/${user.role}/profile` : '/'}
                      className="flex items-center gap-3 py-3 rounded-xl cursor-pointer"
                    >
                      <User size={18} className="text-muted-foreground" />
                      <span className="font-bold text-sm">Hồ sơ cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={user?.role ? `/${user.role}/settings` : '/'}
                      className="flex items-center gap-3 py-3 rounded-xl cursor-pointer"
                    >
                      <Settings size={18} className="text-muted-foreground" />
                      <span className="font-bold text-sm">Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-3 rounded-xl cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <LogOut size={18} />
                    <span className="font-bold text-sm">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <button
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 text-foreground rounded-lg focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-20 left-4 right-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-premium rounded-2xl p-5 lg:hidden flex flex-col gap-1 pointer-events-auto overscroll-contain"
            role="dialog"
            aria-label="Menu điều hướng"
          >
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-semibold transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-muted/55 dark:hover:bg-slate-800/60 hover:text-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        active
                          ? 'bg-primary/20 text-primary'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" aria-hidden="true" />
            <AIToolsDropdown variant="mobile" onItemClick={() => setMobileMenuOpen(false)} />
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 text-center font-semibold border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-muted/35 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3.5 text-center font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default ModernHeader;
