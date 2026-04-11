import React from 'react';
import { motion } from 'framer-motion';

/**
 * Cầu nối trực quan giữa Hero stats và TrustedBy – tạo sự liên kết chuyên nghiệp
 */
const HeroSectionBridge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-center py-6 lg:py-8"
    >
      {/* Gradient line */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px max-w-2xl mx-auto"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, hsl(var(--border)) 15%, hsl(var(--primary) / 0.35) 50%, hsl(var(--border)) 85%, transparent 100%)',
        }}
      />
      {/* Center accent */}
      <div className="relative z-10 flex items-center gap-3 px-4 bg-background">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
        <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
          Đối tác tin dùng
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
      </div>
    </motion.div>
  );
};

export default HeroSectionBridge;
