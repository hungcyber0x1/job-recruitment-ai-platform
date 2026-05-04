import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Video,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  APPLICATION_STATUS,
  getStatusLabel,
  normalizeApplicationStatus,
} from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import applicationService from '../../services/applicationService';
import jobService from '../../services/jobService';
import { normalizeAuthRole } from '@/utils/rolePaths';
import { cn } from '@/utils';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import InterviewScheduleDialog from '../../components/employer/InterviewScheduleDialog';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const SCHEDULABLE_STATUSES = new Set([
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
]);

const INTERVIEW_STATUS_CONFIG = {
  scheduled: {
    label: 'Đã lên lịch',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    accent: 'bg-emerald-500',
    iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    icon: CalendarPlus,
  },
  completed: {
    label: 'Đã phỏng vấn',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    accent: 'bg-blue-500',
    iconBox: 'bg-blue-50 text-blue-600 ring-blue-100',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Đã hủy',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    accent: 'bg-rose-500',
    iconBox: 'bg-rose-50 text-rose-600 ring-rose-100',
    icon: XCircle,
  },
  no_show: {
    label: 'Không tham dự',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    accent: 'bg-amber-500',
    iconBox: 'bg-amber-50 text-amber-600 ring-amber-100',
    icon: AlertCircle,
  },
};

const pad2 = (value) => String(value).padStart(2, '0');
const formatDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstWeekday = (year, month) => {
  const weekday = new Date(year, month, 1).getDay();
  return weekday === 0 ? 6 : weekday - 1;
};

const DATE_TABS = [
  { key: 'upcoming', label: 'Sắp tới', countKey: 'upcoming', icon: Clock, tone: 'emerald' },
  { key: 'today', label: 'Hôm nay', countKey: 'today', icon: AlertCircle, tone: 'amber' },
  { key: 'past', label: 'Đã qua', countKey: 'past', icon: CheckCircle2, tone: 'blue' },
  { key: 'all', label: 'Tất cả', countKey: 'total', icon: Calendar, tone: 'slate' },
];

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    accent: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-700',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    accent: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-slate-400',
    soft: 'bg-slate-50 text-slate-700',
  },
};

const toneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.slate;

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const parseDateTime = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
};

const formatMonthLabel = (year, month) => `${MONTHS[month]} ${year}`;

const formatCompactNumber = (value) =>
  new Intl.NumberFormat('vi-VN', {
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const getCandidateName = (application = {}, fallback = '') =>
  application.candidate_name ||
  [application.first_name, application.last_name].filter(Boolean).join(' ').trim() ||
  application.email ||
  fallback ||
  'Ứng viên';

const getCandidateInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'UV';

const getInterviewTypeMeta = (type) => {
  if (type === 'phone')
    return {
      label: 'Điện thoại',
      icon: Phone,
      badge: 'bg-amber-50 text-amber-700 ring-amber-200',
      locationFallback: 'Gọi điện trực tiếp',
    };
  if (type === 'offline')
    return {
      label: 'Trực tiếp',
      icon: MapPin,
      badge: 'bg-blue-50 text-blue-700 ring-blue-200',
      locationFallback: 'Văn phòng công ty',
    };
  return {
    label: 'Trực tuyến',
    icon: Video,
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    locationFallback: 'Liên kết họp trực tuyến',
  };
};

const buildContext = ({ application, candidateName, jobTitle }) => {
  const normalizedStatus = application?.status
    ? normalizeApplicationStatus(application.status)
    : null;
  return {
    applicationId: application?.id || null,
    name: getCandidateName(application, candidateName),
    role: application?.job_title || jobTitle || 'Chưa có vị trí',
    status: normalizedStatus,
    statusLabel: normalizedStatus ? getStatusLabel(normalizedStatus) : 'Chưa gắn hồ sơ',
    resumeUrl: application?.resume_url || '',
    appliedAt: application?.applied_at || application?.created_at || null,
  };
};

const normalizeInterview = (interview) => {
  const startAt = parseDateTime(interview.scheduled_at);
  const duration = Number(interview.duration_minutes || 60);
  const endAt = startAt ? new Date(startAt.getTime() + duration * 60 * 1000) : null;
  return {
    ...interview,
    startAt,
    endAt,
    dateKey: startAt ? formatDateKey(startAt) : '',
    timeRange:
      startAt && endAt
        ? `${timeFormatter.format(startAt)} - ${timeFormatter.format(endAt)}`
        : 'Chưa rõ giờ',
    candidateName:
      interview.candidate_name ||
      [interview.first_name, interview.last_name].filter(Boolean).join(' ').trim() ||
      'Ứng viên',
    jobTitle: interview.job_title || 'Chưa rõ vị trí',
    status: interview.status || 'scheduled',
  };
};

const normalizeScheduleCandidate = (application, job = {}) => {
  const normalizedStatus = normalizeApplicationStatus(
    application?.status || APPLICATION_STATUS.SUBMITTED
  );
  if (!SCHEDULABLE_STATUSES.has(normalizedStatus)) return null;
  const appliedAtSource = application?.applied_at || application?.created_at || null;
  const appliedAt = parseDateTime(appliedAtSource);
  const resolvedJobTitle = job.title || job.job_title || application?.job_title || 'Chưa rõ vị trí';
  return {
    ...application,
    jobId: job.id || application?.job_id || null,
    jobTitle: resolvedJobTitle,
    job_title: resolvedJobTitle,
    name: getCandidateName(application),
    email: application?.email || application?.candidate_email || '',
    status: normalizedStatus,
    statusLabel: getStatusLabel(normalizedStatus),
    appliedAt,
    appliedAtLabel: appliedAt ? appliedAt.toLocaleDateString('vi-VN') : 'Chưa rõ ngày nộp',
  };
};

// ─── Shared Components ───────────────────────────────────────────────────────

function SidebarCard({ title, icon: Icon, children, className }) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
        <h3 className="!text-sm font-bold text-slate-950">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StageTabButton({ tab, count, active, onClick }) {
  const TabIcon = tab.icon || Calendar;
  const styles = toneStyle(tab.tone || 'slate');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors duration-200',
        active
          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
      )}
    >
      <TabIcon className="h-3.5 w-3.5" />
      <span>{tab.label}</span>
      <span
        className={cn(
          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
          active ? 'bg-white/20 text-white' : styles.soft
        )}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

function QuickActionItem({ icon: Icon, title, to, tone = 'slate', onClick, disabled = false }) {
  const ActionIcon = Icon || Calendar;
  const isPrimary = tone === 'emerald';
  const className = cn(
    'h-11 w-full justify-start rounded-xl px-4 text-sm font-semibold shadow-sm shadow-slate-950/[0.03] sm:w-auto',
    isPrimary
      ? 'border-slate-950 bg-slate-950 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500'
      : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700'
  );
  const iconClass = isPrimary
    ? 'text-white'
    : tone === 'blue'
      ? 'text-sky-600'
      : tone === 'rose'
        ? 'text-rose-600'
        : 'text-emerald-600';
  const content = (
    <>
      <ActionIcon className={cn('mr-2 h-4 w-4', iconClass)} />
      {title}
    </>
  );

  if (to) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link to={to}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {content}
    </Button>
  );
}

function CompactInterviewCard({ item, updating, onUpdateStatus, applicationBasePath, isAdmin }) {
  const cfg = INTERVIEW_STATUS_CONFIG[item.status] || INTERVIEW_STATUS_CONFIG.scheduled;
  const StatusIcon = cfg.icon;
  const typeMeta = getInterviewTypeMeta(item.interview_type);
  const TypeIcon = typeMeta.icon;
  const isScheduled = item.status === 'scheduled';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', cfg.accent)} />
      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ring-1 ring-inset',
            cfg.iconBox
          )}
        >
          {getCandidateInitials(item.candidateName)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-950">{item.candidateName}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                cfg.badge
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                typeMeta.badge
              )}
            >
              <TypeIcon className="h-3 w-3" />
              {typeMeta.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{item.jobTitle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateLabel(item.dateKey)} · {item.timeRange}
            </span>
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3 w-3" />
              {item.location || typeMeta.locationFallback}
            </span>
          </div>
          {item.candidate_note && (
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              {item.candidate_note}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 rounded-md border-slate-200 px-2 text-xs font-bold"
          >
            <Link to={`${applicationBasePath}/${item.application_id}`}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
          {!isAdmin && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-8 rounded-md border-slate-200 px-2 text-xs font-bold"
            >
              <Link
                to={`/employer/messages?applicationId=${item.application_id}&candidateName=${encodeURIComponent(item.candidateName)}&jobTitle=${encodeURIComponent(item.jobTitle)}`}
              >
                <MessageSquare className="h-3 w-3" />
              </Link>
            </Button>
          )}
          {isScheduled && (
            <>
              <Button
                type="button"
                size="sm"
                disabled={updating}
                onClick={() => onUpdateStatus(item.id, 'completed')}
                className="h-8 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={() => onUpdateStatus(item.id, 'cancelled')}
                className="h-8 rounded-md border-rose-200 px-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({
  visibleMonth,
  setVisibleMonth,
  selectedDate,
  setSelectedDate,
  interviewsByDate,
  todayKey,
  today,
}) {
  const calendarCells = useMemo(() => {
    const cells = [];
    const totalDays = getDaysInMonth(visibleMonth.year, visibleMonth.month);
    const firstWeekday = getFirstWeekday(visibleMonth.year, visibleMonth.month);
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= totalDays; day++) {
      const date = `${visibleMonth.year}-${pad2(visibleMonth.month + 1)}-${pad2(day)}`;
      cells.push({ day, date, events: interviewsByDate[date] || [] });
    }
    return cells;
  }, [visibleMonth, interviewsByDate]);

  const monthCount = calendarCells.reduce((t, c) => t + (c?.events.length || 0), 0);

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-950">
          {formatMonthLabel(visibleMonth.year, visibleMonth.month)}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              setVisibleMonth((prev) => {
                const m = prev.month - 1;
                return m < 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: m };
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() =>
              setVisibleMonth((prev) => {
                const m = prev.month + 1;
                return m > 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: m };
              })
            }
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarCells.map((cell, idx) =>
          cell ? (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-md text-xs font-bold transition-all',
                cell.date === selectedDate
                  ? 'bg-emerald-600 text-white'
                  : cell.date === todayKey
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-emerald-50'
              )}
            >
              {cell.day}
              {cell.events.length > 0 && (
                <span
                  className={cn(
                    'absolute bottom-0.5 h-1 w-1 rounded-full',
                    cell.date === selectedDate ? 'bg-white' : 'bg-emerald-500'
                  )}
                />
              )}
            </button>
          ) : (
            <div key={`empty-${idx}`} />
          )
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
        <span className="text-xs font-semibold text-slate-500">{monthCount} lịch tháng này</span>
        <button
          type="button"
          onClick={() => {
            setVisibleMonth({ year: today.getFullYear(), month: today.getMonth() });
            setSelectedDate(todayKey);
          }}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
        >
          Về hôm nay
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewSchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const applicationId = searchParams.get('applicationId');
  const candidateName = searchParams.get('candidateName') || '';
  const jobTitle = searchParams.get('jobTitle') || '';
  const userRole = normalizeAuthRole(user?.role);
  const isAdmin = userRole === 'admin';
  const applicationBasePath = isAdmin ? '/admin/applications' : '/employer/applications';
  const contextListPath = isAdmin ? '/admin/applications' : '/employer/applications';

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const todayKey = formatDateKey(today);

  const [context, setContext] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(Boolean(applicationId));
  const [scheduleCandidates, setScheduleCandidates] = useState([]);
  const [scheduleCandidatesLoading, setScheduleCandidatesLoading] = useState(!isAdmin);
  const [scheduleCandidatesError, setScheduleCandidatesError] = useState('');
  const [error, setError] = useState('');
  const [visibleMonth, setVisibleMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [candidateQuery, setCandidateQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // ── Data Loading ────────────────────────────────────────────────────────────

  const loadContext = useCallback(async () => {
    if (!applicationId) {
      setContext(
        candidateName || jobTitle
          ? buildContext({ application: null, candidateName, jobTitle })
          : null
      );
      setContextLoading(false);
      return;
    }
    setContextLoading(true);
    try {
      const response = await applicationService.getApplication(applicationId);
      setContext(
        buildContext({ application: response.data?.data || null, candidateName, jobTitle })
      );
    } catch (fetchError) {
      console.error('Failed to load application context:', fetchError);
      showNotification('Không tải được hồ sơ.', 'error');
      setContext(
        candidateName || jobTitle
          ? buildContext({ application: null, candidateName, jobTitle })
          : null
      );
    } finally {
      setContextLoading(false);
    }
  }, [applicationId, candidateName, jobTitle, showNotification]);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await applicationService.getCompanyInterviews();
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      setInterviews(list.map(normalizeInterview).filter((item) => item.startAt));
    } catch (fetchError) {
      console.error('Failed to load interviews:', fetchError);
      setInterviews([]);
      setError(fetchError?.response?.data?.message || 'Không tải được lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadScheduleCandidates = useCallback(async () => {
    if (isAdmin) {
      setScheduleCandidates([]);
      setScheduleCandidatesError('');
      setScheduleCandidatesLoading(false);
      return;
    }
    setScheduleCandidatesLoading(true);
    setScheduleCandidatesError('');
    try {
      const jobsResponse = await jobService.getMyJobs();
      const jobs = Array.isArray(jobsResponse.data?.data) ? jobsResponse.data.data : [];
      if (!jobs.length) {
        setScheduleCandidates([]);
        return;
      }
      const responses = await Promise.allSettled(
        jobs.map((job) => applicationService.getJobApplications(job.id))
      );
      const candidates = responses
        .flatMap((response, index) => {
          const job = jobs[index];
          if (response.status !== 'fulfilled') return [];
          const applications = Array.isArray(response.value.data?.data)
            ? response.value.data.data
            : [];
          return applications.map((app) => normalizeScheduleCandidate(app, job)).filter(Boolean);
        })
        .sort((a, b) => (b.appliedAt?.getTime?.() || 0) - (a.appliedAt?.getTime?.() || 0));
      setScheduleCandidates(candidates);
    } catch (fetchError) {
      console.error('Failed to load candidates:', fetchError);
      setScheduleCandidates([]);
    } finally {
      setScheduleCandidatesLoading(false);
    }
  }, [isAdmin]);

  const handleSelectCandidate = useCallback(
    (candidate) => {
      if (!candidate?.id) return;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('applicationId', String(candidate.id));
      nextParams.set('candidateName', candidate.name || getCandidateName(candidate));
      nextParams.set('jobTitle', candidate.jobTitle || candidate.job_title || '');
      setSearchParams(nextParams, { replace: true });
      setContext(
        buildContext({
          application: candidate,
          candidateName: candidate.name,
          jobTitle: candidate.jobTitle || candidate.job_title,
        })
      );
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    loadContext();
  }, [loadContext]);
  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);
  useEffect(() => {
    loadScheduleCandidates();
  }, [loadScheduleCandidates]);

  // ── Derived Data ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: interviews.length,
      upcoming: interviews.filter((item) => item.status === 'scheduled' && item.startAt >= now)
        .length,
      today: interviews.filter((item) => item.status === 'scheduled' && item.dateKey === todayKey)
        .length,
      past: interviews.filter(
        (item) =>
          item.startAt < today || ['completed', 'cancelled', 'no_show'].includes(item.status)
      ).length,
      completed: interviews.filter((item) => item.status === 'completed').length,
      cancelled: interviews.filter((item) => ['cancelled', 'no_show'].includes(item.status)).length,
    };
  }, [interviews, today, todayKey]);

  const filteredInterviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    return interviews.filter((item) => {
      const matchesSearch =
        !query ||
        item.candidateName.toLowerCase().includes(query) ||
        item.jobTitle.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && item.dateKey === todayKey) ||
        (dateFilter === 'upcoming' && item.status === 'scheduled' && item.startAt >= now) ||
        (dateFilter === 'past' &&
          (item.startAt < today || ['completed', 'cancelled', 'no_show'].includes(item.status)));
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, interviews, searchQuery, statusFilter, today, todayKey]);

  const interviewsByDate = useMemo(
    () =>
      filteredInterviews.reduce((acc, item) => {
        acc[item.dateKey] = [...(acc[item.dateKey] || []), item];
        return acc;
      }, {}),
    [filteredInterviews]
  );

  const selectedEvents = useMemo(
    () =>
      [...(interviewsByDate[selectedDate] || [])].sort(
        (a, b) => a.startAt.getTime() - b.startAt.getTime()
      ),
    [interviewsByDate, selectedDate]
  );

  const nextInterview = useMemo(() => {
    const now = new Date();
    return (
      [...interviews]
        .filter((item) => item.status === 'scheduled' && item.startAt >= now)
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] || null
    );
  }, [interviews]);

  const visibleMonthCount = useMemo(
    () => Object.values(interviewsByDate).reduce((t, evs) => t + evs.length, 0),
    [interviewsByDate]
  );

  const filteredScheduleCandidates = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase();
    if (!query) return scheduleCandidates;
    return scheduleCandidates.filter((c) =>
      [c.name, c.jobTitle, c.email].filter(Boolean).some((v) => v.toLowerCase().includes(query))
    );
  }, [candidateQuery, scheduleCandidates]);

  const canSchedule = context?.applicationId && SCHEDULABLE_STATUSES.has(context.status);

  const orderedFilteredInterviews = useMemo(
    () => [...filteredInterviews].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    [filteredInterviews]
  );

  const activeDateLabel = DATE_TABS.find((tab) => tab.key === dateFilter)?.label || 'Tất cả';
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || statusFilter !== 'all' || dateFilter !== 'upcoming';

  const activeFilterBadges = useMemo(() => {
    const badges = [];
    const keyword = searchQuery.trim();
    if (keyword) badges.push(`Từ khóa: ${keyword}`);
    if (dateFilter !== 'upcoming') badges.push(`Khoảng lịch: ${activeDateLabel}`);
    if (statusFilter !== 'all') {
      badges.push(`Trạng thái: ${INTERVIEW_STATUS_CONFIG[statusFilter]?.label || 'Không rõ'}`);
    }
    return badges;
  }, [activeDateLabel, dateFilter, searchQuery, statusFilter]);

  const overviewCards = [
    {
      icon: Calendar,
      label: 'Tổng lịch',
      value: loading ? '...' : formatCompactNumber(stats.total),
      helper: 'Toàn bộ lịch phỏng vấn của công ty',
      tone: 'slate',
    },
    {
      icon: Clock,
      label: 'Sắp tới',
      value: loading ? '...' : formatCompactNumber(stats.upcoming),
      helper: 'Lịch đang chờ diễn ra',
      tone: 'emerald',
    },
    {
      icon: AlertCircle,
      label: 'Hôm nay',
      value: loading ? '...' : formatCompactNumber(stats.today),
      helper: 'Các buổi phỏng vấn trong ngày',
      tone: 'amber',
    },
    {
      icon: CheckCircle2,
      label: 'Hoàn tất',
      value: loading ? '...' : formatCompactNumber(stats.completed),
      helper: 'Ứng viên đã được phỏng vấn',
      tone: 'blue',
    },
    {
      icon: XCircle,
      label: 'Đã hủy',
      value: loading ? '...' : formatCompactNumber(stats.cancelled),
      helper: 'Lịch hủy hoặc không tham dự',
      tone: 'rose',
    },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleScheduleConfirm = async (metadata) => {
    if (!context?.applicationId) return;
    setSavingSchedule(true);
    try {
      await applicationService.updateStatus(
        context.applicationId,
        APPLICATION_STATUS.INTERVIEW_SCHEDULED,
        metadata,
        'Sắp lịch phỏng vấn'
      );
      showNotification('Đã lưu lịch phỏng vấn.', 'success');
      setScheduleOpen(false);
      await Promise.all([loadContext(), loadInterviews()]);
    } catch (scheduleError) {
      console.error('Failed to save:', scheduleError);
      showNotification(
        scheduleError?.response?.data?.message || 'Không lưu được lịch phỏng vấn.',
        'error'
      );
      throw scheduleError;
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleUpdateInterviewStatus = async (interviewId, status) => {
    setUpdatingId(interviewId);
    try {
      await applicationService.updateInterviewStatus(interviewId, status);
      showNotification(
        status === 'completed'
          ? 'Đã chuyển hồ sơ sang trạng thái đã phỏng vấn.'
          : 'Đã cập nhật lịch phỏng vấn.',
        'success'
      );
      await Promise.all([loadContext(), loadInterviews()]);
    } catch (updateError) {
      console.error('Failed to update:', updateError);
      showNotification(
        updateError?.response?.data?.message || 'Không cập nhật được lịch phỏng vấn.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (contextLoading && loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-bold text-slate-500">Đang tải lịch phỏng vấn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-transparent">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-7 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm shadow-slate-950/10">
                <Calendar className="h-6 w-6" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                  <Clock className="h-3.5 w-3.5" />
                  Điều phối phỏng vấn
                </span>
                <h1 className="mt-3 max-w-[13ch] break-words !text-2xl !font-bold !leading-tight tracking-normal text-slate-950 sm:max-w-none sm:!text-[2.35rem]">
                  Lịch phỏng vấn
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                  {context?.applicationId
                    ? `${context.name} · ${context.role} · ${context.statusLabel}`
                    : 'Theo dõi lịch sắp tới, chọn hồ sơ và cập nhật trạng thái phỏng vấn trong một không gian thống nhất.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <QuickActionItem
                icon={Plus}
                title={savingSchedule ? 'Đang lưu' : 'Sắp lịch'}
                tone="emerald"
                onClick={() => setScheduleOpen(true)}
                disabled={!canSchedule || savingSchedule}
              />
              <QuickActionItem
                icon={RotateCcw}
                title={loading ? 'Đang tải lại' : 'Tải lại lịch'}
                tone="blue"
                onClick={loadInterviews}
                disabled={loading}
              />
              <QuickActionItem
                icon={Eye}
                title="Pipeline ứng viên"
                to={contextListPath}
                tone="slate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {overviewCards.map((card) => (
              <EmployerStatCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.03]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Bộ lọc nhanh
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Đang xem {activeDateLabel.toLowerCase()} với {orderedFilteredInterviews.length} lịch
                trong bộ lọc.
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {DATE_TABS.map((tab) => (
                <StageTabButton
                  key={tab.key}
                  tab={tab}
                  count={loading ? '...' : formatCompactNumber(stats[tab.countKey] || 0)}
                  active={dateFilter === tab.key}
                  onClick={() => setDateFilter(tab.key)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.03]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo ứng viên, vị trí..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-none lg:w-[210px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="completed">Đã phỏng vấn</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="no_show">Không tham dự</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('upcoming');
                }}
                className="h-12 rounded-xl border-slate-200 px-4 text-sm font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
              >
                Xóa lọc
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Hiển thị {orderedFilteredInterviews.length}/{stats.total} lịch
            </span>
            {activeFilterBadges.map((badge) => (
              <span key={badge} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                {badge}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Danh sách lịch
                </p>
                <h2 className="mt-1 !text-lg !font-bold !leading-tight tracking-normal text-slate-950">
                  {activeDateLabel}
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                <Calendar className="h-3.5 w-3.5" />
                {loading ? 'Đang tải' : `${orderedFilteredInterviews.length} lịch`}
              </span>
            </div>

            <div className="p-3 sm:p-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orderedFilteredInterviews.length ? (
                <div className="space-y-3">
                  {orderedFilteredInterviews.slice(0, 20).map((item) => (
                    <CompactInterviewCard
                      key={item.id}
                      item={item}
                      updating={updatingId === item.id}
                      onUpdateStatus={handleUpdateInterviewStatus}
                      applicationBasePath={applicationBasePath}
                      isAdmin={isAdmin}
                    />
                  ))}
                  {orderedFilteredInterviews.length > 20 && (
                    <p className="rounded-lg bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-500">
                      Hiển thị 20/{orderedFilteredInterviews.length} lịch. Điều chỉnh bộ lọc để thu
                      hẹp kết quả.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
                  <Calendar className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">Chưa có lịch trong bộ lọc</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    Thử đổi tab thời gian, trạng thái hoặc chọn hồ sơ ứng viên để tạo lịch mới.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <SidebarCard title="Lịch tháng" icon={Calendar}>
              <MiniCalendar
                visibleMonth={visibleMonth}
                setVisibleMonth={setVisibleMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                interviewsByDate={interviewsByDate}
                todayKey={todayKey}
                today={today}
              />
            </SidebarCard>

            <SidebarCard title="Ngày đang chọn" icon={Clock}>
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-950">
                    {formatDateLabel(selectedDate)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedEvents.length} lịch trong ngày
                  </p>
                </div>
                {selectedEvents.length ? (
                  <div className="space-y-2">
                    {selectedEvents.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-xs font-bold text-slate-950">
                            {item.candidateName}
                          </p>
                          <span className="shrink-0 text-xs font-bold text-emerald-700">
                            {item.timeRange}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {item.jobTitle}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
                    Không có lịch trong ngày này
                  </div>
                )}
              </div>
            </SidebarCard>

            {nextInterview && (
              <SidebarCard title="Lịch gần nhất" icon={Clock}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-black text-emerald-600 ring-1 ring-emerald-100">
                      {getCandidateInitials(nextInterview.candidateName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950">
                        {nextInterview.candidateName}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {nextInterview.jobTitle}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateLabel(nextInterview.dateKey)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Clock className="h-3.5 w-3.5" />
                      {nextInterview.timeRange}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      {(() => {
                        const meta = getInterviewTypeMeta(nextInterview.interview_type);
                        const TypeIcon = meta.icon;
                        return (
                          <>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {nextInterview.location || meta.locationFallback}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </SidebarCard>
            )}

            <SidebarCard title="Hồ sơ đang chọn" icon={Eye}>
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3">
                  <p className="text-sm font-bold text-slate-950">
                    {context?.name || 'Chưa chọn hồ sơ'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {context?.applicationId
                      ? `${context.role} · ${context.statusLabel}`
                      : 'Chọn một hồ sơ để sắp lịch'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {context?.applicationId ? (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                      >
                        <Link to={`${applicationBasePath}/${context.applicationId}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Hồ sơ
                        </Link>
                      </Button>
                      {context.resumeUrl && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg border-slate-200 text-xs font-bold"
                        >
                          <a href={context.resumeUrl} target="_blank" rel="noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            CV
                          </a>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="col-span-2 h-9 rounded-lg border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                    >
                      <Link to={contextListPath}>
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Chọn hồ sơ
                      </Link>
                    </Button>
                  )}
                </div>
                {context?.applicationId && !canSchedule && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Hồ sơ không còn ở trạng thái có thể sắp lịch.
                  </div>
                )}
              </div>
            </SidebarCard>

            {!isAdmin && (
              <SidebarCard title="Hồ sơ chờ sắp lịch" icon={CalendarPlus}>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={candidateQuery}
                      onChange={(e) => setCandidateQuery(e.target.value)}
                      placeholder="Tìm ứng viên..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  {scheduleCandidatesError && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {scheduleCandidatesError}
                    </div>
                  )}
                  {scheduleCandidatesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : scheduleCandidates.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center">
                      <Calendar className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Chưa có hồ sơ trong lựa chọn
                      </p>
                    </div>
                  ) : filteredScheduleCandidates.length === 0 ? (
                    <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
                      Không tìm thấy ứng viên khớp bộ lọc
                    </div>
                  ) : (
                    <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {filteredScheduleCandidates.slice(0, 8).map((candidate) => {
                        const selected =
                          String(candidate.id) === String(context?.applicationId || '');
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => handleSelectCandidate(candidate)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                              selected
                                ? 'border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-200'
                                : 'border-slate-200 hover:border-emerald-200'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ring-1 ring-inset',
                                selected
                                  ? 'bg-emerald-600 text-white ring-emerald-600'
                                  : 'bg-slate-100 text-slate-700 ring-slate-200'
                              )}
                            >
                              {getCandidateInitials(candidate.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-slate-950">
                                {candidate.name}
                              </p>
                              <p className="truncate text-xs font-medium text-slate-500">
                                {candidate.jobTitle}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                                selected
                                  ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-500'
                              )}
                            >
                              {selected ? 'Đang chọn' : candidate.statusLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SidebarCard>
            )}

            <SidebarCard title="Thống kê tháng" icon={Calendar}>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-500">Tháng này</span>
                  <span className="text-sm font-bold text-slate-950">{visibleMonthCount} lịch</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
                  <span className="text-xs font-medium text-emerald-700">Hôm nay</span>
                  <span className="text-sm font-bold text-emerald-700">{stats.today}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-2">
                  <span className="text-xs font-medium text-blue-700">Hoàn tất</span>
                  <span className="text-sm font-bold text-blue-700">{stats.completed}</span>
                </div>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </main>

      {scheduleOpen && context?.applicationId && (
        <InterviewScheduleDialog
          applicantName={context.name}
          jobTitle={context.role}
          initialDate={selectedDate >= todayKey ? selectedDate : todayKey}
          onConfirm={handleScheduleConfirm}
          onCancel={() => setScheduleOpen(false)}
        />
      )}
    </div>
  );
}
