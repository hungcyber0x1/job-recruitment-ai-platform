import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Flag,
  Globe,
  MapPin,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const PAGE_SIZE = 10;
const LOGO_COLORS = [
  'bg-emerald-500/15 text-emerald-700 ring-emerald-100',
  'bg-sky-500/15 text-sky-700 ring-sky-100',
  'bg-amber-500/15 text-amber-700 ring-amber-100',
  'bg-violet-500/15 text-violet-700 ring-violet-100',
];

const INDUSTRY_TABS = [
  { id: 'all', label: 'Tất cả', query: '' },
  { id: 'tech', label: 'Công nghệ', query: 'công nghệ' },
  { id: 'finance', label: 'Tài chính', query: 'tài chính' },
  { id: 'manufacturing', label: 'Sản xuất', query: 'sản xuất' },
];

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'Tất cả xác thực' },
  { value: 'verified', label: 'Đã xác thực' },
  { value: 'unverified', label: 'Chờ xác thực' },
];

const FLAGGED_OPTIONS = [
  { value: 'all', label: 'Tất cả cảnh báo' },
  { value: 'clean', label: 'Không gắn cờ' },
  { value: 'flagged', label: 'Đã gắn cờ' },
];

function SectionCard({ icon: Icon, title, description, action, className = '', children, ...props }) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6 ${className}`}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-normal text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return [1];

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.reduce((items, page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }
    items.push(page);
    return items;
  }, []);
}

function getIndustryQuery(industryTab) {
  return INDUSTRY_TABS.find((tab) => tab.id === industryTab)?.query || '';
}

function getInitials(name = '') {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return 'CT';

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return normalizedName.slice(0, 2).toUpperCase();
}

function getLogoColor(index) {
  return LOGO_COLORS[index % LOGO_COLORS.length];
}

function getCompanyLocation(company) {
  return company.location || company.city || 'Chưa cập nhật địa điểm';
}

function getCompanyIndustry(company) {
  return company.industry || company.category_name || 'Chưa phân loại';
}

function getCompanyWebsite(company) {
  const value = String(company.company_website || '').trim();
  if (!value) return '';
  return value.startsWith('http') ? value : `https://${value}`;
}

function getTrustScore(company) {
  const verifiedBase = company.is_verified ? 7.8 : 4.6;
  const jobBonus = Math.min(1.6, Number(company.job_count || 0) * 0.2);
  const flagPenalty = company.flagged ? 1.7 : 0;
  const rawScore = verifiedBase + jobBonus - flagPenalty;
  const clampedScore = Math.max(1, Math.min(10, rawScore));
  return Number(clampedScore.toFixed(1));
}

function getTrustMeta(score) {
  if (score >= 8) {
    return {
      label: 'Ổn định',
      barClass: 'bg-emerald-500',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (score >= 5) {
    return {
      label: 'Cần theo dõi',
      barClass: 'bg-amber-500',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Rủi ro',
    barClass: 'bg-rose-500',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  };
}

function getStatusMeta(company) {
  if (company.flagged) {
    return {
      label: 'Đã gắn cờ',
      description: 'Cần rà soát',
      icon: Flag,
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }

  if (company.is_verified) {
    return {
      label: 'Đã xác thực',
      description: 'Đang hoạt động',
      icon: ShieldCheck,
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: 'Chờ xác thực',
    description: 'Chưa duyệt',
    icon: Clock3,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

const CompaniesPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [verificationFilter, setVerificationFilter] = useState(
    () => searchParams.get('verification') || 'all'
  );
  const [flaggedFilter, setFlaggedFilter] = useState(() => searchParams.get('flagged') || 'all');
  const [industryTab, setIndustryTab] = useState(() => searchParams.get('industry') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        search: debouncedSearch.trim() || undefined,
        is_verified:
          verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
        flagged: flaggedFilter === 'all' ? undefined : String(flaggedFilter === 'flagged'),
        industry: industryTab !== 'all' ? getIndustryQuery(industryTab) : undefined,
        page,
        limit: PAGE_SIZE,
      };

      const response = await adminService.getCompanies(params);
      const payload = response?.data;

      if (payload?.success) {
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const sanitizedCompanies = list.map((company) => ({
          id: company?.id ?? 0,
          company_name: String(company?.company_name ?? ''),
          company_logo: String(company?.company_logo ?? ''),
          company_website: String(company?.company_website ?? ''),
          company_description: String(company?.company_description ?? ''),
          location: String(company?.location ?? ''),
          city: String(company?.city ?? ''),
          industry: String(company?.industry ?? ''),
          category_name: String(company?.category_name ?? ''),
          company_size: String(company?.company_size ?? ''),
          moderation_note: String(company?.moderation_note ?? ''),
          is_verified: Boolean(company?.is_verified ?? false),
          flagged: Boolean(company?.flagged ?? false),
          job_count: Number(company?.job_count ?? company?.open_jobs_count ?? 0),
          created_at: company?.created_at ?? null,
        }));

        const nextPagination = payload?.pagination ?? {
          total: sanitizedCompanies.length,
          pages: 1,
        };
        const nextPages = Math.max(1, Number(nextPagination?.pages ?? 1));
        const nextTotal = Math.max(0, Number(nextPagination?.total ?? sanitizedCompanies.length));

        setCompanies(sanitizedCompanies);
        setPagination({
          total: nextTotal,
          pages: nextPages,
        });
        setStats({
          total: Number(payload?.stats?.total ?? nextTotal),
          pending: Number(
            payload?.stats?.pending ??
              sanitizedCompanies.filter((company) => !company.is_verified).length
          ),
          flagged: Number(
            payload?.stats?.flagged ??
              sanitizedCompanies.filter((company) => company.flagged).length
          ),
        });

        if (nextTotal > 0 && page > nextPages) {
          setPage(nextPages);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, flaggedFilter, industryTab, page, verificationFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (verificationFilter !== 'all') nextParams.set('verification', verificationFilter);
    if (flaggedFilter !== 'all') nextParams.set('flagged', flaggedFilter);
    if (industryTab !== 'all') nextParams.set('industry', industryTab);
    if (page > 1) nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    debouncedSearch,
    flaggedFilter,
    industryTab,
    page,
    searchParams,
    setSearchParams,
    verificationFilter,
  ]);

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  const handleVerifyCompany = async (company, isVerified) => {
    try {
      setLoading(true);
      await adminService.verifyCompany(company.id, isVerified, '');
      showNotification(isVerified ? 'Đã xác thực công ty.' : 'Đã hủy xác thực công ty.', 'success');
      await refreshCompanies();
    } catch (error) {
      console.error('Error verifying company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật xác thực.',
        'error'
      );
      setLoading(false);
    }
  };

  const handleFlagCompany = async (company) => {
    try {
      setLoading(true);
      await adminService.flagCompany(company.id, !company.flagged, '');
      showNotification(
        !company.flagged ? 'Đã gắn cờ công ty.' : 'Đã gỡ cờ công ty.',
        'success'
      );
      await refreshCompanies();
    } catch (error) {
      console.error('Error flagging company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cờ cảnh báo.',
        'error'
      );
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (company) => {
    const confirmed = window.confirm(
      `Xóa công ty "${company.company_name}"? Các tin tuyển dụng liên quan cũng có thể bị ảnh hưởng theo quy tắc hệ thống.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await adminService.deleteCompany(company.id);
      showNotification('Đã xóa công ty thành công.', 'success');

      if (companies.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
        return;
      }

      await refreshCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      showNotification(
        error?.response?.data?.message || 'Có lỗi xảy ra khi xóa công ty.',
        'error'
      );
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setInputValue('');
    setVerificationFilter('all');
    setFlaggedFilter('all');
    setIndustryTab('all');
    setPage(1);
  };

  const safeStats = stats ?? {
    total: pagination.total || companies.length,
    pending: companies.filter((company) => !company.is_verified).length,
    flagged: companies.filter((company) => company.flagged).length,
  };

  const verifiedCount = Math.max(0, safeStats.total - safeStats.pending);
  const pageStart = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = pagination.total === 0 ? 0 : Math.min(page * PAGE_SIZE, pagination.total);
  const pageItems = useMemo(
    () => buildPaginationItems(page, Math.max(1, pagination.pages || 1)),
    [page, pagination.pages]
  );

  const summaryCards = [
    {
      label: 'Tổng công ty',
      value: formatNumber(safeStats.total),
      helper: 'Hồ sơ doanh nghiệp',
      icon: Building2,
      className: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
    {
      label: 'Đã xác thực',
      value: formatNumber(verifiedCount),
      helper: 'Có thể hiển thị ổn định',
      icon: ShieldCheck,
      className: 'text-sky-700 bg-sky-50 ring-sky-100',
    },
    {
      label: 'Chờ xác thực',
      value: formatNumber(safeStats.pending),
      helper: 'Cần rà soát',
      icon: Clock3,
      className: 'text-amber-700 bg-amber-50 ring-amber-100',
    },
    {
      label: 'Đã gắn cờ',
      value: formatNumber(safeStats.flagged),
      helper: 'Cần kiểm duyệt kỹ',
      icon: ShieldAlert,
      className: 'text-rose-700 bg-rose-50 ring-rose-100',
    },
  ];

  const verificationLabel =
    VERIFICATION_OPTIONS.find((option) => option.value === verificationFilter)?.label ||
    'Tất cả xác thực';
  const flaggedLabel =
    FLAGGED_OPTIONS.find((option) => option.value === flaggedFilter)?.label ||
    'Tất cả cảnh báo';
  const industryLabel =
    INDUSTRY_TABS.find((tab) => tab.id === industryTab)?.label || 'Tất cả';

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                Kiểm duyệt hồ sơ doanh nghiệp
              </Badge>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Company moderation</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                Quản lý công ty
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Theo dõi hồ sơ doanh nghiệp, xác thực thông tin công ty và xử lý cảnh báo kiểm
                duyệt trong cùng một không gian vận hành rõ ràng hơn.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
                          {card.value}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset ${card.className}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setVerificationFilter('unverified');
                  setPage(1);
                }}
                className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Clock3 className="mr-2 h-4 w-4" />
                Xem chờ xác thực
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Làm sạch bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <SectionCard
            icon={Search}
            title="Bộ lọc danh sách"
            description="Tìm công ty theo tên, rà soát theo ngành, trạng thái xác thực và mức cảnh báo để vào việc nhanh hơn."
          >
            <div className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công ty hoặc email..."
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    setPage(1);
                  }}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={verificationFilter}
                  onChange={(event) => {
                    setVerificationFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                >
                  {VERIFICATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={flaggedFilter}
                  onChange={(event) => {
                    setFlaggedFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                >
                  {FLAGGED_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {INDUSTRY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setIndustryTab(tab.id);
                      setPage(1);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      industryTab === tab.id
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>
                  Từ khóa:{' '}
                  <strong className="text-slate-700">
                    {debouncedSearch.trim() || 'Tất cả công ty'}
                  </strong>
                </span>
                <span>
                  Xác thực: <strong className="text-slate-700">{verificationLabel}</strong>
                </span>
                <span>
                  Cảnh báo: <strong className="text-slate-700">{flaggedLabel}</strong>
                </span>
                <span>
                  Ngành: <strong className="text-slate-700">{industryLabel}</strong>
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Building2}
            title="Danh sách công ty"
            description="Giữ nguyên các thao tác xác thực, gắn cờ và xóa, nhưng trình bày lại để quá trình kiểm duyệt doanh nghiệp mạch lạc hơn."
            action={
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                {pageStart}-{pageEnd} / {formatNumber(pagination.total)}
              </div>
            }
          >
            {loading ? (
              <div className="flex h-72 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/90">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Công ty
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Ngành nghề
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Trạng thái
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Tin đăng
                        </th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Trust score
                        </th>
                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {companies.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-5 py-16">
                            <div className="flex flex-col items-center justify-center text-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Building2 className="h-6 w-6" />
                              </div>
                              <h3 className="mt-4 text-base font-bold text-slate-900">
                                Không tìm thấy công ty phù hợp
                              </h3>
                              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Hãy điều chỉnh lại bộ lọc hoặc mở rộng từ khóa để xem thêm hồ sơ
                                doanh nghiệp.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        companies.map((company, index) => {
                          const statusMeta = getStatusMeta(company);
                          const StatusIcon = statusMeta.icon;
                          const trustScore = getTrustScore(company);
                          const trustMeta = getTrustMeta(trustScore);
                          const website = getCompanyWebsite(company);

                          return (
                            <tr key={company.id} className="transition-colors hover:bg-emerald-50/30">
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold ring-1 ring-inset ${getLogoColor(index)}`}
                                  >
                                    {company.company_logo ? (
                                      <img
                                        src={company.company_logo}
                                        alt={company.company_name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      getInitials(company.company_name)
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <Link
                                      to={`/admin/companies/${company.id}`}
                                      className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
                                    >
                                      {company.company_name || 'Công ty chưa đặt tên'}
                                    </Link>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {getCompanyLocation(company)}
                                      </span>
                                      {website ? (
                                        <a
                                          href={website}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 hover:text-emerald-700"
                                        >
                                          <Globe className="h-3.5 w-3.5" />
                                          Website
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">
                                  {getCompanyIndustry(company)}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <Badge
                                  className={`rounded-full border px-3 py-1 font-semibold ${statusMeta.badgeClass}`}
                                >
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {statusMeta.label}
                                </Badge>
                                <p className="mt-2 text-xs font-medium text-slate-500">
                                  {statusMeta.description}
                                </p>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="inline-flex rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                      Mở tuyển
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-slate-950">
                                      {formatNumber(company.job_count)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className={`h-full rounded-full ${trustMeta.barClass}`}
                                        style={{ width: `${trustScore * 10}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">
                                      {trustScore}
                                    </span>
                                  </div>
                                  <Badge
                                    className={`rounded-full border px-3 py-1 font-semibold ${trustMeta.badgeClass}`}
                                  >
                                    {trustMeta.label}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center align-top">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-52 rounded-xl border-slate-200 p-2 shadow-lg"
                                  >
                                    <DropdownMenuLabel className="px-2 text-xs font-bold text-slate-400">
                                      Thao tác
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                                      <Link to={`/admin/companies/${company.id}`}>
                                        <ExternalLink className="mr-2 h-4 w-4 text-emerald-500" />
                                        Xem chi tiết
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg"
                                      onClick={() =>
                                        handleVerifyCompany(company, !company.is_verified)
                                      }
                                    >
                                      <ShieldCheck
                                        className={`mr-2 h-4 w-4 ${
                                          company.is_verified ? 'text-slate-500' : 'text-sky-500'
                                        }`}
                                      />
                                      {company.is_verified ? 'Hủy xác thực' : 'Duyệt công ty'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg text-amber-700 focus:bg-amber-50 focus:text-amber-800"
                                      onClick={() => handleFlagCompany(company)}
                                    >
                                      <Flag className="mr-2 h-4 w-4" />
                                      {company.flagged ? 'Gỡ cờ cảnh báo' : 'Gắn cờ cảnh báo'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg text-rose-700 focus:bg-rose-50 focus:text-rose-800"
                                      onClick={() => handleDeleteCompany(company)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Xóa công ty
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination.total > 0 ? (
                  <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm text-slate-500">
                      Hiển thị {pageStart}-{pageEnd} trong {formatNumber(pagination.total)} công ty
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={page === 1}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {pageItems.map((item) =>
                        typeof item === 'string' ? (
                          <span key={item} className="px-1 text-sm font-semibold text-slate-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`flex h-10 min-w-[40px] items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                              page === item
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setPage((currentPage) =>
                            Math.min(Math.max(1, pagination.pages), currentPage + 1)
                          )
                        }
                        disabled={page === Math.max(1, pagination.pages)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SectionCard>
        </section>
      </main>
    </div>
  );
};

export default CompaniesPage;
