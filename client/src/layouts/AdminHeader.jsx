import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

import { AccountHomeLink } from '@/components/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { findNavItem } from '@/config/adminNavigation';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const getAdminDisplayName = (user) => {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return user?.fullName || fullName || user?.name || 'Quản trị viên';
};

const getInitials = (user) => {
  const displayName = getAdminDisplayName(user);
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A'
  );
};

const AdminHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentNavItem = useMemo(
    () => findNavItem(location.pathname, user),
    [location.pathname, user]
  );
  const displayName = getAdminDisplayName(user);
  const avatarSrc = resolveMediaUrl(user?.avatar_url) || undefined;

  const handleSearch = (event) => {
    if (event.key !== 'Enter') return;

    const nextQuery = searchQuery.trim();
    navigate(nextQuery ? `/admin/users?search=${encodeURIComponent(nextQuery)}` : '/admin/users');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 flex h-[4.25rem] items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-emerald-600 lg:hidden"
          onClick={onMenuClick}
          aria-label="Mở menu quản trị"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Tìm kiếm ${currentNavItem?.label?.toLowerCase() || 'hệ thống'}...`}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleSearch}
            className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-base font-medium text-foreground placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AccountHomeLink />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((value) => !value)}
            className="rounded-xl p-2.5 text-slate-500 transition-all hover:scale-110 hover:bg-primary/10 hover:text-emerald-600 active:scale-95 dark:hover:bg-emerald-500/10"
            aria-label="Thông báo quản trị"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-emerald-500" />
          </button>
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            userRole="admin"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group ml-2 flex items-center gap-3 border-l border-border pl-4 transition-all"
              aria-label="Tài khoản quản trị"
            >
              <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20 transition-all group-hover:ring-emerald-500/50 active:scale-95">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="bg-emerald-600 text-base font-semibold text-white">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 border-border bg-white text-foreground shadow-2xl dark:bg-slate-800"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="p-4 font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-base font-semibold">{displayName}</p>
                <p className="truncate text-base text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="cursor-pointer p-3 hover:bg-primary/10 focus:bg-primary/10"
            >
              <Link to="/admin/profile" className="flex w-full items-center">
                <UserRound className="mr-2 h-4 w-4 text-emerald-500" />
                Hồ sơ của tôi
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer p-3 hover:bg-primary/10 focus:bg-primary/10"
            >
              <Link to="/admin/dashboard" className="flex w-full items-center">
                <LayoutDashboard className="mr-2 h-4 w-4 text-emerald-500" />
                Tổng quan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer p-3 hover:bg-primary/10 focus:bg-primary/10"
            >
              <Link to="/admin/users" className="flex w-full items-center">
                <Users className="mr-2 h-4 w-4 text-emerald-500" />
                Người dùng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer p-3 hover:bg-primary/10 focus:bg-primary/10"
            >
              <Link to="/admin/settings" className="flex w-full items-center">
                <Settings className="mr-2 h-4 w-4 text-emerald-500" />
                Cài đặt
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="p-3 text-muted-foreground">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
              Phiên quản trị đang hoạt động
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
  );
};

AdminHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default AdminHeader;
