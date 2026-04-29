import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Briefcase,
  Building,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
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
    description: 'Theo dõi nhanh tình trạng vận hành, tin đăng và sức khỏe nền tảng.',
    action: { to: '/admin/jobs?status=pending_review', label: 'Job chờ duyệt', icon: Briefcase },
  },
  {
    match: '/admin/users',
    title: 'Người dùng',
    description: 'Tìm kiếm, lọc và quản lý tài khoản trong hệ thống.',
    action: { to: '/admin/users?status=pending_verification', label: 'Xem chờ duyệt', icon: Users },
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
    action: { to: '/admin/jobs?status=pending_review', label: 'Job chờ duyệt', icon: Briefcase },
  },
  {
    match: '/admin/moderation',
    title: 'Hang doi xu ly',
    description: 'Hang doi noi bo tong hop cac muc can duyet nhanh tu Jobs, Companies va Blog.',
    action: { to: '/admin/jobs?status=pending_review', label: 'Mo Jobs', icon: Briefcase },
  },
  {
    match: '/admin/applications',
    title: 'Hồ sơ ứng tuyển',
    description: 'Giám sát pipeline ứng tuyển và các hồ sơ cần xử lý.',
    action: { to: '/admin/applications?status=screening', label: 'Hồ sơ đang xử lý', icon: FileText },
  },
  {
    match: '/admin/service-health',
    title: 'Sức khỏe dịch vụ',
    description: 'Theo dõi trạng thái các service và độ ổn định của hệ thống.',
    action: { to: '/admin/analytics', label: 'Mở analytics', icon: Activity },
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
      <div className="container flex h-14 items-center px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2 mr-6">
          <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground transform scale-90 origin-left">
            <MenuSquare className="h-4.5 w-4.5" />
          </div>
          <div className="hidden lg:block">
            <div className="text-base font-bold leading-none">{routeMeta.title}</div>
            <p className="text-[13px] text-muted-foreground hidden md:block mt-1 leading-none">
              {routeMeta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end md:justify-between">
          <div className="hidden md:flex relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-8 h-8.5 w-full md:w-[280px] text-sm bg-muted/40 border-transparent focus:bg-background transition-all"
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

            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              title="Đăng xuất" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hidden sm:flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 flex items-center justify-center group focus-visible:ring-offset-0">
                  <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-primary/20 transition-all duration-300">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white group-hover:scale-110 transition-transform duration-300"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-2 rounded-xl border-slate-100 shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-base font-bold leading-none text-slate-800">
                        {user?.fullName || `${user?.first_name} ${user?.last_name}`}
                      </p>
                      <p className="text-sm font-medium text-slate-500 truncate max-w-[150px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />
                <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                  <Link to="/admin/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-3 h-5 w-5 text-slate-500" />
                    <span className="text-sm font-semibold">Bảng điều khiển</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                  <Link to="/admin/profile" className="flex items-center">
                    <User className="mr-3 h-5 w-5 text-slate-500" />
                    <span className="text-sm font-semibold">Hồ sơ cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                  <Link to="/admin/settings" className="flex items-center">
                    <Settings className="mr-3 h-5 w-5 text-slate-500" />
                    <span className="text-sm font-semibold">Cài đặt</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="p-3 my-1 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 hover:bg-red-50 transition-colors rounded-xl group"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
                  <span className="text-sm font-bold">Đăng xuất</span>
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
