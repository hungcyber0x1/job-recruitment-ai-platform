import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Compass,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Target,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryService } from '@/services';
import { renderCategoryIcon, unwrapCategoryListResponse } from '@/utils';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const FILTER_TABS = [
  {
    id: 'all',
    label: 'Tất cả',
    description: 'Tất cả ngành nghề đang bật',
  },
  {
    id: 'hiring',
    label: 'Đang có việc',
    description: 'Có việc làm công khai để ứng tuyển',
  },
  {
    id: 'skill-linked',
    label: 'Có kỹ năng',
    description: 'Đã liên kết với hệ kỹ năng',
  },
  {
    id: 'unmapped',
    label: 'Chưa gắn việc làm',
    description: 'Cần bổ sung tin tuyển dụng công khai',
  },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Nhiều việc làm nhất' },
  { value: 'skills', label: 'Nhiều kỹ năng nhất' },
  { value: 'curated', label: 'Thứ tự quản trị' },
  { value: 'alphabetical', label: 'A-Z' },
];

const getSortPriority = (category) =>
  Number.isFinite(category.sortOrder) && category.sortOrder > 0
    ? category.sortOrder
    : Number.MAX_SAFE_INTEGER;

const formatNumber = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);

const getCategorySearchText = (category) =>
  [category.name, category.description, category.slug].join(' ').toLowerCase();

const getTabCount = (tabId, categories) => {
  if (tabId === 'hiring') return categories.filter((category) => category.jobCount > 0).length;
  if (tabId === 'skill-linked')
    return categories.filter((category) => category.skillCount > 0).length;
  if (tabId === 'unmapped') return categories.filter((category) => category.jobCount === 0).length;
  return categories.length;
};

const InsightCard = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold leading-none tracking-normal text-foreground">
          {value}
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{helper}</p>
      </div>
    </div>
  </div>
);

const CategorySkeleton = () => (
  <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-4">
      <Skeleton className="size-14 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-5 w-2/3 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
      </div>
    </div>
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </div>
);

const FilterButton = ({ tab, active, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
      active
        ? 'border-primary/20 bg-primary/8 text-primary shadow-sm'
        : 'border-border/60 bg-white text-slate-600 hover:border-primary/20 hover:bg-primary/5 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
    }`}
  >
    <span className="min-w-0">
      <span className="block text-sm font-bold">{tab.label}</span>
      <span className="mt-0.5 line-clamp-1 block text-xs font-medium opacity-70">
        {tab.description}
      </span>
    </span>
    <span
      className={`ml-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {formatNumber(count)}
    </span>
  </button>
);

const CategoryResultCard = ({ category, isTopDemand }) => {
  const hasJobs = category.jobCount > 0;
  const hasSkillMap = category.skillCount > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-slate-700 transition-colors group-hover:border-primary/25 group-hover:bg-primary/8 group-hover:text-primary dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
          {renderCategoryIcon(category, { size: 26, strokeWidth: 1.8 })}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {isTopDemand ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Nhu cầu cao
                  </span>
                ) : null}

                {hasJobs ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Đang mở tuyển
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    Cần bổ sung tin
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold leading-snug tracking-normal text-foreground transition-colors group-hover:text-primary">
                {category.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-base font-medium leading-relaxed text-muted-foreground">
                {category.description ||
                  'Danh mục đang dùng trong bộ lọc việc làm công khai và hệ phân loại kỹ năng.'}
              </p>
            </div>

            <Link
              to={`/jobs?category_id=${category.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-primary/20 hover:bg-primary/8 hover:text-primary dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              Xem việc làm
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Briefcase className="size-4" aria-hidden="true" />
              {formatNumber(category.jobCount)} việc làm
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Tags className="size-4" aria-hidden="true" />
              {formatNumber(category.skillCount)} kỹ năng
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <Target className="size-4" aria-hidden="true" />
              {hasSkillMap ? 'Đã gắn kỹ năng' : 'Chưa gắn kỹ năng'}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllCategories();
        if (!cancelled) {
          setCategories(unwrapCategoryListResponse(response));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load categories:', error);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  const summary = useMemo(() => {
    const totalJobs = activeCategories.reduce((sum, category) => sum + category.jobCount, 0);
    const hiringCount = activeCategories.filter((category) => category.jobCount > 0).length;
    const skillLinkedCount = activeCategories.filter((category) => category.skillCount > 0).length;
    const topCategory =
      [...activeCategories]
        .filter((category) => category.jobCount > 0)
        .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name, 'vi'))[0] || null;
    const topSkillCategory =
      [...activeCategories]
        .filter((category) => category.skillCount > 0)
        .sort((a, b) => b.skillCount - a.skillCount || a.name.localeCompare(b.name, 'vi'))[0] ||
      null;

    return {
      totalCategories: activeCategories.length,
      totalJobs,
      hiringCount,
      skillLinkedCount,
      topCategory,
      topSkillCategory,
    };
  }, [activeCategories]);

  const filterTabs = useMemo(
    () =>
      FILTER_TABS.map((tab) => ({
        ...tab,
        count: getTabCount(tab.id, activeCategories),
      })),
    [activeCategories]
  );

  const activeTabMeta = filterTabs.find((tab) => tab.id === activeTab) || filterTabs[0];

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const next = activeCategories.filter((category) => {
      const matchesSearch = !keyword || getCategorySearchText(category).includes(keyword);

      if (!matchesSearch) return false;
      if (activeTab === 'hiring') return category.jobCount > 0;
      if (activeTab === 'skill-linked') return category.skillCount > 0;
      if (activeTab === 'unmapped') return category.jobCount === 0;
      return true;
    });

    if (sortBy === 'alphabetical') {
      return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    if (sortBy === 'skills') {
      return next.sort((a, b) => b.skillCount - a.skillCount || a.name.localeCompare(b.name, 'vi'));
    }

    if (sortBy === 'curated') {
      return next.sort(
        (a, b) =>
          getSortPriority(a) - getSortPriority(b) ||
          b.jobCount - a.jobCount ||
          a.name.localeCompare(b.name, 'vi')
      );
    }

    return next.sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name, 'vi'));
  }, [activeCategories, activeTab, searchTerm, sortBy]);

  const hasActiveFilters = searchTerm.trim().length > 0 || activeTab !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-emerald-50/30 text-foreground">
      <section className="page-hero-bg page-hero-grain relative overflow-visible">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="page-hero-pattern" />
          <div className="page-hero-blob page-hero-blob-1" />
          <div className="page-hero-blob page-hero-blob-2" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold uppercase tracking-normal text-primary"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              Ngành nghề công khai
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl md:text-4xl lg:text-5xl"
            >
              Khám phá ngành nghề và cơ hội việc làm đang mở
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-base font-medium leading-relaxed text-muted-foreground md:text-lg"
            >
              Dữ liệu lấy trực tiếp từ hệ phân loại đang hoạt động, đồng bộ với bộ lọc việc làm công
              khai và kỹ năng liên quan.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-20 mx-auto mt-8 max-w-4xl"
          >
            <div className="rounded-2xl border border-border/60 bg-white/95 p-2 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="relative flex items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus-within:border-emerald-500/20 dark:focus-within:bg-slate-900">
                <Search className="absolute left-4 size-5 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm ngành nghề, mô tả hoặc mã phân loại..."
                  className="h-14 w-full border-0 bg-transparent pl-12 pr-12 text-base font-semibold text-slate-700 outline-none placeholder:text-slate-400/90 focus:ring-0 dark:text-slate-200"
                  aria-label="Tìm kiếm ngành nghề"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                    activeTab === tab.id
                      ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border bg-white/80 text-slate-600 hover:bg-primary/10 hover:text-primary dark:bg-slate-900/70 dark:text-slate-300'
                  }`}
                >
                  {tab.label} · {formatNumber(tab.count)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InsightCard
                icon={Briefcase}
                label="Việc công khai"
                value={formatNumber(summary.totalJobs)}
                helper={`${formatNumber(summary.hiringCount)} ngành đang có tin`}
              />
              <InsightCard
                icon={Tags}
                label="Kỹ năng liên kết"
                value={formatNumber(summary.skillLinkedCount)}
                helper="Phục vụ gợi ý và bộ lọc ứng viên"
              />
              <InsightCard
                icon={BarChart3}
                label="Danh mục bật"
                value={formatNumber(summary.totalCategories)}
                helper="Chỉ hiển thị danh mục đang hoạt động"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="page-content-bg container relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <section className="rounded-2xl border border-border/60 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Bộ lọc ngành nghề</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Đồng bộ với dữ liệu công khai
                    </p>
                  </div>
                  <SlidersHorizontal className="size-5 text-primary" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                  {filterTabs.map((tab) => (
                    <FilterButton
                      key={tab.id}
                      tab={tab}
                      count={tab.count}
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </div>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-primary/20 hover:bg-primary/8 hover:text-primary dark:border-slate-800 dark:text-slate-300"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Đặt lại bộ lọc
                  </button>
                ) : null}
              </section>

              <section className="rounded-2xl border border-border/60 bg-slate-950 p-5 text-white shadow-sm dark:border-slate-800">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-normal text-emerald-300">
                      Danh mục nổi bật
                    </p>
                    <h2 className="mt-1 text-lg font-bold tracking-normal">Tín hiệu tuyển dụng</h2>
                  </div>
                  <Sparkles className="size-5 text-emerald-300" aria-hidden="true" />
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-normal text-slate-400">
                      Nhiều việc làm nhất
                    </p>
                    <p className="mt-2 text-base font-bold text-white">
                      {summary.topCategory?.name || 'Chưa có dữ liệu'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-400">
                      {summary.topCategory
                        ? `${formatNumber(summary.topCategory.jobCount)} việc làm công khai`
                        : 'Sẽ hiển thị khi có ngành đang tuyển.'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-normal text-slate-400">
                      Liên kết kỹ năng mạnh nhất
                    </p>
                    <p className="mt-2 text-base font-bold text-white">
                      {summary.topSkillCategory?.name || 'Chưa có dữ liệu'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-400">
                      {summary.topSkillCategory
                        ? `${formatNumber(summary.topSkillCategory.skillCount)} kỹ năng đang gắn`
                        : 'Sẽ hiển thị khi ngành được gắn kỹ năng.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </aside>

          <section className="min-w-0 lg:col-span-9">
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border/60 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hiển thị{' '}
                  <span className="font-bold text-foreground">
                    {formatNumber(filteredCategories.length)}
                  </span>{' '}
                  trong{' '}
                  <span className="font-bold text-foreground">
                    {formatNumber(summary.totalCategories)}
                  </span>{' '}
                  ngành nghề
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
                    {activeTabMeta?.label || 'Tất cả'}
                  </span>
                  {searchTerm.trim() ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      Từ khóa: “{searchTerm.trim()}”
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  Sắp xếp
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 w-full min-w-[220px] text-sm font-bold sm:w-[220px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CategorySkeleton key={index} />
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-slate-800">
                  <Loader2 className="size-8" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">
                  Không có ngành nghề phù hợp
                </h3>
                <p className="mx-auto mt-2 max-w-md text-base font-medium leading-relaxed text-muted-foreground">
                  Thử đổi từ khóa hoặc chọn lại bộ lọc để xem thêm hệ phân loại đang hoạt động.
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-primary/20 hover:bg-primary/8 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Xóa bộ lọc
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <CategoryResultCard
                    key={category.id}
                    category={category}
                    isTopDemand={summary.topCategory?.id === category.id && category.jobCount > 0}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;
