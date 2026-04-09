import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Briefcase,
  Building,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  User,
  Users,
  MenuSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ADMIN_ROUTE_META = [
  {
    match: '/admin/dashboard',
    title: 'Dashboard',
    description: 'Theo dõi nhanh tình trạng vận hành, kiểm duyệt và sức khỏe nền tảng.',
    action: { to: '/admin/moderation', label: 'Mở kiểm duyệt', icon: ShieldAlert },
  },
  {
    match: '/admin/users',
    title: 'Người dùng',
    description: 'Tìm kiếm, lọc và quản lý tài khoản trong hệ thống.',
    action: { to: '/admin/users?status=pending', label: 'Xem chờ duyệt', icon: Users },
  },
  {
    match: '/admin/companies',
    title: 'Công ty',
    description: 'Kiểm tra trạng thái xác minh và giám sát đơn vị đang tuyển dụng.',
    action: {
      to: '/admin/companies?verification=unverified',
      label: 'Chưa xác minh',
      icon: Building,
    },
  },
  {
    match: '/admin/jobs',
    title: 'Việc làm',
    description: 'Theo dõi chất lượng tin đăng và xử lý các tin cần kiểm duyệt.',
    action: { to: '/admin/jobs?status=pending', label: 'Job chờ duyệt', icon: Briefcase },
  },
  {
    match: '/admin/applications',
    title: 'Hồ sơ ứng tuyển',
    description: 'Giám sát pipeline ứng tuyển và các hồ sơ cần xử lý.',
    action: { to: '/admin/applications?status=screening', label: 'Sàng lọc AI', icon: FileText },
  },
  {
    match: '/admin/logs',
    title: 'Nhật ký hệ thống',
    description: 'Theo dõi sự cố, hành vi bất thường và tín hiệu cần cảnh báo.',
    action: { to: '/admin/service-health', label: 'Xem sức khỏe', icon: Activity },
  },
  {
    match: '/admin/service-health',
    title: 'Sức khỏe dịch vụ',
    description: 'Theo dõi trạng thái các service và độ ổn định của hệ thống.',
    action: { to: '/admin/logs', label: 'Mở logs', icon: HeartPulse },
  },
  {
    match: '/admin/settings',
    title: 'Cài đặt hệ thống',
    description: 'Điều chỉnh cấu hình quản trị và các tham số vận hành.',
    action: { to: '/admin/feature-flags', label: 'Feature flags', icon: Settings },
  },
];

const getRouteMeta = (pathname) =>
  ADMIN_ROUTE_META.find((item) => pathname.startsWith(item.match)) || {
    title: 'Admin workspace',
    description: 'Quản trị dữ liệu, vận hành và các tác vụ hệ thống.',
    action: null,
  };

const AdminHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const routeMeta = getRouteMeta(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      const nextQuery = searchQuery.trim();
      navigate(nextQuery ? `/admin/users?search=${encodeURIComponent(nextQuery)}` : '/admin/users');
    }
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2 mr-6">
          <div className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
            <MenuSquare className="h-5 w-5" />
          </div>
          <div className="hidden lg:block">
            <div className="text-lg font-semibold">{routeMeta.title}</div>
            <p className="text-xs text-muted-foreground hidden md:block">{routeMeta.description}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-1 items-center justify-end md:justify-between">
          <div className="hidden md:flex relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Action */}
            {routeMeta.action && (
              <Button asChild size="sm" className="hidden sm:flex">
                <Link to={routeMeta.action.to}>
                  <routeMeta.action.icon className="mr-2 h-4 w-4" />
                  {routeMeta.action.label}
                </Link>
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <NotificationDropdown isOpen={true} onClose={() => setShowNotifications(false)} />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || `${user?.first_name} ${user?.last_name}`}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Trang chủ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

AdminHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default AdminHeader;
