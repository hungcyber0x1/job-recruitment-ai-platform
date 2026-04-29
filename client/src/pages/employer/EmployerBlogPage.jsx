import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit,
  ExternalLink,
  FileText,
  Globe2,
  Hash,
  Layers3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { blogService, unwrapBlogListResponse } from '@/services';
import BlogPostEditorDialog from '@/components/blog/BlogPostEditorDialog';
import { Button } from '@/components/ui/button';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';

const ITEMS_PER_PAGE = 6;

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả', countKey: 'all', icon: FileText, tone: 'slate' },
  { key: 'published', label: 'Đã công khai', countKey: 'published', icon: Globe2, tone: 'emerald' },
  { key: 'draft', label: 'Bản nháp', countKey: 'draft', icon: Clock3, tone: 'amber' },
];

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    accent: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    accent: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-700',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    accent: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    accent: 'bg-slate-400',
    soft: 'bg-slate-50 text-slate-700',
  },
};

const toneStyle = (tone) => TONE_STYLES[tone] || TONE_STYLES.slate;

const getTimestamp = (row) => {
  const raw = row?.updated_at || row?.published_at || row?.created_at;
  if (!raw) return 0;
  const stamp = new Date(raw).getTime();
  return Number.isFinite(stamp) ? stamp : 0;
};

const formatDate = (row) => {
  const stamp = getTimestamp(row);
  if (!stamp) return '--';
  try {
    return new Date(stamp).toLocaleDateString('vi-VN');
  } catch {
    return '--';
  }
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat('vi-VN', {
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

function StatusTabButton({ tab, count, active, onClick }) {
  const TabIcon = tab.icon || FileText;
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

function QuickActionItem({ icon: Icon, title, to, tone = 'slate', onClick }) {
  const ActionIcon = Icon || ArrowRight;
  const isPrimary = tone === 'emerald';
  const className = cn(
    'h-11 w-full justify-start rounded-xl px-4 text-sm font-semibold shadow-sm shadow-slate-950/[0.03] sm:w-auto',
    isPrimary
      ? 'border-slate-950 bg-slate-950 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
      : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700'
  );
  const iconClass = isPrimary
    ? 'text-white'
    : tone === 'sky'
      ? 'text-sky-600'
      : tone === 'amber'
        ? 'text-amber-600'
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
    <Button type="button" variant="outline" onClick={onClick} className={className}>
      {content}
    </Button>
  );
}

function PostStatusBadge({ published }) {
  if (published) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Đã công khai
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Bản nháp
    </span>
  );
}

function CompactPostCard({ row, onEdit, onDelete }) {
  const published = Boolean(row.is_published);
  const statusLineClass = published ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
      <div className={cn('absolute inset-y-0 left-0 w-1', statusLineClass)} />

      <div className="p-5 pl-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                published
                  ? 'bg-slate-950 text-white ring-slate-900/10'
                  : 'bg-slate-100 text-slate-500 ring-slate-200'
              )}
            >
              <BookOpen className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 !text-base font-bold !leading-tight tracking-normal text-slate-950 transition-colors group-hover:text-emerald-700">
                  {row.title || 'Bài viết chưa đặt tiêu đề'}
                </h3>
                <PostStatusBadge published={published} />
                {row.category ? (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {row.category}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {row.excerpt || 'Chưa có mô tả ngắn cho bài viết này.'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                  <Calendar className="h-3 w-3 text-emerald-500" />
                  Cập nhật {formatDate(row)}
                </span>
                {row.slug ? (
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                    <Hash className="h-3 w-3 text-slate-400" />
                    <span className="max-w-[220px] truncate font-mono text-[11px]">{row.slug}</span>
                  </span>
                ) : null}
                {published ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <Globe2 className="h-3 w-3" />
                    Đang hiển thị với ứng viên
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">
                    <Clock3 className="h-3 w-3" />
                    Cần hoàn thiện trước khi public
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            {published && row.slug ? (
              <Button
                asChild
                size="sm"
                className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
              >
                <a href={`/blog/${encodeURIComponent(row.slug)}`} target="_blank" rel="noreferrer">
                  Xem công khai
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(row)}
              className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Edit className="mr-1 h-3.5 w-3.5" />
              Sửa
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(row.id)}
              className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Xóa bài viết"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EmployerBlogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editing, setEditing] = useState(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await blogService.listEmployer();
      setItems(unwrapBlogListResponse(res));
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setDialogMode('create');
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setDialogMode('edit');
    setEditing(row);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (dialogMode === 'create') {
      await blogService.createEmployer(payload);
    } else if (editing?.id) {
      await blogService.updateEmployer(editing.id, payload);
    }
    await fetchList();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài viết này?')) return;
    try {
      await blogService.deleteEmployer(id);
      await fetchList();
    } catch (error) {
      console.error(error);
    }
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter((row) => row.is_published).length,
      draft: items.filter((row) => !row.is_published).length,
      categories: new Set(items.map((row) => row.category).filter(Boolean)).size,
    }),
    [items]
  );

  const categoryOptions = useMemo(
    () => [...new Set(items.map((row) => row.category).filter(Boolean))].sort(),
    [items]
  );

  const latestUpdated = useMemo(
    () => [...items].sort((a, b) => getTimestamp(b) - getTimestamp(a))[0] || null,
    [items]
  );

  const latestPublished = useMemo(
    () =>
      [...items]
        .filter((row) => row.is_published)
        .sort((a, b) => getTimestamp(b) - getTimestamp(a))[0] || null,
    [items]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((row) => {
      const matchSearch =
        !query ||
        row.title?.toLowerCase().includes(query) ||
        row.excerpt?.toLowerCase().includes(query) ||
        row.category?.toLowerCase().includes(query);
      const matchStatus =
        filter === 'all' ||
        (filter === 'published' && row.is_published) ||
        (filter === 'draft' && !row.is_published);
      const matchCategory = categoryFilter === 'all' || row.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [categoryFilter, filter, items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pagedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, filter, search]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((row) => row.is_published).length,
      draft: items.filter((row) => !row.is_published).length,
    }),
    [items]
  );

  const activeTabLabel = STATUS_TABS.find((tab) => tab.key === filter)?.label || 'Tất cả';
  const hasActiveFilters = Boolean(search.trim()) || categoryFilter !== 'all';
  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (search.trim()) badges.push(`Từ khóa: ${search.trim()}`);
    if (categoryFilter !== 'all') badges.push(`Chuyên mục: ${categoryFilter}`);

    return badges;
  }, [categoryFilter, search]);
  const activeFilterCount = activeFilterBadges.length;
  const spotlight = latestPublished || latestUpdated;

  const statCards = [
    {
      icon: FileText,
      label: 'Bài đang quản lý',
      value: formatCompactNumber(stats.total),
      helper: `${formatCompactNumber(stats.published)} bài công khai, ${formatCompactNumber(stats.draft)} bản nháp`,
      tone: 'slate',
    },
    {
      icon: Globe2,
      label: 'Đã công khai',
      value: formatCompactNumber(stats.published),
      helper: spotlight ? `Mới nhất: ${spotlight.title || 'bài viết chưa đặt tiêu đề'}` : 'Sẵn sàng xuất hiện khi có bài public',
      tone: 'emerald',
    },
    {
      icon: Layers3,
      label: 'Bản nháp',
      value: formatCompactNumber(stats.draft),
      helper: `${formatCompactNumber(stats.categories)} chuyên mục đang dùng trong blog thương hiệu`,
      tone: 'amber',
    },
  ];

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
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
          <div className="mb-6 max-w-4xl space-y-4">
            <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                <Building2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 space-y-3">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                  Blog thương hiệu
                </span>
                <h1 className="mt-2 max-w-[12ch] break-words !text-2xl font-bold !leading-tight tracking-tight text-slate-950 !whitespace-normal sm:max-w-none sm:!text-[2.35rem]">
                  Trung tâm nội dung tuyển dụng
                </h1>
                <p className="mt-2 max-w-[28ch] text-sm leading-6 text-slate-600 sm:max-w-3xl sm:text-[15px]">
                  Quản lý bài viết, bản nháp và thông điệp thương hiệu trong cùng một nhịp bố cục với trung tâm quản lý việc.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <EmployerStatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <QuickActionItem icon={Plus} title="Viết bài mới" tone="emerald" onClick={openCreate} />
            <QuickActionItem icon={Globe2} title="Blog công khai" to="/blog" tone="sky" />
            <QuickActionItem icon={BookOpen} title="Tin tuyển dụng" to="/employer/jobs" tone="slate" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {STATUS_TABS.map((tab) => (
                <StatusTabButton
                  key={tab.key}
                  tab={tab}
                  count={filterCounts[tab.countKey] ?? 0}
                  active={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                />
              ))}
            </div>
          </div>
        </div>

        <section className="min-w-0 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề, mô tả, chuyên mục..."
                  className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 w-full rounded-lg border-slate-200 bg-white text-sm font-medium text-slate-700 md:w-[220px]">
                  <SelectValue placeholder="Chuyên mục" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 shadow-xl">
                  <SelectItem value="all" className="text-sm font-medium">
                    Tất cả chuyên mục
                  </SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category} className="text-sm font-medium">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-12 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  Xóa lọc
                </Button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                Hiển thị <strong className="text-slate-700">{filtered.length}</strong> bài · {activeTabLabel}
              </span>
              <span>
                <strong className="text-slate-700">{formatCompactNumber(stats.published)}</strong> công khai ·{' '}
                <strong className="text-slate-700">{formatCompactNumber(stats.draft)}</strong> nháp
              </span>
              {activeFilterCount > 0 ? (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {activeFilterCount} bộ lọc
                </span>
              ) : null}
              {activeFilterBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">{filtered.length} bài viết</span>
              </div>
              {totalPages > 1 ? (
                <span className="text-xs text-slate-400">
                  Trang {currentPage}/{totalPages}
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white py-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="mt-4 !text-base font-bold text-slate-950">
                  {items.length === 0 ? 'Chưa có bài viết nào' : 'Không tìm thấy bài phù hợp'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {items.length === 0
                    ? 'Bắt đầu bằng một bài viết thương hiệu để ứng viên hiểu rõ hơn về công ty và quy trình tuyển dụng.'
                    : 'Thử mở rộng bộ lọc hoặc thay đổi từ khóa để xem thêm nội dung.'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold"
                    >
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                  <Button
                    onClick={openCreate}
                    className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {items.length === 0 ? 'Viết bài đầu tiên' : 'Tạo bài mới'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {pagedItems.map((row) => (
                    <CompactPostCard key={row.id} row={row} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
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

      <BlogPostEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialRow={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
