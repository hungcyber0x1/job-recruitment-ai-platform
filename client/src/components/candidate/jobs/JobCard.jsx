import PropTypes from 'prop-types';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import { MapPin, DollarSign, Clock, Bookmark, Sparkles, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { candidateService } from '../../../services';
import { useNotification } from '../../../context/NotificationContext';
import { formatDate } from '../../../utils/formatters';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../../utils/jobDeadline';

const MAX_SKILLS_DISPLAY = 3;

const TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  freelance: 'Freelance',
};

/** Màu avatar cố định theo tên công ty (không random mỗi lần load). */
function avatarBackgroundHex(companyName) {
  const palette = ['0d9488', '0f766e', '115e59', '047857', '059669', '134e4a', '0e7490', '155e75'];
  const s = String(companyName || 'C');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return palette[Math.abs(h) % palette.length];
}

function formatJobType(type) {
  if (!type || typeof type !== 'string') return '—';
  const key = type.trim().toLowerCase().replace(/\s+/g, '-');
  return TYPE_LABELS[key] || type;
}

const JobCard = ({ job, basePath = '/candidate/jobs' }) => {
  const detailPath = `${basePath}/${job.id}`;
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const salaryDisplay = useMemo(() => {
    const raw = job.salary_range;
    if (raw == null) return 'Thỏa thuận';
    const t = String(raw).trim();
    return t.length > 0 ? t : 'Thỏa thuận';
  }, [job.salary_range]);

  const companyLogoSrc = useMemo(() => {
    if (job.company_logo) return job.company_logo;
    const name = encodeURIComponent(job.company_name || 'Company');
    const bg = avatarBackgroundHex(job.company_name);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=ffffff&size=128&font-size=0.42&bold=true`;
  }, [job.company_logo, job.company_name]);

  const typeDisplay = formatJobType(job.type);
  const hasSkills = Array.isArray(job.skills) && job.skills.length > 0;
  const deadlinePassed = Boolean(job.deadline && isJobApplicationDeadlinePassed(job.deadline));
  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    setSaving(true);
    try {
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
      console.error('Failed to toggle job save:', error);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card hover className="card-premium-hover group relative overflow-hidden p-0">
      <div className="relative z-10 flex flex-col h-full bg-white dark:bg-slate-950">
        {/* Top Section: Logo & Main Info */}
        <div className="flex gap-4 p-5 sm:gap-6 sm:p-6">
          <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl border border-border/40 bg-slate-50/50 p-0.5 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary/20 group-hover:shadow-lg dark:bg-slate-900/50">
            <img
              src={companyLogoSrc}
              alt={job.company_name || 'Công ty'}
              className="h-full w-full rounded-[14px] object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <Link to={detailPath}>
                  <h3 className="text-xl font-extrabold leading-tight tracking-tight text-foreground transition-all line-clamp-2 group-hover:text-primary mb-1">
                    {job.title}
                  </h3>
                </Link>
                {job.company_id != null ? (
                  <Link
                    to={`/candidate/companies/${job.company_id}`}
                    className="inline-flex items-center gap-1.5 text-base font-semibold text-muted-foreground/80 transition-colors hover:text-primary"
                  >
                    <Building2 size={14} className="opacity-60" />
                    {job.company_name}
                  </Link>
                ) : (
                  <p className="flex items-center gap-1.5 text-base font-semibold text-muted-foreground/80">
                    <Building2 size={14} className="opacity-60" />
                    {job.company_name}
                  </p>
                )}
              </div>

              {job.match_score > 0 && (
                <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-sm font-bold text-primary shadow-sm">
                  <Sparkles size={12} className="opacity-90 animate-pulse" />
                  <span>{job.match_score}% Match</span>
                </div>
              )}
            </div>

            {/* Core Job Details */}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-bold text-muted-foreground/90">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary/60" />
                {job.location || '—'}
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <DollarSign size={14} />
                {salaryDisplay}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-muted-foreground/60" />
                {typeDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section - Modern Minimalist Pills */}
        <div className="px-5 sm:px-6 mb-5">
          <div className="flex flex-wrap gap-2">
            {hasSkills &&
              job.skills.slice(0, MAX_SKILLS_DISPLAY).map((skill, idx) => (
                <span
                  key={`${String(skill)}-${idx}`}
                  className="rounded-lg border border-border/40 bg-slate-50 px-3 py-1 text-sm font-bold text-muted-foreground/80 transition-all group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary dark:bg-slate-900/40"
                >
                  {skill}
                </span>
              ))}
            {hasSkills && job.skills.length > MAX_SKILLS_DISPLAY && (
              <span className="rounded-lg border border-border/40 bg-slate-50 px-2 py-1 text-sm font-bold text-muted-foreground/60 transition-all dark:bg-slate-900/30">
                +{job.skills.length - MAX_SKILLS_DISPLAY}
              </span>
            )}
          </div>
        </div>

        {/* Improved Footer Action Bar */}
        <div className="mt-auto flex items-center justify-between border-t border-border/40 bg-slate-50/30 p-4 sm:px-6 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar
              size={12}
              className={`${deadlinePassed ? 'text-destructive' : 'text-primary/60'}`}
            />
            <span className={deadlinePassed ? 'text-destructive' : ''}>
              {deadlinePassed
                ? 'Hết hạn'
                : daysLeft === 0
                  ? 'Hết hạn hôm nay'
                  : `${daysLeft} ngày nữa`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-white transition-all hover:scale-105 active:scale-95 ${
                isSaved
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-primary hover:border-primary/30'
              } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleToggleSave}
              disabled={saving}
              aria-label={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
            >
              <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
            </button>
            <Link
              to={detailPath}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-[14px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

JobCard.propTypes = {
  basePath: PropTypes.string,
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    company_name: PropTypes.string.isRequired,
    company_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    company_logo: PropTypes.string,
    location: PropTypes.string,
    salary_range: PropTypes.string,
    type: PropTypes.string,
    deadline: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    match_score: PropTypes.number,
  }).isRequired,
};

export default JobCard;
