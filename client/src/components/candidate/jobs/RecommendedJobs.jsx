import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  Calendar,
  Building2,
  Globe,
  Home,
  Share2,
  Check,
  Loader2,
  ArrowRight,
  Briefcase,
  Heart,
  Star,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  CheckCircle2,
  X,
  ChevronDown,
  SlidersHorizontal as SlidersIcon,
  LayoutGrid,
  List,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import { useNotification } from '@/context/NotificationContext';
import { calendarDaysLeftUntilDeadline, isJobApplicationDeadlinePassed } from '@/utils/jobDeadline';
import { formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { getJobSalaryCardLabel, hasConcreteJobSalary } from '@/utils/jobSalary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// CONSTANTS & CONFIG
// ============================================================================

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

const SALARY_RANGES = [
  'Dưới 10 triệu',
  '10 - 15 triệu',
  '15 - 20 triệu',
  '20 - 30 triệu',
  '30 - 50 triệu',
  'Trên 50 triệu',
  'Thỏa thuận',
];

const JOB_TYPES = ['Toàn thời gian', 'Bán thời gian', 'Hợp đồng', 'Thực tập', 'Từ xa'];

const EXPERIENCE_LEVELS = [
  'Fresher / Mới tốt nghiệp',
  'Dưới 1 năm',
  '1 - 3 năm',
  '3 - 5 năm',
  'Trên 5 năm',
  'Quản lý / Manager',
];

// ============================================================================
// HELPERS
// ============================================================================

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

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Vừa đăng';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Vừa đăng';
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Đăng vài phút trước';
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function getSalarySortValue(job = {}) {
  const salaryMax = Number(job.salary_max);
  const salaryMin = Number(job.salary_min);

  if (Number.isFinite(salaryMax) && salaryMax > 0) return salaryMax;
  if (Number.isFinite(salaryMin) && salaryMin > 0) return salaryMin;

  const raw = String(job.salary_range || job.salary_display || '')
    .trim()
    .toLowerCase();
  if (!raw) return 0;

  const matches = [...raw.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((match) =>
    Number(String(match[1]).replace(',', '.'))
  );

  if (!matches.length) return 0;

  const unit =
    raw.includes('triệu') || raw.includes('trieu') ? 1000000 : raw.includes('k') ? 1000 : 1;

  return Math.max(...matches) * unit;
}

function sortJobs(jobs = [], sortKey = 'recent') {
  const nextJobs = [...jobs];

  nextJobs.sort((a, b) => {
    if (sortKey === 'salary') {
      return getSalarySortValue(b) - getSalarySortValue(a);
    }

    // Default: sort by date (most recent first)
    return (
      new Date(b.published_at || b.created_at || 0).getTime() -
      new Date(a.published_at || a.created_at || 0).getTime()
    );
  });

  return nextJobs;
}

function matchesSalaryFilter(job = {}, salaryFilter) {
  if (!salaryFilter) return true;

  const salaryValue = getSalarySortValue(job);

  switch (salaryFilter) {
    case 'Dưới 10 triệu':
      return salaryValue > 0 && salaryValue < 10000000;
    case '10 - 15 triệu':
      return salaryValue >= 10000000 && salaryValue < 15000000;
    case '15 - 20 triệu':
      return salaryValue >= 15000000 && salaryValue < 20000000;
    case '20 - 30 triệu':
      return salaryValue >= 20000000 && salaryValue < 30000000;
    case '30 - 50 triệu':
      return salaryValue >= 30000000 && salaryValue <= 50000000;
    case 'Trên 50 triệu':
      return salaryValue > 50000000;
    case 'Thỏa thuận':
      return salaryValue === 0;
    default:
      return true;
  }
}

function matchesExperienceFilter(job = {}, experienceFilter) {
  if (!experienceFilter) return true;

  const haystack = String(job.experience_level || job.experience_required || '')
    .trim()
    .toLowerCase();

  if (!haystack) return true;

  switch (experienceFilter) {
    case 'Fresher / Mới tốt nghiệp':
      return (
        haystack.includes('entry') || haystack.includes('fresher') || haystack.includes('intern')
      );
    case 'Dưới 1 năm':
      return haystack.includes('junior') || haystack.includes('entry') || haystack.includes('1');
    case '1 - 3 năm':
      return (
        haystack.includes('mid') ||
        haystack.includes('1') ||
        haystack.includes('2') ||
        haystack.includes('3')
      );
    case '3 - 5 năm':
      return (
        haystack.includes('senior') ||
        haystack.includes('3') ||
        haystack.includes('4') ||
        haystack.includes('5')
      );
    case 'Trên 5 năm':
      return (
        haystack.includes('lead') ||
        haystack.includes('principal') ||
        haystack.includes('6') ||
        haystack.includes('7')
      );
    case 'Quản lý / Manager':
      return (
        haystack.includes('manager') || haystack.includes('lead') || haystack.includes('director')
      );
    default:
      return true;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Work Mode Badge
 */
const WorkModeBadge = ({ mode }) => {
  if (!mode || !WORK_MODE_CONFIG[mode]) return null;

  const config = WORK_MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold',
        config.className
      )}
    >
      <Icon size={12} className={config.iconClass} />
      {config.label}
    </span>
  );
};

/**
 * Skill Pill
 */
const SkillPill = ({ skill, index, isLast }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600',
        'transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700'
      )}
    >
      {skill}
    </motion.span>
  );
};

/**
 * Deadline Indicator
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
        dot: 'bg-red-500',
      };
    }

    if (daysLeft == null) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        icon: 'text-emerald-500',
        label: 'Không giới hạn',
        dot: 'bg-emerald-500',
      };
    }

    if (daysLeft === 0) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        icon: 'text-amber-500',
        label: 'Hạn hôm nay',
        dot: 'bg-amber-500',
      };
    }

    if (daysLeft <= 3) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-600',
        icon: 'text-amber-500',
        label: `${daysLeft} ngày nữa`,
        dot: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      icon: 'text-emerald-500',
      label: `${daysLeft} ngày nữa`,
      dot: 'bg-emerald-500',
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
      <div className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

/**
 * Job Card — Individual job listing
 */
const JobCard = ({ job, onToggleSave, isSaved, onShare, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const salaryDisplay = useMemo(() => getJobSalaryCardLabel(job), [job]);
  const hasConcreteSalary = useMemo(() => hasConcreteJobSalary(job), [job]);

  const companyLogoSrc = useMemo(() => {
    if (job.company_logo) return job.company_logo;
    const name = encodeURIComponent(job.company_name || 'Company');
    const bg = avatarBackgroundHex(job.company_name);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=ffffff&size=128&font-size=0.42&bold=true`;
  }, [job.company_logo, job.company_name]);

  const typeDisplay = formatJobType(job.type);
  const vacancies = Number.parseInt(job.vacancies, 10);
  const vacanciesLabel = Number.isFinite(vacancies) && vacancies > 0 ? `${vacancies} người` : null;
  const hasSkills = Array.isArray(job.skills) && job.skills.length > 0;
  const deadlinePassed = Boolean(job.deadline && isJobApplicationDeadlinePassed(job.deadline));
  const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await onToggleSave(job);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/candidate/jobs/${job.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      onShare?.(job);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border bg-white transition-all duration-300',
          isHovered
            ? 'border-emerald-200/60 shadow-xl shadow-emerald-100/30'
            : 'border-slate-200/60 shadow-sm'
        )}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 to-slate-400" />

        <div className="p-5 sm:p-6">
          {/* Header: Logo + Title + Company */}
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={cn(
                  'relative h-14 w-14 rounded-xl border-2 overflow-hidden transition-all duration-300',
                  isHovered ? 'border-emerald-300 shadow-lg' : 'border-slate-200 shadow-sm'
                )}
              >
                <img
                  src={companyLogoSrc}
                  alt={job.company_name || 'Công ty'}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* Company save indicator */}
              {job.is_company_saved && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center shadow-md">
                  <Heart size={10} className="text-white fill-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link to={`/candidate/jobs/${job.id}`}>
                <h4
                  className={cn(
                    'text-lg font-bold leading-tight line-clamp-2 transition-colors duration-200',
                    isHovered ? 'text-emerald-700' : 'text-slate-900'
                  )}
                >
                  {job.title}
                </h4>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                {job.company_id != null ? (
                  <Link
                    to={`/companies/${job.company_id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-emerald-600"
                  >
                    <Building2 size={14} className="opacity-60" />
                    {job.company_name}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                    <Building2 size={14} className="opacity-60" />
                    {job.company_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick info row */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400" />
              <span className="font-medium">{job.location || job.address || '—'}</span>
            </div>

            <div
              className={cn(
                'flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg',
                hasConcreteSalary ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              <DollarSign size={14} />
              <span>{salaryDisplay}</span>
            </div>

            {vacanciesLabel && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg">
                <Users size={14} className="text-sky-500" />
                <span>Tuyển {vacanciesLabel}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded-lg">
              <Briefcase size={14} className="text-slate-400" />
              <span className="font-medium">{typeDisplay}</span>
            </div>

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

          {/* Footer */}
          <div
            className={cn(
              'flex items-center justify-between border-t border-slate-100 px-0 sm:px-0 py-4 mt-4 transition-all duration-300',
              isHovered ? 'bg-emerald-50/20' : 'bg-slate-50/20'
            )}
          >
            <div className="flex items-center gap-3">
              <DeadlineIndicator daysLeft={daysLeft} deadlinePassed={deadlinePassed} />
              {job.deadline && (
                <span className="text-xs text-slate-400">Hạn: {formatDate(job.deadline)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleSave}
                disabled={saving}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isSaved
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-200/50'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                )}
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                )}
                <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
              </motion.button>

              {/* Share */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl border-2 transition-all duration-200',
                  copied
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600'
                )}
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
              </motion.button>

              {/* View details */}
              <Link to={`/candidate/jobs/${job.id}`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg',
                    isHovered && 'shadow-xl'
                  )}
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight size={16} />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    company_name: PropTypes.string.isRequired,
    company_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    company_logo: PropTypes.string,
    location: PropTypes.string,
    address: PropTypes.string,
    salary_range: PropTypes.string,
    vacancies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    work_mode: PropTypes.string,
    deadline: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    is_saved: PropTypes.bool,
    is_company_saved: PropTypes.bool,
  }).isRequired,
  onToggleSave: PropTypes.func.isRequired,
  isSaved: PropTypes.bool,
  onShare: PropTypes.func,
  onViewDetails: PropTypes.func,
};

/**
 * Empty State — shown when no jobs are found
 */
const EmptyJobsState = ({ onClearFilters, showResetAction = false }) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
      <Briefcase size={34} className="text-slate-300" />
    </div>
    <h3 className="mb-2 text-2xl font-bold text-slate-900">Không tìm thấy việc phù hợp</h3>
    <p className="mx-auto mb-6 max-w-md text-base font-medium leading-8 text-slate-500">
      Thử điều chỉnh bộ lọc, cập nhật hồ sơ hoặc khám phá thêm các vị trí mới để hệ thống gợi ý sát
      hơn.
    </p>

    {showResetAction ? (
      <Button
        onClick={onClearFilters}
        className="rounded-xl bg-emerald-500 font-bold hover:bg-emerald-600"
      >
        <X size={16} className="mr-2" />
        Xóa bộ lọc
      </Button>
    ) : (
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-xl bg-emerald-500 font-bold hover:bg-emerald-600">
          <Link to="/candidate/jobs">Khám phá việc làm</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-white"
        >
          <Link to="/candidate/profile/edit">Cập nhật hồ sơ</Link>
        </Button>
      </div>
    )}
  </div>
);

EmptyJobsState.propTypes = {
  onClearFilters: PropTypes.func.isRequired,
  showResetAction: PropTypes.bool,
};

/**
 * Filter Panel — Collapsible sidebar
 */
const FilterPanel = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTypes, setActiveTypes] = useState(Array.isArray(filters?.type) ? filters.type : []);
  const [activeSalary, setActiveSalary] = useState(null);
  const [activeExperience, setActiveExperience] = useState(null);

  const handleTypeToggle = (value) => {
    const next = activeTypes.includes(value)
      ? activeTypes.filter((v) => v !== value)
      : [...activeTypes, value];
    setActiveTypes(next);
    onFilterChange?.({ ...filters, type: next });
  };

  const handleSalarySelect = (value) => {
    setActiveSalary(activeSalary === value ? null : value);
    onFilterChange?.({ ...filters, salary: activeSalary === value ? null : value });
  };

  const handleExperienceSelect = (value) => {
    setActiveExperience(activeExperience === value ? null : value);
    onFilterChange?.({ ...filters, experience: activeExperience === value ? null : value });
  };

  const handleReset = () => {
    setActiveTypes([]);
    setActiveSalary(null);
    setActiveExperience(null);
    onReset?.();
  };

  const hasActiveFilters = activeTypes.length > 0 || activeSalary || activeExperience;

  const panelContent = (
    <div className="flex flex-col gap-6 p-6">
      {/* Salary */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DollarSign className="size-4" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
            Mức lương
          </h4>
        </div>
        <div className="flex flex-col gap-1 pl-10">
          {SALARY_RANGES.map((item) => (
            <label
              key={item}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeSalary === item
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50 text-foreground'
              )}
            >
              <input
                type="radio"
                name="salary"
                checked={activeSalary === item}
                onChange={() => handleSalarySelect(item)}
                className="hidden"
              />
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all',
                  activeSalary === item ? 'border-primary bg-primary' : 'border-slate-300'
                )}
              >
                {activeSalary === item && (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-border" />

      {/* Job type */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Briefcase className="size-4" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
            Loại hình
          </h4>
        </div>
        <div className="flex flex-col gap-1 pl-10">
          {JOB_TYPES.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={activeTypes.includes(item)}
                onChange={() => handleTypeToggle(item)}
                className="size-4 rounded border-input text-primary focus:ring-primary"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-border" />

      {/* Experience */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <TrendingUp className="size-4" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-normal text-muted-foreground">
            Kinh nghiệm
          </h4>
        </div>
        <div className="flex flex-col gap-1 pl-10">
          {EXPERIENCE_LEVELS.map((item) => (
            <label
              key={item}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeExperience === item
                  ? 'bg-amber-50 text-amber-700'
                  : 'hover:bg-muted/50 text-foreground'
              )}
            >
              <input
                type="radio"
                name="experience"
                checked={activeExperience === item}
                onChange={() => handleExperienceSelect(item)}
                className="hidden"
              />
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all',
                  activeExperience === item ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                )}
              >
                {activeExperience === item && (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Filter className="size-4 text-emerald-500" />
          Bộ lọc
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-auto px-0 py-0 text-sm font-bold uppercase tracking-normal text-red-500 hover:text-red-600 hover:bg-transparent"
            >
              Đặt lại
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden h-auto px-0 py-0 text-sm font-bold uppercase tracking-normal text-primary hover:bg-transparent"
          >
            {isOpen ? 'Ẩn' : 'Mở rộng'}
            <ChevronDown
              size={14}
              className={cn('ml-1 transition-transform', isOpen && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* Desktop always visible */}
      <div className="hidden lg:block rounded-2xl border border-border/40 bg-white shadow-sm overflow-hidden">
        {panelContent}
      </div>

      {/* Mobile collapsible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm"
          >
            {panelContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

FilterPanel.propTypes = {
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  onReset: PropTypes.func,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * RecommendedJobs — Redesigned "Việc làm phù hợp" section
 *
 * @param {Array} jobs - Array of job objects
 * @param {Array} savedJobIds - Array of saved job IDs
 * @param {Function} onToggleSave - Callback when save/unsave is toggled
 * @param {string} title - Section title (default: "Việc làm phù hợp")
 * @param {boolean} showFilters - Whether to show filter panel
 * @param {string} sortBy - Current sort option ('match' | 'recent' | 'salary')
 * @param {Function} onSortChange - Callback when sort changes
 * @param {Object} filters - Active filters object
 * @param {Function} onFilterChange - Callback when filters change
 * @param {Function} onClearFilters - Callback to reset all filters
 * @param {boolean} loading - Loading state
 */
const EMPTY_FILTERS = Object.freeze({});

function normalizeFilters(filters) {
  return filters && typeof filters === 'object' ? filters : EMPTY_FILTERS;
}

function areRecommendedFiltersEqual(current = EMPTY_FILTERS, next = EMPTY_FILTERS) {
  const currentTypes = Array.isArray(current?.type) ? current.type : [];
  const nextTypes = Array.isArray(next?.type) ? next.type : [];

  if (current?.salary !== next?.salary) return false;
  if (current?.experience !== next?.experience) return false;
  if (currentTypes.length !== nextTypes.length) return false;

  return currentTypes.every((type, index) => type === nextTypes[index]);
}

const RecommendedJobs = ({
  jobs = [],
  savedJobIds = [],
  onToggleSave,
  title = 'Việc làm mới',
  showFilters = true,
  sortBy = 'recent',
  onSortChange,
  filters = EMPTY_FILTERS,
  onFilterChange,
  onClearFilters,
  loading = false,
}) => {
  const { showNotification } = useNotification();
  const [viewMode, setViewMode] = useState('grid');
  const [currentSort, setCurrentSort] = useState(sortBy);
  const [activeFilters, setActiveFilters] = useState(() => normalizeFilters(filters));

  const savedJobIdSet = useMemo(
    () => new Set((Array.isArray(savedJobIds) ? savedJobIds : []).map((id) => String(id))),
    [savedJobIds]
  );

  useEffect(() => {
    setCurrentSort(sortBy);
  }, [sortBy]);

  useEffect(() => {
    const nextFilters = normalizeFilters(filters);
    setActiveFilters((currentFilters) =>
      areRecommendedFiltersEqual(currentFilters, nextFilters) ? currentFilters : nextFilters
    );
  }, [filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        activeFilters?.salary ||
        activeFilters?.experience ||
        (Array.isArray(activeFilters?.type) && activeFilters.type.length > 0)
      ),
    [activeFilters]
  );

  const visibleJobs = useMemo(() => {
    let nextJobs = [...jobs];
    const activeTypes = Array.isArray(activeFilters?.type) ? activeFilters.type : [];

    if (activeTypes.length > 0) {
      nextJobs = nextJobs.filter((job) =>
        activeTypes.some((type) =>
          formatJobType(job.type || job.job_type || job.employment_type)
            .toLowerCase()
            .includes(String(type).toLowerCase())
        )
      );
    }

    if (activeFilters?.salary) {
      nextJobs = nextJobs.filter((job) => matchesSalaryFilter(job, activeFilters.salary));
    }

    if (activeFilters?.experience) {
      nextJobs = nextJobs.filter((job) => matchesExperienceFilter(job, activeFilters.experience));
    }

    return sortJobs(nextJobs, currentSort);
  }, [activeFilters, currentSort, jobs]);

  const handleToggleSave = async (job) => {
    try {
      await onToggleSave(job);
    } catch (err) {
      console.error('Failed to toggle save:', err);
      showNotification('Không thể lưu việc làm này', 'error');
    }
  };

  const handleShare = () => {
    showNotification('Đã sao chép liên kết!', 'success');
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters(EMPTY_FILTERS);
    onClearFilters?.();
  };

  const handleSortChange = (value) => {
    setCurrentSort(value);
    onSortChange?.(value);
  };

  const sortOptions = [
    { value: 'recent', label: 'Mới nhất' },
    { value: 'salary', label: 'Lương cao nhất' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Briefcase size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm font-medium text-slate-500">
              {loading ? 'Đang tải...' : `${visibleJobs.length} vị trí tuyển dụng`}
            </p>
          </div>
        </div>

        {/* Controls: Sort + View Mode */}
        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                  currentSort === opt.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-lg p-2 transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-50'
              )}
              title="Lưới"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-lg p-2 transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-50'
              )}
              title="Danh sách"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-8', showFilters && 'lg:grid-cols-[280px_1fr]')}>
        {/* Filter Sidebar */}
        {showFilters && (
          <aside className="space-y-4">
            <FilterPanel
              filters={activeFilters}
              onFilterChange={handleFilterChange}
              onReset={handleClearFilters}
            />
          </aside>
        )}

        {/* Job Grid / List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            <div
              className={cn(viewMode === 'grid' ? 'grid grid-cols-1 gap-6' : 'flex flex-col gap-4')}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl border border-slate-200 bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : visibleJobs.length === 0 ? (
            <EmptyJobsState
              onClearFilters={handleClearFilters}
              showResetAction={hasActiveFilters}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  viewMode === 'grid' ? 'grid grid-cols-1 gap-6' : 'flex flex-col gap-4'
                )}
              >
                {visibleJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={viewMode === 'list' ? 'max-w-full' : ''}
                  >
                    <JobCard
                      job={job}
                      onToggleSave={handleToggleSave}
                      isSaved={savedJobIdSet.has(String(job.id))}
                      onShare={handleShare}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {!loading && visibleJobs.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-emerald-200 px-8 py-3 font-bold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Link to="/candidate/jobs">
                  Xem thêm việc làm
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

RecommendedJobs.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      company_name: PropTypes.string,
      company_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      company_logo: PropTypes.string,
      location: PropTypes.string,
      address: PropTypes.string,
      salary_range: PropTypes.string,
      vacancies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      type: PropTypes.string,
      work_mode: PropTypes.string,
      deadline: PropTypes.string,
      skills: PropTypes.arrayOf(PropTypes.string),
      is_saved: PropTypes.bool,
      is_company_saved: PropTypes.bool,
    })
  ),
  savedJobIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onToggleSave: PropTypes.func,
  title: PropTypes.string,
  showFilters: PropTypes.bool,
  sortBy: PropTypes.string,
  onSortChange: PropTypes.func,
  filters: PropTypes.object,
  onFilterChange: PropTypes.func,
  onClearFilters: PropTypes.func,
  loading: PropTypes.bool,
};

RecommendedJobs.defaultProps = {
  jobs: [],
  savedJobIds: [],
  onToggleSave: () => {},
  title: 'Việc làm phù hợp',
  showFilters: true,
  sortBy: 'match',
  onSortChange: () => {},
  filters: {},
  onFilterChange: () => {},
  onClearFilters: () => {},
  loading: false,
};

export default RecommendedJobs;
