import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, ArrowRight, Flame, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const companyColors = {
  'FPT Software': '#e25b26',
  VNG: '#0066cc',
  OneMount: '#0d9488',
  Tiki: '#1a94ff',
  VinAI: '#c41e3a',
  'VNPT Technology': '#005bac',
  'Masan Group': '#d32f2f',
  'KMS Technology': '#7c4dff',
};

const jobs = [
  {
    id: 10,
    title: 'Senior Backend Engineer',
    company: 'FPT Software',
    location: 'Hồ Chí Minh',
    salary: '35 – 50 triệu',
    time: '2 giờ trước',
    deadline: 'Còn 3 ngày',
    tags: ['Java', 'Spring Boot'],
  },
  {
    id: 11,
    title: 'Project Manager',
    company: 'VNG',
    location: 'Đà Nẵng',
    salary: '40 – 60 triệu',
    time: '1 giờ trước',
    deadline: 'Còn 2 ngày',
    tags: ['Agile', 'Scrum'],
  },
  {
    id: 12,
    title: 'Fullstack Lead',
    company: 'OneMount',
    location: 'Hà Nội',
    salary: 'Thoả thuận',
    time: '3 giờ trước',
    deadline: 'Còn 5 ngày',
    tags: ['React', 'Go'],
  },
  {
    id: 13,
    title: 'Mobile Developer (React Native)',
    company: 'Tiki',
    location: 'Hồ Chí Minh',
    salary: '25 – 45 triệu',
    time: '5 giờ trước',
    deadline: 'Còn 4 ngày',
    tags: ['React Native', 'TypeScript'],
  },
  {
    id: 14,
    title: 'AI Research Engineer',
    company: 'VinAI',
    location: 'Hà Nội',
    salary: 'Lên đến $5,000',
    time: '30 phút trước',
    deadline: 'Còn 7 ngày',
    tags: ['Python', 'LLM', 'CUDA'],
  },
  {
    id: 15,
    title: 'Cloud Infrastructure Engineer',
    company: 'VNPT Technology',
    location: 'Hà Nội',
    salary: '30 – 50 triệu',
    time: '4 giờ trước',
    deadline: 'Còn 6 ngày',
    tags: ['AWS', 'Terraform', 'CI/CD'],
  },
  {
    id: 16,
    title: 'Business Analyst (ERP)',
    company: 'Masan Group',
    location: 'Hồ Chí Minh',
    salary: '20 – 35 triệu',
    time: '7 giờ trước',
    deadline: 'Còn 1 ngày',
    tags: ['SAP', 'SQL', 'Power BI'],
  },
  {
    id: 17,
    title: 'QA Automation Engineer',
    company: 'KMS Technology',
    location: 'Hồ Chí Minh',
    salary: '22 – 38 triệu',
    time: '1 giờ trước',
    deadline: 'Còn 3 ngày',
    tags: ['Selenium', 'Playwright', 'Jest'],
  },
];

const spring = { type: 'spring', stiffness: 100, damping: 18 };

const CompanyAvatar = ({ company, size = 12, className = '' }) => {
  const bg = companyColors[company] || '#f97316';
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=${bg.replace('#', '')}&color=fff&size=${size * 16}&bold=true`;
  return <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${className}`} />;
};

const UrgentCard = ({ job, index }) => {
  const skills = Array.isArray(job.tags) ? job.tags.slice(0, 2) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
      viewport={{ once: true }}
      className="h-full"
    >
      <Link
        to={`/jobs/${job.id}`}
        className="card-premium-hover group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-border/60 bg-white p-6 text-center"
      >
        {/* Urgent Badge with Pulse */}
        <div className="absolute top-3 right-3 z-10">
          <span className="relative flex items-center gap-1 overflow-hidden rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-bold text-orange-600">
            <span className="absolute inset-0 animate-pulse bg-orange-400/10" />
            <Flame size={10} className="relative" />
            <span className="relative uppercase tracking-wider">Tuyển gấp</span>
          </span>
        </div>

        {/* Logo Section - Elevating the Avatar */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 scale-110 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
          <CompanyAvatar
            company={job.company}
            size={16}
            className="relative h-20 w-20 rounded-2xl border-4 border-white shadow-lg ring-1 ring-black/[0.03] transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl dark:border-slate-900"
          />
        </div>

        {/* Content Section */}
        <div className="flex w-full flex-1 flex-col">
          <h3 className="mb-1.5 flex h-[56px] items-center justify-center text-lg font-extrabold leading-tight tracking-tight text-foreground transition-all group-hover:text-primary line-clamp-2">
            {job.title}
          </h3>

          <div className="mb-5 flex flex-col items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground/80 transition-colors group-hover:text-foreground/90">
              <Building2 size={13} className="opacity-60" />
              {job.company}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-sm font-bold text-muted-foreground/80 dark:bg-slate-900/40">
                <MapPin size={12} className="text-primary/60" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-primary dark:bg-emerald-500/10">
                <DollarSign size={12} />
                {job.salary}
              </div>
            </div>
          </div>

          {/* Tags - Modern Minimalist */}
          {skills.length > 0 && (
            <div className="mt-auto flex flex-wrap justify-center gap-1.5 pb-6">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1 text-sm font-bold tracking-tight text-muted-foreground transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary dark:bg-slate-900/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Professional Footer */}
        <div className="mt-auto flex w-full flex-col items-center gap-2 border-t border-border/40 pt-4">
          <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <Clock size={10} className="text-orange-500" />
            Hạn: <span className="text-orange-500">{job.deadline}</span>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2">
            Ứng tuyển ngay <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

const UrgentHiring = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {jobs.map((job, i) => (
          <UrgentCard key={job.id} job={job} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...spring }}
        viewport={{ once: true }}
      >
        <Link
          to="/jobs?urgent=true"
          className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-orange-200 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:border-orange-400 hover:bg-orange-50/50 active:scale-[0.98] transition-all"
        >
          <Flame size={15} />
          Xem thêm việc làm tuyển gấp
          <ArrowRight size={14} aria-hidden />
        </Link>
      </motion.div>
    </div>
  );
};

export default UrgentHiring;
