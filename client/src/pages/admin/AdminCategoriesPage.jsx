import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  Edit2,
  Factory,
  GraduationCap,
  Hotel,
  Landmark,
  LayoutGrid,
  Loader2,
  Megaphone,
  Palette,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100';
const TEXTAREA_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100';

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

function getCategoryIcon(name = '') {
  const normalized = String(name || '').toLowerCase();

  if (
    normalized.includes('công nghệ') ||
    normalized.includes('it') ||
    normalized.includes('phần mềm') ||
    normalized.includes('developer')
  ) {
    return Code2;
  }

  if (normalized.includes('marketing') || normalized.includes('truyền thông') || normalized.includes('nội dung')) {
    return Megaphone;
  }

  if (normalized.includes('kế toán') || normalized.includes('tài chính') || normalized.includes('ngân hàng')) {
    return Landmark;
  }

  if (
    normalized.includes('kinh doanh') ||
    normalized.includes('bán hàng') ||
    normalized.includes('sale') ||
    normalized.includes('account')
  ) {
    return ShoppingBag;
  }

  if (
    normalized.includes('nhân sự') ||
    normalized.includes('hành chính') ||
    normalized.includes('vận hành')
  ) {
    return Briefcase;
  }

  if (
    normalized.includes('kỹ thuật') ||
    normalized.includes('sản xuất') ||
    normalized.includes('công nghiệp')
  ) {
    return Factory;
  }

  if (normalized.includes('thiết kế') || normalized.includes('sáng tạo') || normalized.includes('ux')) {
    return Palette;
  }

  if (normalized.includes('giáo dục') || normalized.includes('đào tạo')) {
    return GraduationCap;
  }

  if (normalized.includes('y tế') || normalized.includes('chăm sóc') || normalized.includes('dược')) {
    return ShieldCheck;
  }

  if (normalized.includes('khách sạn') || normalized.includes('du lịch') || normalized.includes('dịch vụ')) {
    return Hotel;
  }

  if (normalized.includes('logistics') || normalized.includes('vận tải') || normalized.includes('kho')) {
    return Truck;
  }

  return LayoutGrid;
}

function normalizeCategories(payload = []) {
  return payload.map((item) => ({
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    description: String(item?.description ?? ''),
    slug: String(item?.slug ?? ''),
    jobCount: Number(item?.job_count ?? item?.jobs_count ?? item?.jobCount ?? 0),
    isActive: Boolean(Number(item?.is_active ?? item?.isActive ?? 1)),
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
    isActive: Boolean(Number(item?.is_active ?? item?.isActive ?? 1)),
  }));
}

const AdminCategoriesPage = () => {
  const { showNotification } = useNotification();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [categoriesRes, skillsRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getSkills(),
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
      showNotification('Không tải được dữ liệu ngành nghề', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hydratedCategories = useMemo(
    () =>
      categories
        .map((category) => {
          const linkedSkills = skills
            .filter((skill) => skill.categoryId === category.id)
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

          return {
            ...category,
            linkedSkills,
            skillCount: linkedSkills.length,
            activeSkillCount: linkedSkills.filter((skill) => skill.isActive).length,
          };
        })
        .sort((a, b) => {
          const scoreA = a.jobCount * 3 + a.skillCount;
          const scoreB = b.jobCount * 3 + b.skillCount;
          if (scoreA !== scoreB) return scoreB - scoreA;
          return a.name.localeCompare(b.name, 'vi');
        }),
    [categories, skills]
  );

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return hydratedCategories.filter((category) => {
      if (!keyword) return true;

      return (
        category.name.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword) ||
        category.linkedSkills.some((skill) => skill.name.toLowerCase().includes(keyword))
      );
    });
  }, [hydratedCategories, search]);

  useEffect(() => {
    if (expandedId && !filteredCategories.some((category) => category.id === expandedId)) {
      setExpandedId(null);
    }
  }, [expandedId, filteredCategories]);

  const openModal = (category = null) => {
    setEditingCategory(category);
    setFormData({
      name: category?.name || '',
      description: category?.description || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
    });
    setSaving(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      showNotification('Vui lòng nhập tên ngành nghề', 'error');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: editingCategory?.isActive ?? true,
      };

      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, payload);
        showNotification('Đã cập nhật ngành nghề', 'success');
      } else {
        await adminService.createCategory(payload);
        showNotification('Đã thêm ngành nghề mới', 'success');
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save category:', error);
      showNotification('Lỗi khi lưu ngành nghề', 'error');
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Xóa ngành nghề này khỏi taxonomy?')) return;

    try {
      await adminService.deleteCategory(categoryId);
      showNotification('Đã xóa ngành nghề', 'success');

      if (expandedId === categoryId) {
        setExpandedId(null);
      }

      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showNotification('Lỗi khi xóa ngành nghề', 'error');
    }
  };

  const leadingCategory = useMemo(() => {
    if (!hydratedCategories.length) return null;

    return hydratedCategories.reduce((best, category) => {
      const bestScore = (best?.jobCount || 0) * 3 + (best?.skillCount || 0);
      const currentScore = category.jobCount * 3 + category.skillCount;
      return currentScore > bestScore ? category : best;
    }, hydratedCategories[0]);
  }, [hydratedCategories]);

  const statsCards = useMemo(
    () => [
      {
        label: 'Tổng danh mục',
        value: formatNumber(categories.length),
        helper: 'Nhóm taxonomy dùng cho tuyển dụng, nội dung và lọc tìm kiếm.',
        icon: LayoutGrid,
        valueClass: 'text-3xl',
      },
      {
        label: 'Danh mục có kỹ năng',
        value: formatNumber(hydratedCategories.filter((category) => category.skillCount > 0).length),
        helper: `Đang gắn ${formatNumber(skills.length)} kỹ năng đang phục vụ matching và hồ sơ.`,
        icon: Code2,
        valueClass: 'text-3xl',
      },
      {
        label: 'Ngành nổi bật hiện tại',
        value: leadingCategory?.name || 'Chưa có dữ liệu',
        helper: leadingCategory
          ? `${formatNumber(leadingCategory.jobCount)} tin tuyển dụng và ${formatNumber(leadingCategory.skillCount)} kỹ năng liên kết.`
          : 'Thêm danh mục để bắt đầu cấu hình taxonomy cho hệ thống.',
        icon: Briefcase,
        valueClass: 'text-lg leading-7',
      },
    ],
    [categories.length, hydratedCategories, leadingCategory, skills.length]
  );

  const trendBars = useMemo(() => {
    const source = hydratedCategories
      .filter((category) => category.jobCount > 0 || category.skillCount > 0)
      .slice(0, 6);

    const maxValue = Math.max(
      1,
      ...source.map((category) => Math.max(category.jobCount, category.skillCount))
    );

    return source.map((category) => ({
      id: category.id,
      name: category.name,
      jobCount: category.jobCount,
      skillCount: category.skillCount,
      width: `${Math.max(12, Math.round((Math.max(category.jobCount, category.skillCount) / maxValue) * 100))}%`,
    }));
  }, [hydratedCategories]);

  const emptySearch = search.trim().length > 0 && !filteredCategories.length;

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                    Admin workspace
                  </Badge>
                  <Badge className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    Taxonomy management
                  </Badge>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Taxonomy dữ liệu
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      Ngành nghề
                    </h1>
                  </div>

                  <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                    Quản lý danh mục ngành nghề dùng xuyên suốt cho tin tuyển dụng, blog, bộ lọc tìm
                    kiếm và logic matching. Bố cục mới giữ nguyên nghiệp vụ nhưng làm rõ hơn mối quan hệ
                    giữa danh mục, kỹ năng và mức độ sử dụng thực tế.
                  </p>

                  <div className="rounded-2xl border border-emerald-200/80 bg-white/85 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Phạm vi quản trị
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          Màn này tập trung vào CRUD danh mục ngành nghề. Kỹ năng đi sâu theo job và hồ
                          sơ ứng viên, nên không còn đứng riêng ở sidebar; admin chỉ đi tới khi thật sự
                          cần.
                        </p>
                      </div>

                      <Link
                        to="/admin/skills"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 self-start rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 sm:min-h-[44px] sm:w-auto sm:shrink-0 sm:whitespace-nowrap"
                      >
                        Quản lý kỹ năng phụ trợ
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-700"
                  onClick={() => {
                    setSearch('');
                    setExpandedId(null);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm sạch bộ lọc
                </Button>

                <Button
                  type="button"
                  className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={() => openModal()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm ngành nghề
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {statsCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {item.label}
                        </p>
                        <div className={`mt-3 font-bold tracking-tight text-slate-950 ${item.valueClass}`}>
                          {item.value}
                        </div>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">{item.helper}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <SectionCard
            icon={Tags}
            title="Danh sách ngành nghề"
            description="Mở rộng từng dòng để xem mô tả danh mục, số tin tuyển dụng đang dùng và các kỹ năng liên kết bên dưới."
            action={
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-700"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Làm mới
              </Button>
            }
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={`${INPUT_CLASS} pl-11`}
                    placeholder="Tìm theo tên ngành nghề, mô tả hoặc kỹ năng liên kết..."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatNumber(filteredCategories.length)} danh mục hiển thị
                  </Badge>
                  <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatNumber(skills.length)} kỹ năng đã đồng bộ
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-sm font-medium">Đang tải dữ liệu taxonomy...</p>
                </div>
              ) : emptySearch ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Không tìm thấy danh mục phù hợp</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Thử đổi từ khóa tìm kiếm hoặc làm sạch bộ lọc để xem lại toàn bộ taxonomy hiện có.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 h-10 rounded-lg border-slate-200 px-4 text-sm font-semibold text-slate-700"
                    onClick={() => setSearch('')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Xóa từ khóa
                  </Button>
                </div>
              ) : !filteredCategories.length ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa có danh mục ngành nghề</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Hãy tạo nhóm đầu tiên để hệ thống bắt đầu phân loại tin tuyển dụng, blog và kỹ năng.
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
                <div className="space-y-4">
                  {filteredCategories.map((category) => {
                    const Icon = getCategoryIcon(category.name);
                    const isExpanded = expandedId === category.id;
                    const isUnused = category.jobCount === 0 && category.skillCount === 0;

                    return (
                      <div
                        key={category.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          className="w-full cursor-pointer text-left"
                          onClick={() =>
                            setExpandedId((current) => (current === category.id ? null : category.id))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setExpandedId((current) => (current === category.id ? null : category.id));
                            }
                          }}
                        >
                          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-slate-950">{category.name}</h3>
                                  <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    {formatNumber(category.jobCount)} tin
                                  </Badge>
                                  <Badge className="rounded-full border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                    {formatNumber(category.skillCount)} kỹ năng
                                  </Badge>
                                  {isUnused ? (
                                    <Badge className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                      Chưa gắn dữ liệu
                                    </Badge>
                                  ) : null}
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {category.description || 'Chưa có mô tả. Danh mục này có thể được dùng để tổ chức dữ liệu và điều hướng nội dung trong hệ thống.'}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    {category.activeSkillCount
                                      ? `${formatNumber(category.activeSkillCount)} kỹ năng đang hoạt động`
                                      : 'Chưa có kỹ năng hoạt động'}
                                  </span>
                                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                                    {category.jobCount > 0
                                      ? 'Đang có tin tuyển dụng sử dụng'
                                      : 'Chưa có tin tuyển dụng gắn danh mục'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 lg:justify-end">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-lg border-slate-200 px-3 text-sm font-semibold text-slate-700"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openModal(category);
                                  }}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Sửa
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-lg border-rose-200 px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDelete(category.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa
                                </Button>
                              </div>

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-5 sm:px-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Tin tuyển dụng
                                </p>
                                <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                                  {formatNumber(category.jobCount)}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                  Tin đang dùng danh mục này trong hệ thống.
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Kỹ năng liên kết
                                </p>
                                <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                                  {formatNumber(category.skillCount)}
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                  {category.activeSkillCount
                                    ? `${formatNumber(category.activeSkillCount)} kỹ năng đang hoạt động.`
                                    : 'Chưa có kỹ năng hoạt động trong nhóm này.'}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Trạng thái taxonomy
                                </p>
                                <div className="mt-3">
                                  <Badge
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      isUnused
                                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {isUnused ? 'Cần bổ sung dữ liệu' : 'Đang được sử dụng'}
                                  </Badge>
                                </div>
                                <p className="mt-3 text-sm text-slate-500">
                                  Giúp admin biết nhóm nào đang có tác động thực tế lên tuyển dụng.
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-950">Kỹ năng trong ngành</h4>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Dùng để mở rộng matching và bộ lọc tìm kiếm theo taxonomy này.
                                  </p>
                                </div>

                                <Link
                                  to="/admin/skills"
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                                >
                                  Mở quản lý kỹ năng
                                  <ArrowUpRight className="h-4 w-4" />
                                </Link>
                              </div>

                              {category.linkedSkills.length ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {category.linkedSkills.map((skill) => (
                                    <Badge
                                      key={skill.id}
                                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        skill.isActive
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : 'border-slate-200 bg-slate-50 text-slate-500'
                                      }`}
                                    >
                                      {skill.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                                  Danh mục này chưa có kỹ năng nào được liên kết. Bạn có thể thêm kỹ năng mới
                                  trong màn hình phụ trợ để làm giàu taxonomy cho matching.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            icon={Briefcase}
            title="Phân bổ tuyển dụng theo ngành"
            description="Biểu đồ nhanh cho biết nơi dữ liệu tuyển dụng đang tập trung nhiều nhất để ưu tiên taxonomy hợp lý."
          >
            {!trendBars.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm leading-6 text-slate-500">
                Chưa có đủ dữ liệu để hiển thị phân bổ. Khi danh mục bắt đầu được gắn vào tin tuyển dụng hoặc kỹ
                năng, biểu đồ này sẽ tự động cập nhật.
              </div>
            ) : (
              <div className="space-y-4">
                {trendBars.map((item) => (
                  <div key={item.id} className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_90px] lg:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(item.jobCount)} tin tuyển dụng · {formatNumber(item.skillCount)} kỹ năng
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]"
                        style={{ width: item.width }}
                      />
                    </div>

                    <div className="text-right text-sm font-semibold text-emerald-700">
                      {formatNumber(Math.max(item.jobCount, item.skillCount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </main>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-36px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                      Taxonomy editor
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                    {editingCategory ? 'Chỉnh sửa ngành nghề' : 'Thêm ngành nghề mới'}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Cập nhật tên nhóm và mô tả ngắn để admin, biên tập và hệ thống matching cùng hiểu đúng vai
                    trò của danh mục này.
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

            <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-7">
              <div className="space-y-5">
                <div className="space-y-2">
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
                  <label className="text-sm font-semibold text-slate-900" htmlFor="category-description">
                    Mô tả
                  </label>
                  <textarea
                    id="category-description"
                    rows={5}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, description: event.target.value }))
                    }
                    className={TEXTAREA_CLASS}
                    placeholder="Mô tả ngắn về phạm vi nghề nghiệp, kỹ năng đặc trưng hoặc mục đích sử dụng danh mục trong hệ thống."
                  />
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Gợi ý nhập liệu</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                    Mô tả nên giúp phân biệt rõ danh mục này với các nhóm gần nhau, để khi gắn vào job,
                    blog hoặc kỹ năng thì logic phân loại vẫn nhất quán trên toàn hệ thống.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-lg border-slate-200 px-5 text-sm font-semibold text-slate-700"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
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
    </div>
  );
};

export default AdminCategoriesPage;
