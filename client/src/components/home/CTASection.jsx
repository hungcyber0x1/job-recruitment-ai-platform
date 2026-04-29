import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { normalizeAuthRole } from '@/utils';

const CTASection = () => {
  const { user, isAuthenticated } = useAuth();
  const userRole = normalizeAuthRole(user?.role);

  const createAiProfileHref = useMemo(() => {
    if (!isAuthenticated) return '/register?role=candidate';
    if (userRole === 'candidate') return '/candidate/resume';
    if (userRole === 'recruiter') return '/employer/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/register?role=candidate';
  }, [isAuthenticated, userRole]);

  /** Ứng viên đã đăng nhập: tải CV vào hồ sơ; khách: công cụ quét CV công khai; NTD/admin: vẫn dùng công cụ công khai */
  const uploadCvHref = useMemo(() => {
    if (isAuthenticated && userRole === 'candidate') return '/candidate/resume?upload=1';
    return '/ai-cv-scanner';
  }, [isAuthenticated, userRole]);

  return (
    <section
      className="relative overflow-hidden border-t border-white/10 py-24 md:py-32"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0 cta-gradient-bg z-0" aria-hidden="true" />

      {/* Soft light wells — depth without clutter */}
      <div
        className="absolute right-[-8%] top-[-25%] h-[min(90vw,560px)] w-[min(90vw,560px)] rounded-full pointer-events-none z-0 blur-[120px] opacity-[0.22]"
        style={{ background: 'hsl(160 72% 42%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute left-[-12%] bottom-[-30%] h-[420px] w-[420px] rounded-full pointer-events-none z-0 blur-[100px] opacity-[0.14]"
        style={{ background: 'hsl(160 60% 55%)' }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 hero-grid-pattern opacity-[0.07] z-0 mix-blend-soft-light"
        aria-hidden="true"
      />

      {/* Bottom fade into page */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none z-[1]"
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.45 }}
            className="mb-8 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-bold uppercase tracking-normal text-white/95 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-sm">
              <Sparkles size={13} className="text-emerald-300" strokeWidth={2} aria-hidden="true" />
              Bắt đầu miễn phí
            </span>
          </motion.div>

          <h2
            id="cta-heading"
            className="mx-auto max-w-[24ch] text-balance text-3xl font-bold tracking-normal text-white sm:text-4xl md:text-4xl lg:text-5xl lg:leading-[1.08]"
          >
            Sẵn sàng để bước tiếp trong <span className="text-emerald-300">sự nghiệp</span> của bạn?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-white/80 md:text-lg">
            Tạo hồ sơ hoặc tải CV có sẵn — nhận việc làm khớp kỹ năng thực tế của bạn.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to={createAiProfileHref}
              className="group landing-focus inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-white px-8 text-base font-bold text-slate-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] active:scale-[0.98] sm:w-auto"
            >
              Tạo hồ sơ AI
              <ArrowRight
                size={18}
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>

            <Link
              to={uploadCvHref}
              className="landing-focus inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/[0.06] px-8 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/45 hover:bg-white/10 active:scale-[0.98] sm:w-auto"
            >
              <Upload size={17} strokeWidth={2} className="opacity-90" aria-hidden="true" />
              Tải CV lên
            </Link>
          </div>

          <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-base font-medium text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Shield
                size={13}
                className="text-emerald-400/80"
                strokeWidth={2}
                aria-hidden="true"
              />
              Miễn phí cho ứng viên
            </span>
            <span className="hidden text-white/25 sm:inline" aria-hidden="true">
              ·
            </span>
            <span>Dữ liệu được mã hóa an toàn</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
