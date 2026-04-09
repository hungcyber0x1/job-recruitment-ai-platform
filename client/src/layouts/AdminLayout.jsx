import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, BookOpen, Home, LayoutDashboard, Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';
import { ADMIN_NAV_GROUPS } from '@/config/adminNavigation';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const isAdminNavActive = (pathname, path) => {
  if (path === '/admin/dashboard') return pathname === '/admin/dashboard';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const SidebarContent = ({ items, user, onMobileClose }) => {
  const location = useLocation();
  const adminName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || 'Quản trị viên';
  const avatarSrc = resolveMediaUrl(user?.avatar_url) || undefined;

  return (
    <div className="z-50 flex h-full w-64 flex-col border-r border-border bg-[hsl(var(--nav-bg))] text-foreground dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-border bg-gradient-to-br from-primary/[0.07] via-primary/[0.02] to-transparent px-5 py-5 dark:from-primary/12 dark:via-primary/5 dark:to-transparent">
        <Link
          to="/admin/dashboard"
          className="group flex items-center gap-3"
          onClick={() => onMobileClose?.()}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-[1.03]">
            <LayoutDashboard className="h-6 w-6" aria-hidden />
          </div>
          <span className="min-w-0 truncate text-lg font-black tracking-tight text-foreground">
            Quản trị
            <span className="text-primary"> Hub</span>
          </span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {items.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isAdminNavActive(location.pathname, item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin/dashboard'}
                      onClick={() => onMobileClose?.()}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-all duration-200',
                        active
                          ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10 dark:bg-primary/15 dark:text-primary dark:ring-primary/20'
                          : 'text-muted-foreground hover:bg-muted/90 hover:text-foreground dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
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
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground/80 group-hover:text-primary'
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

      <div className="border-t border-border p-4">
        <Link
          to="/admin/profile"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3.5 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.06] dark:bg-slate-900/50 dark:hover:bg-primary/10"
          onClick={() => onMobileClose?.()}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-transform group-hover:scale-[1.02] dark:bg-slate-800 dark:border-slate-700">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">
                {(user?.first_name?.[0] || user?.name?.[0] || 'A').toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {adminName}
            </p>
            <p className="truncate text-xs font-bold uppercase tracking-widest text-primary">
              Quản trị viên
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

SidebarContent.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          path: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.elementType.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
  user: PropTypes.shape({
    avatar_url: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    name: PropTypes.string,
  }),
  onMobileClose: PropTypes.func,
};

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const items = ADMIN_NAV_GROUPS;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="z-50 hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <SidebarContent items={items} user={user} />
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
          'fixed inset-y-0 left-0 z-[70] transition-transform duration-300 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          items={items}
          user={user}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-background">
        {/* Top Header - Ô tìm kiếm + chuông + dấu hỏi */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <LayoutDashboard className="h-6 w-6" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm hệ thống..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-border text-foreground placeholder:text-muted-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
              aria-label="Xem trang chủ"
              title="Xem trang chủ"
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              to="/blog"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
              aria-label="Blog công khai"
              title="Blog công khai — cùng dữ liệu với quản trị Blog"
            >
              <BookOpen className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 border-2 border-white" />
              </button>
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
            <Link
              to="/admin/support"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
              aria-label="Trợ giúp"
              title="Trợ giúp"
            >
              <HelpCircle className="h-5 w-5" />
            </Link>
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

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
