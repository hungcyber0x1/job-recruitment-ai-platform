import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Building2,
  Users,
  ArrowRight,
  Zap,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Logo } from '@/components/common';
import { buildRegisterPayload } from '@/utils';
import { getDashboardPath, getSafePostAuthRedirect } from '@/utils/rolePaths';

const RegisterPage = () => {
  const [role, setRole] = useState(null); // 'candidate' or 'employer'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize role from ?role= query param
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'candidate' || r === 'employer') {
      setRole(r);
    }
  }, [searchParams]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      showNotification('Vui lòng chọn vai trò (ứng viên hoặc nhà tuyển dụng)', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showNotification('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await register(buildRegisterPayload(formData, role));
      // res = { success: true, data: { ...user, token, requires_approval }, meta: { message } }
      // Use extractAuthResponse to get normalized role + status + requiresApproval
      const { requiresApproval, role: normalizedRole } =
        (res?.data && typeof res.data === 'object')
          ? {
              requiresApproval: Boolean(res.data.requires_approval),
              role: res.data.role,
            }
          : { requiresApproval: false, role: null };

      const roleLabel = normalizedRole === 'recruiter' ? 'nhà tuyển dụng' : 'ứng viên';

      if (requiresApproval) {
        showNotification(
          `Tài khoản ${roleLabel} đã được tạo và đang chờ quản trị viên phê duyệt.`,
          'success'
        );
        navigate('/login', { replace: true });
      } else {
        showNotification(`Đăng ký tài khoản ${roleLabel} thành công!`, 'success');
        const next = searchParams.get('next');
        const target = getSafePostAuthRedirect(next, normalizedRole)
          || getDashboardPath(normalizedRole);
        navigate(target, { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.errors) && err?.response?.data?.errors[0]?.message) ||
        (err instanceof Error ? err.message : '') ||
        'Đăng ký thất bại';
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50/90 via-background to-emerald-50/25 px-4 py-16 pt-24 font-sans sm:px-6 lg:px-8 lg:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-0 h-[min(600px,80vw)] w-[min(600px,80vw)] translate-x-1/4 -translate-y-1/4 rounded-full bg-primary/[0.09] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[min(520px,70vw)] w-[min(520px,70vw)] -translate-x-1/4 translate-y-1/4 rounded-full bg-emerald-400/[0.06] blur-[100px]" />
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
        {/* Left: branding — premium panel, aligns with Login aesthetic */}
        <div className="relative hidden overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 p-10 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.15)] lg:flex lg:flex-col lg:justify-center xl:rounded-[2.25rem] xl:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.045]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl"
            aria-hidden
          />
          <div className="relative z-10 space-y-10">
            <div>
              <div className="flex justify-center">
                <Link
                  to="/"
                  className="group mb-8 inline-flex items-center gap-3 transition-opacity hover:opacity-90"
                >
                  <Logo asLink={false} className="h-14 w-auto" />
                </Link>
              </div>
              <h1 className="mb-5 max-w-[22ch] text-balance text-4xl font-bold leading-[1.12] tracking-normal text-foreground xl:text-[2.75rem] xl:leading-[1.1]">
                Mở khóa tiềm năng{' '}
                <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  Sự nghiệp của bạn.
                </span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                Tham gia mạng lưới tuyển dụng thông minh được cung cấp bởi trí tuệ nhân tạo hàng
                đầu.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4">
              <li className="flex gap-4 rounded-xl border border-border/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15">
                  <Zap className="size-6 text-primary" strokeWidth={2.25} aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="font-semibold leading-snug text-foreground">
                    Gợi ý việc làm thông minh
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    Matching chính xác theo kỹ năng và kinh nghiệm.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-xl border border-border/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-1 ring-border/60">
                  <ShieldCheck className="size-6 text-slate-600" strokeWidth={2.25} aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="font-semibold leading-snug text-foreground">
                    Bảo mật &amp; tin cậy
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    Hồ sơ của bạn được bảo vệ tuyệt đối.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: form */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white p-8 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.12)] md:p-10 lg:rounded-[2.25rem] xl:p-12">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
            aria-hidden
          />

          <div className="mb-8 text-center lg:mb-10 lg:text-left">
            <div className="mb-6 flex justify-center lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              >
                <Logo asLink={false} className="h-8 w-auto" />
              </Link>
            </div>
            {!role ? (
              <>
                <h2 className="mb-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
                  Chào mừng bạn!
                </h2>
                <p className="text-base text-muted-foreground sm:text-base">
                  Vui lòng chọn vai trò để bắt đầu.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-primary transition-colors hover:text-primary/80"
                >
                  <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                  Quay lại chọn vai trò
                </button>
                <h2 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
                  Đăng ký {role === 'employer' ? 'nhà tuyển dụng' : 'ứng viên'}
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  {role === 'employer'
                    ? 'Tạo tài khoản để đăng tin và quản lý ứng viên.'
                    : 'Tạo tài khoản để nhận gợi ý việc làm phù hợp.'}
                </p>
              </>
            )}
          </div>

          {!role ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('candidate')}
                className="group flex items-center gap-5 rounded-xl border border-border/90 bg-slate-50/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04] sm:gap-6 sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:rounded-xl">
                  <Users className="size-6 sm:size-7" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 text-base font-semibold text-foreground sm:text-lg">
                    Ứng viên
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-base">
                    Tìm kiếm việc làm &amp; cơ hội sự nghiệp
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-slate-300 transition-colors group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={2}
                />
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('employer')}
                className="group flex items-center gap-5 rounded-xl border border-border/90 bg-slate-50/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04] sm:gap-6 sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:rounded-xl">
                  <Building2 className="size-6 sm:size-7" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-0.5 text-base font-semibold text-foreground sm:text-lg">
                    Nhà tuyển dụng
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-base">
                    Tìm kiếm nhân tài &amp; quản lý tuyển dụng
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-slate-300 transition-colors group-hover:translate-x-0.5 group-hover:text-primary"
                  strokeWidth={2}
                />
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div className="space-y-2.5">
                    <label
                      htmlFor="reg-lastName"
                      className="block text-sm font-semibold text-foreground/90"
                    >
                      Họ
                    </label>
                    <Input
                      id="reg-lastName"
                      name="last_name"
                      placeholder="Nguyễn"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      autoComplete="family-name"
                      className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label
                      htmlFor="reg-firstName"
                      className="block text-sm font-semibold text-foreground/90"
                    >
                      Tên
                    </label>
                    <Input
                      id="reg-firstName"
                      name="first_name"
                      placeholder="Văn A"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      autoComplete="given-name"
                      className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>

                {role === 'employer' && (
                  <div className="space-y-2.5">
                    <label
                      htmlFor="reg-company"
                      className="block text-sm font-semibold text-foreground/90"
                    >
                      Tên công ty
                    </label>
                    <Input
                      id="reg-company"
                      name="company_name"
                      placeholder="Tên doanh nghiệp của bạn"
                      value={formData.company_name}
                      onChange={handleChange}
                      required={role === 'employer'}
                      autoComplete="organization"
                      className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                    />
                  </div>
                )}

                <div className="space-y-2.5">
                  <label
                    htmlFor="reg-email"
                    className="block text-sm font-semibold text-foreground/90"
                  >
                    Email
                  </label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="reg-password"
                    className="block text-sm font-semibold text-foreground/90"
                  >
                    Mật khẩu
                  </label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="reg-confirm"
                    className="block text-sm font-semibold text-foreground/90"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <Input
                    id="reg-confirm"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-border/90 bg-slate-50/40 transition-colors focus-visible:border-primary/45 focus-visible:ring-primary/15"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-12 w-full rounded-xl bg-primary font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/95 disabled:opacity-70 sm:h-14 sm:rounded-xl sm:text-base"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                    {!loading && (
                      <ArrowRight className="size-[1.125rem]" strokeWidth={2.5} aria-hidden />
                    )}
                  </span>
                </Button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-base text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
