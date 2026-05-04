import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  MapPin,
  DollarSign,
  ArrowRight,
  Flame,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services';
import { calendarDaysLeftUntilDeadline } from '../../utils/jobDeadline';
import { getJobSalaryCardLabel } from '../../utils/jobSalary';

const URGENT_LIMIT = 8;
const FETCH_LIMIT = 24;

const companyPalette = [
  '#10b981',
  '#059669',
  '#e25b26',
  '#0d9488',
  '#ae2070',
  '#0068ff',
  '#ee4d2d',
  '#00b14f',
];

const getCompanyColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return companyPalette[Math.abs(hash) % companyPalette.length] || '#f97316';
};

const getCompanyName = (job = {}) =>
  job.company_name || job.company?.name || job.employer?.name || 'Doanh nghiệp đang tuyển';

const getJobLocation = (job = {}) =>
  job.location_name || job.location || job.company_location || job.company?.location || 'Linh hoạt';

const getDeadlineLabel = (deadline) => {
  const daysLeft = calendarDaysLeftUntilDeadline(deadline);
  if (daysLeft === null) return 'Không giới hạn';
  if (daysLeft === 0) return 'Hôm nay';
  if (daysLeft === 1) return 'Còn 1 ngày';
  return `Còn ${daysLeft} ngày`;
};

const getUrgencySortValue = (job = {}) => {
  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);
  return daysLeft === null ? Number.MAX_SAFE_INTEGER : daysLeft;
};

const spring = { type: 'spring', stiffness: 100, damping: 18 };

const CompanyAvatar = ({ job, size = 12, className = '' }) => {
  const company = getCompanyName(job);
  if (job?.company_logo) {
    return (
      <img
        src={job.company_logo}
        alt=""
        className={`shrink-0 rounded-xl object-cover ${className}`}
      />
    );
  }

  const bg = getCompanyColor(company);
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=${bg.replace('#', '')}&color=fff&size=${size * 16}&bold=true`;
  return <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${className}`} />;
};

const UrgentCard = ({ job, index }) => {
  const companyName = getCompanyName(job);
  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 2) : [];
  const location = getJobLocation(job);
  const salary = getJobSalaryCardLabel(job);
  const deadlineLabel = getDeadlineLabel(job.deadline);

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
        className="card-premium-hover group relative flex h-full flex-col items-center overflow-hidden rounded-xl border border-border/60 bg-white p-6 text-center"
      >
        {/* Urgent Badge with Pulse */}
        <div className="absolute top-3 right-3 z-10">
          <span className="relative flex items-center gap-1 overflow-hidden rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-bold text-orange-600">
            <span className="absolute inset-0 animate-pulse bg-orange-400/10" />
            <Flame size={10} className="relative" />
            <span className="relative uppercase tracking-normal">Tuyển gấp</span>
          </span>
        </div>

        {/* Logo Section - Elevating the Avatar */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 scale-110 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
          <CompanyAvatar
            job={job}
            size={16}
            className="relative h-20 w-20 rounded-xl border-4 border-white shadow-lg ring-1 ring-black/[0.03] transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl dark:border-slate-900"
          />
        </div>

        {/* Content Section */}
        <div className="flex w-full flex-1 flex-col">
          <h3 className="mb-1.5 flex h-[56px] items-center justify-center text-lg font-extrabold leading-tight tracking-normal text-foreground transition-all group-hover:text-primary line-clamp-2">
            {job.title}
          </h3>

          <div className="mb-5 flex flex-col items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground/80 transition-colors group-hover:text-foreground/90">
              <Building2 size={13} className="opacity-60" />
              {companyName}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-sm font-bold text-muted-foreground/80 dark:bg-slate-900/40">
                <MapPin size={12} className="text-primary/60" />
                {location}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-bold text-primary dark:bg-emerald-500/10">
                <DollarSign size={12} />
                {salary}
              </div>
            </div>
          </div>

          {/* Tags - Modern Minimalist */}
          {skills.length > 0 && (
            <div className="mt-auto flex flex-wrap justify-center gap-1.5 pb-6">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border/40 bg-muted/40 px-2.5 py-1 text-sm font-bold tracking-normal text-muted-foreground transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary dark:bg-slate-900/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Professional Footer */}
        <div className="mt-auto flex w-full flex-col items-center gap-2 border-t border-border/40 pt-4">
          <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground uppercase tracking-normal">
            <Clock size={10} className="text-orange-500" />
            Hạn: <span className="text-orange-500">{deadlineLabel}</span>
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
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchJobs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await jobService.getJobs({ limit: FETCH_LIMIT });
        if (cancelled) return;

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setJobs(rows);
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load urgent jobs:', fetchError);
        setJobs([]);
        setError('Không tải được việc làm tuyển gấp từ API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  const urgentJobs = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => getUrgencySortValue(a) - getUrgencySortValue(b))
        .slice(0, URGENT_LIMIT),
    [jobs]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border/60 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/40 px-4 text-center text-sm font-semibold text-orange-600">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      );
    }

    if (urgentJobs.length === 0) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-white px-4 text-center text-sm font-semibold text-muted-foreground">
          Chưa có việc làm tuyển gấp đang công khai.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {urgentJobs.map((job, i) => (
          <UrgentCard key={job.id} job={job} index={i} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {renderContent()}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...spring }}
        viewport={{ once: true }}
      >
        <Link
          to="/jobs?urgent=true"
          className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-orange-200 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:border-orange-400 hover:bg-orange-50/50 active:scale-[0.98] transition-all"
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
