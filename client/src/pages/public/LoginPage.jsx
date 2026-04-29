import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();

  // Priority: 1) sessionStorage (from apply flow), 2) ?next= query param, 3) location.state.from, 4) dashboard
  const applyJobId = sessionStorage.getItem('apply_job_id');
  const nextParam = searchParams.get('next');
  const fromLoc = location.state?.from;
  const fromPath =
    fromLoc && typeof fromLoc.pathname === 'string'
      ? `${fromLoc.pathname}${fromLoc.search || ''}`
      : null;

  // Determine best redirect target
  const getRedirectTarget = (userRole) => {
    // 1) Apply flow takes highest priority
    if (applyJobId) {
      sessionStorage.removeItem('apply_job_id');
      return `/jobs/${applyJobId}`;
    }
    // 2) ?next= param if allowed for role
    if (nextParam) {
      const safeNext = getSafeRedirectShapeOnly(nextParam);
      if (safeNext && isPathAllowedForRole(userRole, safeNext.split('?')[0].split('#')[0])) {
        return safeNext;
      }
    }
    // 3) location.state.from (e.g. from PrivateRoute redirect)
    if (fromPath && fromPath !== '/login' && getSafeRedirectShapeOnly(fromPath) && isPathAllowedForRole(userRole, fromLoc.pathname)) {
      return fromPath;
    }
    // 4) Default dashboard
    return getDashboardPath(userRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      // data = { success: true, data: { id, role, token, ... } }
      // Role is normalized by backend; extractAuthResponse normalizes on client.
      const { role: userRole } =
        (data?.data && typeof data.data === 'object')
          ? { role: data.data.role }
          : { role: null };

      if (!userRole) {
        showNotification('Phản hồi đăng nhập không hợp lệ', 'error');
        return;
      }

      showNotification('Chào mừng bạn quay trở lại!', 'success');
      const redirectTo = getRedirectTarget(userRole);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) && err?.response?.data?.errors[0]?.message) ||
        (err instanceof Error ? err.message : '') ||
        'Đăng nhập thất bại';
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
                <Logo asLink={false} className="h-14 w-auto" />
              </Link>
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6 text-wrap-balance">
              Dẫn đầu xu hướng <br /> cùng{' '}
              <span className="text-primary font-extrabold">Trí tuệ nhân tạo.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              Đăng nhập để tiếp tục hành trình sự nghiệp và khám phá những cơ hội không giới hạn.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl">
                <p className="text-3xl font-extrabold text-primary mb-1 tabular-nums">94.7%</p>
                <p className="text-base font-semibold text-slate-400">Matching chính xác</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl">
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
              <Logo asLink={false} className="h-8 w-auto" />
            </Link>
          </div>
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2 text-wrap-balance">
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-foreground"
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
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-foreground"
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
              className="w-full py-4 text-lg font-bold rounded-xl shadow-xl shadow-primary/20"
              disabled={loading}
              rightIcon={<ArrowRight size={20} />}
            >
              {loading ? 'Đang xử lý…' : 'Đăng nhập ngay'}
            </Button>

            <p className="text-center text-txt-muted font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-primary hover:underline">
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
