import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookmarkCheck,
  Briefcase,
  Building2,
  Globe,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common';
import { Input } from '@/components/ui/input';
import { candidateService } from '../../services';
import { useNotification } from '../../context/NotificationContext';
import { cn } from '../../utils/cn';
import { isHandledAuthError } from '../../utils/authErrors';

const AVATAR_PALETTE = [
  '0d9488',
  '0f766e',
  '115e59',
  '047857',
  '059669',
  '134e4a',
  '0e7490',
  '155e75',
];

const INDUSTRY_FILTERS = [
  { value: 'all', label: 'Tất cả', match: () => true },
  {
    value: 'technology',
    label: 'Công nghệ',
    match: (industry) => /công nghệ|technology|tech|it|software|ai/i.test(industry),
  },
  {
    value: 'finance',
    label: 'Tài chính',
    match: (industry) => /tài chính|finance|bank|fintech|bảo hiểm/i.test(industry),
  },
  {
    value: 'marketing',
    label: 'Marketing',
    match: (industry) => /marketing|sales|truyền thông|media|agency/i.test(industry),
  },
];

const INDUSTRY_TONES = [
  {
    test: /công nghệ|technology|tech|it|software|ai/i,
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    icon: 'bg-sky-50 text-sky-600 ring-sky-100',
    accent: 'bg-sky-500',
  },
  {
    test: /tài chính|finance|bank|fintech|bảo hiểm/i,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    accent: 'bg-emerald-500',
  },
  {
    test: /marketing|sales|truyền thông|media|agency/i,
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    icon: 'bg-rose-50 text-rose-600 ring-rose-100',
    accent: 'bg-rose-500',
  },
];

function avatarBackgroundHex(name) {
  const s = String(name || 'C');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function getCompanyLogoSrc(company) {
  if (company.company_logo || company.logo) return company.company_logo || company.logo;
  const name = encodeURIComponent(company.company_name || company.name || 'C');
  const bg = avatarBackgroundHex(company.company_name || company.name);
  return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=ffffff&size=128&font-size=0.42&bold=true`;
}

function getCompanyName(company) {
  return company.company_name || company.name || 'Công ty chưa cập nhật';
}

function getCompanyId(company) {
  return company.id || company.company_id;
}

const UNKNOWN_INDUSTRY_LABEL = 'Lĩnh vực chưa cập nhật';

function getCompanyIndustryRaw(company) {
  return String(company.industry || '').trim();
}

function getCompanyIndustry(company) {
  return getCompanyIndustryRaw(company) || UNKNOWN_INDUSTRY_LABEL;
}

function getCompanyLocation(company) {
  return company.location || 'Địa điểm chưa cập nhật';
}

function getCompanySize(company) {
  return company.size || company.company_size || null;
}

function getCompanyOpenJobs(company) {
  return Number(company.open_jobs ?? company.openPositions ?? 0) || 0;
}

function getCompanyWebsite(company) {
  return company.website || company.company_website || '';
}

function getSizeLabel(size) {
  if (!size) return 'Chưa cập nhật';
  const text = String(size);
  if (/1\s*-\s*10/i.test(text)) return 'Startup';
  if (/11\s*-\s*50/i.test(text)) return 'Nhỏ';
  if (/51\s*-\s*200/i.test(text)) return 'Vừa';
  if (/201\s*-\s*500/i.test(text)) return 'Lớn';
  if (/501\s*-\s*1000/i.test(text)) return 'Doanh nghiệp';
  if (/1000\+|1001/i.test(text)) return 'Tập đoàn';
  return `${text} nhân viên`;
}

function getIndustryTone(industry) {
  const found = INDUSTRY_TONES.find((tone) => tone.test.test(industry));
  return (
    found || {
      badge: 'bg-slate-50 text-slate-700 ring-slate-200',
      icon: 'bg-slate-50 text-slate-600 ring-slate-100',
      accent: 'bg-slate-400',
    }
  );
}

const FilterTabs = ({ value, onChange, counts }) => (
  <div className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
    {INDUSTRY_FILTERS.map((tab) => {
      const active = value === tab.value;
      const count = counts[tab.value] || 0;
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3.5 text-sm font-bold transition-colors duration-200',
            active
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          )}
        >
          {tab.label}
          {count > 0 && (
            <span
              className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const CompanySkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="h-2 bg-slate-100" />
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="h-16 w-16 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-7 w-20 rounded-md bg-slate-100 animate-pulse" />
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="h-5 w-3/4 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-14 rounded-lg bg-slate-50 animate-pulse" />
        <div className="h-14 rounded-lg bg-slate-50 animate-pulse" />
      </div>
      <div className="mt-5 h-11 rounded-lg bg-slate-100 animate-pulse" />
    </div>
  </div>
);

const CompanyCard = ({ company, onUnsave, index }) => {
  const companyId = getCompanyId(company);
  const name = getCompanyName(company);
  const industry = getCompanyIndustry(company);
  const location = getCompanyLocation(company);
  const sizeLabel = getSizeLabel(getCompanySize(company));
  const openJobs = getCompanyOpenJobs(company);
  const website = getCompanyWebsite(company);
  const tone = getIndustryTone(industry);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
        <div className={cn('absolute inset-x-0 top-0 h-1', tone.accent)} />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img
                src={getCompanyLogoSrc(company)}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <BookmarkCheck size={13} />
              Đã lưu
            </div>
          </div>

          <div className="mt-5 flex-1">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                tone.badge
              )}
            >
              <Sparkles size={12} />
              {industry}
            </span>

            <Link to={`/companies/${companyId}`} className="mt-3 block">
              <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-normal text-slate-950 transition-colors group-hover:text-emerald-700">
                {name}
              </h3>
            </Link>

            {website && (
              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">{website}</p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <MapPin size={14} />
                  Vị trí
                </div>
                <div className="mt-1 line-clamp-1 text-sm font-bold text-slate-700">{location}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Users size={14} />
                  Quy mô
                </div>
                <div className="mt-1 line-clamp-1 text-sm font-bold text-slate-700">
                  {sizeLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
            <Link
              to={`/companies/${companyId}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {openJobs > 0 ? `${openJobs} việc đang mở` : 'Xem hồ sơ'}
              <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => onUnsave(companyId)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label={`Bỏ theo dõi ${name}`}
              title="Bỏ theo dõi"
            >
              <BookmarkCheck size={17} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const SavedCompaniesPage = () => {
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchSavedCompanies = async () => {
      try {
        const response = await candidateService.getSavedCompanies();
        setSavedCompanies(response.data?.data || []);
      } catch (error) {
        if (isHandledAuthError(error)) {
          setSavedCompanies([]);
          return;
        }
        console.error('Failed to fetch saved companies:', error);
        showNotification('Không thể tải danh sách công ty đã lưu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCompanies();
  }, [showNotification]);

  const stats = useMemo(() => {
    const knownIndustryNames = savedCompanies
      .map((company) => getCompanyIndustryRaw(company))
      .filter(Boolean);
    const industries = new Set(knownIndustryNames);
    const openJobs = savedCompanies.reduce((sum, company) => sum + getCompanyOpenJobs(company), 0);
    const topIndustry = Object.entries(
      knownIndustryNames.reduce((acc, industry) => {
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      total: savedCompanies.length,
      industries: industries.size,
      openJobs,
      topIndustry,
      unknownIndustryCount: savedCompanies.length - knownIndustryNames.length,
    };
  }, [savedCompanies]);

  const filterCounts = useMemo(() => {
    return INDUSTRY_FILTERS.reduce((acc, tab) => {
      acc[tab.value] =
        tab.value === 'all'
          ? savedCompanies.length
          : savedCompanies.filter((company) => tab.match(getCompanyIndustry(company))).length;
      return acc;
    }, {});
  }, [savedCompanies]);

  const filteredCompanies = useMemo(() => {
    let result = [...savedCompanies];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((company) => {
        const searchable = [
          getCompanyName(company),
          getCompanyIndustry(company),
          getCompanyLocation(company),
          getCompanyWebsite(company),
        ]
          .join(' ')
          .toLowerCase();
        return searchable.includes(query);
      });
    }

    const selectedFilter = INDUSTRY_FILTERS.find((tab) => tab.value === activeFilter);
    if (selectedFilter && selectedFilter.value !== 'all') {
      result = result.filter((company) => selectedFilter.match(getCompanyIndustry(company)));
    }

    return result;
  }, [savedCompanies, searchQuery, activeFilter]);

  const handleUnsave = useCallback(
    async (companyId) => {
      try {
        await candidateService.unsaveCompany(companyId);
        setSavedCompanies((prev) => prev.filter((company) => getCompanyId(company) !== companyId));
        showNotification('Đã bỏ theo dõi công ty', 'info');
      } catch (error) {
        if (isHandledAuthError(error)) return;
        console.error('Failed to unsave company:', error);
        showNotification('Không thể bỏ theo dõi công ty', 'error');
      }
    },
    [showNotification]
  );

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  const hasCompanies = savedCompanies.length > 0;
  const hasActiveFilters = Boolean(searchQuery.trim()) || activeFilter !== 'all';

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Danh sách theo dõi
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  Công ty đang theo dõi
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Quản lý các doanh nghiệp bạn quan tâm và theo dõi cơ hội tuyển dụng mới.
                </p>
              </div>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên, lĩnh vực hoặc địa điểm..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-lg border-slate-200 bg-white/90 pl-10 pr-10 text-sm font-medium shadow-sm transition-colors duration-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>

          {!loading && hasCompanies && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                icon={BookmarkCheck}
                label="Đang theo dõi"
                value={stats.total}
                helper="Công ty đã lưu"
                tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
                index={0}
              />
              <StatCard
                icon={Globe}
                label="Lĩnh vực đã cập nhật"
                value={stats.industries}
                helper={
                  stats.topIndustry ||
                  (stats.unknownIndustryCount > 0
                    ? `${stats.unknownIndustryCount} công ty chưa cập nhật`
                    : 'Chưa có dữ liệu')
                }
                tone="bg-violet-50 text-violet-600 ring-violet-100"
                index={1}
              />
              <StatCard
                icon={Briefcase}
                label="Cơ hội việc làm"
                value={stats.openJobs}
                helper="Đang mở"
                tone="bg-sky-50 text-sky-600 ring-sky-100"
                index={2}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {!loading && hasCompanies && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 overflow-x-auto"
            >
              <div className="min-w-max">
                <FilterTabs value={activeFilter} onChange={setActiveFilter} counts={filterCounts} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium text-slate-500">
                Hiển thị{' '}
                <span className="font-bold text-slate-800">{filteredCompanies.length}</span>
                {filteredCompanies.length !== savedCompanies.length && (
                  <>
                    {' '}
                    trong <span className="font-bold text-slate-800">
                      {savedCompanies.length}
                    </span>{' '}
                    công ty
                  </>
                )}
                {searchQuery && (
                  <>
                    {' '}
                    cho "<span className="font-bold text-emerald-600">{searchQuery}</span>"
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Xóa bộ lọc
                </button>
              )}
            </motion.div>
          </>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <CompanySkeleton key={item} />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <EmptyState
                  variant="robotReading"
                  title={hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa theo dõi công ty nào'}
                  description={
                    hasActiveFilters
                      ? 'Thử thay đổi từ khóa hoặc bỏ bộ lọc để xem lại toàn bộ danh sách theo dõi.'
                      : 'Theo dõi các công ty bạn quan tâm để quay lại nhanh và cập nhật cơ hội mới.'
                  }
                  action={
                    hasActiveFilters ? (
                      <Button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
                      >
                        Xóa bộ lọc
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
                      >
                        <Link to="/companies">Khám phá công ty</Link>
                      </Button>
                    )
                  }
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company, index) => (
                <CompanyCard
                  key={getCompanyId(company)}
                  company={company}
                  onUnsave={handleUnsave}
                  index={index}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {!loading && hasCompanies && (
        <section className="mt-8 border-y border-slate-200 bg-slate-950">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-normal text-white">
                  Khám phá thêm doanh nghiệp phù hợp
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
                  Mở rộng danh sách theo dõi để không bỏ lỡ các vị trí mới từ những công ty đang
                  tuyển dụng.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="h-11 rounded-lg bg-white px-5 font-bold text-slate-950 transition-colors hover:bg-emerald-100"
            >
              <Link to="/companies" className="inline-flex items-center gap-2">
                Khám phá ngay
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default SavedCompaniesPage;
