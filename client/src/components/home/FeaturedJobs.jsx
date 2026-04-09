import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, ArrowRight, Sparkles, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const companyColors = {
  'TechBase Vietnam': '#1a94ff',
  'VNG Corporation': '#0066cc',
  'FPT AI Center': '#e25b26',
  'Tiki Engineering': '#1a94ff',
};

const jobsRaw = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    company: 'TechBase Vietnam',
    location: 'Hồ Chí Minh',
    salary: '$2,000 - $3,500',
    matchScore: 96,
    tags: ['React', 'TypeScript', 'Next.js'],
    postedAt: '2 giờ trước',
    description: 'Xây dựng và phát triển giao diện người dùng cho các sản phẩm SaaS quy mô lớn.',
  },
  {
    id: 2,
    title: 'Product Manager (B2B SaaS)',
    company: 'VNG Corporation',
    location: 'Hà Nội',
    salary: 'Thoả thuận',
    matchScore: 91,
    tags: ['Agile', 'B2B'],
    postedAt: '5 giờ trước',
  },
  {
    id: 3,
    title: 'AI/ML Engineer',
    company: 'FPT AI Center',
    location: 'Đà Nẵng',
    salary: 'Lên đến $4,000',
    matchScore: 88,
    tags: ['Python', 'LLMs'],
    postedAt: '1 ngày trước',
  },
  {
    id: 4,
    title: 'DevOps Lead',
    company: 'Tiki Engineering',
    location: 'Hồ Chí Minh',
    salary: '40-65 triệu',
    matchScore: 84,
    tags: ['K8s', 'AWS'],
    postedAt: '3 giờ trước',
  },
];
const jobs = [...jobsRaw].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

const spring = { type: 'spring', stiffness: 100, damping: 20 };

const CompanyAvatar = ({ company, size = 12, className = '' }) => {
  const bg = companyColors[company] || '#10b981';
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=${bg.replace('#', '')}&color=fff&size=${size * 16}&bold=true`;
  return <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${className}`} />;
};

const JobCardList = ({ job, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, ...spring }}
    viewport={{ once: true }}
  >
    <Link
      to={`/jobs/${job.id}`}
      className="group flex gap-5 sm:gap-6 p-6 bg-background border border-border/60 hover:border-primary/25 hover:shadow-[0_12px_40px_-12px_rgba(16,185,129,0.12)] rounded-[1.75rem] transition-all duration-300"
    >
      <CompanyAvatar
        company={job.company}
        size={14}
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl group-hover:scale-105 transition-transform shrink-0"
      />

      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors truncate">
          {job.title}
        </h4>
        <p className="text-sm font-medium text-muted-foreground mb-3">{job.company}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-primary/60" aria-hidden="true" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-foreground-soft">
            <DollarSign size={14} className="text-primary" aria-hidden="true" />
            {job.salary}
          </span>
        </div>
        {job.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/40">
            {job.tags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground border border-border/40"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/12 text-primary border border-primary/25 rounded-lg font-semibold text-[11px]">
          <Sparkles size={10} />
          {job.matchScore}%
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{job.postedAt}</span>
        <div className="w-10 h-10 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all mt-1">
          <ArrowRight size={18} aria-hidden="true" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const FeaturedJobs = () => {
  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job, i) => (
        <JobCardList key={job.id} job={job} index={i} />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...spring }}
        viewport={{ once: true }}
      >
        <Link
          to="/jobs"
          className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-border/60 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/[0.02] active:scale-[0.98] transition-all"
        >
          <Briefcase size={15} />
          Xem thêm 8,340 việc làm
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  );
};

export default FeaturedJobs;
