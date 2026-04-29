import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, ShieldCheck, Zap, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const personas = [
  {
    id: 'candidate',
    label: 'Ứng viên',
    icon: Users,
    title: 'Tăng tốc tìm việc gấp 3 lần',
    desc: 'Công cụ tự gợi ý việc làm phù hợp, hỗ trợ viết cover letter và luyện phỏng vấn.',
    features: [
      'Gợi ý việc làm thông minh',
      'Luyện phỏng vấn',
      'Phân tích mức độ phù hợp',
      'Tối ưu hồ sơ tự động',
    ],
    stat: { value: '3x', label: 'Nhanh hơn so với tìm việc truyền thống' },
    accent: 'border-l-teal-500',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    statColor: 'text-teal-600',
  },
  {
    id: 'employer',
    label: 'Nhà tuyển dụng',
    icon: Briefcase,
    title: 'Tuyển đúng người, đúng lúc',
    desc: 'Giảm 70% thời gian sàng lọc. Hệ thống tự xếp hạng ứng viên theo mức độ phù hợp thực tế.',
    features: [
      'Sàng lọc CV tự động',
      'Quản lý pipeline tuyển dụng',
      'Phân tích thị trường nhân sự',
      'Báo cáo hiệu quả tuyển dụng',
    ],
    stat: { value: '70%', label: 'Tiết kiệm thời gian sàng lọc' },
    accent: 'border-l-primary',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    statColor: 'text-primary',
  },
  {
    id: 'admin',
    label: 'Quản trị viên',
    icon: ShieldCheck,
    title: 'Vận hành nền tảng hiệu quả',
    desc: 'Theo dõi xu hướng thị trường, quản lý dữ liệu và giám sát hệ thống qua bảng điều khiển thời gian thực.',
    features: [
      'Phân tích xu hướng thị trường',
      'Quản lý người dùng tập trung',
      'Kiểm duyệt nội dung tự động',
      'Bảng điều khiển giám sát thời gian thực',
    ],
    stat: { value: '24/7', label: 'Giám sát và hỗ trợ tự động' },
    accent: 'border-l-emerald-700',
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-700/10 border-emerald-700/20',
    statColor: 'text-emerald-700',
  },
];

const CapabilityShowcase = () => {
  return (
    <section className="py-20 md:py-28 bg-background border-t border-border/30 overflow-hidden relative">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left sticky header */}
          <div className="lg:w-1/3 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="section-accent-line" />
                <p className="text-base font-bold text-primary uppercase tracking-normal">
                  Cho mọi người
                </p>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-normal leading-[0.93]">
                Một nền tảng, <span className="text-primary">nhiều giá trị</span>
              </h2>
              <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-sm">
                Thiết kế cho ứng viên, nhà tuyển dụng và quản trị viên — trải nghiệm tối ưu cho từng
                vai trò.
              </p>
            </motion.div>
          </div>

          {/* Right: tabs */}
          <div className="lg:w-2/3 w-full">
            <Tabs defaultValue="candidate" className="w-full">
              <TabsList className="bg-muted/50 p-1 h-auto rounded-xl mb-8 border border-border/40 flex gap-1 overflow-hidden">
                {personas.map((persona) => {
                  const PersonaIcon = persona.icon;
                  return (
                    <TabsTrigger
                      key={persona.id}
                      value={persona.id}
                      className="flex-1 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] px-4 py-3 rounded-lg font-semibold text-sm text-muted-foreground hover:text-foreground transition-all gap-2"
                    >
                      <PersonaIcon size={15} aria-hidden="true" />
                      {persona.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {personas.map((persona) => {
                const PersonaIcon = persona.icon;
                return (
                  <TabsContent
                    key={persona.id}
                    value={persona.id}
                    className="mt-0 focus-visible:outline-none"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className={`bg-muted/25 p-8 md:p-12 rounded-xl border border-border/40 border-l-4 ${persona.accent}`}
                    >
                      <div className="flex flex-col md:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                          <div
                            className={`size-14 rounded-xl border flex items-center justify-center ${persona.iconBg}`}
                          >
                            <PersonaIcon
                              size={26}
                              strokeWidth={1.8}
                              className={persona.iconColor}
                              aria-hidden="true"
                            />
                          </div>

                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-normal leading-snug mb-3">
                              {persona.title}
                            </h3>
                            <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-lg">
                              {persona.desc}
                            </p>
                          </div>

                          {/* Checkmark feature list */}
                          <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-border/30">
                            {persona.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-2.5">
                                <div
                                  className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${persona.iconBg}`}
                                >
                                  <Check
                                    size={11}
                                    strokeWidth={2.5}
                                    className={persona.iconColor}
                                    aria-hidden="true"
                                  />
                                </div>
                                <span className="text-sm font-medium text-foreground-soft">
                                  {f}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Stat card */}
                        <div className="md:w-44 shrink-0 bg-background rounded-xl p-6 border border-border/40 flex flex-col justify-center items-center text-center">
                          <div
                            className={`size-14 rounded-full border flex items-center justify-center mb-4 ${persona.iconBg}`}
                          >
                            <Zap size={22} className={persona.iconColor} aria-hidden="true" />
                          </div>
                          <p
                            className={`text-4xl font-bold tracking-normal tabular-nums leading-none mb-2 ${persona.statColor}`}
                          >
                            {persona.stat.value}
                          </p>
                          <p className="text-base text-muted-foreground font-medium leading-snug">
                            {persona.stat.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CapabilityShowcase;
