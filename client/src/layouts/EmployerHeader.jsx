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
      <div className="container flex h-14 items-center px-6">
        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo & Title */}
        <div className="flex items-center gap-2 mr-6">
          <Logo className="h-9 w-auto" />
          <div className="ml-2 pl-2 border-l border-border hidden md:block">
            <p className="text-sm font-medium text-muted-foreground">Nhà tuyển dụng</p>
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
                  <AvatarImage src={user?.avatar_url} alt={user?.fullName} />
                  <AvatarFallback className="bg-emerald-600/10 text-emerald-600 font-semibold text-xs">
                    {user?.fullName?.charAt(0) || user?.first_name?.charAt(0) || 'E'}
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
                      <AvatarImage src={user?.avatar_url} alt={user?.fullName} />
                      <AvatarFallback className="bg-emerald-600/10 text-emerald-600 font-bold text-lg">
                        {user?.fullName?.charAt(0) || user?.first_name?.charAt(0) || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-bold leading-none text-slate-800 line-clamp-1">
                      {user?.fullName || user?.companyName || 'Nhà tuyển dụng'}
                    </p>
                    <p className="text-sm font-medium text-slate-500 truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />
              <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                <Link to="/employer/dashboard" className="flex items-center">
                  <Briefcase className="mr-3 h-5 w-5 text-slate-500" />
                  <span className="text-sm font-semibold">Bảng điều khiển</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                <Link to="/employer/company-profile" className="flex items-center">
                  <Building2 className="mr-3 h-5 w-5 text-slate-500" />
                  <span className="text-sm font-semibold">Hồ sơ công ty</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-3 my-1 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors rounded-xl text-slate-700">
                <Link to="/employer/settings" className="flex items-center">
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
    </header>
  );
};

EmployerHeader.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default EmployerHeader;
