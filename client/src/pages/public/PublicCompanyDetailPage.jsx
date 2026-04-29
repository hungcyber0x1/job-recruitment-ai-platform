import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';
import { companyService } from '@/services';
import candidateService from '@/services/candidateService';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { normalizeCompanyEntity } from '@/utils/domain';
import { getJobSalaryCardLabel } from '@/utils/jobSalary';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '@/utils/jobDeadline';

function initialsFromName(name) {
  return (
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO'
  );
}

function avatarPalette(name) {
  const source = String(name || 'company');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
  }
  const palettes = [
    'bg-slate-950 text-white',
    'bg-emerald-100 text-emerald-900',
    'bg-sky-100 text-sky-900',
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

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

const formatCurrencyAmount = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '';
  if (numericValue >= 1_000_000) {
    return `${Math.round(numericValue / 1_000_000)} triệu`;
  }
  return `${numericValue.toLocaleString('vi-VN')} đ`;
};

const getSalaryDisplay = (job) => getJobSalaryCardLabel(job);

const getDeadlineMeta = (job) => {
  const deadline = job.deadline || job.expires_at || job.expiresAt;
  const passed = isJobApplicationDeadlinePassed(deadline);
  const daysLeft = calendarDaysLeftUntilDeadline(deadline);

  if (passed) {
    return { label: 'Hết hạn', tone: 'red' };
  }
  if (daysLeft === null) {
    return { label: 'Không giới hạn', tone: 'slate' };
  }
  if (daysLeft === 0) {
    return { label: 'Hạn hôm nay', tone: 'amber' };
  }
  return { label: `Còn ${daysLeft} ngày`, tone: 'emerald' };
};

const getExternalHref = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const normalizeUrlLabel = (url) =>
  String(url || '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

const tonePillClass = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

const InfoPill = ({ icon: Icon, children, tone = 'slate' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tonePillClass[tone] || tonePillClass.slate}`}
  >
    {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
    {children}
  </span>
);

const SummaryTile = ({ icon: Icon, label, value, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone];

  return (
    <div className="flex min-h-[74px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${toneClass}`}>
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, eyebrow, title, children, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone];

  return (
    <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${toneClass}`}>
          <Icon className="size-[18px]" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-400">{eyebrow}</p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-950">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
};

const CompanyFact = ({ icon: Icon, label, value, href }) => {
  const content = (
    <span className="break-words text-sm font-bold text-slate-800">
      {value || 'Chưa cập nhật'}
    </span>
  );

  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-emerald-700 hover:underline"
          >
            {content}
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          </a>
        ) : (
          <p className="mt-0.5">{content}</p>
        )}
      </div>
    </div>
  );
};

const PublicCompanyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const isCandidate = user?.role === 'candidate';

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCompany = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await companyService.getCompany(id);
        const rawCompany = response.data?.data;
        if (!active) return;

        setCompany(
          rawCompany
            ? {
              ...normalizeCompanyEntity(rawCompany),
              jobs: Array.isArray(rawCompany.jobs) ? rawCompany.jobs : [],
            }
            : null
        );
      } catch (fetchError) {
        console.error('Failed to load public company detail:', fetchError);
        if (!active) return;

        setCompany(null);
        setError(
          fetchError?.response?.status === 404
            ? 'Mã công ty không hợp lệ hoặc công ty hiện chưa có tin tuyển dụng công khai.'
            : 'Không thể tải dữ liệu công ty từ hệ thống hiện tại.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCompany();
    window.scrollTo(0, 0);

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    if (!isCandidate || !id) {
      setIsSaved(false);
      return () => {
        active = false;
      };
    }

    candidateService
      .checkCompanySaved(id)
      .then((res) => {
        if (active) setIsSaved(!!res.data?.data?.saved);
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, [id, isCandidate]);

  const handleToggleSave = useCallback(async () => {
    if (savePending) return;

    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/companies/${id}`)}`);
      return;
    }

    if (!isCandidate) {
      showNotification('Tính năng lưu công ty chỉ dành cho ứng viên', 'info');
      return;
    }

    setSavePending(true);
    try {
      if (isSaved) {
        await candidateService.unsaveCompany(id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu công ty', 'info');
      } else {
        await candidateService.saveCompany(id);
        setIsSaved(true);
        showNotification('Đã lưu công ty vào danh sách theo dõi', 'success');
      }
    } catch (err) {
      console.error('Toggle save company error:', err);
      showNotification('Không thể cập nhật trạng thái lưu công ty. Vui lòng thử lại.', 'error');
    } finally {
      setSavePending(false);
    }
  }, [id, isCandidate, isAuthenticated, isSaved, navigate, savePending, showNotification]);

  const companyDescriptionHtml = useMemo(() => {
    const description = String(company?.description ?? '').trim();
    if (!description) {
      return '<p>Doanh nghiệp này chưa cập nhật phần giới thiệu công ty trong hệ thống.</p>';
    }
    return sanitizeHtml(description);
  }, [company?.description]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Skeleton className="mb-4 h-4 w-48 rounded" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-44 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[50vh] bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl">
          <EmptyState
            title="Không tìm thấy công ty"
            description={error || 'Công ty này hiện chưa khả dụng ở khu vực công khai.'}
            variant="robotSearch"
          />
          <div className="mt-8 flex justify-center">
            <Button asChild className="rounded-lg text-base font-bold">
              <Link to="/companies">Quay lại danh sách công ty</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = initialsFromName(company.name);
  const jobs = Array.isArray(company.jobs) ? company.jobs : [];
  const companyLogoSrc = resolveMediaUrl(company.logo);
  const companyWebsiteHref = getExternalHref(company.website);
  const openJobsCount = jobs.length || company.openPositions || 0;
  const savedActionLabel = !isAuthenticated
    ? 'Đăng nhập để lưu'
    : isSaved
      ? 'Đã lưu công ty'
      : 'Lưu công ty';
  const primaryActionLabel = openJobsCount > 0 ? `Xem ${openJobsCount} việc làm` : 'Khám phá việc làm';
  const createdDateLabel =
    company.created_at && !Number.isNaN(new Date(company.created_at).getTime())
      ? new Date(company.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      : 'Đang cập nhật';

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500" aria-label="Breadcrumb">
          <Link to="/companies" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden />
            Danh sách công ty
          </Link>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="line-clamp-1 max-w-[min(100%,26rem)] font-bold text-slate-800">
            {company.name}
          </span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 p-2 text-lg font-bold shadow-sm ${avatarPalette(company.name)}`}
                >
                  {companyLogoSrc ? (
                    <img src={companyLogoSrc} alt={company.name} className="h-full w-full object-contain" />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <InfoPill icon={Building2} tone="emerald">
                      {company.industry || 'Doanh nghiệp'}
                    </InfoPill>
                    {company.is_verified ? (
                      <InfoPill icon={ShieldCheck} tone="sky">
                        Đã xác minh
                      </InfoPill>
                    ) : (
                      <InfoPill icon={Info} tone="slate">
                        Đang cập nhật hồ sơ
                      </InfoPill>
                    )}
                    <InfoPill icon={Briefcase} tone="amber">
                      {openJobsCount} việc đang tuyển
                    </InfoPill>
                  </div>

                  <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                    {company.name}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4 text-slate-400" aria-hidden />
                      {company.location || 'Đang cập nhật'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4 text-slate-400" aria-hidden />
                      {company.size || 'Quy mô chưa cập nhật'}
                    </span>
                    {companyWebsiteHref ? (
                      <a
                        href={companyWebsiteHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 transition hover:text-emerald-800"
                      >
                        <Globe className="size-4" aria-hidden />
                        {normalizeUrlLabel(company.website)}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile icon={MapPin} label="Địa điểm" value={company.location || 'Đang cập nhật'} tone="emerald" />
                <SummaryTile icon={Users} label="Quy mô" value={company.size || 'Chưa cập nhật'} tone="sky" />
                <SummaryTile icon={Briefcase} label="Việc mở" value={`${openJobsCount} tin tuyển dụng`} tone="amber" />
                <SummaryTile icon={CalendarDays} label="Cập nhật" value={createdDateLabel} tone="slate" />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={Building2}
                eyebrow="Hồ sơ công ty"
                title="Giới thiệu công ty"
                tone="emerald"
              />
              <div
                className="prose prose-slate max-w-none text-sm leading-7 text-slate-600 prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-slate-950 prose-p:my-2 prose-strong:text-slate-950"
                dangerouslySetInnerHTML={{ __html: companyDescriptionHtml }}
              />
            </section>

            <section id="open-jobs" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                icon={Briefcase}
                eyebrow="Cơ hội hiện có"
                title="Việc làm đang mở"
                tone="sky"
              >
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  {jobs.length} tin
                </span>
              </SectionHeader>

              {jobs.length === 0 ? (
                <EmptyState
                  title="Chưa có tin tuyển dụng công khai"
                  description="Công ty này hiện chưa có tin tuyển dụng đã công khai để hiển thị ở khu vực công khai."
                  variant="robotSearch"
                />
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const deadlineMeta = getDeadlineMeta(job);
                    return (
                      <article
                        key={job.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="text-base font-bold leading-6 text-slate-950 transition hover:text-emerald-700"
                            >
                              {job.title}
                            </Link>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <InfoPill icon={DollarSign} tone="emerald">
                                {getSalaryDisplay(job)}
                              </InfoPill>
                              {job.vacancies ? (
                                <InfoPill icon={Users} tone="sky">
                                  Tuyển {job.vacancies} người
                                </InfoPill>
                              ) : null}
                              <InfoPill icon={CalendarDays} tone={deadlineMeta.tone}>
                                {deadlineMeta.label}
                              </InfoPill>
                              <InfoPill icon={Briefcase} tone="slate">
                                {formatJobTypeVi(job.type || job.job_type || job.employment_type)}
                              </InfoPill>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-4 text-slate-400" aria-hidden />
                                {job.location || job.location_name || company.location || 'Đang cập nhật'}
                              </span>
                            </div>
                          </div>

                          <Button asChild className="h-10 rounded-lg px-4 text-sm font-bold lg:shrink-0">
                            <Link to={`/jobs/${job.id}`}>
                              Xem chi tiết
                              <ArrowRight className="size-4" aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-lg border border-slate-900 bg-slate-950 p-4 text-white shadow-lg shadow-slate-950/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-300">Tuyển dụng</p>
                  <p className="mt-1 text-2xl font-bold tracking-normal">{openJobsCount} việc làm</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Tin đang công khai và có thể xem chi tiết ngay.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                  {company.is_verified ? 'Đã xác minh' : 'Public'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <Button asChild size="lg" className="h-11 w-full rounded-lg bg-emerald-500 text-sm font-bold text-white hover:bg-emerald-400">
                  <a href={jobs.length > 0 ? '#open-jobs' : '/jobs'}>
                    {primaryActionLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  disabled={savePending}
                  onClick={handleToggleSave}
                  className="h-11 w-full rounded-lg border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 hover:text-white"
                >
                  {isSaved ? (
                    <BookmarkCheck className="size-4" aria-hidden />
                  ) : (
                    <Bookmark className="size-4" aria-hidden />
                  )}
                  {savedActionLabel}
                </Button>
              </div>

              <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold leading-5 text-slate-300">
                {!isAuthenticated
                  ? 'Đăng nhập ứng viên để lưu công ty và quay lại nhanh khi có vị trí phù hợp.'
                  : isCandidate
                    ? 'Lưu công ty giúp bạn theo dõi cơ hội mới trong khu vực ứng viên.'
                    : 'Tài khoản hiện tại có thể xem thông tin công ty, nhưng tính năng lưu dành cho ứng viên.'}
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-slate-950">Thông tin công ty</h2>
              <div className="space-y-2">
                <CompanyFact icon={MapPin} label="Địa điểm" value={company.location} />
                <CompanyFact icon={Users} label="Quy mô" value={company.size} />
                <CompanyFact icon={Building2} label="Lĩnh vực" value={company.industry} />
                <CompanyFact
                  icon={Globe}
                  label="Website"
                  value={company.website ? normalizeUrlLabel(company.website) : ''}
                  href={companyWebsiteHref}
                />
              </div>
            </section>

            <section className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <Sparkles className="size-[18px]" aria-hidden />
                </div>
                <h2 className="text-base font-bold text-slate-950">Hành động tiếp theo</h2>
              </div>
              <p className="mb-4 text-sm font-medium leading-6 text-slate-600">
                Tạo hồ sơ ứng viên hoặc mở danh sách việc làm để so sánh thêm các vị trí cùng ngành.
              </p>
              <div className="grid gap-2">
                <Button asChild className="h-10 rounded-lg text-sm font-bold">
                  <Link to="/register">Tạo tài khoản ứng viên</Link>
                </Button>
                <Button asChild variant="outline" className="h-10 rounded-lg border-emerald-200 bg-white text-sm font-bold text-emerald-700 hover:bg-emerald-50">
                  <Link to="/jobs">
                    <Search className="size-4" aria-hidden />
                    Khám phá thêm việc làm
                  </Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PublicCompanyDetailPage;
