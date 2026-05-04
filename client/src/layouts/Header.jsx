import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Bell, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Avatar, Logo, AIToolsDropdown } from '@/components/common';
import { getDashboardPath, getProfilePath, getSettingsPath } from '../utils/rolePaths';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Việc làm', path: '/jobs' },
    { label: 'Công ty', path: '/companies' },
    { label: 'Chat tư vấn AI', path: '/chat' },
    { label: 'Blog', path: '/blog' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardPath = getDashboardPath(user?.role);
  const profilePath = getProfilePath(user?.role);
  const settingsPath = getSettingsPath(user?.role);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-colors transition-transform transition-shadow opacity-100 duration-500 ${
        isScrolled
          ? 'py-3 glass border-b border-border/70 shadow-premium'
          : 'py-6 bg-transparent border-transparent'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-[120] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-card"
      >
        Bỏ qua và đến nội dung chính
      </a>
      <div className="container mx-auto px-6 max-w-7xl">
        <nav className="flex items-center justify-between" aria-label="Điều hướng chính">
          <Link to="/" className="group">
            <Logo className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-lg font-bold transition-colors transition-transform transition-shadow opacity-100 duration-200 hover:text-primary relative group pb-1 ${
                  location.pathname === link.path ? 'text-primary' : 'text-txt-muted'
                }`}
                onClick={() => {
                  setIsOpen(false);
                  setIsProfileOpen(false);
                }}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-[3px] bg-primary transition-colors transition-transform transition-shadow opacity-100 duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`}
                ></span>
              </Link>
            ))}

            {/* AI Tools Dropdown */}
            <AIToolsDropdown />
          </div>

          {/* User Auth Section */}
          <div className="hidden lg:flex items-center gap-5">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <button
                  className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
                  aria-label="Xem thông báo"
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-primary/5 border border-transparent hover:border-border transition-colors"
                    aria-label="Trình đơn người dùng"
                    aria-expanded={isProfileOpen}
                  >
                    <Avatar
                      size="sm"
                      src={user?.avatar_url}
                      name={`${user?.first_name} ${user?.last_name}`}
                      className="w-8 h-8 rounded-full border border-border"
                    />
                    <span className="text-sm font-bold text-foreground">{user?.first_name}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-card border border-border py-2 animate-fade-in z-[110]">
                      <div className="px-5 py-3 border-b border-border mb-2">
                        <p className="font-bold text-foreground">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-base text-muted-foreground truncate">{user?.email}</p>
                        <span className="mt-2 inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-sm font-black uppercase rounded">
                          {user?.role}
                        </span>
                      </div>
                      <div className="px-2 space-y-0.5">
                        <Link
                          to={dashboardPath}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-foreground hover:text-primary font-bold text-sm transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LayoutDashboard size={18} />
                          Tổng quan
                        </Link>
                        <Link
                          to={profilePath}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-foreground hover:text-primary font-bold text-sm transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User size={18} />
                          Hồ sơ
                        </Link>
                        <Link
                          to={settingsPath}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/5 text-foreground hover:text-primary font-bold text-sm transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings size={18} />
                          Cài đặt
                        </Link>
                        <div className="h-px bg-border my-1.5 mx-3"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/100/10 text-red-400 font-bold text-sm transition-colors"
                        >
                          <LogOut size={18} />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="md" renderAs={Link} to="/login" className="font-bold">
                  Đăng nhập
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  renderAs={Link}
                  to="/register"
                  className="font-bold shadow-lg shadow-primary/20"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:bg-primary/5 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            type="button"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile menu - Slide over */}
        <div
          id="mobile-navigation"
          className={`fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsOpen(false)}
        ></div>

        <div
          className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-50 shadow-premium transform transition-transform duration-300 ease-out lg:hidden flex flex-col border-l border-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-primary/5 rounded-full transition-colors"
              aria-label="Đóng menu"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-base transition-all ${
                  location.pathname === link.path
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground dark:text-slate-400 hover:bg-primary/5 hover:text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-border dark:bg-slate-800 my-6"></div>
            <AIToolsDropdown variant="mobile" onItemClick={() => setIsOpen(false)} />
          </div>

          <div className="p-6 border-t border-border space-y-3 bg-white">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  to={dashboardPath}
                  className="w-full py-4 rounded-2xl bg-primary text-white text-center font-bold shadow-lg shadow-primary/25"
                  onClick={() => setIsOpen(false)}
                >
                  Tổng quan
                </Link>
                <Button
                  variant="ghost"
                  className="w-full py-4 text-red-400 font-bold hover:bg-destructive/100/10"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full py-4 bg-white border-border text-foreground font-bold"
                  renderAs={Link}
                  to="/login"
                  onClick={() => setIsOpen(false)}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="primary"
                  className="w-full py-4 font-bold shadow-lg shadow-primary/20"
                  renderAs={Link}
                  to="/register"
                  onClick={() => setIsOpen(false)}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
