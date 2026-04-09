import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Brain, BarChart3, Rocket, ChevronRight } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Upload,
    title: 'Thu thập dữ liệu',
    description:
      'Tải CV hoặc nhập thông tin kỹ năng, kinh nghiệm. AI bắt đầu phân tích ngay lập tức.',
    detail: 'NLP Parser → Extract Skills',
  },
  {
    num: '02',
    icon: Brain,
    title: 'AI phân tích thông minh',
    description:
      'Matching algorithm so sánh profile của bạn với hàng nghìn vị trí và xu hướng thị trường.',
    detail: 'ML Model → Scoring Engine',
  },
  {
    num: '03',
    icon: BarChart3,
    title: 'Đánh giá & xếp hạng',
    description:
      'Mỗi công việc được chấm điểm phù hợp kèm giải thích chi tiết tại sao phù hợp với bạn.',
    detail: 'Explainable AI → Reasoning',
  },
  {
    num: '04',
    icon: Rocket,
    title: 'Gợi ý cá nhân hóa',
    description:
      'Nhận lộ trình nghề nghiệp, việc làm phù hợp và kế hoạch phát triển kỹ năng riêng.',
    detail: 'Personalization → Action Plan',
  },
];

const matchDemo = {
  skills: [
    { name: 'React / Next.js', match: 95 },
    { name: 'TypeScript', match: 88 },
    { name: 'Node.js', match: 72 },
    { name: 'System Design', match: 45 },
  ],
  overallScore: 82,
};

const HowAIWorks = () => {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[600px] h-[400px] bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 space-y-5"
        >
          <span className="landing-badge">
            <Brain size={14} aria-hidden />
            Explainable AI
          </span>
          <h2 className="landing-heading">
            AI hoạt động <span className="landing-heading-muted">như thế nào?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Minh bạch và giải thích được — bạn luôn hiểu vì sao AI đưa ra gợi ý đó
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group relative landing-card flex gap-5 p-6"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:scale-105 transition-all duration-300">
                  <step.icon
                    size={24}
                    className="text-primary group-hover:text-white transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-primary/30 text-xs font-bold tracking-widest">
                      {step.num}
                    </span>
                    <h3 className="text-foreground font-bold text-lg">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/50 border border-border/40 rounded-lg text-[11px] font-mono text-primary/60">
                    {step.detail}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight
                    size={16}
                    className="text-border absolute -bottom-3 left-12 rotate-90"
                  />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <div className="landing-card p-7 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.06)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    Skill Matching
                  </p>
                  <p className="text-foreground font-bold text-lg mt-1">
                    Senior Frontend Developer
                  </p>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="4"
                      strokeOpacity="0.4"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      strokeDasharray={`${matchDemo.overallScore * 1.76} 176`}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 176' }}
                      whileInView={{ strokeDasharray: `${matchDemo.overallScore * 1.76} 176` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-foreground font-extrabold text-sm tabular-nums">
                      {matchDemo.overallScore}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {matchDemo.skills.map((skill, index) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground text-sm font-medium">
                        {skill.name}
                      </span>
                      <span
                        className={`text-sm font-bold tabular-nums ${skill.match >= 80 ? 'text-primary' : skill.match >= 60 ? 'text-amber-500' : 'text-muted-foreground'}`}
                      >
                        {skill.match}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${skill.match >= 80 ? 'bg-primary' : skill.match >= 60 ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.match}%` }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.6 + index * 0.15,
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <p className="text-primary text-xs font-bold mb-1 flex items-center gap-1.5">
                  <Brain size={12} />
                  AI Insight
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bạn phù hợp <span className="text-primary font-bold">82%</span> với vị trí này. Bổ
                  sung <span className="text-foreground font-bold">System Design</span> sẽ nâng lên{' '}
                  <span className="text-primary font-bold">93%</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowAIWorks;
