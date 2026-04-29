import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, Brain, ListChecks, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizeAuthRole } from '../../utils/rolePaths';

const CANDIDATE_RESUME_UPLOAD_PATH = '/candidate/resume?upload=1';

const buildCandidateRegisterPath = (nextPath = CANDIDATE_RESUME_UPLOAD_PATH) =>
  `/register?role=candidate&next=${encodeURIComponent(nextPath)}`;

const steps = [
  {
    id: 'profile',
    number: '01',
    icon: Upload,
    title: 'Tạo hồ sơ & tải CV',
    description:
      'Hệ thống đọc và cấu trúc hóa kinh nghiệm, kỹ năng của bạn.',
    color: 'from-primary/18 to-primary/5',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    targets: {
      guest: { href: buildCandidateRegisterPath(), actionLabel: 'Tạo hồ sơ ứng viên' },
      candidate: { href: CANDIDATE_RESUME_UPLOAD_PATH, actionLabel: 'Mở hồ sơ & tải CV' },
      recruiter: { href: '/employer/dashboard', actionLabel: 'Về dashboard tuyển dụng' },
      admin: { href: '/admin/dashboard', actionLabel: 'Về bảng điều khiển' },
    },
  },
  {
    id: 'analysis',
    number: '02',
    icon: Brain,
    title: 'Phân tích kỹ năng',
    description:
      'Hệ thống đối chiếu hồ sơ với yêu cầu thực tế từ nhà tuyển dụng để tính điểm phù hợp.',
    color: 'from-emerald-500/15 to-primary/8',
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    targets: {
      guest: { href: '/ai-cv-scanner', actionLabel: 'Chấm điểm CV' },
      candidate: { href: '/ai-cv-scanner', actionLabel: 'Phân tích CV' },
      admin: { href: '/admin/ai-tools', actionLabel: 'Quản trị công cụ' },
    },
  },
  {
    id: 'matches',
    number: '03',
    icon: ListChecks,
    title: 'Khám phá việc làm phù hợp',
    description:
      'Danh sách việc làm đang tuyển được cập nhật liên tục để bạn nhanh chóng lọc ra cơ hội phù hợp.',
    color: 'from-primary/12 to-emerald-500/6',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    targets: {
      guest: { href: '/jobs', actionLabel: 'Xem việc đang tuyển' },
      candidate: { href: '/candidate/jobs', actionLabel: 'Mở danh sách việc làm' },
      recruiter: { href: '/employer/search-candidates', actionLabel: 'Tìm ứng viên phù hợp' },
      admin: { href: '/admin/jobs', actionLabel: 'Quản lý tin tuyển dụng' },
    },
  },
  {
    id: 'applications',
    number: '04',
    icon: MessagesSquare,
    title: 'Ứng tuyển & phỏng vấn',
    description: 'Ứng tuyển một chạm, theo dõi trạng thái và chuẩn bị phỏng vấn với gợi ý từ hệ thống.',
    color: 'from-emerald-600/12 to-primary/6',
    iconColor: 'text-emerald-800',
    iconBg: 'bg-primary/10 border-primary/25',
    targets: {
      guest: { href: '/jobs', actionLabel: 'Tìm việc để ứng tuyển' },
      candidate: { href: '/candidate/applications', actionLabel: 'Theo dõi ứng tuyển' },
      recruiter: { href: '/employer/applications', actionLabel: 'Quản lý ứng tuyển' },
      admin: { href: '/admin/applications', actionLabel: 'Kiểm tra ứng tuyển' },
    },
  },
];

const HowItWorks = () => {
  const { isAuthenticated, user } = useAuth();
  const userRole = normalizeAuthRole(user?.role);
  const targetKey = isAuthenticated ? userRole : 'guest';

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
              <p className="text-base font-bold text-primary uppercase tracking-normal">
                Quy trình
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-normal leading-[1.08]">
              Quy trình tìm việc với <span className="text-primary">HireBOT</span>
            </h2>
            <p className="text-muted-foreground font-medium text-base leading-relaxed">
              Bốn bước rõ ràng — từ hồ sơ đến phỏng vấn, có hệ thống đồng hành ở mỗi giai đoạn.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const target = step.targets[targetKey] || step.targets.guest;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 90, damping: 20 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { type: 'spring', stiffness: 250, damping: 18 } }}
                className="h-full"
              >
                <Link
                  to={target.href}
                  aria-label={`${step.title}: ${target.actionLabel}`}
                  className="landing-card landing-focus group relative flex h-full min-h-[344px] flex-col overflow-hidden rounded-xl bg-background p-8"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`}
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[3rem] font-bold text-foreground/[0.05] group-hover:text-foreground/[0.08] leading-none transition-colors duration-300 tabular-nums select-none">
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
                            aria-hidden="true"
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
                      className={`size-12 rounded-xl border flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-105 ${step.iconBg}`}
                    >
                      <StepIcon
                        size={22}
                        strokeWidth={1.5}
                        className={step.iconColor}
                        aria-hidden="true"
                      />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3 transition-colors group-hover:text-primary">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                      {step.description}
                    </p>

                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-primary">
                      {target.actionLabel}
                      <ArrowRight
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
