import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import EmployerStatCard from './EmployerStatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../utils/cn';

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  blue: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    accent: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    soft: 'bg-sky-50 text-sky-700',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    accent: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    soft: 'bg-amber-50 text-amber-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-700 ring-slate-200',
    soft: 'bg-slate-50 text-slate-700',
  },
};

const toneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.emerald;

/* ── Reusable sub-components ── */

const StatusTabButton = ({ tab, count, active, onClick }) => {
  const safeTab = tab || {};
  const TabIcon = safeTab.icon || Briefcase;
  const styles = toneStyle(safeTab.tone || 'slate');

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
      <span>{safeTab.label || 'Trạng thái'}</span>
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
};

const getQuickActionIconClass = (tone) => {
  if (tone === 'emerald') return 'text-emerald-600';
  if (tone === 'sky' || tone === 'blue') return 'text-sky-600';
  if (tone === 'amber') return 'text-amber-600';
  return 'text-slate-500';
};

const QuickActionItem = ({ icon: Icon, title, to, tone, className }) => {
  const ActionIcon = Icon || ArrowRight;
  const isPrimary = tone === 'emerald';

  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        'h-11 justify-start rounded-xl px-4 text-sm font-semibold shadow-sm shadow-slate-950/[0.03]',
        isPrimary
          ? 'border-slate-950 bg-slate-950 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
          : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700',
        className
      )}
    >
      <Link to={to}>
        <ActionIcon className={cn('mr-2 h-4 w-4', isPrimary ? 'text-white' : getQuickActionIconClass(tone))} />
        {title}
      </Link>
    </Button>
  );
};

/* ── Job Card (compact) ── */

const DEFAULT_STATUS_META = {
  label: 'Đang cập nhật',
  badgeClass: 'border-slate-200 bg-slate-50 text-slate-600',
  dotClass: 'bg-slate-400',
};

const DEFAULT_DEADLINE_META = {
  label: '',
  className: 'border-slate-200 bg-slate-50 text-slate-600',
  iconClass: 'text-slate-400',
};

const JobCard = ({
  item = {},
  deletingId,
  handleDelete,
  formatCompactNumber,
  formatRelativeAge,
  formatShortDate,
}) => {
  const {
    job = {},
    statusMeta = DEFAULT_STATUS_META,
    deadlineMeta = DEFAULT_DEADLINE_META,
    applicants = 0,
    vacancies,
    typeLabel = 'Chưa cập nhật loại hình',
    isClosed = false,
    deadlinePassed = false,
  } = item;
  const vacanciesLabel = vacancies ? `${formatCompactNumber(vacancies)} người` : '--';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300',
        isClosed
          ? 'opacity-[0.85]'
          : 'hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40'
      )}
    >
      <div className={cn('absolute inset-y-0 left-0 w-1', statusMeta.dotClass)} />

      <div className="min-w-0">
        <div className="p-5 pl-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-inset',
                  isClosed
                    ? 'bg-slate-100 text-slate-400 ring-slate-200'
                    : 'bg-slate-950 text-white ring-slate-900/10'
                )}
              >
                {job.company_logo ? (
                  <img src={job.company_logo} alt={job.company_name || ''} className="h-full w-full object-cover" />
                ) : (
                  <Briefcase className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="line-clamp-2 text-base font-bold leading-tight tracking-normal text-slate-950 group-hover:text-emerald-700">
                    {job.title || 'Vị trí tuyển dụng'}
                  </h3>

                  <Badge className={cn('rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm', statusMeta.badgeClass)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dotClass)} />
                    {statusMeta.label}
                  </Badge>

                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {typeLabel}
                  </Badge>

                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  {job.location && (
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                      <MapPin className="h-3 w-3 shrink-0 text-emerald-500" />
                      <span className="truncate">{job.location}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                    <Calendar className="h-3 w-3" />
                    Đăng {formatRelativeAge(job.created_at)}
                  </span>
                  {job.deadline && (
                    <span className={cn('inline-flex items-center gap-1 rounded-md px-2.5 py-1 ring-1 ring-inset', deadlineMeta.className)}>
                      <Clock3 className="h-3 w-3" />
                      {formatShortDate(job.deadline)}
                    </span>
                  )}
                  {vacancies && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-100">
                      <Users className="h-3 w-3" />
                      Tuyển {vacanciesLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
                >
                  <Link to={`/employer/applications?jobId=${job.id}`}>
                    Xem quy trình
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Link to={`/employer/jobs/${job.id}/edit`}>
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Sửa
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  isLoading={deletingId === job.id}
                  onClick={() => handleDelete(job.id)}
                  disabled={deletingId === job.id}
                  className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {(deadlineMeta.label || deadlinePassed || applicants > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {applicants > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  <Users className="h-3.5 w-3.5 text-sky-500" />
                  {formatCompactNumber(applicants)} hồ sơ
                </span>
              )}
              {false && views > 0 && applicants > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  {applyRate}% chuyển đổi
                </span>
              )}
              {applicants === 0 && job.status === 'published' && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Chưa có hồ sơ
                </span>
              )}
              {deadlinePassed && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Đã quá hạn
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Main Component ── */

const STATUS_TABS_CONFIG = [
  { key: 'published', label: 'Đang đăng', countKey: 'published', icon: Briefcase, tone: 'emerald' },
  { key: 'pending_review', label: 'Chờ duyệt', countKey: 'pendingReview', icon: Clock3, tone: 'blue' },
  { key: 'closed', label: 'Đã đóng', countKey: 'closed', icon: MapPin, tone: 'slate' },
  { key: 'draft', label: 'Bản nháp', countKey: 'draft', icon: Edit, tone: 'amber' },
];

const ManageJobsWorkspace = ({
  loading,
  jobsCount,
  filteredJobsCount,
  jobsView,
  totalPages,
  currentPage,
  deletingId,
  searchQuery,
  filterType,
  filterLocation,
  activeTab,
  activeTabLabel,
  tabCounts = {},
  statusTabs = STATUS_TABS_CONFIG,
  typeOptions,
  locationOptions,
  hasActiveFilters,
  activeFilterBadges,
  activeFilterCount,
  overviewCards,
  quickActions,
  attentionCount = 0,
  visibleApplicants = 0,
  visibleViews = 0,
  setActiveTab,
  setCurrentPage,
  setSearchQuery,
  setFilterType,
  setFilterLocation,
  resetFilters,
  handleDelete,
  formatCompactNumber,
  formatRelativeAge,
  formatShortDate,
}) => {
  const maxPages = Math.max(totalPages, 1);
  const resolvedStatusTabs = (Array.isArray(statusTabs) && statusTabs.length ? statusTabs : STATUS_TABS_CONFIG)
    .map((rawTab) => {
      const tab = rawTab || {};
      const fallback = STATUS_TABS_CONFIG.find((item) => item.key === tab.key) || {};

      return {
        ...fallback,
        ...tab,
        countKey: tab.countKey || fallback.countKey || tab.key,
        icon: tab.icon || fallback.icon || Briefcase,
        tone: tab.tone || fallback.tone || 'slate',
      };
    })
    .filter((tab) => tab.key);

  const statCards = (overviewCards || []).map((card) => ({
    ...card,
    tone: card.tone || 'slate',
  }));

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
      {/* ── Compact Header ── */}
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          {/* Title row */}
          <div className="mb-6 max-w-4xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                  Quản lý tin tuyển dụng
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                  Trung tâm điều phối tuyển dụng
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Theo dõi trạng thái live, hiệu suất hồ sơ và các tín hiệu vận hành trong một không gian rõ ràng.
                </p>
              </div>
            </div>

            {/* Summary pills — top-right */}
            {false && !loading && jobsCount > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/80 bg-white/85 p-2 shadow-sm sm:min-w-[300px]">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xs font-semibold text-slate-500">Đang mở</div>
                  <div className="mt-1 text-xl font-bold text-slate-950">{formatCompactNumber(tabCounts.published || 0)}</div>
                </div>
                <div className="rounded-md bg-emerald-50 px-3 py-2">
                  <div className="text-xs font-semibold text-emerald-700">Cần xử lý</div>
                  <div className="mt-1 text-xl font-bold text-emerald-700">{formatCompactNumber(attentionCount)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stats row */}
          {!loading && jobsCount > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map(({ label, ...card }) => (
                <EmployerStatCard key={label} {...card} />
              ))}
            </div>
          )}

          {quickActions?.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {quickActions.map((item) => (
                <QuickActionItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  to={item.to}
                  tone={item.tone || 'emerald'}
                  className="w-full sm:w-auto"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* Stage tabs */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {resolvedStatusTabs.map((tab) => (
                <StatusTabButton
                  key={tab.key}
                  tab={tab}
                  count={tabCounts[tab.countKey] ?? 0}
                  active={activeTab === tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main workspace */}
        <div className="min-w-0">
          <section className="min-w-0 space-y-4">
            {/* Search + filter bar */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm kiếm theo tiêu đề, địa điểm..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <Select
                  value={filterType}
                  onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}
                >
                  <SelectTrigger className="h-12 w-full rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700 md:w-[180px]">
                    <SelectValue placeholder="Loại hình" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-sm font-medium">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterLocation}
                  onValueChange={(v) => { setFilterLocation(v); setCurrentPage(1); }}
                >
                  <SelectTrigger className="h-12 w-full rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700 md:w-[180px]">
                    <SelectValue placeholder="Địa điểm" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                    {locationOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-sm font-medium">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="h-12 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Xóa lọc
                  </Button>
                )}
              </div>

              {/* Active filter summary */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  Hiển thị <strong className="text-slate-700">{filteredJobsCount}</strong> tin ·{' '}
                  {activeTabLabel}
                </span>
                <span>
                  <strong className="text-slate-700">{formatCompactNumber(visibleApplicants)}</strong> hồ sơ ·{' '}
                  <strong className="text-slate-700">{formatCompactNumber(visibleViews)}</strong> lượt xem
                </span>
                {false && visibleApplyRate > 0 && (
                  <Badge className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {visibleApplyRate}% tỷ lệ ứng tuyển
                  </Badge>
                )}
                {activeFilterCount > 0 && (
                  <Badge className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {activeFilterCount} bộ lọc
                  </Badge>
                )}
                {activeFilterBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeFilterBadges.map((item) => (
                      <Badge
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Job list */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">
                    {filteredJobsCount} tin tuyển dụng
                  </span>
                </div>
                {maxPages > 1 && (
                  <span className="text-xs text-slate-400">
                    Trang {currentPage}/{maxPages}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                  ))}
                </div>
              ) : filteredJobsCount === 0 ? (
                <EmptyState
                  variant="robotSearch"
                  title={jobsCount === 0 ? 'Chưa có tin tuyển dụng nào' : 'Không tìm thấy tin phù hợp'}
                  description={
                    jobsCount === 0
                      ? 'Bắt đầu bằng một tin tuyển dụng mới để mở quy trình ứng viên đầu tiên.'
                      : 'Thử mở rộng bộ lọc hoặc thay đổi từ khóa để xem thêm kết quả.'
                  }
                  className="rounded-lg border border-slate-200 bg-white py-10"
                  action={
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {hasActiveFilters ? (
                        <Button variant="outline" onClick={resetFilters} className="h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold">
                          Xóa bộ lọc
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                      >
                        <Link to="/employer/jobs/post">
                          <Plus className="mr-2 h-4 w-4" />
                          {jobsCount === 0 ? 'Đăng tin ngay' : 'Tạo tin mới'}
                        </Link>
                      </Button>
                    </div>
                  }
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {jobsView.map((item) => (
                      <JobCard
                        key={item.job.id}
                        item={item}
                        deletingId={deletingId}
                        handleDelete={handleDelete}
                        formatCompactNumber={formatCompactNumber}
                        formatRelativeAge={formatRelativeAge}
                        formatShortDate={formatShortDate}
                      />
                    ))}
                  </div>

                  {maxPages > 1 && (
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: maxPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm font-bold transition-all',
                            page === currentPage
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
                        disabled={currentPage === maxPages}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default ManageJobsWorkspace;
