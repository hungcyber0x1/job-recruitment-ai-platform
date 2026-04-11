import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  getDashboardPath,
  getSafeRedirectShapeOnly,
  isPathAllowedForRole,
} from '../../utils/rolePaths';
import Button from '../../components/common/Button';
import { Logo } from '@/components/common';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLoc = location.state?.from;
  const fromPath =
    fromLoc && typeof fromLoc.pathname === 'string'
      ? `${fromLoc.pathname}${fromLoc.search || ''}`
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      // data = { success: true, token, data: { id, role, ... } }
      const userRole = data?.data?.role;

      // Validate role before redirect
      if (!userRole || !['candidate', 'employer', 'admin'].includes(userRole)) {
        showNotification('Vai trò người dùng không hợp lệ', 'error');
        return;
      }

      showNotification('Chào mừng bạn quay trở lại!', 'success');
      const useFrom =
        fromPath &&
        fromPath !== '/login' &&
        getSafeRedirectShapeOnly(fromPath) &&
        isPathAllowedForRole(userRole, fromLoc.pathname);
      const redirectTo = useFrom ? fromPath : getDashboardPath(userRole);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        (error instanceof Error && error.message ? error.message : '') ||
        'Email hoặc mật khẩu không đúng';
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-32 lg:pt-40 pb-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-center bg-[linear-gradient(135deg,#0b1510_0%,#0f1f17_55%,#065f46_100%)] p-12 text-white relative overflow-hidden rounded-[3rem] shadow-2xl space-y-12">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
          <div className="relative z-10">
            <div className="flex justify-center">
              <Link to="/" className="inline-block mb-12 transition-opacity hover:opacity-90">
                <Logo className="h-14 w-auto" />
              </Link>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-6 text-wrap-balance">
              Dẫn đầu xu hướng <br /> cùng{' '}
              <span className="text-primary font-extrabold">Trí tuệ nhân tạo.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              Đăng nhập để tiếp tục hành trình sự nghiệp và khám phá những cơ hội không giới hạn.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-xl">
                <p className="text-3xl font-extrabold text-primary mb-1 tabular-nums">94.7%</p>
                <p className="text-base font-semibold text-slate-400">Matching chính xác</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-xl">
                <p className="text-3xl font-extrabold text-primary mb-1 tabular-nums">8,340</p>
                <p className="text-base font-semibold text-slate-400">Việc làm đang mở</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-premium border border-border">
          <div className="text-center mb-10 flex justify-center lg:hidden">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <Logo className="h-8 w-auto" />
            </Link>
          </div>
          <div className="mb-10">
            <h2 className="text-3xl font-black text-foreground mb-2 text-wrap-balance">
              Đăng nhập
            </h2>
            <p className="text-txt-muted font-medium">
              Nhập thông tin bên dưới để truy cập tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-foreground"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-primary" />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="font-bold text-primary hover:opacity-90">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              variant="primary"
              type="submit"
              className="w-full py-4 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Đang xử lý…' : 'Đăng nhập ngay'}
              <ArrowRight size={20} />
            </Button>

            <p className="text-center text-txt-muted font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-black text-primary hover:underline">
                Đăng ký miễn phí
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
