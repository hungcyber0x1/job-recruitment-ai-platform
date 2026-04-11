import PropTypes from 'prop-types';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, Building2, Home, LogOut, Menu, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '@/components/common';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EmployerHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
          <Logo className="h-12 w-auto" />
          <div className="ml-2 pl-2 border-l border-border hidden md:block">
            <p className="text-base font-medium text-muted-foreground">Nhà tuyển dụng</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Quick Links */}
          <Button variant="ghost" size="sm" asChild className="hidden md:flex">
            <Link to="/employer/jobs/post">
              <Briefcase className="mr-2 h-4 w-4" />
              Đăng tin mới
            </Link>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chưa có thông báo mới
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} alt={user?.fullName} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user?.fullName?.charAt(0) || user?.first_name?.charAt(0) || 'E'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-base font-medium leading-none">
                    {user?.fullName || user?.companyName || 'Nhà tuyển dụng'}
                  </p>
                  <p className="text-base leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/employer/dashboard">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/employer/company-profile">
                  <Building2 className="mr-2 h-4 w-4" />
                  Hồ sơ công ty
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/employer/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
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
    </header>
  );
};

EmployerHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default EmployerHeader;
