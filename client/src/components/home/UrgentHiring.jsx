import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const companyColors = {
  'FPT Software': '#e25b26',
  VNG: '#0066cc',
  OneMount: '#0d9488',
  Tiki: '#1a94ff',
  VinAI: '#c41e3a',
};

const jobs = [
  {
    id: 10,
    title: 'Senior Backend Engineer',
    company: 'FPT Software',
    location: 'Hồ Chí Minh',
    salary: '35-50 triệu',
    time: '2 giờ trước',
  },
  {
    id: 11,
    title: 'Project Manager',
    company: 'VNG',
    location: 'Đà Nẵng',
    salary: '40-60 triệu',
    time: '1 giờ trước',
  },
  {
    id: 12,
    title: 'Fullstack Lead',
    company: 'OneMount',
    location: 'Hà Nội',
    salary: 'Thoả thuận',
    time: '3 giờ trước',
  },
  {
    id: 13,
    title: 'Mobile Developer',
    company: 'Tiki',
    location: 'Hồ Chí Minh',
    salary: '25-45 triệu',
    time: '5 giờ trước',
  },
  {
    id: 14,
    title: 'AI Research Engineer',
    company: 'VinAI',
    location: 'Hà Nội',
    salary: 'Lên đến $5,000',
    time: '30 phút trước',
  },
];

const UrgentHiring = () => {
  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <Link
            to={`/jobs/${job.id}`}
            className="group flex flex-col md:flex-row items-center gap-5 p-5 bg-background border border-border/60 hover:border-orange-300/40 hover:shadow-[0_8px_24px_-8px_rgba(249,115,22,0.12)] rounded-2xl transition-all duration-300"
          >
            <div className="relative flex h-12 w-12 shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=${(companyColors[job.company] || '#f97316').replace('#', '')}&color=fff&size=96&bold=true`}
                alt=""
                className="h-12 w-12 rounded-xl object-cover group-hover:scale-105 transition-transform"
              />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                <Flame size={10} aria-hidden="true" />
              </span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h4 className="text-base font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
                {job.title}
              </h4>
              <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                <span className="font-medium">{job.company}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-primary font-medium">{job.time}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-foreground-subtle" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground-soft">
                <DollarSign size={14} className="text-primary" aria-hidden="true" />
                {job.salary}
              </div>
            </div>

            <div className="h-9 w-9 flex items-center justify-center rounded-xl border border-border/40 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all shrink-0">
              <ArrowRight
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-colors"
                aria-hidden="true"
              />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default UrgentHiring;
