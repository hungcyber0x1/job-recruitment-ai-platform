import React from 'react';
import { Users, Building2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppIcon } from '@/components/common';

/** Teal mẫu ảnh 2 (#12a592) */
const STAT_TEAL = '#12a592';
const CIRCLE_BG = 'rgba(18, 165, 146, 0.12)';
const CIRCLE_BORDER = 'rgba(18, 165, 146, 0.22)';

const stats = [
  {
    icon: Users,
    display: '50.000+',
    label: 'ứng viên',
  },
  {
    icon: Building2,
    display: '1.000+',
    label: 'doanh nghiệp',
  },
  {
    icon: Share2,
    display: '95%',
    label: 'vị trí hoàn thành',
  },
];

const QuickStats = () => {
  return (
    <div className="relative z-30 px-4 pb-12 pt-8 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 divide-y divide-slate-200/90 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-slate-200/90">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-4 px-5 py-8 sm:justify-center sm:px-8 sm:py-7"
              >
                <div
                  className="flex size-[52px] shrink-0 items-center justify-center rounded-full border shadow-sm"
                  style={{
                    backgroundColor: CIRCLE_BG,
                    borderColor: CIRCLE_BORDER,
                  }}
                >
                  <AppIcon icon={Icon} size="md" className="text-neutral-500" />
                </div>
                <div className="min-w-0 text-left">
                  <p
                    className="text-3xl font-black tabular-nums tracking-tight leading-none md:text-[2.125rem]"
                    style={{ color: STAT_TEAL }}
                  >
                    {stat.display}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-neutral-500">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
