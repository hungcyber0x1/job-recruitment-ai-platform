import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Zap, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/common';

const HeroSection = () => {
  return (
    <section className="relative min-h-[95vh] flex items-center pt-24 pb-32 overflow-hidden bg-white">
      {/* Dynamic Background Elements - Original Theme #1 */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10 translate-x-1/4 -translate-y-1/4 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 -translate-x-1/4 translate-y-1/4"></div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] -z-20"></div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm shadow-sm"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-normal">
                Next-Gen Recruitment Ecosystem
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.95] tracking-normal"
            >
              Khai quật <br />
              <span className="gradient-text">Nhân tài thực</span> <br />
              cùng HireBOT.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-txt-muted font-medium leading-relaxed max-w-xl"
            >
              Hãy để trí tuệ nhân tạo của HireBOT thay bạn tìm kiếm, sàng lọc và kết nối những cơ hội
              nghề nghiệp phù hợp nhất với năng lực thực tế.
            </motion.p>

            {/* Smart Search Bar - Theme #1 Style */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-premium border border-border flex flex-col md:flex-row items-center gap-2 max-w-3xl"
            >
              <div className="flex-1 flex items-center px-6 w-full border-b md:border-b-0 md:border-r border-border/50 py-3">
                <Search size={22} className="text-primary mr-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Kỹ năng, vị trí công việc..."
                  className="w-full bg-transparent border-none text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-0 font-bold text-lg"
                />
              </div>
              <div className="flex-1 flex items-center px-6 w-full py-3">
                <MapPin size={22} className="text-secondary mr-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Thành phố, địa điểm"
                  className="w-full bg-transparent border-none text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-0 font-bold text-lg"
                />
              </div>
              <Button
                variant="primary"
                className="w-full md:w-auto px-10 h-16 rounded-[2rem] font-bold text-sm uppercase tracking-normal shadow-glow active:scale-95"
              >
                Kích hoạt ngay
                <Zap size={18} className="ml-2 fill-current" />
              </Button>
            </motion.div>

            {/* Quick Stats - Floating Style */}
            <div className="pt-8 flex flex-wrap gap-10 items-center">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-foreground leading-none">50K+</span>
                <span className="text-sm font-bold text-txt-muted uppercase tracking-normal">
                  Việc làm Active
                </span>
              </div>
              <div className="w-px h-10 bg-border hidden md:block" />
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-primary leading-none">98%</span>
                <span className="text-sm font-bold text-txt-muted uppercase tracking-normal">
                  Độ chính xác
                </span>
              </div>
              <div className="w-px h-10 bg-border hidden md:block" />
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-secondary leading-none">1.2K+</span>
                <span className="text-sm font-bold text-txt-muted uppercase tracking-normal">
                  Top Doanh nghiệp
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Visual Element */}
          <div className="hidden lg:block relative h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="relative"
            >
              {/* Main Visual Frame */}
              <div className="relative w-[540px] h-[680px] bg-slate-100 rounded-[5rem] overflow-hidden border-[12px] border-white shadow-premium group">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000"
                  alt="High Quality Candidate"
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />

                {/* Advanced Overlay Components */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent h-1/2 p-12 flex flex-col justify-end">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                      <Star size={28} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-2xl tracking-normal leading-none mb-1">
                        Top 1% Talent
                      </p>
                      <p className="text-white/60 text-base font-bold font-sans uppercase tracking-normal">
                        Verified by HireBOT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backglow and Floating Items */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] -z-10" />

              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-20 -left-16 p-6 glass border border-white/20 rounded-[2.5rem] shadow-premium"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-txt-muted uppercase">Verification</p>
                    <p className="text-base font-bold text-foreground leading-none">
                      Node_ID: #49281
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-40 -right-12 p-6 glass border border-white/20 rounded-[2.5rem] shadow-premium max-w-[240px]"
              >
                <p className="text-base font-bold text-txt-muted uppercase mb-4 tracking-normal underline decoration-primary decoration-4 underline-offset-4">
                  Skill Matrix Output
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-foreground">
                  <span className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
                    PYTHON_CORE
                  </span>
                  <span className="px-2 py-1 bg-secondary/10 rounded-md border border-secondary/20">
                    TENSORFLOW
                  </span>
                  <span className="px-2 py-1 bg-accent/10 rounded-md border border-accent/20">
                    NLP_SYSTEM
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
