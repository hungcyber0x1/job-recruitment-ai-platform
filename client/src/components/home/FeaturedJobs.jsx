import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  ArrowRight,
  Sparkles,
  Briefcase,
  Clock,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const companyColors = {
  'TechBase Vietnam': '#10b981',
  'VNG Corporation': '#059669',
  'FPT AI Center': '#e25b26',
  'Tiki Engineering': '#0d9488',
  MoMo: '#ae2070',
  Zalo: '#0068ff',
  'Shopee Vietnam': '#ee4d2d',
  'Grab Vietnam': '#00b14f',
};

const jobsRaw = [
  {
    id: 1,
    title: 'Senior Frontend Engineer',
    company: 'TechBase Vietnam',
    location: 'Hồ Chí Minh',
    salary: '$2,000 – $3,500',
    matchScore: 96,
    tags: ['React', 'TypeScript', 'Next.js'],
    postedAt: '2 giờ trước',
    type: 'Full-time',
  },
  {
    id: 2,
    title: 'Product Manager (B2B SaaS)',
    company: 'VNG Corporation',
    location: 'Hà Nội',
    salary: 'Thoả thuận',
    matchScore: 91,
    tags: ['Agile', 'B2B', 'Roadmap'],
    postedAt: '5 giờ trước',
    type: 'Full-time',
  },
  {
    id: 3,
    title: 'AI/ML Engineer',
    company: 'FPT AI Center',
    location: 'Đà Nẵng',
    salary: 'Lên đến $4,000',
    matchScore: 88,
    tags: ['Python', 'LLMs', 'PyTorch'],
    postedAt: '1 ngày trước',
    type: 'Full-time',
  },
  {
    id: 4,
    title: 'DevOps Lead',
    company: 'Tiki Engineering',
    location: 'Hồ Chí Minh',
    salary: '40 – 65 triệu',
    matchScore: 84,
    tags: ['K8s', 'AWS', 'Terraform'],
    postedAt: '3 giờ trước',
    type: 'Hybrid',
  },
  {
    id: 5,
    title: 'Backend Engineer (Node.js)',
    company: 'MoMo',
    location: 'Hồ Chí Minh',
    salary: '30 – 50 triệu',
    matchScore: 82,
    tags: ['Node.js', 'PostgreSQL', 'Redis'],
    postedAt: '6 giờ trước',
    type: 'Full-time',
  },
  {
    id: 6,
    title: 'Data Scientist',
    company: 'Zalo',
    location: 'Hà Nội',
    salary: '$1,800 – $2,800',
    matchScore: 79,
    tags: ['Python', 'Spark', 'SQL'],
    postedAt: '12 giờ trước',
    type: 'Full-time',
  },
  {
    id: 7,
    title: 'iOS Developer',
    company: 'Shopee Vietnam',
    location: 'Hồ Chí Minh',
    salary: '35 – 55 triệu',
    matchScore: 76,
    tags: ['Swift', 'UIKit', 'SwiftUI'],
    postedAt: '2 ngày trước',
    type: 'On-site',
  },
  {
    id: 8,
    title: 'UX/Product Designer',
    company: 'Grab Vietnam',
    location: 'Hà Nội',
    salary: '$1,500 – $2,500',
    matchScore: 73,
    tags: ['Figma', 'Research', 'Prototyping'],
    postedAt: '1 ngày trước',
    type: 'Hybrid',
  },
];

const jobs = [...jobsRaw].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

const spring = { type: 'spring', stiffness: 100, damping: 20 };

const typeColors = {
  'Full-time': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Hybrid: 'bg-sky-50 text-sky-700 border-sky-200',
  'On-site': 'bg-violet-50 text-violet-700 border-violet-200',
  Remote: 'bg-amber-50 text-amber-700 border-amber-200',
};

const CompanyAvatar = ({ company, size = 12, className = '' }) => {
  const bg = companyColors[company] || '#10b981';
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=${bg.replace('#', '')}&color=fff&size=${size * 16}&bold=true`;
  return <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${className}`} />;
};

const JobCard = ({ job, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, ...spring }}
    viewport={{ once: true }}
    className="h-full"
  >
    <Link
      to={`/jobs/${job.id}`}
      className="group flex flex-col gap-4 p-5 bg-background border border-border/60 card-premium-hover rounded-2xl h-full"
    >
      {/* Header row */}
      <div className="flex items-start gap-4">
        <CompanyAvatar
          company={job.company}
          size={12}
          className="h-12 w-12 rounded-xl group-hover:scale-105 transition-transform shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-foreground leading-snug line-clamp-2 flex-1">
              {job.title}
            </h4>
            {/* AI match badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg font-semibold text-sm shrink-0 whitespace-nowrap">
              <Sparkles size={9} />
              {job.matchScore}%
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} className="text-muted-foreground/60 shrink-0" />
            <p className="text-base font-medium text-muted-foreground truncate">{job.company}</p>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} className="text-primary/60 shrink-0" aria-hidden />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
          <DollarSign size={13} className="text-primary shrink-0" aria-hidden />
          {job.salary}
        </span>
      </div>

      {/* Tags row */}
      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border/40">
          {job.tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="text-sm font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40"
            >
              {tag}
            </span>
          ))}
          {/* job type pill */}
          <span
            className={`ml-auto text-sm font-semibold px-2 py-0.5 rounded-md border ${typeColors[job.type] || 'bg-muted text-muted-foreground border-border/40'}`}
          >
            {job.type}
          </span>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
          <Clock size={10} aria-hidden />
          {job.postedAt}
        </span>
        <div className="h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
          <ArrowRight size={14} aria-hidden />
        </div>
      </div>
    </Link>
  </motion.div>
);

const FeaturedJobs = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>

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
          <ArrowRight size={14} aria-hidden />
        </Link>
      </motion.div>
    </div>
  );
};

export default FeaturedJobs;
