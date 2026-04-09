import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import AICVScanner from './AICVScanner';
import CareerGuidance from './CareerGuidance';

const AIPowerSuite = () => {
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden relative border-t border-border/30">
      {/* Subtle bg accent */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[50%] h-[60%] bg-primary/[0.025] rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section header: 2-col on desktop */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="section-accent-line" />
              <div className="inline-flex items-center gap-2">
                <Sparkles size={13} className="text-primary" aria-hidden="true" />
                <span className="text-sm font-bold text-primary uppercase tracking-widest">
                  Công cụ AI
                </span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-[-0.04em] leading-[0.92]">
              Phát triển sự nghiệp cùng <span className="text-primary">trợ lý AI</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground font-medium md:max-w-sm text-base leading-relaxed md:text-right"
          >
            Bộ công cụ AI phân tích CV, gợi ý việc làm phù hợp và định hướng lộ trình phát triển
            nghề nghiệp cho bạn.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <AICVScanner />
          <CareerGuidance />
        </div>
      </div>
    </section>
  );
};

export default AIPowerSuite;
