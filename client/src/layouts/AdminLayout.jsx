import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, BookOpen, Home, LayoutDashboard, Search, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';
import { ADMIN_NAV_GROUPS } from '@/config/adminNavigation';

const SidebarContent = ({ items, user }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-white text-foreground border-r border-border z-50 w-64">
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-emerald-600">AI Recruiter</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {items.map((group) => (
            <div key={group.title}>
              <h3 className="px-3 mb-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    location.pathname === item.path ||
                    (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                        active
                          ? 'bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/5'
                          : 'text-slate-500 hover:bg-primary/10 hover:text-emerald-600'
                      )}
                    >
                      <Icon
                        size={18}
                        className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer - Admin profile */}
      <div className="p-4 border-t border-border">
        <Link
          to="/admin/profile"
          className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-primary/10 hover:border-emerald-100 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-sm">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-emerald-600">
                {(user?.first_name?.[0] || user?.name?.[0] || 'A').toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-700 transition-colors">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.name || 'Admin Name'}
            </p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              Hồ sơ Quản trị
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
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50">
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
          'fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-border transition-transform duration-300 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent items={items} user={user} />
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
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-border text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
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
