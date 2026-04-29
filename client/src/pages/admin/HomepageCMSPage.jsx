import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  LayoutGrid,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/context/NotificationContext';
import api from '@/services/api';

const ICON_OPTIONS = [
  { value: 'users', label: 'Người dùng', icon: Users },
  { value: 'building', label: 'Doanh nghiệp', icon: Building2 },
  { value: 'check_circle', label: 'Hoàn thành', icon: CheckCircle2 },
  { value: 'star', label: 'Nổi bật', icon: Star },
  { value: 'globe', label: 'Toàn cầu', icon: Globe },
];

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

function getInitials(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized) return 'HP';

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return normalized.slice(0, 2).toUpperCase();
}

function getStatIcon(iconName) {
  return ICON_OPTIONS.find((option) => option.value === iconName)?.icon || Users;
}

function getAvatarSrc(item) {
  const raw = String(item?.author_avatar || '').trim();
  if (raw) return raw;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(item?.author_name || 'User')}&background=ECFDF5&color=047857`;
}

function getPartnerLogoSrc(item) {
  const logoUrl = String(item?.logo_url || '').trim();
  const logoSvg = String(item?.logo_svg || '').trim();

  if (logoUrl) return logoUrl;
  if (logoSvg.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}`;
  }
  return logoSvg;
}

function renderStars(rating = 0) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 0));
  return Array.from({ length: safeRating }).map((_, index) => (
    <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
  ));
}

const HomepageCMSPage = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    quick_stats: null,
    testimonials: null,
    trusted_by: null,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editingKind, setEditingKind] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    quick_stats: true,
    testimonials: true,
    trusted_by: true,
  });

  const quickStatsItems = useMemo(
    () => (Array.isArray(data.quick_stats?.items) ? data.quick_stats.items : []),
    [data.quick_stats]
  );
  const testimonialItems = useMemo(
    () => (Array.isArray(data.testimonials?.items) ? data.testimonials.items : []),
    [data.testimonials]
  );
  const partnerItems = useMemo(
    () => (Array.isArray(data.trusted_by?.items) ? data.trusted_by.items : []),
    [data.trusted_by]
  );

  const totalManagedItems = quickStatsItems.length + testimonialItems.length + partnerItems.length;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('admin/homepage');
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (error) {
      console.warn('HomepageCMSPage fetch error:', error?.message);
      showNotification('Không tải được dữ liệu homepage', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (section) => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const closeEditor = () => {
    setEditingItem(null);
    setEditMode(null);
    setEditingKind(null);
  };

  const openEditor = (kind, mode, payload) => {
    setEditingKind(kind);
    setEditMode(mode);
    setEditingItem(payload);
  };

  const ensureSectionId = (sectionId, fallbackLabel) => {
    if (!sectionId) {
      showNotification(`Không tìm thấy vùng ${fallbackLabel} trên homepage.`, 'error');
      return false;
    }

    return true;
  };

  const handleAddStat = () => {
    if (!ensureSectionId(data.quick_stats?.id, 'thống kê')) return;

    openEditor('stats', 'create', {
      section_id: data.quick_stats.id,
      icon: 'users',
      display_value: '',
      label: '',
      value_type: 'number',
      display_order: quickStatsItems.length + 1,
    });
  };

  const handleEditStat = (stat) => {
    openEditor('stats', 'edit', { ...stat, section_id: data.quick_stats?.id });
  };

  const handleSaveStat = async () => {
    if (!editingItem?.display_value || !editingItem?.label) {
      showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      setSaving(true);

      if (editMode === 'create') {
        await api.post(`admin/homepage/stats/${editingItem.section_id}`, editingItem);
        showNotification('Đã thêm thống kê', 'success');
      } else {
        await api.put(`admin/homepage/stats/${editingItem.id}`, editingItem);
        showNotification('Đã cập nhật thống kê', 'success');
      }

      closeEditor();
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi lưu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStat = async (statId) => {
    if (!window.confirm('Xóa thống kê này?')) return;

    try {
      await api.delete(`admin/homepage/stats/${statId}`);
      showNotification('Đã xóa thống kê', 'success');
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi xóa', 'error');
    }
  };

  const handleAddTestimonial = () => {
    if (!ensureSectionId(data.testimonials?.id, 'đánh giá')) return;

    openEditor('testimonials', 'create', {
      section_id: data.testimonials.id,
      author_name: '',
      author_role: '',
      author_avatar: '',
      content: '',
      rating: 5,
      display_order: testimonialItems.length + 1,
    });
  };

  const handleEditTestimonial = (item) => {
    openEditor('testimonials', 'edit', { ...item, section_id: data.testimonials?.id });
  };

  const handleSaveTestimonial = async () => {
    if (!editingItem?.author_name || !editingItem?.content) {
      showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      setSaving(true);

      if (editMode === 'create') {
        await api.post(`admin/homepage/testimonials/${editingItem.section_id}`, editingItem);
        showNotification('Đã thêm đánh giá', 'success');
      } else {
        await api.put(`admin/homepage/testimonials/${editingItem.id}`, editingItem);
        showNotification('Đã cập nhật đánh giá', 'success');
      }

      closeEditor();
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi lưu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return;

    try {
      await api.delete(`admin/homepage/testimonials/${id}`);
      showNotification('Đã xóa đánh giá', 'success');
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi xóa', 'error');
    }
  };

  const handleAddPartner = () => {
    if (!ensureSectionId(data.trusted_by?.id, 'đối tác')) return;

    openEditor('partners', 'create', {
      section_id: data.trusted_by.id,
      name: '',
      logo_url: '',
      logo_svg: '',
      website_url: '',
      display_order: partnerItems.length + 1,
    });
  };

  const handleEditPartner = (item) => {
    openEditor('partners', 'edit', { ...item, section_id: data.trusted_by?.id });
  };

  const handleSavePartner = async () => {
    if (!editingItem?.name) {
      showNotification('Vui lòng nhập tên đối tác', 'error');
      return;
    }

    try {
      setSaving(true);

      if (editMode === 'create') {
        await api.post(`admin/homepage/partners/${editingItem.section_id}`, editingItem);
        showNotification('Đã thêm đối tác', 'success');
      } else {
        await api.put(`admin/homepage/partners/${editingItem.id}`, editingItem);
        showNotification('Đã cập nhật đối tác', 'success');
      }

      closeEditor();
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi lưu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Xóa đối tác này?')) return;

    try {
      await api.delete(`admin/homepage/partners/${id}`);
      showNotification('Đã xóa đối tác', 'success');
      fetchData();
    } catch (error) {
      showNotification('Lỗi khi xóa', 'error');
    }
  };

  const summaryCards = [
    {
      label: 'Tổng mục nội dung',
      value: formatNumber(totalManagedItems),
      helper: 'Số phần tử đang quản lý',
      icon: LayoutGrid,
      className: 'bg-slate-50 text-slate-700 ring-slate-100',
    },
    {
      label: 'Thống kê',
      value: formatNumber(quickStatsItems.length),
      helper: 'Khối số liệu hiển thị',
      icon: Users,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
    {
      label: 'Đánh giá',
      value: formatNumber(testimonialItems.length),
      helper: 'Câu chuyện người dùng',
      icon: Quote,
      className: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    {
      label: 'Đối tác',
      value: formatNumber(partnerItems.length),
      helper: 'Logo trusted by',
      icon: Building2,
      className: 'bg-sky-50 text-sky-700 ring-sky-100',
    },
  ];

  const renderEmptyState = (title, description) => (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-inset ring-slate-200">
        <LayoutGrid className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );

  const renderEditModal = () => {
    if (!editingItem || !editingKind) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                    {editMode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                    {editingKind === 'stats'
                      ? 'Thống kê nền tảng'
                      : editingKind === 'testimonials'
                        ? 'Đánh giá người dùng'
                        : 'Trusted by'}
                  </Badge>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
                  {editMode === 'create' ? 'Thêm mục nội dung' : 'Cập nhật mục nội dung'}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Điền thông tin cần hiển thị trên homepage. Bố cục và thứ tự sẽ được áp dụng sau khi lưu.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeEditor}
                className="h-10 w-10 rounded-full text-slate-500 hover:bg-white hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto px-6 py-6 sm:px-7">
            <div className="space-y-6">
              {editingKind === 'stats' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Giá trị hiển thị *
                      </label>
                      <input
                        type="text"
                        value={editingItem.display_value}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, display_value: event.target.value })
                        }
                        placeholder="VD: 50.000+"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nhãn *
                      </label>
                      <input
                        type="text"
                        value={editingItem.label}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, label: event.target.value })
                        }
                        placeholder="VD: ứng viên"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Icon
                      </label>
                      <select
                        value={editingItem.icon}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, icon: event.target.value })
                        }
                        className={INPUT_CLASS}
                      >
                        {ICON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Loại giá trị
                      </label>
                      <select
                        value={editingItem.value_type}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, value_type: event.target.value })
                        }
                        className={INPUT_CLASS}
                      >
                        <option value="number">Số</option>
                        <option value="percentage">Phần trăm</option>
                        <option value="text">Văn bản</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Xem trước khối thống kê
                    </p>
                    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white bg-white p-4 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        {React.createElement(getStatIcon(editingItem.icon), {
                          className: 'h-5 w-5',
                        })}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-950">
                          {editingItem.display_value || '0'}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          {editingItem.label || 'Nhãn thống kê'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {editingKind === 'testimonials' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tên người đánh giá *
                      </label>
                      <input
                        type="text"
                        value={editingItem.author_name}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, author_name: event.target.value })
                        }
                        placeholder="VD: Nguyễn Văn A"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Chức vụ / Công ty
                      </label>
                      <input
                        type="text"
                        value={editingItem.author_role}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, author_role: event.target.value })
                        }
                        placeholder="VD: Senior Product Designer tại HireAI"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Avatar URL
                      </label>
                      <input
                        type="text"
                        value={editingItem.author_avatar}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, author_avatar: event.target.value })
                        }
                        placeholder="https://..."
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rating
                      </label>
                      <select
                        value={editingItem.rating}
                        onChange={(event) =>
                          setEditingItem({
                            ...editingItem,
                            rating: parseInt(event.target.value, 10) || 5,
                          })
                        }
                        className={INPUT_CLASS}
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {`${'★'.repeat(value)} (${value})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nội dung đánh giá *
                    </label>
                    <textarea
                      value={editingItem.content}
                      onChange={(event) =>
                        setEditingItem({ ...editingItem, content: event.target.value })
                      }
                      placeholder="Nhập nội dung đánh giá..."
                      rows={5}
                      className={TEXTAREA_CLASS}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Xem trước thẻ đánh giá
                    </p>
                    <div className="mt-4 rounded-2xl border border-white bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarSrc(editingItem)}
                          alt={editingItem.author_name || 'Người dùng'}
                          className="h-12 w-12 rounded-full object-cover ring-1 ring-inset ring-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {editingItem.author_name || 'Người dùng'}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {editingItem.author_role || 'Chức vụ / Công ty'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1">
                        {renderStars(editingItem.rating)}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {editingItem.content || 'Nội dung đánh giá sẽ hiển thị tại đây.'}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}

              {editingKind === 'partners' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tên đối tác *
                      </label>
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, name: event.target.value })
                        }
                        placeholder="VD: TechCorp Vietnam"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Website URL
                      </label>
                      <input
                        type="text"
                        value={editingItem.website_url}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, website_url: event.target.value })
                        }
                        placeholder="https://..."
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Logo URL
                      </label>
                      <input
                        type="text"
                        value={editingItem.logo_url}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, logo_url: event.target.value })
                        }
                        placeholder="https://... (ảnh logo)"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Logo SVG
                      </label>
                      <textarea
                        value={editingItem.logo_svg}
                        onChange={(event) =>
                          setEditingItem({ ...editingItem, logo_svg: event.target.value })
                        }
                        placeholder="<svg ...>...</svg> hoặc data URI"
                        rows={4}
                        className={TEXTAREA_CLASS}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Xem trước logo đối tác
                    </p>
                    <div className="mt-4 rounded-2xl border border-white bg-white p-5 shadow-sm">
                      <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                        {getPartnerLogoSrc(editingItem) ? (
                          <img
                            src={getPartnerLogoSrc(editingItem)}
                            alt={editingItem.name || 'Partner'}
                            className="max-h-10 max-w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-inset ring-slate-200">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-bold text-slate-900">
                          {editingItem.name || 'Tên đối tác'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {editingItem.website_url || 'Website đối tác'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={editingItem.display_order}
                  onChange={(event) =>
                    setEditingItem({
                      ...editingItem,
                      display_order: parseInt(event.target.value, 10) || 0,
                    })
                  }
                  min={1}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
            <Button type="button" variant="outline" onClick={closeEditor} className="h-11 rounded-lg">
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editingKind === 'stats') handleSaveStat();
                if (editingKind === 'testimonials') handleSaveTestimonial();
                if (editingKind === 'partners') handleSavePartner();
              }}
              disabled={saving}
              className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/40">
        <div className="mx-auto flex h-72 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            Đang tải dữ liệu homepage...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                  Homepage content orchestration
                </Badge>
              </div>

              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-emerald-600">Homepage management</p>
                <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                  Quản lý homepage
                </h1>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Quản trị các khối nội dung cốt lõi của trang chủ như thống kê nền tảng, đánh giá
                  người dùng và hệ đối tác trong cùng một không gian vận hành sáng sủa, đồng nhất
                  và dễ kiểm soát hơn.
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
                  onClick={handleAddStat}
                  className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm thống kê
                </Button>
                <Button
                  type="button"
                  onClick={handleAddTestimonial}
                  variant="outline"
                  className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
                >
                  <Quote className="mr-2 h-4 w-4" />
                  Thêm đánh giá
                </Button>
                <Button
                  type="button"
                  onClick={handleAddPartner}
                  variant="outline"
                  className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Thêm đối tác
                </Button>
                <Button
                  type="button"
                  onClick={fetchData}
                  variant="outline"
                  className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Làm mới dữ liệu
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <section className="space-y-6">
            <SectionCard
              icon={Users}
              title="Thống kê nền tảng"
              description="Các block số liệu lớn giúp phần hero và các vùng tin cậy trên trang chủ có trọng lượng rõ ràng hơn."
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    {quickStatsItems.length} items
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStat}
                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm thống kê
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSection('quick_stats')}
                    className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {expandedSections.quick_stats ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              }
            >
              {expandedSections.quick_stats ? (
                quickStatsItems.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {quickStatsItems.map((stat) => {
                      const Icon = getStatIcon(stat.icon);

                      return (
                        <div
                          key={stat.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditStat(stat)}
                                className="h-8 w-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStat(stat.id)}
                                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-5">
                            <p className="text-3xl font-bold tracking-normal text-slate-950">
                              {stat.display_value}
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                              {stat.value_type || 'number'}
                            </Badge>
                            <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500">
                              Thứ tự {stat.display_order || 0}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  renderEmptyState(
                    'Chưa có block thống kê',
                    'Thêm các số liệu như ứng viên, doanh nghiệp hoặc tỷ lệ match để tăng độ tin cậy cho phần đầu trang chủ.'
                  )
                )
              ) : null}
            </SectionCard>

            <SectionCard
              icon={Quote}
              title="Đánh giá người dùng"
              description="Các câu chuyện thành công giúp tăng độ thuyết phục và tạo chiều sâu cảm xúc cho homepage."
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    {testimonialItems.length} items
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTestimonial}
                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm đánh giá
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSection('testimonials')}
                    className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {expandedSections.testimonials ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              }
            >
              {expandedSections.testimonials ? (
                testimonialItems.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {testimonialItems.map((item) => (
                      <article
                        key={item.id}
                        className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                      >
                        <div className="absolute right-4 top-4 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTestimonial(item)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTestimonial(item.id)}
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 pr-16">
                          <img
                            src={getAvatarSrc(item)}
                            alt={item.author_name}
                            className="h-12 w-12 rounded-full object-cover ring-1 ring-inset ring-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.author_name}
                            </p>
                            <p className="truncate text-sm text-slate-500">{item.author_role}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-1">{renderStars(item.rating)}</div>
                        <p className="mt-4 text-sm leading-7 text-slate-600">{item.content}</p>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                            {item.rating || 5} sao
                          </Badge>
                          <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500">
                            Thứ tự {item.display_order || 0}
                          </Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    'Chưa có đánh giá người dùng',
                    'Thêm nhận xét từ ứng viên hoặc doanh nghiệp để homepage có thêm bằng chứng xã hội và cảm giác tin cậy.'
                  )
                )
              ) : null}
            </SectionCard>

            <SectionCard
              icon={Building2}
              title="Đối tác / Trusted By"
              description="Quản lý logo đối tác để tăng tín nhiệm thương hiệu và tạo cảm giác hệ sinh thái đang hoạt động mạnh."
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    {partnerItems.length} items
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPartner}
                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm đối tác
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSection('trusted_by')}
                    className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {expandedSections.trusted_by ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              }
            >
              {expandedSections.trusted_by ? (
                partnerItems.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {partnerItems.map((item) => (
                      <article
                        key={item.id}
                        className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                      >
                        <div className="absolute right-4 top-4 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPartner(item)}
                            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePartner(item.id)}
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex h-20 items-center justify-center rounded-2xl border border-white bg-white pr-12 shadow-sm">
                          {getPartnerLogoSrc(item) ? (
                            <img
                              src={getPartnerLogoSrc(item)}
                              alt={item.name}
                              className="max-h-10 max-w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
                              <span className="text-sm font-bold">{getInitials(item.name)}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.website_url || 'Chưa gắn website'}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {item.website_url ? (
                            <a
                              href={item.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Visit site
                            </a>
                          ) : (
                            <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500">
                              Chưa có link
                            </Badge>
                          )}
                          <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-500">
                            Thứ tự {item.display_order || 0}
                          </Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    'Chưa có đối tác hiển thị',
                    'Thêm logo thương hiệu hoặc doanh nghiệp đồng hành để vùng Trusted By trên homepage có chiều sâu và độ tin cậy tốt hơn.'
                  )
                )
              ) : null}
            </SectionCard>

            <SectionCard
              icon={Globe}
              title="Tóm tắt cấu hình"
              description="Nhìn nhanh trạng thái các khối trên homepage trước khi tiếp tục chỉnh sửa nội dung."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Section mở
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {Object.values(expandedSections).filter(Boolean).length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Trên tổng số 3 khối nội dung</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Có avatar
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {testimonialItems.filter((item) => item.author_avatar).length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Đánh giá có ảnh đại diện</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Có website
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {partnerItems.filter((item) => item.website_url).length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Đối tác có liên kết ngoài</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Icon đa dạng
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {new Set(quickStatsItems.map((item) => item.icon)).size}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Loại icon đang sử dụng</p>
                </div>
              </div>
            </SectionCard>
          </section>
        </main>
      </div>

      {renderEditModal()}
    </>
  );
};

export default HomepageCMSPage;
