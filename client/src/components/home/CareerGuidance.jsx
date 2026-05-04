import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Target, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Mục tiêu tiếp theo',
    desc: 'Gợi ý các bước ưu tiên dựa trên kinh nghiệm hiện tại và vị trí bạn đang nhắm tới.',
    icon: Compass,
  },
  {
    title: 'Phân tích kỹ năng',
    desc: 'Chỉ ra nhóm kỹ năng nên đầu tư trước để hồ sơ phù hợp hơn với nhu cầu tuyển dụng.',
    icon: Target,
  },
  {
    title: 'Gợi ý học tập',
    desc: 'Đề xuất khóa học và tài liệu phù hợp với mục tiêu nghề nghiệp hiện tại.',
    icon: Lightbulb,
  },
];

const CareerGuidance = () => {
  return (
    <div className="bg-background p-8 lg:p-10 flex flex-col min-h-[480px] rounded-xl border border-border/40 card-premium-hover">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/8 text-primary border border-primary/12 flex items-center justify-center group-hover/guidance:bg-primary group-hover/guidance:text-white transition-all duration-300">
          <Compass size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground leading-tight group-hover/guidance:text-primary transition-colors">
            Định hướng nghề nghiệp
          </h3>
          <p className="text-base text-muted-foreground font-medium mt-0.5">Trao đổi cùng AI</p>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex gap-4 group/item cursor-pointer p-3 -mx-3 rounded-xl hover:bg-primary/4 transition-colors"
          >
            <div className="h-10 w-10 shrink-0 border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground group-hover/item:border-primary/30 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-300">
              <f.icon size={18} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm group-hover/item:text-primary transition-colors">
                {f.title}
              </h4>
              <p className="text-base text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        to="/chat"
        className="mt-6 w-full py-3.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        Trò chuyện với AI
        <ArrowRight
          size={16}
          className="group-hover/btn:translate-x-1 transition-transform"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
};

export default CareerGuidance;
