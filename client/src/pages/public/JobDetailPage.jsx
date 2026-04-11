import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ApplicationForm from '../../components/candidate/applications/ApplicationForm';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';

const formatSalaryRange = (min, max) => {
  const fmt = (v) => {
    if (v == null || Number.isNaN(Number(v))) return null;
    const n = Math.round(Number(v) / 1_000_000);
    return `${n} triệu`;
  };
  const lo = fmt(min);
  const hi = fmt(max);
  if (!lo && !hi) return 'Thỏa thuận';
  if (lo && hi) return `${lo} – ${hi}`;
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
    internship: 'Thực tập',
    remote: 'Làm việc từ xa',
  };
  return map[t] || type;
};

const formatExperienceVi = (value) => {
  if (value == null || String(value).trim() === '') return null;
  const s = String(value).trim();
  const y = /^(\d+)\s*(?:years?|yr)$/i.exec(s);
  if (y) return `${y[1]} năm kinh nghiệm`;
  const plus = /^(\d+)\s*\+\s*years?$/i.exec(s);
  if (plus) return `${plus[1]}+ năm`;
  return s;
};

const normalizeLines = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
};

const JobDetailPage = () => {
  const { id } = useParams();
  const { showNotification } = useNotification();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

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

  const deadlineDate = job?.deadline ? new Date(job.deadline) : null;
  const isExpired = job?.deadline ? isJobApplicationDeadlinePassed(job.deadline) : false;
  const daysLeft = calendarDaysLeftUntilDeadline(job?.deadline);

  const requirementItems = useMemo(() => normalizeLines(job?.requirements), [job?.requirements]);
  const benefitItems = useMemo(
    () =>
      normalizeLines(job?.benefits).length > 0
        ? normalizeLines(job?.benefits)
        : [
            'Thưởng hiệu suất và lương tháng 13',
            'Bảo hiểm và chế độ phúc lợi đầy đủ',
            'Review thu nhập định kỳ',
            'Môi trường làm việc linh hoạt',
          ],
    [job?.benefits]
  );

  const handleShare = async () => {
    if (!job) return;
    const url = window.location.href;
    const title = `${job.title} · ${job.company_name || 'HireAI'}`;
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
      <div className="bg-slate-50/40 pb-20 pt-8">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mb-10 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-3xl bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-4">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-10 max-w-xl animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="h-48 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60" />
              <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60" />
            </div>
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-slate-50/50 px-6 py-20 text-center">
        <Building className="mb-4 size-14 text-slate-300" aria-hidden />
        <p className="text-xl font-bold text-slate-800">Không tìm thấy tin tuyển dụng</p>
        <p className="mt-2 max-w-sm text-base font-medium text-slate-500 leading-relaxed">
          Liên kết có thể đã hết hạn hoặc tin đã gỡ. Quay lại danh sách việc làm để tiếp tục.
        </p>
        <Link
          to="/jobs"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-bold text-white shadow-md shadow-primary/25 transition hover:opacity-95"
        >
          Xem việc làm <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const companyName =
    job.company_name || job.company?.company_name || job.employer?.company_name || 'Nhà tuyển dụng';
  const companyLogo =
    job.company_logo || job.company?.company_logo || job.employer?.company_logo || null;
  const employerId = job.employer_id || job.company?.id || job.employer?.id;
  const experienceLine = formatExperienceVi(job.experience_required);

  const jobPageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobPageUrl)}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobPageUrl)}`;

  const socialSharePillClass =
    'inline-flex items-center justify-center rounded-full border border-slate-700/90 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-slate-900 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2';

  return (
    <>
      <div className="bg-gradient-to-b from-slate-50 to-white pb-20 pt-6 md:pt-8">
        <div className="container mx-auto max-w-6xl px-6">
          <nav className="mb-6 text-base text-slate-500" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link to="/" className="font-medium transition hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li className="text-slate-300" aria-hidden>
                /
              </li>
              <li>
                <Link to="/jobs" className="font-medium transition hover:text-primary">
                  Việc làm
                </Link>
              </li>
              <li className="text-slate-300" aria-hidden>
                /
              </li>
              <li className="line-clamp-1 max-w-[min(100%,28rem)] font-semibold text-slate-800">
                {job.title}
              </li>
            </ol>
          </nav>

          <Card className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm ring-1 ring-slate-100/80 md:p-10">
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/[0.06] blur-3xl" />

            <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 shadow-inner">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building size={44} className="text-slate-300" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="primary"
                    className="rounded-lg px-3 py-1 text-sm font-bold uppercase tracking-wider"
                  >
                    {formatJobTypeVi(job.type)}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-sm font-bold uppercase tracking-wider text-emerald-700">
                    <ShieldCheck size={13} className="shrink-0" aria-hidden /> Đã xác minh
                  </span>
                  {isExpired && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-bold uppercase tracking-wider text-red-700">
                      Đã hết hạn ứng tuyển
                    </span>
                  )}
                </div>

                <h1 className="mb-5 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                  {job.title}
                </h1>

                <div className="flex flex-col gap-4 text-base text-slate-600 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-4">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                    <Building size={18} className="shrink-0 text-primary" aria-hidden />
                    {companyName}
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                    <MapPin size={18} className="shrink-0 text-primary" aria-hidden />
                    {job.location || 'Đang cập nhật'}
                  </span>
                  <div
                    className={`flex min-w-0 max-w-full flex-col gap-0.5 sm:max-w-sm ${isExpired ? 'text-red-600' : ''}`}
                  >
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                      <Clock
                        size={18}
                        className={`shrink-0 ${isExpired ? 'text-red-500' : 'text-primary'}`}
                        aria-hidden
                      />
                      {isExpired
                        ? 'Đã hết hạn ứng tuyển'
                        : daysLeft !== null
                          ? daysLeft === 0
                            ? 'Hạn nộp trong hôm nay'
                            : `Còn ${daysLeft} ngày để ứng tuyển`
                          : 'Không giới hạn hạn nộp'}
                    </span>
                    {job.deadline && deadlineDate && !Number.isNaN(deadlineDate.getTime()) && (
                      <span
                        className={`pl-[26px] text-sm font-medium leading-snug ${isExpired ? 'text-red-600/90' : 'text-slate-500'}`}
                      >
                        Hạn chót:{' '}
                        {deadlineDate.toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto lg:items-stretch">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    variant={isExpired ? 'secondary' : 'primary'}
                    className={`rounded-2xl px-8 py-4 text-base font-bold ${isExpired ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none' : 'group shadow-md shadow-primary/20'}`}
                    onClick={() => !isExpired && setIsApplyModalOpen(true)}
                    disabled={isExpired}
                  >
                    {isExpired ? 'Đã hết hạn ứng tuyển' : 'Ứng tuyển ngay'}
                    {!isExpired && (
                      <ArrowRight
                        size={20}
                        className="ml-2 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 rounded-2xl border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:bg-muted/35"
                  >
                    <Share2 size={18} aria-hidden /> Chia sẻ
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-center lg:justify-start">
                  <a
                    href={facebookShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialSharePillClass}
                  >
                    + Facebook
                  </a>
                  <a
                    href={linkedInShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={socialSharePillClass}
                  >
                    + LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              <Card className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm md:p-10">
                <h2 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  <span className="h-6 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  Mô tả công việc
                </h2>
                <div className="prose prose-slate max-w-none whitespace-pre-line text-base leading-relaxed text-slate-600">
                  {job.description?.trim()
                    ? job.description
                    : 'Nhà tuyển dụng chưa cập nhật mô tả chi tiết cho vị trí này.'}
                </div>

                <h2 className="mb-6 mt-14 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  <span className="h-6 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  Yêu cầu ứng viên
                </h2>
                <div className="space-y-3">
                  {requirementItems.length > 0 ? (
                    requirementItems.map((req) => (
                      <div
                        key={req}
                        className="flex items-start gap-3 rounded-xl border border-slate-100/90 bg-slate-50/40 p-4 transition-colors hover:border-primary/15 hover:bg-muted/40"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle size={15} aria-hidden />
                        </div>
                        <p className="text-base font-medium leading-relaxed text-slate-600">
                          {req}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-base font-medium text-slate-500">
                      Nhà tuyển dụng chưa bổ sung yêu cầu chi tiết.
                    </p>
                  )}
                </div>
              </Card>

              <Card className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm md:p-10">
                <h2 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  <span className="h-6 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  Quyền lợi
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {benefitItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Zap size={18} aria-hidden />
                      </span>
                      <span className="text-base font-medium leading-snug text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-primary via-primary to-emerald-700 p-8 text-white shadow-lg shadow-primary/25">
                <Sparkles
                  className="pointer-events-none absolute -bottom-6 -right-2 opacity-[0.12]"
                  size={112}
                  aria-hidden
                />
                <div className="relative z-10">
                  <p className="mb-1 text-base font-bold uppercase tracking-widest text-white/70">
                    Mức lương (tham khảo)
                  </p>
                  <p className="mb-2 text-3xl font-black tracking-tight md:text-4xl">
                    {formatSalaryRange(job.salary_min, job.salary_max)}
                  </p>
                  <p className="mb-8 text-base font-medium text-white/80">
                    Gross / tháng · có thể thỏa thuận
                  </p>
                  <div className="mb-6 h-px bg-white/15" />
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                        <DollarSign size={20} aria-hidden />
                      </div>
                      <div>
                        <p className="text-base font-bold uppercase tracking-widest text-white/60">
                          Hình thức trả lương
                        </p>
                        <p className="mt-0.5 text-base font-semibold">
                          Theo hợp đồng lao động (Gross)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                        <Users size={20} aria-hidden />
                      </div>
                      <div>
                        <p className="text-base font-bold uppercase tracking-widest text-white/60">
                          Kinh nghiệm
                        </p>
                        <p className="mt-0.5 text-base font-semibold">
                          {experienceLine || 'Đang cập nhật'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles size={20} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Gợi ý từ HireAI</h3>
                </div>
                <p className="mb-6 text-base font-medium leading-relaxed text-slate-600">
                  So khớp nhanh hồ sơ của bạn với mô tả công việc — chat với trợ lý để nhận gợi ý
                  ứng tuyển và từ khóa phù hợp.
                </p>
                <Link to="/chat" className="block">
                  <Button
                    variant="ghost"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.04] py-3 text-base font-bold text-primary transition hover:bg-primary/[0.08]"
                  >
                    <MessageSquare size={18} aria-hidden /> Mở trợ lý tư vấn
                  </Button>
                </Link>
              </Card>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-white shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Info size={18} className="shrink-0 text-emerald-400/90" aria-hidden /> Về nhà
                  tuyển dụng
                </h3>
                <p className="mb-6 text-base font-medium leading-relaxed text-slate-400">
                  {job.company_description ||
                    job.employer?.company_description ||
                    'Thông tin doanh nghiệp đang được cập nhật.'}
                </p>
                {employerId && (
                  <Link
                    to={`/companies/${employerId}`}
                    className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-400/95 transition hover:text-emerald-300"
                  >
                    Xem trang công ty <ArrowRight size={14} aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Nộp đơn ứng tuyển"
      >
        <ApplicationForm job={job} onClose={() => setIsApplyModalOpen(false)} />
      </Modal>
    </>
  );
};

export default JobDetailPage;
