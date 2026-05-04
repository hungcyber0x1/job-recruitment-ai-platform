import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  ArrowRight,
  Briefcase,
  Clock,
  Building2,
  Bookmark,
  Loader2,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { candidateService, jobService } from '../../services';
import { getJobSalaryCardLabel } from '../../utils/jobSalary';

const FEATURED_LIMIT = 8;

const spring = { type: 'spring', stiffness: 100, damping: 20 };

const typeColors = {
  'Full-time': 'bg-primary/10 text-primary border-primary/20',
  'full-time': 'bg-primary/10 text-primary border-primary/20',
  full_time: 'bg-primary/10 text-primary border-primary/20',
  fulltime: 'bg-primary/10 text-primary border-primary/20',
  Hybrid: 'bg-primary/10 text-primary border-primary/20',
  hybrid: 'bg-primary/10 text-primary border-primary/20',
  'On-site': 'bg-muted text-muted-foreground border-border',
  'on-site': 'bg-muted text-muted-foreground border-border',
  onsite: 'bg-muted text-muted-foreground border-border',
  Remote: 'bg-warning/10 text-warning-700 border-warning/25',
  remote: 'bg-warning/10 text-warning-700 border-warning/25',
  'part-time': 'bg-warning/10 text-warning-700 border-warning/25',
  'Part-time': 'bg-warning/10 text-warning-700 border-warning/25',
  part_time: 'bg-warning/10 text-warning-700 border-warning/25',
  contract: 'bg-sky-50 text-sky-700 border-sky-200',
  internship: 'bg-violet-50 text-violet-700 border-violet-200',
};

const JOB_TYPE_LABELS = {
  'Full-time': 'Toàn thời gian',
  'full-time': 'Toàn thời gian',
  full_time: 'Toàn thời gian',
  fulltime: 'Toàn thời gian',
  Hybrid: 'Kết hợp',
  hybrid: 'Kết hợp',
  'On-site': 'Tại văn phòng',
  'on-site': 'Tại văn phòng',
  onsite: 'Tại văn phòng',
  Remote: 'Từ xa',
  remote: 'Từ xa',
  'part-time': 'Bán thời gian',
  'Part-time': 'Bán thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
};

const formatJobTypeLabel = (value = '') => JOB_TYPE_LABELS[String(value).trim()] || value;

const COMPANY_COLORS = [
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
};

const CompanyAvatar = ({ job, size = 12, className = '' }) => {
  const bg = getCompanyColor(job.company_name);
  if (job.company_logo) {
    return (
      <img
        src={job.company_logo}
        alt=""
        className={`shrink-0 rounded-xl object-cover ${className}`}
        style={{ width: size * 4, height: size * 4 }}
      />
    );
  }
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || 'C')}&background=${bg.replace('#', '')}&color=fff&size=${size * 16}&bold=true`;
  return <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${className}`} />;
};

const formatPostedAt = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
};

const JobCard = ({ job, index }) => {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const [saving, setSaving] = useState(false);
  const salaryDisplay = getJobSalaryCardLabel(job);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || user?.role !== 'candidate') {
      showNotification('Vui lòng đăng nhập với tài khoản ứng viên để lưu việc làm', 'warning');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await candidateService.unsaveJob(job.id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu việc làm', 'info');
      } else {
        await candidateService.saveJob(job.id);
        setIsSaved(true);
        showNotification('Đã lưu việc làm thành công', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSaving(false);
    }
  };

  const jobType = job.type || job.employment_type || '';
  const vacancies = Number.parseInt(job.vacancies, 10);
  const vacanciesLabel = Number.isFinite(vacancies) && vacancies > 0 ? `${vacancies} người` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ...spring }}
      viewport={{ once: true }}
      className="h-full"
    >
      <div className="group flex flex-col gap-4 p-5 bg-background border border-border/60 card-premium-hover rounded-xl h-full">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <Link
            to={`/jobs/${job.id}`}
            className="shrink-0 no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            <CompanyAvatar
              job={job}
              size={12}
              className="h-12 w-12 rounded-xl group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/jobs/${job.id}`}
                className="no-underline flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                  {job.title}
                </h4>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <Building2 size={12} className="text-muted-foreground/60 shrink-0" />
              <p className="text-base font-medium text-muted-foreground truncate">
                {job.company_name}
              </p>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-primary/60 shrink-0" aria-hidden />
            {job.location || 'Không xác định'}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
            <DollarSign size={13} className="text-primary shrink-0" aria-hidden />
            {salaryDisplay}
          </span>
          {vacanciesLabel && (
            <span className="flex items-center gap-1.5 font-semibold text-sky-700">
              <Users size={13} className="text-sky-500 shrink-0" aria-hidden />
              Tuyển {vacanciesLabel}
            </span>
          )}
        </div>

        {/* Tags row */}
        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border/40">
            {job.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={`${skill}-${idx}`}
                className="text-sm font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40"
              >
                {skill}
              </span>
            ))}
            {jobType && (
              <span
                className={`ml-auto text-sm font-semibold px-2 py-0.5 rounded-md border ${typeColors[jobType] || 'bg-muted text-muted-foreground border-border/40'}`}
              >
                {formatJobTypeLabel(jobType)}
              </span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <Clock size={10} aria-hidden />
            {formatPostedAt(job.created_at)}
          </span>
          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className={`p-2 rounded-lg border transition-all ${
                isSaved
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-primary hover:border-primary/30'
              } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
            >
              <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
            </button>
            <Link
              to={`/jobs/${job.id}`}
              className="no-underline h-7 w-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await jobService.getJobs({
          status: 'published',
          limit: FEATURED_LIMIT,
          offset: 0,
        });
        if (!cancelled) {
          setJobs(res.data?.data || []);
          setTotal(res.data?.total || 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch featured jobs:', err);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 p-5 bg-background border border-border/60 rounded-xl animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex gap-1.5 pt-3 border-t border-border/40">
                <div className="h-5 w-16 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded" />
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Không thể tải việc làm nổi bật
          </div>
        ) : jobs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Hiện chưa có việc làm nổi bật
          </div>
        ) : (
          jobs.map((job, i) => <JobCard key={job.id || i} job={job} index={i} />)
        )}
      </div>

      {!loading && !error && jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring }}
          viewport={{ once: true }}
        >
          <Link
            to="/jobs"
            className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border/60 text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/[0.02] active:scale-[0.98] transition-all"
          >
            <Briefcase size={15} />
            Xem thêm {total > 0 ? total.toLocaleString('vi-VN') : ''} việc làm
            <ArrowRight size={14} aria-hidden />
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default FeaturedJobs;
