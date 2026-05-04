import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Briefcase,
  CheckCircle2,
  Clock3,
  DollarSign,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Target,
  Users,
  X,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { JobCompanySidebar } from '../../components/candidate/jobs/JobDetailComponents';
import ApplyModal from '../../components/candidate/jobs/ApplyModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button, Card, Loading } from '../../components/common';
import candidateService from '../../services/candidateService';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import { formatDate } from '../../utils/formatters';
import { isJobApplicationDeadlinePassed } from '../../utils/jobDeadline';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { cn } from '../../utils/cn';

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  freelance: 'Tự do',
  remote: 'Từ xa',
  hybrid: 'Kết hợp',
  onsite: 'Tại văn phòng',
};

const normalizeSkills = (skills) =>
  Array.isArray(skills)
    ? skills
        .map((skill) => {
          if (typeof skill === 'string') return skill;
          return skill?.name || skill?.skill_name || skill?.label || '';
        })
        .filter(Boolean)
    : [];

const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026039;');

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatSalaryLabel = (job = null) => {
  if (job == null) return 'Thỏa thuận';
  const direct = job.salary_range || job.salary || job.salary_text;
  if (direct) return direct;

  const min = Number(job.salary_min);
  const max = Number(job.salary_max);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (hasMin && hasMax) return `${formatNumber(min)} - ${formatNumber(max)} VNĐ`;
  if (hasMin) return `Từ ${formatNumber(min)} VNĐ`;
  if (hasMax) return `Đến ${formatNumber(max)} VNĐ`;
  return 'Thỏa thuận';
};

const formatWorkMode = (job = null) => {
  if (job == null) return 'Chưa cập nhật';
  const raw = String(job.type || job.job_type || job.work_mode || '').trim();
  if (!raw) return 'Chưa cập nhật';
  return JOB_TYPE_LABELS[raw] || JOB_TYPE_LABELS[raw.toLowerCase()] || raw;
};

const getApplyButtonText = ({ isApplied, deadlinePassed, status }) => {
  if (isApplied) return 'Đã ứng tuyển';
  if (deadlinePassed) return 'Đã hết hạn ứng tuyển';
  if (status && status !== 'published') return 'Chưa nhận hồ sơ';
  return 'Ứng tuyển ngay';
};

const getStatusLabel = ({ isApplied, deadlinePassed, status }) => {
  if (deadlinePassed) return 'Đã hết hạn';
  if (isApplied) return 'Đã ứng tuyển';
  if (status === 'published') return 'Đang nhận hồ sơ';
  return 'Tạm dừng';
};

const getStatusTone = ({ isApplied, deadlinePassed, status }) => {
  if (deadlinePassed || (status && status !== 'published')) return 'amber';
  if (isApplied) return 'emerald';
  return 'blue';
};

const GuidanceItem = ({ title, description }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 transition-colors hover:border-emerald-100 hover:bg-emerald-50/50">
    <p className="text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{description}</p>
  </div>
);

const DetailSection = ({ icon: Icon, title, html, tone = 'emerald' }) => {
  const toneClasses = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  }[tone];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', toneClasses)}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </div>
      <div
        className="prose prose-slate max-w-none text-sm leading-7 text-slate-600 prose-headings:mb-2 prose-headings:mt-3 prose-headings:text-slate-950 prose-p:my-2 prose-strong:text-slate-950 prose-ul:my-2 prose-li:my-0.5"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(html || '<p>Chưa cập nhật nội dung.</p>'),
        }}
      />
    </section>
  );
};

const QuickInfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
    <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span>
    <span className="min-w-0 truncate text-right text-sm font-bold text-slate-900">{value}</span>
  </div>
);

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [error, setError] = useState(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [contentSearch, setContentSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const fetchJobDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobRes, appRes] = await Promise.all([
        jobService.getJob(id),
        applicationService.getMyApplications(),
      ]);

      if (jobRes.data.success) {
        const jobData = jobRes.data.data;
        setJob(jobData);
        setIsSaved(Boolean(jobData?.is_saved || jobData?.saved || jobData?.isSaved));
      } else {
        setError('Không tìm thấy thông tin công việc');
      }

      if (appRes.data.success) {
        const alreadyApplied = appRes.data.data.some(
          (application) => Number(application.job_id) === Number(id)
        );
        setIsApplied(alreadyApplied);
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      setError('Đã có lỗi xảy ra khi tải thông tin công việc');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  const normalizedSkills = useMemo(() => normalizeSkills(job?.skills), [job?.skills]);
  const deadlinePassed = job?.deadline ? isJobApplicationDeadlinePassed(job.deadline) : false;
  const applyBlocked = job?.status !== 'published' || deadlinePassed || isApplied;
  const company = job?.employer || job?.company || {};
  const companyName = company.name || job?.company_name || 'Doanh nghiệp đang tuyển';
  const salaryLabel = formatSalaryLabel(job);
  const workModeLabel = formatWorkMode(job);
  const statusLabel = getStatusLabel({ isApplied, deadlinePassed, status: job?.status });
  const statusTone = getStatusTone({ isApplied, deadlinePassed, status: job?.status });

  const workflowSummary = !job
    ? ''
    : isApplied
      ? 'Bạn đã ứng tuyển vị trí này. Hồ sơ đang ở trong quy trình đánh giá của nhà tuyển dụng.'
      : job.status !== 'published'
        ? 'Tin đăng hiện chưa mở để nhận hồ sơ mới. Bạn vẫn có thể lưu lại để theo dõi cập nhật tiếp theo.'
        : deadlinePassed
          ? 'Tin đăng đã hết hạn nộp hồ sơ. Bạn có thể theo dõi doanh nghiệp để chờ các vị trí tương tự.'
          : 'Tin đăng đang mở. Nếu hồ sơ phù hợp, bạn có thể nộp ngay và theo dõi trạng thái từ quy trình ứng tuyển.';

  const guidanceItems = useMemo(() => {
    if (!job) return [];

    const items = [];

    if (normalizedSkills.length > 0) {
      items.push({
        title: 'Nhấn mạnh kỹ năng cốt lõi',
        description: `CV nên làm rõ các điểm như ${normalizedSkills.slice(0, 4).join(', ')} để tăng khả năng qua sơ loại.`,
      });
    }

    items.push({
      title: 'Kiểm tra thời gian nộp',
      description: job.deadline
        ? `Hạn nộp hiện là ${formatDate(job.deadline)}. Chuẩn bị CV và thư giới thiệu trước thời điểm này để không bị lỡ nhịp.`
        : 'Tin đăng chưa đặt hạn nộp cụ thể, nhưng ứng tuyển sớm thường có lợi thế hơn trong vòng sàng lọc đầu tiên.',
    });

    items.push({
      title: 'Theo dõi sau khi nộp',
      description: isApplied
        ? 'Bạn đã ở trong quy trình ứng tuyển. Hãy giữ hồ sơ cập nhật và bật thông báo để không bỏ lỡ phản hồi mới.'
        : 'Sau khi ứng tuyển, hãy theo dõi quy trình ứng tuyển và thông báo để phản hồi nhanh khi nhà tuyển dụng liên hệ.',
    });

    return items;
  }, [isApplied, job, normalizedSkills]);

  const skillSectionHtml = useMemo(() => {
    if (!normalizedSkills.length) return '<p>Nhà tuyển dụng chưa cập nhật kỹ năng cụ thể.</p>';
    return `<ul>${normalizedSkills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join('')}</ul>`;
  }, [normalizedSkills]);

  const detailSections = useMemo(() => {
    if (!job) return [];
    return [
      {
        id: 'description',
        label: 'Mô tả',
        title: 'Mô tả công việc',
        icon: Briefcase,
        html: job.description,
        text: stripHtml(job.description),
        tone: 'emerald',
      },
      {
        id: 'requirements',
        label: 'Yêu cầu',
        title: 'Yêu cầu công việc',
        icon: ShieldCheck,
        html: job.requirements,
        text: stripHtml(job.requirements),
        tone: 'blue',
      },
      {
        id: 'benefits',
        label: 'Quyền lợi',
        title: 'Quyền lợi và phúc lợi',
        icon: Star,
        html: job.benefits,
        text: stripHtml(job.benefits),
        tone: 'amber',
      },
      {
        id: 'skills',
        label: 'Kỹ năng',
        title: 'Kỹ năng ưu tiên',
        icon: Target,
        html: skillSectionHtml,
        text: normalizedSkills.join(' '),
        tone: 'violet',
      },
    ];
  }, [job, normalizedSkills, skillSectionHtml]);

  const visibleSections = useMemo(() => {
    const query = contentSearch.trim().toLowerCase();
    return detailSections.filter((section) => {
      if (sectionFilter !== 'all' && section.id !== sectionFilter) return false;
      if (!query) return true;
      return `${section.title} ${section.label} ${section.text}`.toLowerCase().includes(query);
    });
  }, [contentSearch, detailSections, sectionFilter]);

  const statusCards = [
    {
      icon: Clock3,
      label: 'Trạng thái',
      value: statusLabel,
      helper: deadlinePassed ? 'Tin đăng đã qua hạn nộp.' : workflowSummary,
      tone: statusTone,
    },
    {
      icon: DollarSign,
      label: 'Mức lương',
      value: salaryLabel,
      helper: 'Khoảng lương công bố trong tin tuyển dụng.',
      tone: 'emerald',
    },
    {
      icon: MapPin,
      label: 'Địa điểm',
      value: job?.location || company.address || 'Chưa cập nhật',
      helper: workModeLabel,
      tone: 'blue',
    },
    {
      icon: Users,
      label: 'Số lượng',
      value: job?.vacancies ? `${formatNumber(job.vacancies)} người` : 'Không giới hạn',
      helper: job?.deadline
        ? `Hạn nộp ${formatDate(job.deadline)}`
        : 'Chưa giới hạn thời gian nộp.',
      tone: 'violet',
    },
  ];

  const handleApplySuccess = () => {
    setIsApplied(true);
    setShowApplyModal(false);
    showNotification('Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ.', 'success');
  };

  const handleToggleSaveJob = async () => {
    if (savingJob || !job?.id) return;

    if (!isAuthenticated) {
      if (window.confirm('Bạn cần đăng nhập để lưu việc làm. Chuyển đến trang đăng nhập?')) {
        navigate(`/login?next=${encodeURIComponent(`/candidate/jobs/${job.id}`)}`);
      }
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
        showNotification('Đã lưu việc làm thành công', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle save job:', err);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSavingJob(false);
    }
  };

  const resetContentFilters = () => {
    setContentSearch('');
    setSectionFilter('all');
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loading size="xl" text="Đang tải thông tin công việc..." />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Briefcase className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {error || 'Không tìm thấy thông tin công việc'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Trang chi tiết này hiện chưa có dữ liệu hoặc tin tuyển dụng đã không còn khả dụng.
        </p>
        <div className="mt-6">
          <Button to="/candidate/jobs" leftIcon={ArrowLeft}>
            Quay lại danh sách việc làm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 lg:px-8">
          <Link
            to="/candidate/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách việc làm
          </Link>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Chi tiết việc làm
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  {companyName ? `tại ${companyName}` : 'Việc làm hấp dẫn đang chờ bạn khám phá'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => !applyBlocked && setShowApplyModal(true)}
                disabled={applyBlocked}
                leftIcon={isApplied ? CheckCircle2 : Target}
                className={cn(
                  'h-10 rounded-lg px-4 text-sm font-bold',
                  applyBlocked
                    ? 'bg-white text-slate-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                {getApplyButtonText({ isApplied, deadlinePassed, status: job.status })}
              </Button>
              <button
                type="button"
                onClick={handleToggleSaveJob}
                disabled={savingJob}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  isSaved
                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                )}
              >
                <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Đã lưu' : 'Lưu việc'}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statusCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={contentSearch}
                  onChange={(event) => setContentSearch(event.target.value)}
                  placeholder="Tìm trong mô tả, yêu cầu, quyền lợi..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-none outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                {contentSearch && (
                  <button
                    type="button"
                    onClick={() => setContentSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={sectionFilter}
                  onChange={(event) => setSectionFilter(event.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="all">Tất cả nội dung</option>
                  {detailSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
                {(contentSearch || sectionFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={resetContentFilters}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Hiển thị {visibleSections.length}/{detailSections.length} phần nội dung phù hợp.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 space-y-4">
            <Card className="rounded-lg border-slate-200 bg-white p-0 shadow-sm">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Quy trình ứng tuyển
                      </p>
                      <h2 className="mt-1 text-base font-bold text-slate-950">
                        Tình trạng hiện tại của tin tuyển dụng
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{workflowSummary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 bg-slate-50/70 p-4">
                  <QuickInfoRow
                    label="Ngày đăng"
                    value={job.created_at ? formatDate(job.created_at) : 'Chưa cập nhật'}
                  />
                  <QuickInfoRow
                    label="Hạn nộp"
                    value={job.deadline ? formatDate(job.deadline) : 'Không giới hạn'}
                  />
                  <QuickInfoRow label="Hình thức" value={workModeLabel} />
                </div>
              </div>
            </Card>

            {visibleSections.length > 0 ? (
              visibleSections.map((section) => <DetailSection key={section.id} {...section} />)
            ) : (
              <Card className="rounded-lg border-slate-200 bg-white p-8 text-center shadow-sm">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <h2 className="mt-3 text-base font-bold text-slate-900">
                  Không tìm thấy nội dung phù hợp
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Thử đổi từ khóa hoặc chọn lại bộ lọc để xem toàn bộ thông tin tuyển dụng.
                </p>
                <button
                  type="button"
                  onClick={resetContentFilters}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Xem lại tất cả
                </button>
              </Card>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <JobCompanySidebar company={company} />

            <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Gợi ý hồ sơ
                  </p>
                  <h2 className="mt-1 text-base font-bold text-slate-950">
                    Chuẩn bị trước khi nộp
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {guidanceItems.map((item) => (
                  <GuidanceItem
                    key={item.title}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>

              <Button
                fullWidth
                to="/candidate/resume"
                leftIcon={Brain}
                className="mt-4 h-10 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Quản lý CV của tôi
              </Button>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                Kỹ năng ưu tiên
              </p>
              <h2 className="mt-2 text-base font-bold">Những gì nhà tuyển dụng đang tìm kiếm</h2>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-300">
                Dùng phần này để rà lại CV, danh mục dự án và phần giới thiệu bản thân trước khi gửi
                hồ sơ.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {normalizedSkills.length > 0 ? (
                  normalizedSkills.slice(0, 10).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100">
                    Nhà tuyển dụng chưa cập nhật kỹ năng cụ thể
                  </span>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </main>

      {showApplyModal && !applyBlocked && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
};

export default JobDetailPage;
