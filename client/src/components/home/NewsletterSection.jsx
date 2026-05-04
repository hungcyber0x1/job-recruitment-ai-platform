import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

import useNewsletterSubscription from '@/hooks/useNewsletterSubscription';

const NewsletterSection = () => {
  const newsletter = useNewsletterSubscription({
    source: 'home_newsletter',
    topic: 'weekly_hiring_insights',
    metadata: { page: 'home', placement: 'newsletter_section' },
  });

  return (
    <section className="py-14 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-slate-900 rounded-xl p-8 md:p-12 overflow-hidden text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-sm font-semibold mb-5">
              <Mail size={13} aria-hidden="true" /> Bản tin chọn lọc mỗi tuần
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-normal leading-tight mb-3 text-balance">
              Nhận góc nhìn tuyển dụng có thể hành động
            </h2>
            <p className="text-white/60 text-base font-medium max-w-xl mx-auto mb-6 leading-relaxed">
              Tóm tắt xu hướng nhân sự, mức lương thị trường, bài phân tích mới và cơ hội việc làm
              đáng chú ý — được biên tập để không làm phiền hộp thư của bạn.
            </p>

            <form
              onSubmit={newsletter.submit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              noValidate
            >
              <label htmlFor="home-newsletter-email" className="sr-only">
                Địa chỉ email
              </label>
              <input
                id="home-newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="ten@congty.com"
                value={newsletter.email}
                onChange={(e) => newsletter.setEmail(e.target.value)}
                disabled={newsletter.isSubmitting}
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={newsletter.isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-80 disabled:active:scale-100"
              >
                {newsletter.isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Đang gửi
                  </>
                ) : (
                  <>
                    Đăng ký <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {newsletter.message ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mx-auto mt-4 flex max-w-lg items-start justify-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                  newsletter.status === 'error'
                    ? 'bg-red-500/10 text-red-200 border border-red-400/20'
                    : 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/20'
                }`}
                role={newsletter.status === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {newsletter.status === 'error' ? (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                )}
                <span>{newsletter.message}</span>
              </motion.div>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-semibold text-white/45">
              {['Có sự đồng ý rõ ràng', 'Không chia sẻ dữ liệu', 'Huỷ đăng ký bất cứ lúc nào'].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-300/80" aria-hidden="true" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
