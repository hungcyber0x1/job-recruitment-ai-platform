import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Code2,
  Megaphone,
  Palette,
  Building2,
  GraduationCap,
  Landmark,
  Hotel,
  ShoppingBag,
  Factory,
  Truck,
  Briefcase,
  Tags,
  LayoutGrid,
} from 'lucide-react';
import adminService from '../../services/adminService';
import AdminLayout from '../../layouts/AdminLayout';

const MOCK_SUB_INDUSTRIES = [];

const MOCK_SKILL_TAGS = [];

const getCategoryIcon = (name) => {
  const n = String(name || '').toLowerCase();
  const iconCls = 'text-emerald-600 dark:text-emerald-400';
  const size = 18;
  if (n.includes('công nghệ') || n.includes('it') || n.includes('tech') || n.includes('phần mềm'))
    return <Code2 size={size} className={iconCls} strokeWidth={2} />;
  if (
    n.includes('marketing') ||
    n.includes('truyền thông') ||
    n.includes('media') ||
    n.includes('bán hàng') ||
    n.includes('kinh doanh')
  )
    return <Megaphone size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('bất động sản') || n.includes('real'))
    return <Building2 size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('giáo dục') || n.includes('đào tạo'))
    return <GraduationCap size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('kế toán') || n.includes('tài chính') || n.includes('finance'))
    return <Landmark size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('khách sạn') || n.includes('du lịch') || n.includes('nhà hàng'))
    return <Hotel size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('logistics') || n.includes('vận tải') || n.includes('kho bãi'))
    return <Truck size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('kỹ thuật') || n.includes('sản xuất') || n.includes('cơ khí'))
    return <Factory size={size} className={iconCls} strokeWidth={2} />;
  if (n.includes('bán lẻ') || n.includes('thương mại'))
    return <ShoppingBag size={size} className={iconCls} strokeWidth={2} />;
  return <Palette size={size} className={iconCls} strokeWidth={2} />;
};

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [modalMode, setModalMode] = useState('category'); // 'category' | 'skill'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, skillRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getSkills(),
      ]);
      const catData = Array.isArray(catRes?.data?.data)
        ? catRes.data.data
        : Array.isArray(catRes?.data)
          ? catRes.data
          : [];
      const skillData = Array.isArray(skillRes?.data?.data)
        ? skillRes.data.data
        : Array.isArray(skillRes?.data)
          ? skillRes.data
          : [];
      setCategories(
        catData.map((c) => ({
          id: c?.id ?? 0,
          name: String(c?.name ?? ''),
          description: String(c?.description ?? ''),
          job_count: Number(c?.job_count ?? 0),
        }))
      );
      setSkills(
        skillData.map((s) => ({
          id: s?.id ?? 0,
          name: String(s?.name ?? ''),
          description: String(s?.description ?? ''),
          category_id: s?.category_id ?? null,
        }))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (modalMode === 'category') {
        if (editingItem) {
          await adminService.updateCategory(editingItem.id, formData);
        } else {
          await adminService.createCategory(formData);
        }
      } else {
        if (editingItem) {
          await adminService.updateSkill(editingItem.id, formData);
        } else {
          await adminService.createSkill(formData);
        }
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (id, isCategory) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      if (isCategory) await adminService.deleteCategory(id);
      else await adminService.deleteSkill(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openModal = (item = null, mode = 'category') => {
    setModalMode(mode);
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, description: item.description || '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const filteredCategories = categories.filter(
    (c) => !search.trim() || (c.name && c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const statsCards = useMemo(() => {
    const totalIndustries = categories.length;
    const activeSkills = skills.length;
    const topByJobs = [...categories].sort(
      (a, b) => (Number(b.job_count) || 0) - (Number(a.job_count) || 0)
    )[0];
    return [
      {
        label: 'Tổng danh mục',
        value: totalIndustries,
        hint: 'Ngành / lĩnh vực đang cấu hình',
      },
      {
        label: 'Kỹ năng (tags)',
        value: activeSkills,
        hint: 'Dùng cho bộ lọc & gợi ý AI',
      },
      {
        label: 'Ngành có nhiều tin nhất',
        value: topByJobs?.name || '—',
        hint:
          topByJobs && (topByJobs.job_count ?? 0) > 0
            ? `${topByJobs.job_count} tin đang gắn`
            : 'Chưa có tin tuyển dụng gắn danh mục',
        isText: true,
      },
    ];
  }, [categories, skills]);

  const trendBars = useMemo(() => {
    const rows = categories
      .map((c) => ({ label: c.name, value: Number(c.job_count) || 0 }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const max = Math.max(...rows.map((r) => r.value), 1);
    return rows.map((r) => ({ ...r, pct: Math.round((r.value / max) * 100) }));
  }, [categories]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-8 text-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90">
              Cấu hình hệ thống
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Ngành nghề &amp; kỹ năng
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
              Quản lý danh mục ngành và từ khóa kỹ năng phục vụ bộ lọc tìm việc, gợi ý AI và báo
              cáo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              <p
                className={`mt-2 font-black text-slate-900 ${card.isText ? 'text-lg leading-snug' : 'text-2xl tabular-nums'}`}
              >
                {card.value}
              </p>
              {card.hint ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{card.hint}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <LayoutGrid size={20} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-900">Danh sách danh mục</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Mở rộng từng dòng để xem nhóm phụ và tag kỹ năng (theo dữ liệu thật từ API).
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[220px] flex-1 sm:max-w-xs lg:max-w-sm">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Lọc theo tên ngành..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-100/50 placeholder:text-slate-400 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openModal(null, 'category')}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/15 transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Thêm danh mục
                </button>
              </div>
            </div>
          </div>

          {!loading && filteredCategories.length > 0 && (
            <div className="hidden border-b border-slate-100 bg-slate-50/60 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 md:grid md:grid-cols-[2.5rem,2.75rem,1fr,auto,auto] md:items-center md:gap-3 md:pl-[calc(1.5rem+0.25rem)]">
              <span className="sr-only">Mở rộng</span>
              <span className="sr-only">Biểu tượng</span>
              <span>Danh mục</span>
              <span className="text-center">Hoạt động</span>
              <span className="text-right pr-1">Thao tác</span>
            </div>
          )}

          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <LayoutGrid size={28} strokeWidth={1.5} />
                  </div>
                  <p className="mt-4 text-base font-bold text-slate-800">
                    {categories.length === 0
                      ? 'Chưa có danh mục nào'
                      : 'Không khớp bộ lọc tìm kiếm'}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                    {categories.length === 0
                      ? 'Tạo danh mục đầu tiên để gắn tin tuyển dụng và phân loại kỹ năng.'
                      : 'Thử từ khóa khác hoặc xóa ô tìm kiếm.'}
                  </p>
                  {categories.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openModal(null, 'category')}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
                    >
                      <Plus size={18} />
                      Thêm danh mục
                    </button>
                  ) : null}
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isExpanded = expandedId === cat.id;
                  const jobCount = cat.job_count ?? 0;
                  const skillCount = skills.filter((s) => s.category_id === cat.id).length;
                  const isQuiet = jobCount === 0 && skillCount === 0;
                  return (
                    <div key={cat.id} className="bg-white">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        aria-controls={`category-panel-${cat.id}`}
                        id={`category-row-${cat.id}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedId(isExpanded ? null : cat.id);
                          }
                        }}
                        className={`group flex cursor-pointer flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:gap-3 sm:px-6 md:grid md:grid-cols-[2.5rem,2.75rem,1fr,auto,auto] md:items-center md:gap-3 ${
                          isExpanded ? 'bg-emerald-50/40' : 'hover:bg-slate-50/90'
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                      >
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-sm transition group-hover:border-emerald-200 group-hover:text-emerald-600"
                          aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : cat.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} className="text-emerald-600" />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/12 to-emerald-600/5 ring-1 ring-emerald-500/10">
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div className="min-w-0 flex-1 md:min-w-0">
                          <p className="font-bold text-slate-900">{cat.name}</p>
                          {cat.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {cat.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${
                              jobCount > 0
                                ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}
                          >
                            <Briefcase size={13} className="opacity-70" />
                            {jobCount} tin
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${
                              skillCount > 0
                                ? 'border-sky-200/80 bg-sky-50 text-sky-900'
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}
                          >
                            <Tags size={13} className="opacity-70" />
                            {skillCount} kỹ năng
                          </span>
                          {isQuiet ? (
                            <span className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:inline">
                              Chưa gắn dữ liệu
                            </span>
                          ) : null}
                        </div>
                        <div
                          className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <button
                            type="button"
                            onClick={() => openModal(cat, 'category')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-emerald-700"
                            title="Sửa danh mục"
                          >
                            <Edit2 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                            title="Xóa danh mục"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          id={`category-panel-${cat.id}`}
                          role="region"
                          aria-labelledby={`category-row-${cat.id}`}
                          className="space-y-4 border-t border-slate-100 bg-slate-50/40 px-4 py-5 sm:px-6 md:pl-24"
                        >
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Nhóm ngành phụ
                            </p>
                            <ul className="space-y-1">
                              {MOCK_SUB_INDUSTRIES.map((sub, i) => (
                                <li
                                  key={i}
                                  className="flex items-center justify-between py-1.5 text-sm text-slate-600"
                                >
                                  {sub}
                                  <button
                                    type="button"
                                    className="text-xs font-medium text-emerald-400 hover:underline"
                                  >
                                    Sửa
                                  </button>
                                </li>
                              ))}
                              <li>
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 mt-1"
                                >
                                  <Plus size={12} />
                                  Thêm nhóm phụ
                                </button>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Từ khóa kỹ năng (tags)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(skills.filter((s) => s.category_id === cat.id).slice(0, 6).length
                                ? skills
                                    .filter((s) => s.category_id === cat.id)
                                    .slice(0, 6)
                                    .map((s) => s.name)
                                : MOCK_SKILL_TAGS
                              ).map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    className="hover:text-red-400"
                                    aria-label="Xóa tag"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                              <button
                                type="button"
                                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <Plus size={12} />
                                Thêm tag
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Phân bổ tin tuyển dụng theo ngành
              </h3>
              <p className="text-sm text-slate-500">
                Tỷ lệ tương đối theo số tin đang gắn từng danh mục (chuẩn hóa theo ngành có nhiều
                tin nhất).
              </p>
            </div>
          </div>
          {trendBars.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có tin tuyển dụng gắn danh mục — biểu đồ sẽ hiển thị khi có dữ liệu.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {trendBars.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="w-full text-sm font-semibold text-slate-700 sm:w-52 sm:shrink-0">
                    {item.label}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingItem ? 'Chỉnh sửa' : 'Thêm mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-muted/55 hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Nhập tên..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Nhập mô tả (tùy chọn)..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 font-semibold text-slate-900 hover:bg-muted/55"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-semibold text-white hover:bg-emerald-600"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
