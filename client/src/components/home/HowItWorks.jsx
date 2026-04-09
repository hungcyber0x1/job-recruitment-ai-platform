import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Brain, ListChecks, MessagesSquare } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Tạo hồ sơ & tải CV',
    description:
      'Hoàn thiện hồ sơ và tải CV — AI đọc và cấu trúc hóa kinh nghiệm, kỹ năng của bạn.',
    color: 'from-primary/18 to-primary/5',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI phân tích kỹ năng',
    description:
      'Mô hình AI đối chiếu hồ sơ với yêu cầu thực tế từ nhà tuyển dụng để tính điểm phù hợp.',
    color: 'from-emerald-500/15 to-primary/8',
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    number: '03',
    icon: ListChecks,
    title: 'Nhận gợi ý việc làm',
    description:
      'Danh sách việc làm được xếp hạng theo mức độ khớp — cập nhật liên tục theo thị trường.',
    color: 'from-primary/12 to-emerald-500/6',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
  },
  {
    number: '04',
    icon: MessagesSquare,
    title: 'Ứng tuyển & phỏng vấn',
    description: 'Ứng tuyển một chạm, theo dõi trạng thái và chuẩn bị phỏng vấn với gợi ý từ AI.',
    color: 'from-emerald-600/12 to-primary/6',
    iconColor: 'text-emerald-800',
    iconBg: 'bg-primary/10 border-primary/25',
  },
];

const HowItWorks = () => {
  return (
    <section className="landing-section-alt py-20 md:py-28 overflow-hidden relative border-t border-border/40">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="section-accent-line" />
              <p className="text-sm font-bold text-primary uppercase tracking-widest">Quy trình</p>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.08]">
              Quy trình tìm việc với <span className="text-primary">HireAI</span>
            </h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed">
              Bốn bước rõ ràng — từ hồ sơ đến phỏng vấn, có AI đồng hành ở mỗi giai đoạn.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 90, damping: 20 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 250, damping: 18 } }}
                className="landing-card bg-background p-8 rounded-2xl group relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[3rem] font-black text-foreground/[0.05] group-hover:text-foreground/[0.08] leading-none transition-colors duration-300 tabular-nums select-none">
                      {step.number}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="absolute top-8 -right-3 z-20 hidden lg:flex items-center">
                        <div className="h-px w-6 bg-gradient-to-r from-border/60 to-transparent" />
                        <svg
                          width="6"
                          height="10"
                          viewBox="0 0 6 10"
                          fill="none"
                          className="text-border/60"
                        >
                          <path
                            d="M1 1L5 5L1 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div
                    className={`size-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300 ${step.iconBg}`}
                  >
                    <StepIcon
                      size={22}
                      strokeWidth={1.5}
                      className={step.iconColor}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-base text-muted-foreground font-medium leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
