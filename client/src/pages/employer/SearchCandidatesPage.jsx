import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  UserRoundSearch,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { useNotification } from '../../context/NotificationContext';
import { employerCandidateService } from '../../services';
import { cn } from '../../utils';

const PAGE_SIZE = 12;

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Tất cả kinh nghiệm' },
  { value: 'intern', label: 'Thực tập sinh / Mới tốt nghiệp' },
  { value: 'junior', label: 'Cấp cơ bản' },
  { value: 'mid', label: 'Cấp trung' },
  { value: 'senior', label: 'Cấp cao' },
  { value: 'lead', label: 'Trưởng nhóm / Quản lý' },
];

const SALARY_OPTIONS = [
  { value: 'all', label: 'Tất cả mức lương' },
  { value: 'lt20m', label: 'Dưới 20 triệu' },
  { value: '20m-40m', label: '20 - 40 triệu' },
  { value: '40m-80m', label: '40 - 80 triệu' },
  { value: 'gt80m', label: 'Trên 80 triệu' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Hoạt động gần đây' },
  { value: 'experience', label: 'Kinh nghiệm cao' },
  { value: 'salary', label: 'Lương thấp đến cao' },
];

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UV';

const formatExperience = (years) => {
  const value = Number(years) || 0;
  if (value <= 0) return 'Mới tốt nghiệp';
  if (value === 1) return '1 năm kinh nghiệm';
  return `${value} năm kinh nghiệm`;
};

const formatSalary = (candidate) => {
  const toSalaryNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
  };

  const min = toSalaryNumber(candidate.expected_salary_min);
  const max = toSalaryNumber(candidate.expected_salary_max);
  const currency = candidate.salary_currency || 'VND';

  if (min === null && max === null) return 'Chưa cập nhật';

  if (currency === 'VND') {
    const compact = (value) => {
      if (value === null) return null;
      if (value >= 1000000) return `${Math.round(value / 1000000)} triệu`;
      return `${formatNumber(value)} VND`;
    };

    const compactMin = compact(min);
    const compactMax = compact(max);
    if (compactMin && compactMax) return `${compactMin} - ${compactMax}`;
    if (compactMin) return `Từ ${compactMin}`;
    return `Đến ${compactMax}`;
  }

  if (min !== null && max !== null) {
    return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
  }
  if (min !== null) return `Từ ${formatNumber(min)} ${currency}`;
  return `Đến ${formatNumber(max)} ${currency}`;
};

const getStatusMeta = (status) => {
  const map = {
    actively_looking: {
      label: 'Đang tìm việc',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    open_to_work: {
      label: 'Sẵn sàng trao đổi',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    not_looking: {
      label: 'Chưa tìm việc',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    },
    employed: {
      label: 'Đang đi làm',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    },
  };

  return (
    map[status] || {
      label: 'Hồ sơ công khai',
      className: 'border-violet-200 bg-violet-50 text-violet-700',
    }
  );
};

function SearchInput({ icon: Icon, value, onChange, placeholder }) {
  return (
    <label className="relative block min-w-0">
      <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

function CandidateCard({ candidate, saving, onToggleSave }) {
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const detailPath = candidate.application_id
    ? `/employer/applications/${candidate.application_id}`
    : `/employer/search-candidates?q=${encodeURIComponent(candidate.name || '')}`;
  const messagePath = `/employer/messages?candidateId=${candidate.id}&candidateName=${encodeURIComponent(candidate.name || '')}`;
  const statusMeta = getStatusMeta(candidate.job_search_status);
  const salaryLabel = formatSalary(candidate);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-0.5',
          candidate.is_saved ? 'bg-emerald-500' : 'bg-slate-300'
        )}
      />

      <div className="flex flex-col gap-3 p-4 pl-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <Avatar className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-100">
            <AvatarFallback className="rounded-lg bg-slate-950 text-sm font-bold text-white">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold leading-tight tracking-normal text-slate-950 transition-colors group-hover:text-emerald-700">
                {candidate.name || 'Ứng viên đang cập nhật'}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  statusMeta.className
                )}
              >
                {statusMeta.label}
              </span>
              {candidate.is_saved ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Đã lưu
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {candidate.role || 'Vị trí đang cập nhật'}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                <Briefcase className="h-3 w-3 text-emerald-500" />
                {formatExperience(candidate.experience_years)}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                <MapPin className="h-3 w-3 shrink-0 text-emerald-500" />
                <span className="truncate">{candidate.location || 'Linh hoạt'}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                <Target className="h-3 w-3" />
                {salaryLabel}
              </span>
            </div>

            {skills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 4 ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    +{skills.length - 4}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="mt-2 inline-flex rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-0.5 text-[11px] font-medium text-slate-500">
                Hồ sơ chưa cập nhật kỹ năng
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <Button
            type="button"
            onClick={() => onToggleSave(candidate)}
            disabled={saving}
            aria-label={candidate.is_saved ? 'Bỏ lưu hồ sơ' : 'Lưu hồ sơ'}
            title={candidate.is_saved ? 'Bỏ lưu hồ sơ' : 'Lưu hồ sơ'}
            className={cn(
              'h-9 w-9 rounded-lg p-0 shadow-sm',
              candidate.is_saved
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-950 text-white hover:bg-emerald-700'
            )}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : candidate.is_saved ? (
              <BookmarkCheck className="h-3.5 w-3.5" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">{candidate.is_saved ? 'Đã lưu' : 'Lưu'}</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Link to={detailPath}>
              Chi tiết
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-9 w-9 rounded-lg border-slate-200 p-0 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            title="Nhắn tin"
          >
            <Link to={messagePath} aria-label="Nhắn tin">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="sr-only">Nhắn</span>
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

export default function SearchCandidatesPage() {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [skillQuery, setSkillQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [salaryRange, setSalaryRange] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [stats, setStats] = useState({ visibleCandidates: 0, savedCandidates: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingIds, setSavingIds] = useState(() => new Set());

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setKeyword((current) => (current === urlQuery ? current : urlQuery));
  }, [searchParams]);

  const requestParams = useMemo(() => {
    const params = {
      page,
      limit: PAGE_SIZE,
      sort: sortBy,
    };

    if (keyword.trim()) params.search = keyword.trim();
    if (skillQuery.trim()) params.skills = skillQuery.trim();
    if (locationQuery.trim()) params.location = locationQuery.trim();
    if (selectedLevel !== 'all') params.level = selectedLevel;
    if (salaryRange !== 'all') params.salary = salaryRange;

    return params;
  }, [keyword, skillQuery, locationQuery, page, salaryRange, selectedLevel, sortBy]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await employerCandidateService.searchCandidates(requestParams);
        if (cancelled) return;

        setCandidates(Array.isArray(response.data?.data) ? response.data.data : []);
        setPagination(
          response.data?.meta?.pagination || { page, limit: PAGE_SIZE, total: 0, totalPages: 1 }
        );
        setStats(response.data?.meta?.stats || { visibleCandidates: 0, savedCandidates: 0 });
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to search candidates:', fetchError);
        setCandidates([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
        setStats({ visibleCandidates: 0, savedCandidates: 0 });
        setError('Không tải được danh sách ứng viên. Vui lòng kiểm tra API hoặc đăng nhập lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, refreshKey, requestParams]);

  const resetFilters = () => {
    setKeyword('');
    setSkillQuery('');
    setLocationQuery('');
    setSelectedLevel('all');
    setSalaryRange('all');
    setSortBy('recent');
    setPage(1);
    setSearchParams({});
  };

  const executeSearch = () => {
    setPage(1);
    setRefreshKey((value) => value + 1);
    setSearchParams(keyword.trim() ? { q: keyword.trim() } : {});
  };

  const handleToggleSave = async (candidate) => {
    const candidateId = candidate.id;
    const wasSaved = Boolean(candidate.is_saved);

    setSavingIds((previous) => new Set(previous).add(candidateId));
    setCandidates((previous) =>
      previous.map((item) =>
        item.id === candidateId
          ? { ...item, is_saved: !wasSaved, saved_folder: wasSaved ? null : 'general' }
          : item
      )
    );

    try {
      if (wasSaved) {
        await employerCandidateService.removeSavedCandidate(candidateId);
        showNotification('Đã bỏ ứng viên khỏi kho ứng viên.', 'success');
      } else {
        await employerCandidateService.saveCandidate(candidateId, { folder: 'general' });
        showNotification('Đã lưu ứng viên vào kho ứng viên.', 'success');
      }
      setRefreshKey((value) => value + 1);
    } catch (saveError) {
      console.error('Failed to toggle saved candidate:', saveError);
      setCandidates((previous) =>
        previous.map((item) =>
          item.id === candidateId
            ? { ...item, is_saved: wasSaved, saved_folder: candidate.saved_folder }
            : item
        )
      );
      showNotification('Không cập nhật được kho ứng viên. Vui lòng thử lại.', 'error');
    } finally {
      setSavingIds((previous) => {
        const next = new Set(previous);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const currentPageSavedCount = candidates.filter((candidate) =>
    Boolean(candidate.is_saved)
  ).length;
  const visiblePublicCount = Number(stats.visibleCandidates || pagination.total || 0);
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label || SORT_OPTIONS[0].label;
  const selectedLevelLabel =
    LEVEL_OPTIONS.find((option) => option.value === selectedLevel)?.label || LEVEL_OPTIONS[0].label;
  const salaryLabel =
    SALARY_OPTIONS.find((option) => option.value === salaryRange)?.label || SALARY_OPTIONS[0].label;
  const activeFilters = [
    keyword.trim() ? `Từ khóa: ${keyword.trim()}` : null,
    skillQuery.trim() ? `Kỹ năng: ${skillQuery.trim()}` : null,
    locationQuery.trim() ? `Khu vực: ${locationQuery.trim()}` : null,
    selectedLevel !== 'all' ? selectedLevelLabel : null,
    salaryRange !== 'all' ? salaryLabel : null,
  ].filter(Boolean);
  const activeFilterCount = activeFilters.length;
  const resultHeading = keyword.trim()
    ? `Kết quả cho "${keyword.trim()}"`
    : activeFilterCount
      ? 'Ứng viên theo bộ lọc'
      : 'Danh sách ứng viên công khai';

  const insightHeader = useMemo(() => {
    if (loading) {
      return {
        title: 'Đang đồng bộ nguồn ứng viên',
        description: 'Hệ thống đang rà lại hồ sơ công khai để cập nhật dữ liệu mới nhất.',
      };
    }

    if (error) {
      return {
        title: 'Cần kiểm tra kết nối dữ liệu',
        description: 'Danh sách ứng viên chưa tải được nên các nhận định tạm thời chưa sẵn sàng.',
      };
    }

    if (!pagination.total) {
      return {
        title: 'Bộ lọc hiện chưa tạo ra kết quả',
        description:
          'Thử nới rộng kỹ năng, khu vực hoặc mức lương để mở thêm nguồn ứng viên công khai.',
      };
    }

    if (activeFilterCount >= 3) {
      return {
        title: 'Bộ lọc đang khá tập trung',
        description:
          'Giữ bộ lọc này nếu bạn cần danh sách rút gọn chính xác, hoặc nới nhẹ để mở thêm nguồn.',
      };
    }

    return {
      title: 'Tập hồ sơ đang cân bằng',
      description:
        'Bạn có thể tiếp tục lưu hồ sơ vào kho ứng viên và nhắn tin với các ứng viên cần trao đổi.',
    };
  }, [activeFilterCount, error, loading, pagination.total]);

  return (
    <div className="min-h-screen bg-transparent pb-16 animate-fade-in">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-4xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                  Tìm ứng viên công khai
                </span>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                  Trung tâm tìm kiếm ứng viên
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  {insightHeader.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <EmployerStatCard
              icon={Search}
              label="Kết quả hiện tại"
              value={formatNumber(pagination.total)}
              helper="Theo bộ lọc"
              tone="emerald"
              loading={loading}
            />
            <EmployerStatCard
              icon={UserRoundSearch}
              label="Nguồn công khai"
              value={formatNumber(visiblePublicCount)}
              helper="Có thể tiếp cận"
              tone="blue"
              loading={loading}
            />
            <EmployerStatCard
              icon={Bookmark}
              label="Kho ứng viên"
              value={formatNumber(stats.savedCandidates)}
              helper="Hồ sơ đã lưu"
              tone="violet"
              loading={loading}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              variant="outline"
              className="h-11 justify-start rounded-xl border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:border-emerald-600 hover:bg-emerald-600 hover:text-white sm:w-auto"
            >
              <Link to="/employer/saved-candidates">
                Mở kho ứng viên
                <ArrowRight className="ml-2 h-4 w-4 text-white" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 justify-start rounded-xl border-slate-200/90 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-white hover:text-emerald-700 sm:w-auto"
            >
              <Link to="/employer/jobs">Tin tuyển dụng</Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <section className="min-w-0 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.25fr)_minmax(170px,0.9fr)_minmax(160px,0.85fr)_180px_180px_180px_auto]">
              <SearchInput
                icon={Search}
                value={keyword}
                onChange={setKeyword}
                placeholder="Tên ứng viên, vị trí..."
              />
              <SearchInput
                icon={Sparkles}
                value={skillQuery}
                onChange={setSkillQuery}
                placeholder="Kỹ năng: React, SEO..."
              />
              <SearchInput
                icon={MapPin}
                value={locationQuery}
                onChange={setLocationQuery}
                placeholder="Địa điểm..."
              />
              <Select
                value={selectedLevel}
                onValueChange={(value) => {
                  setSelectedLevel(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  {LEVEL_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm font-medium"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={salaryRange}
                onValueChange={(value) => {
                  setSalaryRange(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  {SALARY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm font-medium"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-12 rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-sm font-medium"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={executeSearch}
                className="h-12 rounded-lg bg-emerald-600 px-4 text-sm font-bold hover:bg-emerald-700"
              >
                <Search className="mr-1.5 h-4 w-4" />
                Tìm
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Hiển thị{' '}
                <strong className="text-slate-700">{formatNumber(pagination.total || 0)}</strong>{' '}
                ứng viên · {resultHeading}
              </span>
              <span>
                <strong className="text-slate-700">{formatNumber(currentPageSavedCount)}</strong> đã
                lưu trong trang
              </span>
              {activeFilterCount > 0 ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {activeFilterCount} bộ lọc
                </span>
              ) : null}
              {activeFilters.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {activeFilters.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Đang xem toàn bộ hồ sơ công khai
                </span>
              )}
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {sortLabel} · {salaryLabel} ·{' '}
                {selectedLevel !== 'all' ? selectedLevelLabel : 'Tất cả cấp độ'}
              </span>
              {activeFilterCount ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-8 rounded-lg border-slate-200 px-3 text-xs font-bold"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Xóa lọc
                </Button>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserRoundSearch className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">
                  {loading
                    ? 'Đang đồng bộ ứng viên'
                    : `${formatNumber(pagination.total || 0)} ứng viên`}
                </span>
              </div>
              {totalPages > 1 ? (
                <span className="text-xs text-slate-400">
                  Trang {page}/{totalPages}
                </span>
              ) : null}
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : candidates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Không tìm thấy ứng viên</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Thử mở rộng từ khóa, bỏ bớt kỹ năng hoặc chọn lại khu vực để lấy thêm nhiều hồ sơ
                  hơn từ hệ thống.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={resetFilters}
                    className="h-11 rounded-lg bg-emerald-600 px-6 font-bold hover:bg-emerald-700"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-lg border-slate-200 px-6 font-bold"
                  >
                    <Link to="/employer/saved-candidates">Xem kho ứng viên</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      saving={savingIds.has(candidate.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="flex h-10 min-w-[88px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                      {page}/{totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
