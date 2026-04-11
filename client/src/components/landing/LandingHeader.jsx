import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Building2,
  Briefcase,
  FileText,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AIToolsDropdown, AppIcon, Logo } from '@/components/common';

const navLinksCenter = [
  { label: 'Việc làm', path: '/jobs', icon: Briefcase },
  { label: 'Cộng đồng', path: '/about', icon: UsersRound },
  { label: 'Công ty', path: '/companies', icon: Building2 },
  { label: 'Blog', path: '/blog', icon: FileText },
];

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role ? `/${user.role}/dashboard` : '/';
  const isHome = location.pathname === '/';
  const navFloating = isScrolled || isHome;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'w-full max-w-7xl grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 transition-all duration-500 pointer-events-auto',
          navFloating
            ? 'rounded-2xl border border-slate-200/90 bg-white/[0.97] py-3.5 shadow-[0_12px_42px_-14px_rgba(15,23,42,0.14)] backdrop-blur-xl'
            : 'border border-transparent bg-transparent py-5'
        )}
      >
        <Link
          to="/"
          className="group shrink-0 transition-[transform,opacity] duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          <Logo className="h-14 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center justify-center gap-0.5 min-w-0">
          {navLinksCenter.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            return (
              <motion.div key={link.path} whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                <Link
                  to={link.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 text-base font-semibold rounded-xl transition-all duration-300 relative group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
                    active
                      ? 'text-primary bg-primary/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <AppIcon
                    icon={Icon}
                    size="sm"
                    className={cn(
                      'opacity-80 transition-transform group-hover:scale-110',
                      active && 'text-primary opacity-100'
                    )}
                  />
                  {link.label}
                  {!active && (
                    <motion.div
                      className="absolute bottom-1 left-3 right-3 h-0.5 bg-primary rounded-full origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
          <AIToolsDropdown />
        </div>

        <div className="flex items-center justify-end gap-3 shrink-0">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="hidden sm:block px-3 py-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="landing-btn-cta hidden px-5 py-2.5 text-base font-bold sm:inline-flex"
              >
                Tuyển dụng ngay
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                aria-label="Thông báo"
                className="p-2 text-muted-foreground hover:text-primary transition-colors relative rounded-lg"
              >
                <AppIcon icon={Bell} size="md" className="text-current" />
                <span className="absolute top-1 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all cursor-pointer">
                    <Avatar
                      size="sm"
                      src={user?.avatar_url}
                      name={user?.first_name}
                      className="size-8 border border-border/50"
                    />
                    <AppIcon
                      icon={ChevronDown}
                      size="xs"
                      className="text-muted-foreground hidden sm:block"
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 mt-2 p-2 border-border/50 shadow-premium rounded-2xl"
                >
                  <div className="px-3 py-4 mb-2">
                    <p className="text-base font-black tracking-tight text-foreground">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="truncate text-base font-medium text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem asChild>
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-3 py-3 rounded-xl cursor-pointer"
                    >
                      <AppIcon icon={LayoutDashboard} size={18} className="text-muted-foreground" />
                      <span className="text-base font-bold">Bảng điều khiển</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={user?.role ? `/${user.role}/settings` : '/'}
                      className="flex items-center gap-3 py-3 rounded-xl cursor-pointer"
                    >
                      <AppIcon icon={Settings} size={18} className="text-muted-foreground" />
                      <span className="text-base font-bold">Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-3 rounded-xl cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <AppIcon icon={LogOut} size={18} className="text-current" />
                    <span className="text-base font-bold">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <button
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 text-foreground rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <AppIcon icon={X} size="lg" /> : <AppIcon icon={Menu} size="lg" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 left-4 right-4 bg-white border border-border shadow-premium rounded-3xl p-6 lg:hidden flex flex-col gap-4 pointer-events-auto"
          >
            <div className="flex flex-col gap-0.5">
              {navLinksCenter.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-xl text-base transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-600 font-semibold hover:bg-muted/55 hover:text-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        active ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      <AppIcon icon={Icon} size="md" />
                    </div>
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="h-px bg-border my-1" />
            <AIToolsDropdown variant="mobile" onItemClick={() => setMobileMenuOpen(false)} />
            {!isAuthenticated && (
              <div className="grid grid-cols-1 gap-3 mt-3">
                <Link
                  to="/login"
                  className="py-4 text-center text-base font-semibold border border-border rounded-2xl hover:bg-muted/50"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="landing-btn-cta rounded-2xl py-4 text-center text-base font-bold"
                >
                  Tuyển dụng ngay
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingHeader;
