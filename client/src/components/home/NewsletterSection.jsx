import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-14 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-slate-900 rounded-2xl p-8 md:p-12 overflow-hidden text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-semibold mb-5">
              <Mail size={13} aria-hidden="true" /> Cập nhật mỗi tuần
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3 text-balance">
              Nhận thông tin việc làm mới nhất
            </h2>
            <p className="text-white/60 text-sm font-medium max-w-md mx-auto mb-6 leading-relaxed">
              Xu hướng tuyển dụng, mức lương thị trường và cơ hội nghề nghiệp gửi thẳng inbox.
            </p>

            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Địa chỉ email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="Email của bạn…"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 font-medium transition-colors"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  Đăng ký <ArrowRight size={16} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 text-emerald-400 font-semibold"
              >
                <CheckCircle2 size={20} />
                Đăng ký thành công. Cảm ơn bạn!
              </motion.div>
            )}

            <p className="text-white/30 text-[11px] mt-3">
              Không spam. Huỷ đăng ký bất cứ lúc nào.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
