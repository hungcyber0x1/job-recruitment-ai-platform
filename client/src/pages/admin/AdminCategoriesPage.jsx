import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Gauge,
  Hash,
  Layers3,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Trash2,
  X,
} from 'lucide-react';

import StatCard from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentCard, PageHeader } from '@/components/admin';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';
import { cn, renderCategoryIcon } from '@/utils';

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100';
const TEXTAREA_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả', helper: 'Toàn bộ taxonomy' },
  { value: 'active', label: 'Công khai', helper: 'Đang hiển thị public' },
  { value: 'inactive', label: 'Đã ẩn', helper: 'Giữ dữ liệu nội bộ' },
  { value: 'hiring', label: 'Có việc làm', helper: 'Đang được job sử dụng' },
  { value: 'review', label: 'Cần rà soát', helper: 'Thiếu mô tả hoặc dữ liệu' },
];

const SORT_OPTIONS = [
  { value: 'curated', label: 'Thứ tự quản trị' },
  { value: 'jobs', label: 'Nhiều việc làm nhất' },
  { value: 'skills', label: 'Nhiều kỹ năng nhất' },
  { value: 'az', label: 'Tên A-Z' },
];

const TAXONOMY_FLOW = [
  {
    title: 'Chuẩn hóa',
    description: 'Tên, slug, mô tả và thứ tự hiển thị.',
    icon: Tags,
  },
  {
    title: 'Gắn kỹ năng',
    description: 'Liên kết skill để AI matching có ngữ cảnh.',
    icon: Link2,
  },
  {
    title: 'Công khai',
    description: 'Bật hiển thị khi dữ liệu đã đủ an toàn.',
    icon: Eye,
  },
  {
    title: 'Theo dõi',
    description: 'Ưu tiên ngành có job và nhu cầu tuyển dụng.',
    icon: BarChart3,
  },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((Number(value || 0) / Number(total || 1)) * 100)));
}

function getSortPriority(category) {
  return Number.isFinite(category.sortOrder) && category.sortOrder > 0
    ? category.sortOrder
    : Number.MAX_SAFE_INTEGER;
}

function normalizeCategoryBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'active'].includes(normalized)) return true;
    if (['false', '0', 'no', 'inactive'].includes(normalized)) return false;
  }
  return Boolean(Number(value));
}

function normalizeCategories(payload = []) {
  return payload.map((item) => ({
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    description: String(item?.description ?? ''),
    slug: String(item?.slug ?? ''),
    icon: String(item?.icon ?? item?.icon_url ?? ''),
    sortOrder: Number(item?.sort_order ?? item?.sortOrder ?? 0),
    jobCount: Number(item?.job_count ?? item?.jobs_count ?? item?.jobCount ?? 0),
    skillCount: Number(item?.skill_count ?? item?.skillCount ?? 0),
    isActive: normalizeCategoryBoolean(item?.is_active ?? item?.isActive, true),
  }));
}

function normalizeSkills(payload = []) {
  return payload.map((item) => ({
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    categoryId:
      item?.category_id != null
        ? Number(item.category_id)
        : item?.categoryId != null
          ? Number(item.categoryId)
          : null,
    isActive: normalizeCategoryBoolean(item?.is_active ?? item?.isActive, true),
  }));
}

function getCategorySearchText(category) {
  return [
    category.name,
    category.slug,
    category.description,
    category.icon,
    ...(category.linkedSkills || []).map((skill) => skill.name),
  ]
    .join(' ')
    .toLowerCase();
}

function isCategoryNeedsReview(category) {
  const missingDescription = !category.description.trim();
  const noOperationalData = category.jobCount === 0 && category.skillCount === 0;
  const publicWithoutMatching =
    category.isActive && category.jobCount > 0 && category.skillCount === 0;

  return missingDescription || noOperationalData || publicWithoutMatching;
}

function getOperationalState(category) {
  if (!category.isActive) {
    return {
      label: 'Đã ẩn',
      description: 'Không hiển thị public, vẫn giữ liên kết nội bộ.',
      badgeClass: 'border-slate-200 bg-slate-50 text-slate-600',
      dotClass: 'bg-slate-400',
    };
  }

  if (category.jobCount > 0 && category.skillCount > 0) {
    return {
      label: 'Đang vận hành',
      description: 'Có job và kỹ năng để phục vụ tìm kiếm/matching.',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClass: 'bg-emerald-500',
    };
  }

  if (category.jobCount > 0 && category.skillCount === 0) {
    return {
      label: 'Thiếu kỹ năng',
      description: 'Có tin tuyển dụng nhưng dữ liệu matching còn mỏng.',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }

  if (category.jobCount === 0 && category.skillCount > 0) {
    return {
      label: 'Chờ tin tuyển dụng',
      description: 'Đã có skill nền, cần thêm job để tăng giá trị public.',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
      dotClass: 'bg-sky-500',
    };
  }

  return {
    label: 'Cần rà soát',
    description: 'Chưa có job hoặc kỹ năng liên kết để vận hành.',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  };
}

function getFilterCount(value, stats) {
  if (value === 'active') return stats.active;
  if (value === 'inactive') return stats.inactive;
  if (value === 'hiring') return stats.hiring;
  if (value === 'review') return stats.review;
  return stats.total;
}

const AdminCategoriesPage = () => {
  const { showNotification } = useNotification();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('curated');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    sortOrder: '0',
    description: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, skillsRes] = await Promise.all([
        adminService.getCategories({ include_inactive: true }),
        adminService.getSkills({ include_inactive: true }),
      ]);

      const categoryPayload = Array.isArray(categoriesRes?.data?.data)
        ? categoriesRes.data.data
        : Array.isArray(categoriesRes?.data)
          ? categoriesRes.data
          : [];

      const skillPayload = Array.isArray(skillsRes?.data?.data)
        ? skillsRes.data.data
        : Array.isArray(skillsRes?.data)
          ? skillsRes.data
          : [];

      setCategories(normalizeCategories(categoryPayload));
      setSkills(normalizeSkills(skillPayload));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
      setSkills([]);
      showNotification('Không tải được dữ liệu ngành nghề.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hydratedCategories = useMemo(
    () =>
      categories.map((category) => {
        const linkedSkills = skills
          .filter((skill) => skill.categoryId === category.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        return {
          ...category,
          linkedSkills,
          skillCount: Number(category.skillCount || linkedSkills.length),
          activeSkillCount: linkedSkills.filter((skill) => skill.isActive).length,
        };
      }),
    [categories, skills]
  );

  const stats = useMemo(() => {
    const activeCategories = hydratedCategories.filter((category) => category.isActive);
    const inactiveCategories = hydratedCategories.filter((category) => !category.isActive);
    const usedCategories = hydratedCategories.filter(
      (category) => category.jobCount > 0 || category.skillCount > 0
    );
    const hiringCategories = hydratedCategories.filter((category) => category.jobCount > 0);
    const reviewCategories = hydratedCategories.filter(isCategoryNeedsReview);
    const readyCategories = activeCategories.filter(
      (category) => category.jobCount > 0 && category.skillCount > 0
    );
    const totalPublicJobs = hydratedCategories.reduce(
      (sum, category) => sum + category.jobCount,
      0
    );
    const linkedSkillTotal = hydratedCategories.reduce(
      (sum, category) => sum + category.skillCount,
      0
    );
    const leadingCategory =
      [...hydratedCategories]
        .filter((category) => category.jobCount > 0 || category.skillCount > 0)
        .sort(
          (a, b) =>
            b.jobCount * 3 + b.skillCount - (a.jobCount * 3 + a.skillCount) ||
            a.name.localeCompare(b.name, 'vi')
        )[0] || null;

    return {
      total: hydratedCategories.length,
      active: activeCategories.length,
      inactive: inactiveCategories.length,
      used: usedCategories.length,
      unused: hydratedCategories.length - usedCategories.length,
      hiring: hiringCategories.length,
      review: reviewCategories.length,
      ready: readyCategories.length,
      skillReady: hydratedCategories.filter((category) => category.skillCount > 0).length,
      missingDescription: hydratedCategories.filter((category) => !category.description.trim())
        .length,
      publicWithoutSkills: activeCategories.filter(
        (category) => category.jobCount > 0 && category.skillCount === 0
      ).length,
      totalPublicJobs,
      linkedSkillTotal,
      leadingCategory,
    };
  }, [hydratedCategories]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const next = hydratedCategories.filter((category) => {
      const matchesSearch = !keyword || getCategorySearchText(category).includes(keyword);
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return category.isActive;
      if (statusFilter === 'inactive') return !category.isActive;
      if (statusFilter === 'hiring') return category.jobCount > 0;
      if (statusFilter === 'review') return isCategoryNeedsReview(category);
      return true;
    });

    if (sortBy === 'jobs') {
      return next.sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name, 'vi'));
    }

    if (sortBy === 'skills') {
      return next.sort((a, b) => b.skillCount - a.skillCount || a.name.localeCompare(b.name, 'vi'));
    }

    if (sortBy === 'az') {
      return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    return next.sort(
      (a, b) =>
        getSortPriority(a) - getSortPriority(b) ||
        Number(b.isActive) - Number(a.isActive) ||
        b.jobCount - a.jobCount ||
        a.name.localeCompare(b.name, 'vi')
    );
  }, [hydratedCategories, search, sortBy, statusFilter]);

  useEffect(() => {
    if (expandedId && !filteredCategories.some((category) => category.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, filteredCategories]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Tổng ngành nghề',
        value: formatNumber(stats.total),
        helper: `${formatNumber(stats.active)} công khai • ${formatNumber(stats.inactive)} ẩn`,
        icon: Tags,
        type: 'neutral',
        filterValue: 'all',
      },
      {
        label: 'Sẵn sàng public',
        value: formatNumber(stats.ready),
        helper: 'Có job, kỹ năng và đang công khai.',
        icon: CheckCircle2,
        type: 'success',
        filterValue: 'active',
      },
      {
        label: 'Việc làm gắn ngành',
        value: formatNumber(stats.totalPublicJobs),
        helper: `${formatNumber(stats.hiring)} ngành đang có tin tuyển dụng.`,
        icon: Briefcase,
        type: 'primary',
        filterValue: 'hiring',
      },
      {
        label: 'Cần rà soát',
        value: formatNumber(stats.review),
        helper: 'Thiếu mô tả, job hoặc kỹ năng matching.',
        icon: ShieldAlert,
        type: stats.review > 0 ? 'warning' : 'success',
        filterValue: 'review',
      },
    ],
    [stats]
  );

  const topUsage = useMemo(() => {
    const source = [...hydratedCategories]
      .filter((category) => category.jobCount > 0 || category.skillCount > 0)
      .sort(
        (a, b) =>
          b.jobCount * 3 + b.skillCount - (a.jobCount * 3 + a.skillCount) ||
          a.name.localeCompare(b.name, 'vi')
      )
      .slice(0, 6);
    const maxValue = Math.max(
      1,
      ...source.map((category) => category.jobCount * 3 + category.skillCount)
    );

    return source.map((category) => {
      const score = category.jobCount * 3 + category.skillCount;
      return {
        ...category,
        width: `${Math.max(10, Math.round((score / maxValue) * 100))}%`,
      };
    });
  }, [hydratedCategories]);

  const healthMetrics = useMemo(
    () => [
      {
        label: 'Công khai',
        value: stats.active,
        percent: getPercent(stats.active, stats.total),
        helper: 'Đang xuất hiện ở public',
        barClass: 'bg-emerald-500',
      },
      {
        label: 'Có dữ liệu',
        value: stats.used,
        percent: getPercent(stats.used, stats.total),
        helper: 'Có job hoặc kỹ năng',
        barClass: 'bg-sky-500',
      },
      {
        label: 'Đủ kỹ năng',
        value: stats.skillReady,
        percent: getPercent(stats.skillReady, stats.total),
        helper: 'Sẵn sàng cho matching',
        barClass: 'bg-violet-500',
      },
      {
        label: 'Cần rà soát',
        value: stats.review,
        percent: getPercent(stats.review, stats.total),
        helper: 'Nên xử lý trước khi public',
        barClass: stats.review > 0 ? 'bg-amber-500' : 'bg-emerald-500',
      },
    ],
    [stats]
  );

  const activeFilterLabel =
    STATUS_FILTERS.find((option) => option.value === statusFilter)?.label || 'Tất cả';
  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Thứ tự quản trị';
  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== 'all' || sortBy !== 'curated';
  const emptySearch = hasActiveFilters && filteredCategories.length === 0;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('curated');
    setExpandedId(null);
  };

  const openModal = (category = null) => {
    setEditingCategory(category);
    setFormData({
      name: category?.name || '',
      slug: category?.slug || '',
      icon: category?.icon || '',
      sortOrder: String(category?.sortOrder ?? 0),
      description: category?.description || '',
      isActive: category?.isActive ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '',
      sortOrder: '0',
      description: '',
      isActive: true,
    });
    setSaving(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      showNotification('Vui lòng nhập tên ngành nghề.', 'error');
      return;
    }

    try {
      setSaving(true);
      const parsedSortOrder = Number(formData.sortOrder);
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        icon: formData.icon.trim() || null,
        description: formData.description.trim(),
        sort_order: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
        is_active: formData.isActive,
      };

      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, payload);
        showNotification('Đã cập nhật ngành nghề.', 'success');
      } else {
        await adminService.createCategory(payload);
        showNotification('Đã thêm ngành nghề mới.', 'success');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
      showNotification('Lỗi khi lưu ngành nghề.', 'error');
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const nextActive = !category.isActive;
      setActionLoadingId(`toggle-${category.id}`);
      await adminService.updateCategory(category.id, { is_active: nextActive });
      showNotification(
        nextActive ? 'Đã công khai ngành nghề.' : 'Đã ẩn ngành nghề khỏi khu vực công khai.',
        'success'
      );
      fetchData();
    } catch (error) {
      console.error('Failed to toggle category:', error);
      showNotification('Không thể cập nhật trạng thái ngành nghề.', 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleDelete = async (category) => {
    if (category.jobCount > 0 || category.skillCount > 0) {
      showNotification(
        'Không thể xóa ngành nghề đang có tin tuyển dụng hoặc kỹ năng. Hãy ẩn ngành nghề để bảo toàn dữ liệu.',
        'warning'
      );
      return;
    }

    if (!window.confirm(`Xóa ngành nghề "${category.name}" khỏi taxonomy?`)) return;

    try {
      setActionLoadingId(`delete-${category.id}`);
      await adminService.deleteCategory(category.id);
      showNotification('Đã xóa ngành nghề.', 'success');
      if (expandedId === category.id) {
        setExpandedId(null);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showNotification('Lỗi khi xóa ngành nghề.', 'error');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <>
      <div className="space-y-7 pb-10 animate-fade-in">
        <PageHeader
          icon={Tags}
          eyebrow="Dữ liệu nền tuyển dụng"
          badge="Taxonomy ngành nghề"
          title="Quản lý ngành nghề"
          description="Điều phối taxonomy ngành nghề dùng cho tin tuyển dụng, trang công khai, bộ lọc tìm việc và logic matching kỹ năng. Giao diện được gom theo đúng luồng: chuẩn hóa dữ liệu, gắn kỹ năng, công khai và theo dõi sử dụng."
          className="border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#eff6ff_100%)]"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl bg-white/90 px-4 font-bold shadow-sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RotateCcw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                Làm mới
              </Button>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl bg-white/90 px-4 font-bold shadow-sm"
                  onClick={resetFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Bỏ lọc
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl bg-white/90 px-4 font-bold shadow-sm"
              >
                <Link to="/categories">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Xem public
                </Link>
              </Button>
              <Button
                type="button"
                className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
                onClick={() => openModal()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm ngành nghề
              </Button>
            </>
          }
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <StatCard
                  key={card.label}
                  title={card.label}
                  value={loading ? '...' : card.value}
                  subtitle={card.helper}
                  icon={card.icon}
                  type={card.type}
                  active={statusFilter === card.filterValue && !search.trim()}
                  onClick={() => {
                    setStatusFilter(card.filterValue);
                    setSearch('');
                  }}
                  className="h-full border-white/80 bg-white/90 shadow-sm backdrop-blur"
                />
              ))}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white/85 p-4 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Luồng vận hành</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Mỗi ngành nên đi đủ 4 bước trước khi ưu tiên public.
                  </p>
                </div>
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  {formatNumber(stats.ready)} sẵn sàng
                </Badge>
              </div>
              <div className="mt-4 space-y-3">
                {TAXONOMY_FLOW.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PageHeader>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="space-y-6">
            <ContentCard
              icon={SlidersHorizontal}
              title="Điều phối danh sách"
              description="Tìm nhanh theo tên, slug, mô tả hoặc skill; sau đó lọc theo trạng thái vận hành thực tế."
              action={
                hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                    onClick={resetFilters}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Đặt lại
                  </Button>
                ) : null
              }
            >
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Tìm ngành nghề, mô tả, slug hoặc kỹ năng liên kết..."
                      className={`${INPUT_CLASS} h-12 pl-11 pr-4`}
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    aria-label="Sắp xếp ngành nghề"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((option) => {
                    const active = statusFilter === option.value;
                    const count = getFilterCount(option.value, stats);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatusFilter(option.value)}
                        className={cn(
                          'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                          active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-700'
                        )}
                        title={option.helper}
                      >
                        {option.label}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition-colors',
                            active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                          )}
                        >
                          {formatNumber(count)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Từ khóa:{' '}
                      <strong className="text-slate-700">
                        {search.trim() || 'Tất cả ngành nghề'}
                      </strong>
                    </span>
                    <span>
                      Trạng thái: <strong className="text-slate-700">{activeFilterLabel}</strong>
                    </span>
                    <span>
                      Sắp xếp: <strong className="text-slate-700">{sortLabel}</strong>
                    </span>
                  </div>
                  <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
                    {formatNumber(filteredCategories.length)} kết quả
                  </Badge>
                </div>
              </div>
            </ContentCard>

            <ContentCard
              icon={Layers3}
              title="Bảng điều phối ngành nghề"
              description="Dạng thẻ giúp admin thấy nhanh trạng thái vận hành, dữ liệu liên kết và thao tác an toàn cho từng ngành."
              action={
                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                  {formatNumber(filteredCategories.length)} / {formatNumber(stats.total)} ngành
                </Badge>
              }
            >
              {loading ? (
                <div className="flex h-72 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
                </div>
              ) : emptySearch ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    Không tìm thấy ngành nghề phù hợp
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Thử đổi từ khóa, trạng thái hoặc đặt lại bộ lọc để xem lại toàn bộ taxonomy hiện
                    có.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-700"
                    onClick={resetFilters}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    Chưa có danh mục ngành nghề
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Tạo nhóm đầu tiên để hệ thống phân loại tin tuyển dụng, kỹ năng và trang công
                    khai.
                  </p>
                  <Button
                    type="button"
                    className="mt-5 h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                    onClick={() => openModal()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm ngành nghề đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category) => {
                    const isExpanded = expandedId === category.id;
                    const deleteLocked = category.jobCount > 0 || category.skillCount > 0;
                    const toggleLoading = actionLoadingId === `toggle-${category.id}`;
                    const deleteLoading = actionLoadingId === `delete-${category.id}`;
                    const reviewNeeded = isCategoryNeedsReview(category);
                    const state = getOperationalState(category);

                    return (
                      <article
                        key={category.id}
                        className={cn(
                          'overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-md',
                          isExpanded && 'border-emerald-200 ring-1 ring-emerald-100',
                          !isExpanded && 'border-slate-200'
                        )}
                      >
                        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_210px_230px_168px] lg:items-start">
                          <div className="flex min-w-0 items-start gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId((current) =>
                                  current === category.id ? null : category.id
                                )
                              }
                              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              aria-label={isExpanded ? 'Thu gọn ngành nghề' : 'Mở rộng ngành nghề'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                              {renderCategoryIcon(category, { size: 21, strokeWidth: 1.8 })}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="line-clamp-1 text-base font-bold text-slate-950">
                                  {category.name}
                                </h3>
                                {reviewNeeded ? (
                                  <Badge className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    Cần kiểm tra
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
                                  <Hash className="h-3.5 w-3.5" />
                                  {category.slug || `category-${category.id}`}
                                </Badge>
                                {category.icon ? (
                                  <Badge className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">
                                    icon: {category.icon}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {category.description || 'Chưa có mô tả cho ngành nghề này.'}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                            <Badge
                              className={cn(
                                'rounded-full border px-3 py-1 font-semibold',
                                state.badgeClass
                              )}
                            >
                              <span className={cn('h-2 w-2 rounded-full', state.dotClass)} />
                              {state.label}
                            </Badge>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {state.description}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-slate-600">
                              Thứ tự:{' '}
                              <span className="text-slate-900">
                                {formatNumber(category.sortOrder)}
                              </span>
                            </p>
                          </div>

                          <div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                                <p className="text-xs font-semibold text-emerald-700">Việc làm</p>
                                <p className="mt-1 text-xl font-bold text-emerald-900 tabular-nums">
                                  {formatNumber(category.jobCount)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                                <p className="text-xs font-semibold text-sky-700">Kỹ năng</p>
                                <p className="mt-1 text-xl font-bold text-sky-900 tabular-nums">
                                  {formatNumber(category.skillCount)}
                                </p>
                              </div>
                            </div>
                            <p
                              className={cn(
                                'mt-2 text-xs leading-5',
                                deleteLocked ? 'text-amber-600' : 'text-slate-500'
                              )}
                            >
                              {deleteLocked
                                ? 'Đang có dữ liệu liên kết, ưu tiên ẩn thay vì xóa.'
                                : 'Chưa có dữ liệu liên kết, có thể xóa nếu không dùng.'}
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600"
                              title="Xem việc làm công khai"
                            >
                              <Link to={`/jobs?category_id=${category.id}`}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600"
                              onClick={() => openModal(category)}
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl border-slate-200 bg-white text-slate-600"
                              onClick={() => handleToggleActive(category)}
                              disabled={toggleLoading}
                              title={category.isActive ? 'Ẩn ngành nghề' : 'Công khai ngành nghề'}
                            >
                              {toggleLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : category.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className={cn(
                                'h-9 w-9 rounded-xl bg-white',
                                deleteLocked
                                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                  : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              )}
                              onClick={() => handleDelete(category)}
                              disabled={deleteLoading}
                              title={
                                deleteLocked
                                  ? 'Không xóa khi còn dữ liệu liên kết'
                                  : 'Xóa ngành nghề'
                              }
                            >
                              {deleteLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="border-t border-slate-200 bg-slate-50/70 p-4">
                            <div className="grid gap-3 lg:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                  Tác động public
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {category.isActive
                                    ? 'Ngành đang có thể xuất hiện ở trang công khai, trang chủ và bộ lọc việc làm khi có dữ liệu phù hợp.'
                                    : 'Ngành đang bị ẩn khỏi khu vực công khai nhưng vẫn được giữ trong admin để bảo toàn dữ liệu.'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                  Dữ liệu matching
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {category.skillCount > 0
                                    ? `${formatNumber(category.activeSkillCount)} / ${formatNumber(category.skillCount)} kỹ năng đang hoạt động cho nhóm ngành này.`
                                    : 'Chưa có kỹ năng liên kết, nên bổ sung trước khi ưu tiên hiển thị public.'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                  Điều hướng nhanh
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    asChild
                                    variant="outline"
                                    className="h-9 rounded-lg border-slate-200 bg-white text-sm font-semibold"
                                  >
                                    <Link to={`/jobs?category_id=${category.id}`}>
                                      Xem việc làm
                                    </Link>
                                  </Button>
                                  <Button
                                    asChild
                                    variant="outline"
                                    className="h-9 rounded-lg border-slate-200 bg-white text-sm font-semibold"
                                  >
                                    <Link to="/admin/skills">Quản lý kỹ năng</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <ListChecks className="h-4 w-4 text-emerald-600" />
                                  <p className="text-sm font-bold text-slate-900">
                                    Kỹ năng liên kết
                                  </p>
                                </div>
                                <Badge className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {formatNumber(category.linkedSkills.length)} kỹ năng
                                </Badge>
                              </div>
                              {category.linkedSkills.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {category.linkedSkills.slice(0, 14).map((skill) => (
                                    <Badge
                                      key={skill.id}
                                      className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                                        skill.isActive
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : 'border-slate-200 bg-slate-50 text-slate-500'
                                      )}
                                    >
                                      {skill.name}
                                    </Badge>
                                  ))}
                                  {category.linkedSkills.length > 14 ? (
                                    <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                      +{formatNumber(category.linkedSkills.length - 14)}
                                    </Badge>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                  Chưa có kỹ năng nào được gắn. Hãy mở trang quản lý kỹ năng để bổ
                                  sung dữ liệu matching cho ngành này.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </ContentCard>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24">
            <ContentCard
              icon={Gauge}
              title="Sức khỏe dữ liệu"
              description="Theo dõi mức độ sẵn sàng trước khi đưa taxonomy ra public."
            >
              <div className="space-y-4">
                {healthMetrics.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.helper}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatNumber(item.value)}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">{item.percent}%</p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', item.barClass)}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ContentCard>

            <ContentCard
              icon={BarChart3}
              title="Top ngành đang dùng"
              description="Ưu tiên dựa trên số tin tuyển dụng và kỹ năng liên kết."
            >
              {topUsage.length ? (
                <div className="space-y-4">
                  {topUsage.map((category) => (
                    <div key={category.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-sm font-bold text-slate-800">
                          {category.name}
                        </p>
                        <p className="shrink-0 text-xs font-semibold text-slate-500">
                          {formatNumber(category.jobCount)} tin •{' '}
                          {formatNumber(category.skillCount)} kỹ năng
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#38bdf8_100%)]"
                          style={{ width: category.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm leading-6 text-slate-500">
                  Chưa có đủ dữ liệu job hoặc kỹ năng để hiển thị top ngành.
                </div>
              )}
            </ContentCard>

            <ContentCard
              icon={ShieldAlert}
              title="Quy tắc vận hành"
              description="Bảo vệ tính toàn vẹn dữ liệu khi ngành đã được sử dụng."
            >
              <ul className="space-y-2.5 text-sm leading-6 text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Chỉ public nhóm ngành đã có mô tả rõ, job hoặc kỹ năng liên kết.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Ẩn ngành để ngừng hiển thị public nhưng vẫn giữ liên kết lịch sử.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Không xóa ngành đang có job hoặc kỹ năng tham chiếu.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Thứ tự quản trị quyết định mức ưu tiên hiển thị ở trang công khai.
                </li>
              </ul>
            </ContentCard>
          </aside>
        </section>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-36px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_70%,#eff6ff_100%)] px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="rounded-full border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                    Taxonomy editor
                  </Badge>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                    {editingCategory ? 'Chỉnh sửa ngành nghề' : 'Thêm ngành nghề mới'}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Thiết lập dữ liệu cốt lõi cho nhóm ngành. Có thể để slug trống nếu backend cần
                    tự sinh, nhưng nên bổ sung mô tả trước khi công khai.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-142px)] overflow-y-auto px-6 py-6 sm:px-7"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="category-name">
                    Tên ngành nghề
                  </label>
                  <input
                    id="category-name"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, name: event.target.value }))
                    }
                    className={INPUT_CLASS}
                    placeholder="Ví dụ: Công nghệ thông tin"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="category-slug">
                    Slug public
                  </label>
                  <input
                    id="category-slug"
                    value={formData.slug}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, slug: event.target.value }))
                    }
                    className={INPUT_CLASS}
                    placeholder="cong-nghe-thong-tin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="category-icon">
                    Icon key
                  </label>
                  <input
                    id="category-icon"
                    value={formData.icon}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, icon: event.target.value }))
                    }
                    className={INPUT_CLASS}
                    placeholder="code, briefcase, palette..."
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-900"
                    htmlFor="category-sort-order"
                  >
                    Thứ tự hiển thị
                  </label>
                  <input
                    id="category-sort-order"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, sortOrder: event.target.value }))
                    }
                    className={INPUT_CLASS}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Trạng thái công khai</p>
                  <label className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                    <span>{formData.isActive ? 'Đang công khai' : 'Đã ẩn'}</span>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, isActive: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    className="text-sm font-semibold text-slate-900"
                    htmlFor="category-description"
                  >
                    Mô tả nghiệp vụ
                  </label>
                  <textarea
                    id="category-description"
                    rows={5}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, description: event.target.value }))
                    }
                    className={TEXTAREA_CLASS}
                    placeholder="Mô tả phạm vi nghề nghiệp, nhóm kỹ năng đặc trưng hoặc mục đích sử dụng trong hệ thống."
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Public</p>
                  <p className="mt-2 text-xs leading-5 text-emerald-700/90">
                    Ngành công khai sẽ xuất hiện trong trang ngành nghề và bộ lọc tìm việc.
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                  <p className="text-sm font-semibold text-sky-800">Matching</p>
                  <p className="mt-2 text-xs leading-5 text-sky-700/90">
                    Sau khi tạo ngành, hãy gắn skill để tăng chất lượng gợi ý AI.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="text-sm font-semibold text-amber-800">An toàn dữ liệu</p>
                  <p className="mt-2 text-xs leading-5 text-amber-700/90">
                    Nếu đã có job hoặc kỹ năng, nên ẩn thay vì xóa để giữ lịch sử.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 px-5 text-sm font-semibold text-slate-700"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingCategory ? (
                    'Lưu cập nhật'
                  ) : (
                    'Tạo ngành nghề'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AdminCategoriesPage;
