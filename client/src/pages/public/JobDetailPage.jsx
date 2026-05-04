import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ApplyModal from '../../components/candidate/jobs/ApplyModal';
import api from '../../services/api';
import applicationService from '../../services/applicationService';
import candidateService from '../../services/candidateService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';
import { getInitials, resolveMediaUrl } from '../../utils';
import { sanitizeHtml, decodeHtml } from '../../utils/sanitizeHtml';

const formatSalaryRange = (min, max) => {
  const fmt = (v) => {
    if (v == null || Number.isNaN(Number(v))) return null;
    const numericValue = Number(v);
    if (numericValue <= 0) return null;
    if (numericValue >= 1_000_000) {
      const millions = Math.round((numericValue / 1_000_000) * 10) / 10;
      return `${millions.toLocaleString('vi-VN', {
        minimumFractionDigits: Number.isInteger(millions) ? 0 : 1,
        maximumFractionDigits: 1,
      })} triệu`;
    }
    return numericValue.toLocaleString('vi-VN');
  };
  const lo = fmt(min);
  const hi = fmt(max);
  if (!lo && !hi) return 'Thỏa thuận';
  if (lo && hi) {
    if (lo.endsWith(' triệu') && hi.endsWith(' triệu')) {
      return `${lo.replace(/ triệu$/, '')}–${hi.replace(/ triệu$/, '')} triệu`;
    }
    return `${lo}–${hi}`;
  }
  if (lo) return `Từ ${lo}`;
  return `Đến ${hi}`;
};

const formatJobTypeVi = (type) => {
  if (!type) return 'Việc làm';
  const t = String(type).toLowerCase().replace(/_/g, '-');
  const map = {
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    contract: 'Hợp đồng',
    freelance: 'Tự do',
    internship: 'Thực tập',
    remote: 'Làm việc từ xa',
  };
  return map[t] || type;
};

const formatExperienceVi = (value) => {
  if (value == null || String(value).trim() === '') return null;
  const s = String(value).trim();
  const key = s.toLowerCase().replace(/[_\s]+/g, '-');
  const map = {
    entry: 'Mới đi làm',
    'entry-level': 'Mới đi làm',
    fresher: 'Fresher',
    intern: 'Thực tập',
    internship: 'Thực tập',
    junior: 'Cơ bản',
    mid: 'Trung cấp',
    middle: 'Trung cấp',
    senior: 'Cấp cao',
    lead: 'Trưởng nhóm',
    manager: 'Quản lý',
  };
  if (map[key]) return map[key];

  const range = /^(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?|yr)$/i.exec(s);
  if (range) return `${range[1]} - ${range[2]} năm kinh nghiệm`;
  const y = /^(\d+)\s*(?:years?|yrs?|yr)$/i.exec(s);
  if (y) return `${y[1]} năm kinh nghiệm`;
  const plus = /^(\d+)\s*\+\s*(?:years?|yrs?|yr)$/i.exec(s);
  if (plus) return `${plus[1]}+ năm kinh nghiệm`;
  return s;
};

const stripHtmlToText = (value) =>
  decodeHtml(String(value || ''))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasMeaningfulContent = (value) => stripHtmlToText(value).length > 0;

const normalizeHeadingText = (value) =>
  stripHtmlToText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const removeDuplicateSectionHeadings = (html, sectionTitle) => {
  const normalizedTitle = normalizeHeadingText(sectionTitle);
  if (!normalizedTitle) return html;

  return String(html || '').replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (match, _level, headingContent) =>
      normalizeHeadingText(headingContent) === normalizedTitle ? '' : match
  );
};

const getSafeSectionHtml = (value, fallbackHtml, sectionTitle = '') => {
  const safeHtml = hasMeaningfulContent(value) ? sanitizeHtml(value) : sanitizeHtml(fallbackHtml);
  return removeDuplicateSectionHeadings(safeHtml, sectionTitle);
};

const getJobStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  const map = {
    published: 'Đang nhận hồ sơ',
    approved: 'Đã duyệt',
    pending_review: 'Chờ duyệt',
    draft: 'Bản nháp',
    expired: 'Hết hạn',
    closed: 'Đã đóng',
    suspended: 'Tạm dừng',
    rejected: 'Bị từ chối',
  };
  return map[normalized] || 'Đang cập nhật';
};

const getApplyActionState = ({ job, isExpired, isApplied }) => {
  const status = String(job?.status || '').toLowerCase();
  if (isApplied) {
    return {
      disabled: true,
      label: 'Đã ứng tuyển',
      helper: 'Hồ sơ của bạn đã nằm trong pipeline tuyển dụng.',
      tone: 'applied',
    };
  }
  if (isExpired || status === 'expired' || status === 'closed') {
    return {
      disabled: true,
      label: 'Đã hết hạn ứng tuyển',
      helper: 'Tin đăng đã qua hạn nhận hồ sơ.',
      tone: 'closed',
    };
  }
  if (status && status !== 'published') {
    return {
      disabled: true,
      label: 'Chưa nhận hồ sơ',
      helper: 'Tin đăng chưa mở để nhận ứng tuyển mới.',
      tone: 'closed',
    };
  }
  return {
    disabled: false,
    label: 'Ứng tuyển ngay',
    helper: 'Nộp CV và theo dõi trạng thái trong khu vực ứng viên.',
    tone: 'open',
  };
};

const normalizeUrlLabel = (url) =>
  String(url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

const getExternalHref = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];
  return value
    .split(value.includes('||') ? '||' : ',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const addCurrencySuffix = (salaryLabel) => {
  if (!salaryLabel || salaryLabel === 'Thỏa thuận') return salaryLabel || 'Thỏa thuận';
  return /(vnd|vnđ|đ|usd|\$)/i.test(salaryLabel) ? salaryLabel : `${salaryLabel} VNĐ`;
};

const localizeInlineJobText = (value) =>
  String(value || '')
    .replace(/\ballowance\b/gi, 'phụ cấp')
    .replace(/\bbonus\b/gi, 'thưởng');

const getCompactDateLabel = (value) => {
  const parsedDate = value ? new Date(value) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return 'Không giới hạn';
  }

  return parsedDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getSalaryCardCopy = (salaryLabel, salaryNegotiable) => {
  const localized = localizeInlineJobText(salaryLabel).trim();
  if (!localized || salaryNegotiable || localized === 'Thỏa thuận') {
    return {
      value: 'Thỏa thuận',
      meta: 'Thương lượng',
    };
  }

  const hasAllowance = /\+\s*phụ cấp/i.test(localized);
  const compactValue = localized.replace(/\s*\+\s*phụ cấp\b/i, '').trim();

  return {
    value: compactValue || localized,
    meta: hasAllowance ? 'Kèm phụ cấp' : 'Gross / tháng',
  };
};

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const pillToneClass = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
};

const InfoPill = ({ icon: Icon, children, tone = 'slate' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${pillToneClass[tone] || pillToneClass.slate}`}
  >
    {Icon ? <Icon size={13} className="shrink-0" aria-hidden /> : null}
    {children}
  </span>
);

const SummaryTile = ({ icon: Icon, label, value, tone = 'emerald' }) => {
  const iconTone = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone];

  return (
    <div className="flex h-full min-h-[92px] flex-col rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${iconTone}`}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 break-words text-[15px] font-bold leading-5 text-slate-900">
        {value || '--'}
      </p>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, eyebrow, title, tone = 'emerald' }) => {
  const iconTone = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone];

  return (
    <div className="mb-4 flex items-start gap-3 border-b border-slate-100 pb-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${iconTone}`}
      >
        <Icon size={18} aria-hidden />
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">{eyebrow}</p>
        <h2 className="mt-0.5 text-lg font-bold text-slate-950">{title}</h2>
      </div>
    </div>
  );
};

const DetailSection = ({ icon, eyebrow, title, html, tone }) => (
  <Card className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <SectionHeader icon={icon} eyebrow={eyebrow} title={title} tone={tone} />
    <div
      className="prose prose-slate max-w-none text-sm leading-7 text-slate-600 prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-bold prose-headings:leading-tight prose-headings:tracking-normal prose-headings:text-slate-950 prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-li:pl-0 prose-li:marker:text-emerald-500 prose-strong:text-slate-950 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </Card>
);

const WorkflowStep = ({ icon: Icon, title, text, active = false }) => (
  <div
    className={`rounded-lg border p-3 ${
      active ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/70'
    }`}
  >
    <div className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-slate-600 shadow-sm'
        }`}
      >
        <Icon size={15} aria-hidden />
      </span>
      <p className="text-sm font-bold text-slate-950">{title}</p>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
  </div>
);

const SidebarFact = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
    <Icon size={17} className="mt-0.5 text-emerald-600" aria-hidden />
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const avatarBackgroundHex = (companyName) => {
  const palette = ['0d9488', '0f766e', '115e59', '047857', '059669', '134e4a', '0e7490', '155e75'];
  const source = String(companyName || 'C');
  const hash = Array.from(source).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

const CompanyLogo = ({ src, companyName, compact = false }) => {
  const [failedLogoSrc, setFailedLogoSrc] = useState('');
  const logoSrc = useMemo(() => resolveMediaUrl(src), [src]);
  const initials = useMemo(() => getInitials(companyName).slice(0, 2), [companyName]);
  const backgroundColor = useMemo(() => `#${avatarBackgroundHex(companyName)}`, [companyName]);
  const shouldShowLogo = Boolean(logoSrc && failedLogoSrc !== logoSrc);

  if (shouldShowLogo) {
    return (
      <img
        key={logoSrc}
        src={logoSrc}
        alt={companyName}
        className="h-full w-full object-contain"
        onError={() => setFailedLogoSrc(logoSrc)}
      />
    );
  }

  if (initials && initials !== '?') {
    return (
      <span
        className={`flex h-full w-full select-none items-center justify-center rounded-md font-black text-white ${compact ? 'text-sm' : 'text-lg'}`}
        style={{ backgroundColor }}
        aria-label={`${companyName} logo fallback`}
      >
        {initials}
      </span>
    );
  }

  return <Building size={compact ? 22 : 30} className="text-slate-300" aria-hidden />;
};

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const deadlineValue = job?.deadline || job?.expires_at || job?.expiresAt;
  const isExpired = deadlineValue ? isJobApplicationDeadlinePassed(deadlineValue) : false;
  const daysLeft = calendarDaysLeftUntilDeadline(deadlineValue);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`jobs/${id}`);
        setJob(response.data?.data || null);
      } catch (error) {
        console.error('Failed to load job detail:', error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let active = true;

    const fetchCandidateState = async () => {
      if (!isAuthenticated || user?.role !== 'candidate') {
        setIsApplied(false);
        setIsSaved(false);
        return;
      }

      try {
        const [applicationsResult, savedJobsResult] = await Promise.allSettled([
          applicationService.getMyApplications(),
          candidateService.getSavedJobs(),
        ]);

        if (!active) return;

        if (applicationsResult.status === 'fulfilled') {
          const applications = applicationsResult.value.data?.data || [];
          setIsApplied(
            Array.isArray(applications) &&
              applications.some((application) => Number(application.job_id) === Number(id))
          );
        }

        if (savedJobsResult.status === 'fulfilled') {
          const savedJobs = savedJobsResult.value.data?.data || [];
          setIsSaved(
            Array.isArray(savedJobs) &&
              savedJobs.some((savedJob) => Number(savedJob.id || savedJob.job_id) === Number(id))
          );
        }
      } catch (error) {
        console.warn('Failed to load candidate job state:', error?.message);
      }
    };

    fetchCandidateState();

    return () => {
      active = false;
    };
  }, [id, isAuthenticated, user?.role]);

  const descriptionHtml = useMemo(
    () =>
      getSafeSectionHtml(
        job?.description,
        '<p>Nhà tuyển dụng chưa cập nhật mô tả chi tiết cho vị trí này.</p>',
        'Mô tả công việc'
      ),
    [job?.description]
  );
  const requirementsHtml = useMemo(
    () =>
      getSafeSectionHtml(
        job?.requirements,
        '<p>Nhà tuyển dụng chưa bổ sung yêu cầu chi tiết cho vị trí này.</p>',
        'Yêu cầu ứng viên'
      ),
    [job?.requirements]
  );
  const benefitsHtml = useMemo(
    () =>
      getSafeSectionHtml(
        job?.benefits,
        '<p>Quyền lợi và phúc lợi sẽ được nhà tuyển dụng cập nhật trong quá trình trao đổi.</p>',
        'Quyền lợi'
      ),
    [job?.benefits]
  );

  const handleApplyClick = () => {
    if (!job) return;
    const actionState = getApplyActionState({ job, isExpired, isApplied });
    if (actionState.disabled) return;
    if (!isAuthenticated) {
      sessionStorage.setItem('apply_job_id', String(id));
      navigate(`/login?next=${encodeURIComponent(`/jobs/${id}`)}`);
      return;
    }
    if (user?.role !== 'candidate') {
      showNotification('Chỉ ứng viên mới có thể ứng tuyển', 'warning');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySuccess = () => {
    setIsApplied(true);
    setIsApplyModalOpen(false);
    showNotification(
      'Ứng tuyển thành công! Bạn có thể theo dõi hồ sơ trong khu vực ứng viên.',
      'success'
    );
  };

  const handleToggleSave = async () => {
    if (savingJob || !job) return;

    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/jobs/${id}`)}`);
      return;
    }

    if (user?.role !== 'candidate') {
      showNotification('Chỉ ứng viên mới có thể lưu việc làm', 'warning');
      return;
    }

    setSavingJob(true);

    try {
      if (isSaved) {
        await candidateService.unsaveJob(job.id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu việc làm', 'info');
      } else {
        await candidateService.saveJob(job.id);
        setIsSaved(true);
        showNotification('Đã lưu việc làm vào danh sách của bạn', 'success');
      }
    } catch (error) {
      console.warn('Failed to toggle saved job:', error?.message);
      showNotification('Không thể cập nhật trạng thái lưu việc. Vui lòng thử lại.', 'error');
    } finally {
      setSavingJob(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    const url = window.location.href;
    const title = `${job.title} · ${job.company_name || job.company?.name || 'HireBOT'}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: title, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showNotification('Đã sao chép liên kết vào bộ nhớ tạm.', 'success');
      } else {
        showNotification('Trình duyệt không hỗ trợ chia sẻ liên kết.', 'error');
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      showNotification('Không thể chia sẻ. Thử sao chép liên kết thủ công.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 pb-16 pt-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 h-4 w-56 animate-pulse rounded bg-slate-200" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
              <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
              <div className="h-44 animate-pulse rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
            </div>
            <div className="h-96 animate-pulse rounded-lg bg-slate-200/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-slate-50 px-6 py-20 text-center">
        <Building className="mb-4 size-14 text-slate-300" aria-hidden />
        <p className="text-xl font-bold text-slate-800">Không tìm thấy tin tuyển dụng</p>
        <p className="mt-2 max-w-sm text-base font-medium leading-relaxed text-slate-500">
          Liên kết có thể đã hết hạn hoặc tin đã gỡ. Quay lại danh sách việc làm để tiếp tục.
        </p>
        <Link
          to="/jobs"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-white shadow-md shadow-primary/25 transition hover:opacity-95"
        >
          Xem việc làm <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const companyName =
    job.company_name ||
    job.company?.company_name ||
    job.company?.name ||
    job.employer?.company_name ||
    job.employer?.name ||
    'Nhà tuyển dụng';
  const companyLogo =
    job.company_logo ||
    job.company?.company_logo ||
    job.company?.logo ||
    job.company?.logo_url ||
    job.employer?.company_logo ||
    job.employer?.logo ||
    job.employer?.logo_url ||
    null;
  const companyDescription =
    job.company_description ||
    job.company?.description ||
    job.employer?.company_description ||
    job.employer?.description ||
    'Thông tin doanh nghiệp đang được cập nhật.';
  const companyWebsite = job.company_website || job.company?.website || job.employer?.website;
  const companyWebsiteHref = getExternalHref(companyWebsite);
  const employerId = job.company_id || job.employer_id || job.company?.id || job.employer?.id;
  const companyProfilePath = employerId ? `/companies/${employerId}` : null;
  const experienceLine = formatExperienceVi(
    job.experience_required || job.experience || job.experience_level
  );
  const salaryNegotiable = isTruthyFlag(job.salary_negotiable);
  const salaryLabel = salaryNegotiable
    ? 'Thỏa thuận'
    : job.salary_range || job.salary_display || formatSalaryRange(job.salary_min, job.salary_max);
  const salaryDisplayLabel = localizeInlineJobText(addCurrencySuffix(salaryLabel));
  const salaryCardCopy = getSalaryCardCopy(salaryDisplayLabel, salaryNegotiable);
  const vacanciesLabel = job.vacancies ? `Tuyển ${job.vacancies} người` : 'Không giới hạn';
  const salaryHelper = salaryNegotiable ? 'Lương thỏa thuận theo năng lực' : 'Lương theo tháng';
  const jobTypeLabel = formatJobTypeVi(job.type || job.job_type || job.employment_type);
  const jobStatusLabel = getJobStatusLabel(job.status);
  const applyActionState = getApplyActionState({ job, isExpired, isApplied });
  const createdAtValue = job.created_at || job.createdAt || job.published_at || job.publishedAt;
  const postedLabel =
    createdAtValue && !Number.isNaN(new Date(createdAtValue).getTime())
      ? new Date(createdAtValue).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Đang cập nhật';
  const locationLabel = job.location || job.location_name || job.address || 'Đang cập nhật';
  const addressLabel = job.address || job.company_location || job.company?.address || locationLabel;
  const categoryLabel = job.category_name || job.category || 'Chưa phân loại';
  const skillTags = normalizeList(job.skills || job.skill_names);
  const visibleSkillTags = skillTags.slice(0, 8);
  const remainingSkillCount = Math.max(0, skillTags.length - visibleSkillTags.length);

  const deadlineLabel = isExpired
    ? 'Đã hết hạn ứng tuyển'
    : daysLeft !== null
      ? daysLeft === 0
        ? 'Hạn nộp trong hôm nay'
        : `Còn ${daysLeft} ngày`
      : 'Không giới hạn';
  const deadlineCardLabel = getCompactDateLabel(deadlineValue);
  const workflowSummary = isApplied
    ? 'Bạn đã ứng tuyển vị trí này. Hồ sơ đang nằm trong pipeline đánh giá của nhà tuyển dụng.'
    : applyActionState.disabled
      ? 'Tin tuyển dụng hiện chưa mở để nhận hồ sơ mới. Bạn vẫn có thể lưu lại hoặc xem thêm vị trí liên quan.'
      : 'Tin đang mở. Ứng viên có thể nộp CV, thư giới thiệu và theo dõi trạng thái trong khu vực ứng viên.';

  const isWrongRole = isAuthenticated && user?.role !== 'candidate';
  const applyButtonDisabled = applyActionState.disabled || isWrongRole;
  const applyButtonLabel = isWrongRole
    ? 'Chỉ dành cho ứng viên'
    : !isAuthenticated && !applyActionState.disabled
      ? 'Đăng nhập để ứng tuyển'
      : applyActionState.label;
  const applyHelper = isWrongRole
    ? 'Tài khoản hiện tại không thể nộp hồ sơ. Hãy dùng tài khoản ứng viên để ứng tuyển.'
    : !isAuthenticated && !applyActionState.disabled
      ? 'Đăng nhập xong bạn sẽ quay lại đúng tin tuyển dụng này để nộp CV.'
      : applyActionState.helper;
  const compactSaveButtonLabel = isWrongRole ? 'Không thể lưu' : isSaved ? 'Đã lưu' : 'Lưu việc';

  return (
    <>
      <div className="bg-slate-50 pb-12">
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-slate-500" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link to="/" className="font-semibold transition hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li className="text-slate-300" aria-hidden>
                /
              </li>
              <li>
                <Link to="/jobs" className="font-semibold transition hover:text-primary">
                  Việc làm
                </Link>
              </li>
              <li className="text-slate-300" aria-hidden>
                /
              </li>
              <li className="line-clamp-1 max-w-[min(100%,28rem)] font-bold text-slate-800">
                {job.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <CompanyLogo src={companyLogo} companyName={companyName} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <InfoPill icon={Briefcase} tone="emerald">
                        {jobTypeLabel}
                      </InfoPill>
                      <InfoPill icon={ShieldCheck} tone="sky">
                        Đã xác minh
                      </InfoPill>
                      <InfoPill icon={Clock} tone={isExpired ? 'red' : 'amber'}>
                        {deadlineLabel}
                      </InfoPill>
                    </div>

                    <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                      {job.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
                      {companyProfilePath ? (
                        <Link
                          to={companyProfilePath}
                          className="inline-flex items-center gap-1.5 text-emerald-700 transition hover:text-emerald-800"
                        >
                          {companyName}
                          <ArrowRight size={14} aria-hidden />
                        </Link>
                      ) : (
                        <span className="text-emerald-700">{companyName}</span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={15} className="text-slate-400" aria-hidden />
                        {locationLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} className="text-slate-400" aria-hidden />
                        Đăng {postedLabel}
                      </span>
                    </div>

                    {visibleSkillTags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {visibleSkillTags.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {remainingSkillCount > 0 ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                            +{remainingSkillCount} kỹ năng
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="h-full">
                    <SummaryTile
                      icon={DollarSign}
                      label="Mức lương"
                      value={salaryCardCopy.value}
                      tone="emerald"
                    />
                  </div>
                  <div className="h-full">
                    <SummaryTile icon={Users} label="Số lượng" value={vacanciesLabel} tone="sky" />
                  </div>
                  <div className="h-full">
                    <SummaryTile
                      icon={Users}
                      label="Kinh nghiệm"
                      value={experienceLine || 'Đang cập nhật'}
                      tone="sky"
                    />
                  </div>
                  <div className="h-full">
                    <SummaryTile
                      icon={Briefcase}
                      label="Loại hình"
                      value={jobTypeLabel}
                      tone="slate"
                    />
                  </div>
                  <div className="h-full">
                    <SummaryTile
                      icon={Clock}
                      label="Hạn nộp"
                      value={deadlineCardLabel}
                      tone={isExpired ? 'slate' : 'amber'}
                    />
                  </div>
                </div>
              </section>

              <Card className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <SectionHeader
                      icon={CheckCircle2}
                      eyebrow="Luồng ứng tuyển"
                      title="Trạng thái và bước tiếp theo"
                      tone="emerald"
                    />
                    <p className="-mt-2 text-sm font-medium leading-6 text-slate-600">
                      {workflowSummary}
                    </p>
                  </div>
                  <InfoPill
                    tone={isExpired || applyActionState.tone === 'closed' ? 'red' : 'emerald'}
                  >
                    {jobStatusLabel}
                  </InfoPill>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <WorkflowStep
                    icon={CheckCircle2}
                    title="Nộp hồ sơ"
                    text="CV và thư giới thiệu được gửi vào pipeline tuyển dụng."
                    active={!applyActionState.disabled || isApplied}
                  />
                  <WorkflowStep
                    icon={ShieldCheck}
                    title="Sàng lọc"
                    text="Nhà tuyển dụng xem CV, kinh nghiệm và mức độ phù hợp."
                    active={isApplied}
                  />
                  <WorkflowStep
                    icon={MessageSquare}
                    title="Trao đổi"
                    text="Ứng viên theo dõi phản hồi và lịch phỏng vấn trong tài khoản."
                    active={isApplied}
                  />
                </div>
              </Card>

              <DetailSection
                icon={FileText}
                eyebrow="Chi tiết vị trí"
                title="Mô tả công việc"
                html={descriptionHtml}
                tone="emerald"
              />
              <DetailSection
                icon={ShieldCheck}
                eyebrow="Điều kiện phù hợp"
                title="Yêu cầu ứng viên"
                html={requirementsHtml}
                tone="sky"
              />
              <DetailSection
                icon={Zap}
                eyebrow="Đãi ngộ"
                title="Quyền lợi"
                html={benefitsHtml}
                tone="amber"
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <Card className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Mức lương
                    </p>
                    <p className="mt-1 text-[28px] font-bold leading-tight text-slate-950">
                      {salaryDisplayLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{salaryHelper}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      isExpired || applyActionState.tone === 'closed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {jobStatusLabel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <InfoPill icon={Clock} tone={isExpired ? 'red' : 'amber'}>
                    {deadlineLabel}
                  </InfoPill>
                  {isApplied && (
                    <InfoPill icon={CheckCircle2} tone="sky">
                      Đã ứng tuyển
                    </InfoPill>
                  )}
                </div>

                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
                  {isApplied ? (
                    <Button
                      to="/candidate/applications"
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="rounded-lg text-sm font-bold"
                      rightIcon={ArrowRight}
                    >
                      Theo dõi hồ sơ
                    </Button>
                  ) : (
                    <Button
                      variant={applyButtonDisabled ? 'secondary' : 'primary'}
                      size="lg"
                      fullWidth
                      className={`h-11 rounded-lg text-sm font-bold whitespace-normal ${
                        applyButtonDisabled
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 shadow-none'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                      onClick={handleApplyClick}
                      disabled={applyButtonDisabled}
                      rightIcon={!applyButtonDisabled ? ArrowRight : null}
                    >
                      {applyButtonLabel}
                    </Button>
                  )}

                  <div className="grid grid-cols-2 items-stretch gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      fullWidth
                      onClick={handleToggleSave}
                      isLoading={savingJob}
                      disabled={isWrongRole}
                      className="h-11 rounded-lg border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      leftIcon={Heart}
                    >
                      {compactSaveButtonLabel}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      fullWidth
                      onClick={handleShare}
                      className="h-11 rounded-lg border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      leftIcon={Share2}
                    >
                      Chia sẻ
                    </Button>
                  </div>
                </div>

                <p className="mt-3 text-xs font-medium leading-5 text-slate-500">{applyHelper}</p>
              </Card>

              <Card className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                    <CompanyLogo src={companyLogo} companyName={companyName} compact />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-950">{companyName}</p>
                    <p className="text-xs font-semibold uppercase text-slate-400">Nhà tuyển dụng</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-4 text-sm font-medium leading-6 text-slate-500">
                  {companyDescription}
                </p>

                <div className="mt-4 grid gap-2">
                  {companyProfilePath ? (
                    <Button
                      to={companyProfilePath}
                      variant="secondary"
                      size="md"
                      fullWidth
                      className="rounded-lg bg-slate-950 text-sm font-bold text-white hover:bg-slate-800 hover:text-white"
                      rightIcon={ArrowRight}
                    >
                      Xem trang công ty
                    </Button>
                  ) : null}
                  {companyWebsiteHref ? (
                    <a
                      href={companyWebsiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {normalizeUrlLabel(companyWebsite)}
                      <ExternalLink size={14} aria-hidden />
                    </a>
                  ) : null}
                </div>
              </Card>

              <Card className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-slate-950">Thông tin nhanh</h3>
                <div className="space-y-2">
                  <SidebarFact icon={MapPin} label="Địa điểm" value={addressLabel} />
                  <SidebarFact icon={Briefcase} label="Danh mục" value={categoryLabel} />
                  <SidebarFact icon={Users} label="Số lượng" value={vacanciesLabel} />
                  <SidebarFact icon={Info} label="Loại hình" value={jobTypeLabel} />
                  <SidebarFact icon={Clock} label="Ngày đăng" value={postedLabel} />
                </div>
              </Card>
            </aside>
          </div>
        </main>
      </div>

      {isApplyModalOpen && !applyActionState.disabled ? (
        <ApplyModal
          job={job}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={handleApplySuccess}
        />
      ) : null}
    </>
  );
};

export default JobDetailPage;
