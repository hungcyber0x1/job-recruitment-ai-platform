import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-muted/50 border border-primary/10 shadow-[0_0_0_1px_rgba(16,185,129,0.05)_inset]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.06] rounded-full blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.04) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative z-10 px-8 py-14 md:px-16 md:py-16 text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="landing-badge mb-8"
            >
              <Zap size={14} />
              Bắt đầu miễn phí — không cần thẻ tín dụng
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground tracking-tighter leading-[1.05] mb-6 text-balance">
              Đừng bỏ lỡ <span className="text-primary">công việc phù hợp</span> với bạn
            </h2>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-6 font-medium">
              Tham gia cùng hơn 47,000 ứng viên và 1,200 doanh nghiệp đang sử dụng AI để kết nối
              nhanh hơn, chính xác hơn
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="group landing-btn-primary px-10 py-5 text-lg">
                <Sparkles size={20} aria-hidden />
                Bắt đầu ngay
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                  aria-hidden
                />
              </Link>
              <Link to="/jobs" className="landing-btn-secondary px-10 py-5 text-lg">
                Khám phá việc làm
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Miễn phí mãi mãi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Không spam
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Bảo mật tuyệt đối
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
