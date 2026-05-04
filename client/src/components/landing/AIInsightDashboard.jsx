import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const focusAreas = [
  { skill: 'React / Next.js', current: 92, target: 95, status: 'strong' },
  { skill: 'TypeScript', current: 85, target: 90, status: 'good' },
  { skill: 'Node.js / Express', current: 55, target: 80, status: 'focus' },
  { skill: 'Thiết kế hệ thống', current: 35, target: 75, status: 'focus' },
  { skill: 'CI/CD & Vận hành DevOps', current: 40, target: 70, status: 'focus' },
];

const prioritySteps = [
  {
    period: 'Tuần này',
    milestone: 'Hoàn thiện 1 API Node.js có xác thực và ghi log',
    status: 'current',
  },
  {
    period: '2 tuần tới',
    milestone: 'Bổ sung 1 tình huống thiết kế hệ thống vào hồ sơ dự án',
    status: 'upcoming',
  },
  {
    period: 'Tháng này',
    milestone: 'Rà soát CV để nhấn mạnh tác động và vai trò làm chủ kết quả',
    status: 'upcoming',
  },
  {
    period: 'Liên tục',
    milestone: 'Luyện phỏng vấn hành vi theo STAR sau mỗi vòng ứng tuyển',
    status: 'completed',
  },
];

const getBarColor = (status) => {
  switch (status) {
    case 'strong':
      return 'bg-primary';
    case 'good':
      return 'bg-primary/80';
    case 'focus':
      return 'bg-amber-500';
    default:
      return 'bg-muted-foreground/30';
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-primary';
    case 'current':
      return 'bg-amber-400 animate-pulse';
    case 'upcoming':
      return 'bg-border';
    default:
      return 'bg-border';
  }
};

const AIInsightDashboard = () => {
  return (
    <section className="py-16 relative bg-muted/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 space-y-4"
        >
          <span className="landing-badge">
            <Brain size={14} aria-hidden />
            Bảng phân tích nghề nghiệp
          </span>
          <h2 className="landing-heading">
            Hiểu rõ bản thân <span className="landing-heading-muted">phát triển nhanh hơn</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Tổng quan cá nhân với ưu tiên kỹ năng, bước tiếp theo và gợi ý học tập được cập nhật
            liên tục
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Skills Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="landing-card p-7 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.06)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center">
                  <Target size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">Ưu tiên kỹ năng</h3>
                  <p className="text-muted-foreground text-base font-medium">
                    Theo mục tiêu: lập trình viên full-stack cấp cao
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-primary/8 border border-primary/12 text-primary rounded-lg text-sm font-bold">
                Cập nhật hôm nay
              </span>
            </div>

            <div className="space-y-5">
              {focusAreas.map((item, index) => (
                <div key={item.skill}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground/80 text-sm font-medium">{item.skill}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold tabular-nums ${item.status === 'focus' ? 'text-amber-500' : 'text-primary'}`}
                      >
                        {item.current}%
                      </span>
                      <span className="text-border text-sm">/</span>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {item.target}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(item.status)}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.current}%` }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.2 + index * 0.1,
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-foreground/15"
                      style={{ left: `${item.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200/50 rounded-xl">
              <p className="text-amber-600 text-base font-bold mb-1 flex items-center gap-1.5">
                <Sparkles size={12} />
                Gợi ý
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                Tập trung vào <span className="text-foreground font-bold">Node.js</span> và
                <span className="text-foreground font-bold"> thiết kế hệ thống</span> để nâng tổng
                điểm lên <span className="text-primary font-bold">85%+</span>
              </p>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="landing-card p-7 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.06)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center">
                  <TrendingUp size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold">Bước tiếp theo</h3>
                  <p className="text-muted-foreground text-base font-medium">
                    Các hạng mục nên ưu tiên ngay
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-muted/50 border border-border/40 text-muted-foreground rounded-lg text-sm font-bold">
                4 việc chính
              </span>
            </div>

            <div className="space-y-1">
              {prioritySteps.map((step, index) => (
                <motion.div
                  key={step.period}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusDot(step.status)} flex-shrink-0`}
                    />
                    {index < prioritySteps.length - 1 && <div className="w-px h-8 bg-border/60" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-muted-foreground text-base font-bold uppercase tracking-normal">
                      {step.period}
                    </p>
                    <p
                      className={`text-base font-medium mt-0.5 ${step.status === 'current' ? 'text-foreground' : step.status === 'completed' ? 'text-muted-foreground line-through' : 'text-muted-foreground/60'}`}
                    >
                      {step.milestone}
                    </p>
                  </div>
                  {step.status === 'current' && (
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200/50 text-amber-600 rounded-md text-sm font-bold whitespace-nowrap">
                      Đang thực hiện
                    </span>
                  )}
                  {step.status === 'completed' && (
                    <span className="px-2 py-0.5 bg-primary/8 border border-primary/12 text-primary rounded-md text-sm font-bold">
                      Hoàn thành
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-muted-foreground text-base font-bold uppercase tracking-normal flex items-center gap-2">
                <BookOpen size={12} />
                Tài nguyên gợi ý
              </p>
              {[
                { title: 'Node.js - Hướng dẫn toàn diện', provider: 'Udemy', duration: '40 giờ' },
                {
                  title: 'Phỏng vấn thiết kế hệ thống',
                  provider: 'ByteByteGo',
                  duration: '24 giờ',
                },
              ].map((course) => (
                <div
                  key={course.title}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border/30 rounded-xl hover:border-primary/15 transition-all cursor-pointer group"
                >
                  <div>
                    <p className="text-foreground text-base font-bold group-hover:text-primary transition-colors">
                      {course.title}
                    </p>
                    <p className="text-muted-foreground text-base font-medium">
                      {course.provider} · {course.duration}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground/40 group-hover:text-primary transition-colors"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <Link to="/register" className="landing-btn-primary px-8 py-4">
            <Sparkles size={18} />
            Xem bảng điều khiển của bạn
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AIInsightDashboard;
