import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, UserCheck, ShieldCheck, BarChart3 } from 'lucide-react';

const values = [
  {
    icon: Brain,
    title: 'Phân tích chuyên sâu',
    description:
      'Hiểu kỹ năng, kinh nghiệm và tiềm năng của bạn thông qua phân tích dữ liệu hiệu quả',
    stat: '94.7%',
    statLabel: 'độ chính xác',
  },
  {
    icon: UserCheck,
    title: 'Cá nhân hóa hoàn toàn',
    description: 'Mỗi gợi ý được điều chỉnh riêng dựa trên hồ sơ, mục tiêu và hành vi của bạn',
    stat: '12x',
    statLabel: 'hiệu quả hơn',
  },
  {
    icon: Zap,
    title: 'Kết nối tức thì',
    description: 'Từ phân tích CV đến gợi ý việc làm chỉ trong vài giây nhờ AI thời gian thực',
    stat: '3.2s',
    statLabel: 'thời gian phản hồi',
  },
  {
    icon: BarChart3,
    title: 'Định hướng rõ ràng',
    description:
      'AI gợi ý các bước ưu tiên dựa trên xu hướng thị trường và mục tiêu cá nhân của bạn',
    stat: '24/7',
    statLabel: 'tư vấn liên tục',
  },
  {
    icon: ShieldCheck,
    title: 'Dữ liệu an toàn',
    description: 'Mã hóa AES-256, tuân thủ GDPR. Dữ liệu của bạn luôn được bảo vệ tuyệt đối',
    stat: 'AES-256',
    statLabel: 'mã hóa dữ liệu',
  },
];

const ValueProposition = () => {
  return (
    <section className="py-16 relative bg-muted/30">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 space-y-5"
        >
          <span className="landing-badge">Tại sao chọn HireBOT</span>
          <h2 className="landing-heading">
            Hệ thống là trung tâm <span className="landing-heading-muted">mọi trải nghiệm</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium max-w-[65ch]">
            Không chỉ là công cụ tìm việc — HireBOT là người đồng hành thông minh trong hành trình
            sự nghiệp của bạn
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative landing-card p-7 ${index === 2 ? 'lg:col-span-2' : ''}`}
            >
              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <item.icon
                      size={22}
                      className="text-primary group-hover:text-white transition-colors"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-extrabold text-lg tabular-nums tracking-normal">
                      {item.stat}
                    </p>
                    <p className="text-muted-foreground text-base font-medium uppercase tracking-normal">
                      {item.statLabel}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-foreground font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
