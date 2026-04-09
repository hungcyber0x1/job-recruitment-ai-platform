import PropTypes from 'prop-types';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import { MapPin, DollarSign, Clock, Bookmark, Sparkles, Calendar } from 'lucide-react';
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
    <Card className="group relative border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.08)]">
      <div className="relative z-10 flex gap-5 sm:gap-6">
        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm transition-transform duration-300 group-hover:border-primary/15">
          <img
            src={companyLogoSrc}
            alt={job.company_name || 'Công ty'}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1">
              <Link to={detailPath}>
                <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors line-clamp-2 hover:text-primary">
                  {job.title}
                </h3>
              </Link>
              {job.company_id != null ? (
                <Link
                  to={`/candidate/companies/${job.company_id}`}
                  className="mt-1 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {job.company_name}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-muted-foreground">{job.company_name}</p>
              )}
            </div>
            {job.match_score > 0 && (
              <div className="flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles size={13} className="shrink-0 opacity-90" aria-hidden />
                <span>{job.match_score}% phù hợp</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
            <div className="flex min-w-0 max-w-full items-center gap-2">
              <MapPin size={15} className="shrink-0 text-muted-foreground/70" aria-hidden />
              <span className="font-medium truncate">{job.location || '—'}</span>
            </div>
            <div className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2">
              <DollarSign size={15} className="shrink-0 text-primary/80" aria-hidden />
              <span className="font-medium text-foreground/90 truncate">{salaryDisplay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="shrink-0 text-muted-foreground/70" aria-hidden />
              <span className="font-medium">{typeDisplay}</span>
            </div>
            {job.deadline ? (
              <div className="flex min-w-0 max-w-full items-center gap-2">
                <Calendar
                  size={15}
                  className={`shrink-0 ${deadlinePassed ? 'text-destructive' : 'text-muted-foreground/70'}`}
                  aria-hidden
                />
                <span
                  className={`font-medium truncate ${deadlinePassed ? 'text-destructive' : 'text-foreground/85'}`}
                >
                  {deadlinePassed
                    ? 'Hết hạn ứng tuyển'
                    : daysLeft === 0
                      ? `Hạn nộp: hôm nay (${formatDate(job.deadline)})`
                      : `Hạn: ${formatDate(job.deadline)} · còn ${daysLeft} ngày`}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-1 flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-h-[1.75rem] flex-wrap gap-2">
              {hasSkills &&
                job.skills.slice(0, MAX_SKILLS_DISPLAY).map((skill, idx) => (
                  <Badge
                    key={`${String(skill)}-${idx}`}
                    variant="gray"
                    className="rounded-md border border-border/40 bg-muted/40 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
              {hasSkills && job.skills.length > MAX_SKILLS_DISPLAY && (
                <Badge
                  variant="gray"
                  className="rounded-md border border-border/40 bg-muted/30 py-0.5 text-xs font-medium text-muted-foreground/80"
                >
                  +{job.skills.length - MAX_SKILLS_DISPLAY}
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-end">
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-transparent transition-colors ${
                  isSaved
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-primary'
                } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={handleToggleSave}
                disabled={saving}
                aria-label={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
              >
                <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
              </button>
              <Link
                to={detailPath}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                Xem chi tiết
              </Link>
            </div>
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
