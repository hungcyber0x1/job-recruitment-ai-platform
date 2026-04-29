import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Megaphone } from 'lucide-react';

const typingWords = [
  'công việc mơ ước',
  'lộ trình sự nghiệp',
  'mức lương xứng đáng',
  'kỹ năng cần thiết',
];

const useTypingEffect = (words, typingSpeed = 80, deletingSpeed = 40, pauseDuration = 2000) => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];
    if (!isDeleting) {
      setDisplayText(currentWord.substring(0, displayText.length + 1));
      if (displayText === currentWord) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
        return;
      }
    } else {
      setDisplayText(currentWord.substring(0, displayText.length - 1));
      if (displayText === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
        return;
      }
    }
  }, [displayText, isDeleting, wordIndex, words, pauseDuration]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting, deletingSpeed, typingSpeed]);

  return displayText;
};

/* Sound wave bars for AI megaphone - animated */
const SoundWaves = () => (
  <div className="flex items-end gap-0.5 h-6" aria-hidden>
    {[0.5, 0.8, 1, 0.6, 0.9, 0.4, 0.7].map((scale, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full bg-primary/50 origin-bottom"
        animate={{ scaleY: [scale, 1 - scale * 0.5, scale] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
        style={{ height: '100%' }}
      />
    ))}
  </div>
);

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const HeroSection = () => {
  const typedText = useTypingEffect(typingWords);

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(16,185,129,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10 pt-32 pb-20 lg:pt-0 lg:pb-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6 text-center flex flex-col items-center"
          >
            <motion.div variants={fadeUp}>
              <span className="landing-badge">
                <Sparkles size={14} aria-hidden />
                Nền tảng tuyển dụng AI #1 Việt Nam
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold text-foreground tracking-normal leading-[1.05] text-center"
            >
              AI giúp bạn tìm đúng{' '}
              <span className="relative">
                <span className="text-primary">{typedText}</span>
                <span className="animate-pulse text-primary" aria-hidden>
                  |
                </span>
              </span>
              <br />
              <span className="text-muted-foreground/60">nhanh hơn 10 lần</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg landing-prose max-w-xl text-center">
              Phân tích CV thông minh, hiểu sâu kỹ năng của bạn và gợi ý lộ trình nghề nghiệp được
              cá nhân hóa hoàn toàn.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Link to="/chat" className="group landing-btn-primary px-8 py-4 text-base">
                <Sparkles size={18} aria-hidden />
                Bắt đầu ngay
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                  aria-hidden
                />
              </Link>
              <Link to="/jobs" className="landing-btn-secondary px-8 py-4 text-base">
                <Play size={16} aria-hidden />
                Xem việc làm
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-8 pt-4 flex-wrap justify-center">
              <div className="flex -space-x-3">
                {['PM', 'TH', 'LN', 'VD'].map((initials, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-sm font-bold text-primary"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-foreground font-extrabold text-base tabular-nums">
                  47,200+ ứng viên
                </p>
                <p className="text-muted-foreground text-base font-medium">đã tin tưởng sử dụng</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-foreground font-extrabold text-base tabular-nums">94.7%</p>
                <p className="text-muted-foreground text-base font-medium">matching chính xác</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: AI Announcement Megaphone */}
          <div className="hidden lg:flex relative justify-center items-center">
            <div className="relative w-full max-w-md">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/[0.06] rounded-full blur-[100px]" />

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative landing-card p-8 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.08)] overflow-hidden"
              >
                {/* AI glow accent */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />

                <div className="relative flex flex-col items-center text-center">
                  {/* Megaphone icon with sound waves */}
                  <div className="relative mb-6">
                    <motion.div
                      className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(16,185,129,0.1)',
                          '0 0 24px 4px rgba(16,185,129,0.15)',
                          '0 0 0 0 rgba(16,185,129,0.1)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Megaphone size={36} className="text-primary" strokeWidth={2} aria-hidden />
                    </motion.div>
                    <div className="absolute -right-2 -bottom-1">
                      <SoundWaves />
                    </div>
                  </div>

                  <span className="landing-badge mb-4">
                    <Sparkles size={12} aria-hidden />
                    Tạo bởi AI
                  </span>

                  <h3 className="text-foreground font-bold text-lg mb-2">Loa thông báo AI</h3>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-[280px] mb-6">
                    Thông báo việc làm mới, gợi ý phù hợp và cập nhật sự nghiệp được AI tổng hợp và
                    phát trực tiếp đến bạn
                  </p>

                  <div className="w-full bg-muted/50 rounded-xl px-4 py-3 text-left">
                    <p className="text-foreground/80 text-base leading-relaxed">
                      <span className="text-primary font-bold">12 vị trí mới</span> phù hợp với hồ
                      sơ của bạn vừa được đăng. Xem ngay!
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
