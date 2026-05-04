import PropTypes from 'prop-types';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Bookmark,
  Calendar,
  Building2,
  Heart,
  Home,
  Share2,
  Check,
  Loader2,
  ArrowRight,
  Briefcase,
  Globe,
  Users,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Link, useNavigate } from 'react-router-dom';
import { candidateService } from '../../../services';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { getJobSalaryCardLabel, hasConcreteJobSalary } from '../../../utils/jobSalary';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../../utils/jobDeadline';
import { formatDate, getInitials } from '../../../utils/formatters';
import { resolveMediaUrl } from '../../../utils/mediaUrl';

const MAX_SKILLS_DISPLAY = 4;

const TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  freelance: 'Tự do',
};

const WORK_MODE_CONFIG = {
  remote: {
    label: 'Từ xa',
    icon: Globe,
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    iconClass: 'text-violet-500',
  },
  hybrid: {
    label: 'Kết hợp',
    icon: Home,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'text-blue-500',
  },
  onsite: {
    label: 'Tại văn phòng',
    icon: Building2,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    iconClass: 'text-amber-500',
  },
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
  if (!type || typeof type !== 'string') return 'Đang cập nhật';
  const key = type
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  return TYPE_LABELS[key] || type;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Work Mode Badge - Visual badge for work mode
 */
const WorkModeBadge = ({ mode }) => {
  if (!mode || !WORK_MODE_CONFIG[mode]) return null;

  const config = WORK_MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
        config.className
      )}
    >
      <Icon size={12} className={config.iconClass} />
      {config.label}
    </span>
  );
};

/**
 * Skill Pill - Modern skill tag
 */
const SkillPill = ({ skill, index }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600',
        'transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
      )}
    >
      {skill}
    </motion.span>
  );
};

/**
 * Deadline Indicator - Shows remaining time
 */
const DeadlineIndicator = ({ daysLeft, deadlinePassed }) => {
  const getDeadlineConfig = () => {
    if (deadlinePassed) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-600',
        icon: 'text-red-500',
        label: 'Hết hạn',
      };
    }

    if (daysLeft == null) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        icon: 'text-emerald-500',
        label: 'Không giới hạn',
      };
    }

    if (daysLeft === 0) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        icon: 'text-amber-500',
        label: 'Hạn hôm nay',
      };
    }

    if (daysLeft <= 3) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        icon: 'text-amber-500',
        label: `${daysLeft} ngày nữa`,
      };
    }

    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      icon: 'text-emerald-500',
      label: `${daysLeft} ngày nữa`,
    };
  };

  const config = getDeadlineConfig();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1',
        config.bg,
        config.border,
        config.text
      )}
    >
      <Calendar size={12} className={config.icon} />
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const JobCard = ({ job, basePath = '/candidate/jobs' }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const detailPath = `${basePath}/${job.id}`;
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const [saving, setSaving] = useState(false);
  const [isCompanySaved, setIsCompanySaved] = useState(job.is_company_saved || false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);
  const { showNotification } = useNotification();
  const companyName = job.company_name || job.company?.name || 'Công ty';

  const salaryDisplay = useMemo(() => getJobSalaryCardLabel(job), [job]);
  const hasConcreteSalary = useMemo(() => hasConcreteJobSalary(job), [job]);

  const companyLogoSrc = useMemo(() => {
    const rawLogo =
      job.company_logo ||
      job.logo ||
      job.company?.company_logo ||
      job.company?.logo ||
      job.company?.logo_url ||
      '';
    return resolveMediaUrl(rawLogo);
  }, [
    job.company?.company_logo,
    job.company?.logo,
    job.company?.logo_url,
    job.company_logo,
    job.logo,
  ]);

  useEffect(() => {
    setCompanyLogoFailed(false);
  }, [job.id, companyLogoSrc]);

  const companyLogoInitials = useMemo(() => getInitials(companyName).slice(0, 2), [companyName]);
  const companyLogoBg = useMemo(() => avatarBackgroundHex(companyName), [companyName]);

  const typeDisplay = formatJobType(job.type || job.job_type || job.employment_type);
  const hasSkills = Array.isArray(job.skills) && job.skills.length > 0;
  const deadlinePassed = Boolean(job.deadline && isJobApplicationDeadlinePassed(job.deadline));
  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      if (window.confirm('Bạn cần đăng nhập để lưu việc làm. Chuyển đến trang đăng nhập?')) {
        navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

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

  const handleToggleSaveCompany = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (savingCompany) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      if (window.confirm('Bạn cần đăng nhập để lưu công ty. Chuyển đến trang đăng nhập?')) {
        navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    setSavingCompany(true);
    try {
      const companyId = job.company_id || job.employer?.id;
      if (!companyId) {
        showNotification('Không tìm thấy thông tin công ty', 'error');
        return;
      }

      if (isCompanySaved) {
        await candidateService.unsaveCompany(companyId);
        setIsCompanySaved(false);
        showNotification('Đã bỏ lưu công ty', 'info');
      } else {
        await candidateService.saveCompany(companyId);
        setIsCompanySaved(true);
        showNotification('Đã lưu công ty thành công', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle company save:', error);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${detailPath}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        showNotification('Đã sao chép liên kết!', 'success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showNotification('Không thể sao chép liên kết', 'error');
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-white transition-all duration-300',
          isHovered
            ? 'border-emerald-200 shadow-lg shadow-emerald-100/40'
            : 'border-slate-200/80 shadow-sm'
        )}
      >
        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Header: Logo & Info */}
          <div className="flex gap-4">
            {/* Company Logo */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={cn(
                  'relative h-14 w-14 overflow-hidden rounded-lg border bg-slate-50 transition-all duration-300',
                  isHovered ? 'border-emerald-200 shadow-md' : 'border-slate-200 shadow-sm'
                )}
              >
                {companyLogoSrc && !companyLogoFailed ? (
                  <img
                    key={companyLogoSrc}
                    src={companyLogoSrc}
                    alt={`${companyName} logo`}
                    className="h-full w-full object-cover"
                    onError={() => setCompanyLogoFailed(true)}
                  />
                ) : (
                  <span
                    className="flex h-full w-full select-none items-center justify-center text-lg font-black text-white"
                    style={{ backgroundColor: `#${companyLogoBg}` }}
                    aria-label={`${companyName} logo fallback`}
                  >
                    {companyLogoInitials}
                  </span>
                )}
                {/* Save company button overlay */}
                <button
                  onClick={handleToggleSaveCompany}
                  disabled={savingCompany}
                  className={cn(
                    'absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200',
                    isCompanySaved
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-white/95 text-slate-400 shadow-sm hover:bg-rose-50 hover:text-rose-500'
                  )}
                >
                  <Heart size={12} fill={isCompanySaved ? 'currentColor' : 'none'} />
                </button>
              </motion.div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <Link to={detailPath}>
                    <h3
                      className={cn(
                        'line-clamp-2 text-base font-extrabold leading-tight tracking-normal transition-colors duration-200',
                        isHovered ? 'text-emerald-700' : 'text-slate-950'
                      )}
                    >
                      {job.title}
                    </h3>
                  </Link>

                  {/* Company */}
                  <div className="flex items-center gap-2 mt-1">
                    {job.company_id != null ? (
                      <Link
                        to={`/companies/${job.company_id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-emerald-700"
                      >
                        <Building2 size={14} className="opacity-60" />
                        {companyName}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                        <Building2 size={14} className="opacity-60" />
                        {companyName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {/* Location */}
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400" />
              <span className="font-semibold">{job.location || job.address || '—'}</span>
            </div>

            {/* Salary */}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-bold',
                hasConcreteSalary
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              )}
            >
              <DollarSign size={14} />
              <span>{salaryDisplay}</span>
            </div>

            {/* Vacancies */}
            {job.vacancies && job.vacancies > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                <Users size={14} />
                <span>Tuyển {job.vacancies} người</span>
              </div>
            )}

            {/* Job Type */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              <Briefcase size={14} className="text-slate-400" />
              <span className="font-semibold">{typeDisplay}</span>
            </div>

            {/* Work Mode */}
            {job.work_mode && <WorkModeBadge mode={job.work_mode} />}
          </div>
          {/* Skills */}
          {hasSkills && (
            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.slice(0, MAX_SKILLS_DISPLAY).map((skill, idx) => (
                <SkillPill key={`${String(skill)}-${idx}`} skill={skill} index={idx} />
              ))}
              {job.skills.length > MAX_SKILLS_DISPLAY && (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  +{job.skills.length - MAX_SKILLS_DISPLAY}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex flex-col gap-3 border-t border-slate-100 px-4 py-4 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:px-5',
            isHovered ? 'bg-emerald-50/25' : 'bg-slate-50/40'
          )}
        >
          {/* Deadline */}
          <div className="flex flex-wrap items-center gap-3">
            <DeadlineIndicator daysLeft={daysLeft} deadlinePassed={deadlinePassed} />
            {job.deadline && (
              <span className="text-xs text-slate-400">Hạn: {formatDate(job.deadline)}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Save Job Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleSave}
              disabled={saving}
              className={cn(
                'relative flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                isSaved
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
              )}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
              )}
              <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
            </motion.button>

            {/* Share Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-all duration-200',
                copied
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'
              )}
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
            </motion.button>

            {/* View Details Button */}
            <Link to={detailPath}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200',
                  'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
                  isHovered && 'shadow-md'
                )}
              >
                <span>Xem chi tiết</span>
                <ArrowRight size={16} />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
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
    address: PropTypes.string,
    salary_range: PropTypes.string,
    salary_display: PropTypes.string,
    salary_negotiable: PropTypes.bool,
    salary_min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    salary_max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    vacancies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    job_type: PropTypes.string,
    employment_type: PropTypes.string,
    work_mode: PropTypes.string,
    deadline: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    is_saved: PropTypes.bool,
    is_company_saved: PropTypes.bool,
  }).isRequired,
};

export default JobCard;
