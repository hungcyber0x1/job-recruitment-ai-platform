import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Sparkles, ArrowRight, TrendingUp, Bookmark } from 'lucide-react';

const jobs = [
  {
    title: 'Senior Frontend Developer',
    company: 'FPT Software',
    initial: 'F',
    location: 'TP. Hồ Chí Minh',
    salary: '35 - 55 triệu',
    matchScore: 96,
    posted: '2 giờ trước',
    skills: ['React', 'TypeScript', 'Next.js'],
    salaryPrediction: '~45 triệu (trung vị)',
    type: 'Toàn thời gian',
  },
  {
    title: 'Fullstack Engineer',
    company: 'VNG Corporation',
    initial: 'V',
    location: 'TP. Hồ Chí Minh',
    salary: '40 - 65 triệu',
    matchScore: 89,
    posted: '5 giờ trước',
    skills: ['Node.js', 'React', 'PostgreSQL'],
    salaryPrediction: '~52 triệu (trung vị)',
    type: 'Toàn thời gian',
  },
  {
    title: 'Product Designer (AI)',
    company: 'Tiki',
    initial: 'T',
    location: 'Hà Nội',
    salary: '30 - 50 triệu',
    matchScore: 74,
    posted: '1 ngày trước',
    skills: ['Figma', 'Design System', 'AI/UX'],
    salaryPrediction: '~38 triệu (trung vị)',
    type: 'Hybrid',
  },
];

const getMatchColor = (score) => {
  if (score >= 90) return 'text-primary bg-primary/8 border-primary/12';
  if (score >= 75) return 'text-amber-600 bg-amber-50 border-amber-200/50';
  return 'text-muted-foreground bg-muted/50 border-border/40';
};

const JobMatchingPreview = () => {
  return (
    <section className="py-16 relative bg-muted/30">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="space-y-4">
            <span className="landing-badge">
              <Sparkles size={14} aria-hidden />
              Dành riêng cho bạn
            </span>
            <h2 className="landing-heading">
              Việc làm AI <span className="landing-heading-muted">gợi ý cho bạn</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed font-medium">
              Mỗi vị trí được AI chấm điểm phù hợp, phân tích kỹ năng match và dự đoán mức lương
              thực tế
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 transition-colors group whitespace-nowrap landing-focus rounded-lg py-1"
          >
            Xem tất cả việc làm
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job, index) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group landing-card p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center text-primary font-bold text-lg">
                    {job.initial}
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-base">{job.title}</p>
                    <p className="text-muted-foreground text-base font-medium">{job.company}</p>
                  </div>
                </div>
                <button className="p-2 text-muted-foreground/40 hover:text-primary transition-colors rounded-lg hover:bg-primary/5">
                  <Bookmark size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-muted/50 border border-border/40 rounded-lg text-sm font-medium text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>{job.location}</span>
                  <span className="text-border">·</span>
                  <span>{job.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-foreground font-bold">{job.salary}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                  <Clock size={14} />
                  <span>{job.posted}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold ${getMatchColor(job.matchScore)}`}
                >
                  <Sparkles size={12} />
                  {job.matchScore}% phù hợp
                </div>
                <p className="text-muted-foreground/50 text-base font-medium">
                  AI dự đoán: <span className="text-muted-foreground">{job.salaryPrediction}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JobMatchingPreview;
