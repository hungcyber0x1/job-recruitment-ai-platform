import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';

import AdminTable from '@/components/admin/AdminTable';
import BlogPostEditorDialog from '@/components/blog/BlogPostEditorDialog';
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
import { useNotification } from '@/context/NotificationContext';
import { blogService, unwrapBlogListResponse } from '@/services';
import useDebounce from '@/hooks/useDebounce';
import { cn } from '@/utils';

const PAGE_SIZE = 15;

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả', helper: 'Toàn bộ danh sách', countKey: 'total' },
  { id: 'pending', label: 'Chờ duyệt', helper: 'Cần kiểm duyệt', countKey: 'pending' },
  { id: 'published', label: 'Đã đăng', helper: 'Đã xuất bản', countKey: 'published' },
  { id: 'rejected', label: 'Từ chối', helper: 'Đã phản hồi', countKey: 'rejected' },
];

const AUTHOR_OPTIONS = [
  { value: '', label: 'Tất cả nguồn bài' },
  { value: 'admin', label: 'Quản trị' },
  { value: 'recruiter', label: 'Đối tác' },
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

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getAuthorMeta(row) {
  if (row.author_type === 'recruiter') {
    return {
      label: 'Đối tác',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
      subLabel: row.company_name || 'Bài viết doanh nghiệp',
    };
  }

  return {
    label: 'Quản trị',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700',
    subLabel: 'Biên tập nội bộ',
  };
}

function getStatusMeta(status) {
  if (status === 'published') {
    return {
      label: 'Đã xuất bản',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClass: 'bg-emerald-500',
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Từ chối',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
      dotClass: 'bg-rose-500',
    };
  }

  if (status === 'archived') {
    return {
      label: 'Lưu trữ',
      badgeClass: 'border-slate-200 bg-slate-50 text-slate-600',
      dotClass: 'bg-slate-400',
    };
  }

  if (status === 'draft') {
    return {
      label: 'Nháp',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }

  return {
    label: 'Chờ duyệt',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  };
}

const AdminBlogPage = () => {
  const { showNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [authorFilter, setAuthorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editing, setEditing] = useState(null);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, pages: 1, current: 1 });

  const fetchList = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const res = await blogService.listAdmin({
          search: debouncedSearch.trim() || undefined,
          author_type: authorFilter || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          flagged: flagFilter ? 'true' : undefined,
          page,
          page_size: PAGE_SIZE,
        });

        setItems(unwrapBlogListResponse(res));

        const pagination = res?.data?.meta?.pagination;
        if (pagination) {
          setPaginationMeta({
            total: Number(pagination.total) || 0,
            pages: Number(pagination.pages) || 1,
            current: Number(pagination.page) || page,
          });
        } else {
          setPaginationMeta({
            total: 0,
            pages: 1,
            current: 1,
          });
        }
      } catch (error) {
        console.warn('AdminBlogPage fetch error:', error?.message);
        showNotification('Không tải được danh sách bài viết.', 'error');
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [authorFilter, debouncedSearch, flagFilter, showNotification, statusFilter]
  );

  useEffect(() => {
    setSelectedIds([]);
    fetchList(1);
  }, [fetchList]);

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) return;

    const confirmMsg =
      {
        approve: `Duyệt ${selectedIds.length} bài viết đã chọn?`,
        reject: `Từ chối ${selectedIds.length} bài viết đã chọn?`,
        delete: `Xóa vĩnh viễn ${selectedIds.length} bài viết đã chọn?`,
        flag: `Gắn cờ ${selectedIds.length} bài viết đã chọn?`,
        unflag: `Bỏ cờ ${selectedIds.length} bài viết đã chọn?`,
      }[action] || 'Xác nhận thao tác hàng loạt?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setBulkLoading(true);
      let reason = '';

      if (action === 'reject') {
        reason =
          window.prompt('Nhập lý do từ chối chung (không bắt buộc):') ||
          'Không đạt yêu cầu kiểm duyệt';
      }

      await blogService.bulkAction({
        ids: selectedIds.map((id) => Number(id)),
        action,
        data: { reason },
      });

      showNotification('Đã thực hiện thao tác hàng loạt.', 'success');
      setSelectedIds([]);
      fetchList(paginationMeta.current);
    } catch (error) {
      showNotification('Lỗi khi thực hiện thao tác hàng loạt.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

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

  const updatePostStatus = async (id, status, reason = '') => {
    try {
      await blogService.updateStatus(id, { status, rejection_reason: reason });
      showNotification(
        `Đã ${status === 'published' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật'} bài viết.`,
        'success'
      );
      fetchList(paginationMeta.current);
    } catch (error) {
      showNotification('Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const updateFlagStatus = async (row, nextFlagged) => {
    try {
      await blogService.updateStatus(row.id, { is_flagged: nextFlagged });
      showNotification(nextFlagged ? 'Đã gắn cờ bài viết.' : 'Đã bỏ cờ bài viết.', 'success');
      fetchList(paginationMeta.current);
    } catch (error) {
      showNotification('Lỗi khi cập nhật cờ kiểm duyệt.', 'error');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Xóa bài viết này?')) return;

    try {
      await blogService.deleteAdmin(row.id);
      showNotification('Đã xóa bài viết.', 'success');
      fetchList(paginationMeta.current);
    } catch (error) {
      showNotification('Lỗi khi xóa bài viết.', 'error');
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setAuthorFilter('');
    setStatusFilter('all');
    setFlagFilter(false);
    setSelectedIds([]);
  };

  const pendingCount = items.filter((row) => row.status === 'pending').length;
  const publishedCount = items.filter((row) => row.status === 'published').length;
  const rejectedCount = items.filter((row) => row.status === 'rejected').length;
  const flaggedCount = items.filter((row) => Boolean(row.is_flagged)).length;
  const featuredCount = items.filter((row) => Boolean(row.is_featured)).length;
  const partnerCount = items.filter((row) => row.author_type === 'recruiter').length;
  const pageStart = paginationMeta.total === 0 ? 0 : (paginationMeta.current - 1) * PAGE_SIZE + 1;
  const pageEnd =
    paginationMeta.total === 0 ? 0 : Math.min(paginationMeta.current * PAGE_SIZE, paginationMeta.total);
  const activeStatusLabel =
    STATUS_TABS.find((tab) => tab.id === statusFilter)?.label || 'Tất cả';
  const activeAuthorLabel =
    AUTHOR_OPTIONS.find((option) => option.value === authorFilter)?.label || 'Tất cả nguồn bài';

  const summaryCards = [
    {
      label: 'Tổng bài viết',
      value: formatNumber(paginationMeta.total),
      helper: 'Theo bộ lọc hiện tại',
      icon: BookOpen,
      className: 'bg-slate-50 text-slate-700 ring-slate-100',
    },
    {
      label: 'Chờ duyệt',
      value: formatNumber(pendingCount),
      helper: 'Trên danh sách đang mở',
      icon: RefreshCw,
      className: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
    {
      label: 'Đã đăng',
      value: formatNumber(publishedCount),
      helper: 'Đang hiển thị công khai',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
    {
      label: 'Bài gắn cờ',
      value: formatNumber(flaggedCount),
      helper: 'Cần rà soát nội dung',
      icon: AlertTriangle,
      className: 'bg-rose-50 text-rose-700 ring-rose-100',
    },
    {
      label: 'Nguồn đối tác',
      value: formatNumber(partnerCount),
      helper: 'Bài viết từ doanh nghiệp',
      icon: Building2,
      className: 'bg-sky-50 text-sky-700 ring-sky-100',
    },
  ];

  const bulkActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={() => handleBulkAction('approve')}
        disabled={bulkLoading}
        size="sm"
        className="h-9 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500"
      >
        <Check size={14} className="mr-1.5" />
        Duyệt
      </Button>
      <Button
        onClick={() => handleBulkAction('reject')}
        disabled={bulkLoading}
        size="sm"
        className="h-9 rounded-xl bg-amber-600 font-bold hover:bg-amber-500"
      >
        <XCircle size={14} className="mr-1.5" />
        Từ chối
      </Button>
      <Button
        onClick={() => handleBulkAction('flag')}
        disabled={bulkLoading}
        variant="outline"
        size="sm"
        className="h-9 rounded-xl border-rose-200 bg-white font-bold text-rose-600 hover:bg-rose-50"
      >
        <AlertTriangle size={14} className="mr-1.5" />
        Gắn cờ
      </Button>
      <Button
        onClick={() => handleBulkAction('delete')}
        disabled={bulkLoading}
        variant="destructive"
        size="sm"
        className="h-9 rounded-xl font-bold"
      >
        <Trash2 size={14} className="mr-1.5" />
        Xóa
      </Button>
    </div>
  );

  const columns = [
    {
      header: 'Bài viết',
      width: '360px',
      accessor: (row) => (
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-bold leading-6 text-slate-900">{row.title}</p>
            </div>
            {row.is_featured ? (
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                <Star size={14} fill="currentColor" />
              </span>
            ) : null}
          </div>

          <p className="mt-2 truncate text-xs font-mono text-slate-400">{row.slug}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {row.is_flagged ? (
              <Badge className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Đã gắn cờ
              </Badge>
            ) : null}
            {row.is_featured ? (
              <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Star className="mr-1 h-3 w-3" />
                Nổi bật
              </Badge>
            ) : null}
            <span className="text-xs font-medium text-slate-400">
              Cập nhật {formatDate(row.updated_at || row.created_at)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Phân loại',
      width: '170px',
      accessor: (row) => (
        <div className="space-y-2">
          <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {(row.category_name || row.category || 'Chưa phân loại').toString()}
          </Badge>
          <p className="text-xs font-medium text-slate-400">
            {row.status === 'published'
              ? `Xuất bản ${formatDate(row.published_at)}`
              : 'Chưa công khai'}
          </p>
        </div>
      ),
    },
    {
      header: 'Tác giả',
      width: '190px',
      accessor: (row) => {
        const authorMeta = getAuthorMeta(row);

        return (
          <div className="space-y-2">
            <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${authorMeta.badgeClass}`}>
              {authorMeta.label}
            </Badge>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserRound size={13} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {row.author_name || 'Hệ thống'}
                </p>
                <p className="truncate text-xs font-medium text-slate-400">{authorMeta.subLabel}</p>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Kiểm duyệt',
      width: '190px',
      accessor: (row) => {
        const statusMeta = getStatusMeta(row.status);

        return (
          <div className="space-y-2">
            <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
              <span className={`mr-1.5 h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </Badge>
            {row.status === 'rejected' && row.rejection_reason ? (
              <p className="max-w-[220px] text-xs leading-5 text-rose-500">{row.rejection_reason}</p>
            ) : (
              <p className="text-xs font-medium text-slate-400">
                {row.is_flagged ? 'Nội dung cần kiểm tra thêm' : 'Quy trình kiểm duyệt ổn định'}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Thao tác',
      width: '130px',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'pending' ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updatePostStatus(row.id, 'published')}
                className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50"
                title="Duyệt bài"
              >
                <CheckCircle2 size={17} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const reason = window.prompt('Lý do từ chối bài viết:');
                  if (reason !== null) updatePostStatus(row.id, 'rejected', reason);
                }}
                className="h-9 w-9 rounded-lg text-rose-600 hover:bg-rose-50"
                title="Từ chối"
              >
                <XCircle size={17} />
              </Button>
            </>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-slate-200 p-2 shadow-lg"
            >
              <DropdownMenuLabel className="px-2 text-xs font-bold uppercase tracking-normal text-slate-400">
                Thao tác
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to={`/blog/${row.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4 text-emerald-500" />
                  Xem bài công khai
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-lg"
                onClick={() => openEdit(row)}
              >
                <Pencil className="mr-2 h-4 w-4 text-sky-500" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-lg"
                onClick={() => updateFlagStatus(row, !row.is_flagged)}
              >
                <AlertTriangle
                  className={cn(
                    'mr-2 h-4 w-4',
                    row.is_flagged ? 'text-slate-500' : 'text-rose-500'
                  )}
                />
                {row.is_flagged ? 'Bỏ cờ vi phạm' : 'Gắn cờ kiểm duyệt'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg text-rose-600 focus:text-rose-600"
                onClick={() => handleDelete(row)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa bài viết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

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
                  Kiểm duyệt nội dung blog
                </Badge>
              </div>

              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-emerald-600">Editorial operations</p>
                <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                  Quản lý & kiểm duyệt blog
                </h1>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Theo dõi bài viết nội bộ và bài từ đối tác trong cùng một không gian vận hành
                  sáng sủa, rõ trạng thái kiểm duyệt và thuận tiện cho biên tập viên xử lý nhanh.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                    setStatusFilter('pending');
                    setFlagFilter(false);
                  }}
                  className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mở chờ duyệt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchList(1)}
                  className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                  Làm mới danh sách
                </Button>
                <Button
                  type="button"
                  onClick={openCreate}
                  className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Viết bài mới
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <section className="space-y-6">
            <SectionCard
              icon={Search}
              title="Bộ lọc kiểm duyệt"
              description="Tìm theo tiêu đề, slug, trích dẫn hoặc nguồn bài; kết hợp trạng thái và cờ vi phạm để đội biên tập xử lý đúng nhóm nội dung."
            >
              <div className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm bài viết, slug hoặc nội dung..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_TABS.map((tab) => {
                      const isActive = statusFilter === tab.id && !flagFilter;
                      const count =
                        tab.countKey === 'total'
                          ? paginationMeta.total
                          : tab.countKey === 'pending'
                            ? pendingCount
                            : tab.countKey === 'published'
                              ? publishedCount
                              : rejectedCount;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setStatusFilter(tab.id);
                            setFlagFilter(false);
                          }}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                          }`}
                        >
                          {tab.label}
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {formatNumber(count)}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setFlagFilter((current) => !current);
                        setStatusFilter('all');
                      }}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        flagFilter
                          ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-700'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Vi phạm
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                          flagFilter ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {formatNumber(flaggedCount)}
                      </span>
                    </button>
                  </div>

                  <select
                    value={authorFilter}
                    onChange={(event) => setAuthorFilter(event.target.value)}
                    className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    {AUTHOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <span>
                    Từ khóa:{' '}
                    <strong className="text-slate-700">
                      {debouncedSearch.trim() || 'Tất cả bài viết'}
                    </strong>
                  </span>
                  <span>
                    Trạng thái: <strong className="text-slate-700">{activeStatusLabel}</strong>
                  </span>
                  <span>
                    Nguồn bài: <strong className="text-slate-700">{activeAuthorLabel}</strong>
                  </span>
                  <span>
                    Cờ vi phạm:{' '}
                    <strong className="text-slate-700">{flagFilter ? 'Đang bật' : 'Tắt'}</strong>
                  </span>
                  <span>
                    Nổi bật: <strong className="text-slate-700">{formatNumber(featuredCount)}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="h-10 rounded-lg border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Làm sạch bộ lọc
                  </Button>
                </div>
              </div>
            </SectionCard>

            <AdminTable
              title="Danh sách bài viết"
              subtitle="Giữ nguyên quy trình tạo, chỉnh sửa, duyệt, từ chối và xóa, nhưng trình bày lại để đội biên tập quét nội dung và ra quyết định nhanh hơn."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                    {pageStart}-{pageEnd} / {formatNumber(paginationMeta.total)}
                  </Badge>
                  {flagFilter ? (
                    <Badge className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                      Nội dung vi phạm
                    </Badge>
                  ) : null}
                </div>
              }
              columns={columns}
              data={items}
              loading={loading}
              pagination={{
                currentPage: paginationMeta.current,
                totalPages: paginationMeta.pages,
                totalItems: paginationMeta.total,
                pageSize: PAGE_SIZE,
                onPageChange: (nextPage) => {
                  setSelectedIds([]);
                  fetchList(nextPage);
                },
              }}
              selectable={{
                selectedIds,
                onSelectChange: setSelectedIds,
                rowKey: (row) => row.id,
              }}
              bulkActions={bulkActions}
              emptyTitle="Không có bài viết phù hợp"
              emptyDescription="Hãy điều chỉnh lại bộ lọc hoặc mở rộng từ khóa để xem thêm nội dung blog."
            />
          </section>
        </main>
      </div>

      <BlogPostEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialRow={editing}
        onSubmit={async (payload) => {
          try {
            if (dialogMode === 'create') {
              await blogService.createAdmin(payload);
              showNotification('Đã tạo bài viết.', 'success');
            } else {
              await blogService.updateAdmin(editing.id, payload);
              showNotification('Đã lưu thay đổi.', 'success');
            }

            fetchList(paginationMeta.current);
          } catch (error) {
            showNotification('Lỗi khi lưu bài viết.', 'error');
          }
        }}
      />
    </>
  );
};

export default AdminBlogPage;
