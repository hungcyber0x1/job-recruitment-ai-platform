import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Filter,
  History,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  User as UserIcon,
  X,
} from 'lucide-react';

import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';

const STATUS_OPTIONS = [
  { id: 'open', label: 'Đang chờ', color: 'rose', icon: Clock },
  { id: 'in_progress', label: 'Đang xử lý', color: 'amber', icon: History },
  { id: 'resolved', label: 'Đã đóng', color: 'emerald', icon: ShieldCheck },
];

const TAB_MAP = {
  all: 'all',
  pending: 'open',
  in_progress: 'in_progress',
  closed: 'resolved',
};

const STATUS_META = {
  open: {
    label: 'Đang chờ',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    soft: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  in_progress: {
    label: 'Đang xử lý',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    soft: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  resolved: {
    label: 'Đã đóng',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    soft: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
};

const CATEGORY_META = {
  bug: {
    label: 'Lỗi kỹ thuật',
    className: 'border-rose-100 bg-rose-50 text-rose-700',
  },
  payment: {
    label: 'Thanh toán',
    className: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  account: {
    label: 'Tài khoản',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
  general: {
    label: 'Khác',
    className: 'border-slate-200 bg-slate-50 text-slate-600',
  },
};

const PRIORITY_META = {
  high: {
    label: 'Ưu tiên cao',
    className: 'border-rose-200 bg-rose-100/60 text-rose-700',
  },
  medium: {
    label: 'Bình thường',
    className: 'border-amber-200 bg-amber-100/60 text-amber-700',
  },
  low: {
    label: 'Ưu tiên thấp',
    className: 'border-slate-200 bg-slate-100/80 text-slate-600',
  },
};

const limit = 10;

const formatTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${Math.max(diffMins, 1)} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN');
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return 'N/A';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const getCategoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META.general;
const getPriorityMeta = (priority) => PRIORITY_META[priority] || PRIORITY_META.medium;
const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.open;

function SupportStatCard({ icon: Icon, label, value, helper, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            tones[tone] || tones.emerald
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

const AdminSupportPage = () => {
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [tabFilter, setTabFilter] = useState('all');
  const [searchTicket, setSearchTicket] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ticketFilter, setTicketFilter] = useState({
    priority: 'all',
    category: 'all',
    assignee: 'all',
  });

  const statusFilter = TAB_MAP[tabFilter] || undefined;

  const fetchTickets = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        const response = await adminService.getTickets({
          limit: 500,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });

        const rawTickets = Array.isArray(response.data?.data) ? response.data.data : [];
        const nextTickets = rawTickets.map((ticket) => ({
          id: ticket?.id ?? 0,
          subject: String(ticket?.subject ?? ''),
          description: String(ticket?.description ?? ''),
          status: String(ticket?.status ?? 'open'),
          priority: String(ticket?.priority ?? 'medium'),
          category:
            ticket?.category ||
            (String(ticket?.subject || '')
              .toLowerCase()
              .includes('lỗi')
              ? 'bug'
              : 'general'),
          user_id: ticket?.user_id ?? null,
          admin_id: ticket?.admin_id ?? null,
          assignee: ticket?.assignee_name ?? null,
          first_name: ticket?.first_name,
          last_name: ticket?.last_name,
          email: ticket?.email,
          created_at: ticket?.created_at ?? new Date().toISOString(),
          updated_at: ticket?.updated_at ?? new Date().toISOString(),
        }));

        setTickets(nextTickets);
        setSelectedTicketId((current) => {
          if (!nextTickets.length) return null;
          return nextTickets.some((ticket) => ticket.id === current) ? current : nextTickets[0].id;
        });
      } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Không thể tải danh sách ticket.', 'error');
      } finally {
        if (showLoader) setLoading(false);
        else setRefreshing(false);
      }
    },
    [showNotification, statusFilter]
  );

  useEffect(() => {
    fetchTickets(true);
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [tabFilter, searchTicket, ticketFilter]);

  const counts = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'open').length;
    const inProgress = tickets.filter((ticket) => ticket.status === 'in_progress').length;
    const resolved = tickets.filter((ticket) => ticket.status === 'resolved').length;
    const total = tickets.length;

    return {
      total,
      open,
      inProgress,
      resolved,
      resolvedPct: total ? ((resolved / total) * 100).toFixed(1) : '0',
    };
  }, [tickets]);

  const avgResponseTime = useMemo(() => {
    const resolvedTickets = tickets.filter(
      (ticket) => ticket.status === 'resolved' && ticket.created_at && ticket.updated_at
    );

    if (!resolvedTickets.length) return null;

    const totalMs = resolvedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at).getTime();
      const updated = new Date(ticket.updated_at).getTime();
      return sum + (updated - created);
    }, 0);

    return Math.round(totalMs / resolvedTickets.length);
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let next = tickets;

    if (ticketFilter.priority !== 'all') {
      next = next.filter((ticket) => ticket.priority === ticketFilter.priority);
    }

    if (ticketFilter.category !== 'all') {
      next = next.filter((ticket) => ticket.category === ticketFilter.category);
    }

    if (ticketFilter.assignee !== 'all') {
      next = next.filter((ticket) => {
        if (ticketFilter.assignee === 'unassigned') return !ticket.admin_id;
        return ticket.assignee === ticketFilter.assignee;
      });
    }

    if (searchTicket.trim()) {
      const query = searchTicket.trim().toLowerCase();
      next = next.filter(
        (ticket) =>
          String(ticket.subject || '').toLowerCase().includes(query) ||
          String(ticket.email || '').toLowerCase().includes(query) ||
          String(ticket.description || '').toLowerCase().includes(query) ||
          String(ticket.id || '').includes(query)
      );
    }

    return next;
  }, [searchTicket, ticketFilter, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedTickets = useMemo(
    () => filteredTickets.slice((page - 1) * limit, page * limit),
    [filteredTickets, page]
  );

  useEffect(() => {
    if (!paginatedTickets.length) {
      setSelectedTicketId(null);
      return;
    }

    setSelectedTicketId((current) =>
      paginatedTickets.some((ticket) => ticket.id === current) ? current : paginatedTickets[0].id
    );
  }, [paginatedTickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [selectedTicketId, tickets]
  );

  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    adminService
      .getTicketMessages(selectedTicketId)
      .then((response) => setMessages(response.data?.data || []))
      .catch(() => setMessages([]));
  }, [selectedTicketId]);

  const handleStatusChange = async (ticketId, status) => {
    try {
      setSavingKey(`status-${ticketId}`);
      await adminService.updateTicketStatus(ticketId, status);
      await fetchTickets(false);
      showNotification('Đã cập nhật trạng thái ticket.', 'success');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showNotification('Không thể cập nhật trạng thái ticket.', 'error');
    } finally {
      setSavingKey('');
    }
  };

  const handleReply = async () => {
    if (!selectedTicketId || !reply.trim()) {
      showNotification('Vui lòng nhập nội dung phản hồi.', 'error');
      return;
    }

    try {
      setSaving(true);
      await adminService.replyToTicket(selectedTicketId, {
        message: reply.trim(),
        isInternal,
      });

      await fetchTickets(false);
      const response = await adminService.getTicketMessages(selectedTicketId);
      setMessages(response.data?.data || []);
      setReply('');
      setIsInternal(false);
      showNotification(isInternal ? 'Đã lưu ghi chú nội bộ.' : 'Đã gửi phản hồi ticket.', 'success');
    } catch (error) {
      console.error('Error replying to ticket:', error);
      showNotification('Không thể gửi phản hồi ticket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportTickets = async () => {
    try {
      setExporting(true);
      const response = await adminService.exportTickets({
        status: statusFilter === 'all' ? undefined : statusFilter,
        ...ticketFilter,
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', `tickets-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất báo cáo thành công.', 'success');
    } catch (error) {
      console.error('Error exporting tickets:', error);
      showNotification('Không thể xuất báo cáo.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const activeFilterCount =
    [ticketFilter.priority, ticketFilter.category, ticketFilter.assignee].filter(
      (value) => value !== 'all'
    ).length + (searchTicket.trim() ? 1 : 0);

  const unassignedCount = tickets.filter((ticket) => !ticket.admin_id).length;
  const currentTabLabel =
    {
      all: 'Tất cả',
      pending: 'Đang chờ',
      in_progress: 'Đang xử lý',
      closed: 'Đã đóng',
    }[tabFilter] || 'Tất cả';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Support workspace
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Ticket operations
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                {filteredTickets.length} ticket trong chế độ xem hiện tại
              </span>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Doanh nghiệp hỗ trợ người dùng</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                Hệ thống hỗ trợ
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Theo dõi hàng đợi ticket, phân loại mức độ ưu tiên và xử lý hội thoại hỗ trợ trong
                cùng một không gian vận hành rõ ràng hơn, đồng nhất với các trang doanh nghiệp.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SupportStatCard
                icon={Ticket}
                label="Tổng yêu cầu"
                value={counts.total.toLocaleString('vi-VN')}
                helper="Toàn bộ ticket đã ghi nhận trong hệ thống"
                tone="emerald"
              />
              <SupportStatCard
                icon={Clock}
                label="Đang chờ"
                value={counts.open.toLocaleString('vi-VN')}
                helper="Các yêu cầu chưa được đội hỗ trợ xử lý"
                tone="amber"
              />
              <SupportStatCard
                icon={ShieldCheck}
                label="Tỷ lệ giải quyết"
                value={`${counts.resolvedPct}%`}
                helper="Tỷ lệ ticket đã đóng trên tổng số yêu cầu"
                tone="blue"
              />
              <SupportStatCard
                icon={History}
                label="Phản hồi trung bình"
                value={avgResponseTime ? formatDuration(avgResponseTime) : 'N/A'}
                helper="Thời gian xử lý trung bình từ mở đến đóng ticket"
                tone="violet"
              />
            </div>
          </div>

          <div className="self-start rounded-[28px] border border-white/90 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bảng điều phối
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">Queue control</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tìm ticket theo email hoặc tiêu đề, bật lọc nhanh và xuất snapshot làm báo cáo hỗ trợ.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  View hiện tại
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950">{currentTabLabel}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm ticket, email hoặc mô tả..."
                  value={searchTicket}
                  onChange={(event) => setSearchTicket(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Ticket chưa bàn giao
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{unassignedCount} yêu cầu</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Bộ lọc đang áp dụng
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {activeFilterCount ? `${activeFilterCount} điều kiện` : 'Đang xem mặc định'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilterPanel((current) => !current)}
                className="h-10 rounded-2xl border-slate-200 px-4"
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilterPanel ? 'Ẩn lọc' : 'Lọc nâng cao'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchTickets(false)}
                disabled={refreshing || exporting}
                className="h-10 rounded-2xl border-slate-200 px-4"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Làm mới
              </Button>
              <Button
                type="button"
                onClick={handleExportTickets}
                disabled={exporting}
                className="h-10 rounded-2xl bg-emerald-600 px-4 text-white hover:bg-emerald-700 sm:col-span-2"
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-bg">
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {showFilterPanel && (
              <SectionCard
                icon={Filter}
                title="Bộ lọc ticket nâng cao"
                description="Khoanh vùng hàng đợi theo mức độ ưu tiên, loại ticket và tình trạng bàn giao để hỗ trợ xử lý nhanh hơn."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setTicketFilter({ priority: 'all', category: 'all', assignee: 'all' })
                    }
                    className="rounded-2xl border-slate-200"
                  >
                    Xóa bộ lọc
                  </Button>
                }
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Mức độ ưu tiên
                    </label>
                    <select
                      value={ticketFilter.priority}
                      onChange={(event) =>
                        setTicketFilter((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="low">Ưu tiên thấp</option>
                      <option value="medium">Bình thường</option>
                      <option value="high">Ưu tiên cao</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Phân loại
                    </label>
                    <select
                      value={ticketFilter.category}
                      onChange={(event) =>
                        setTicketFilter((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="all">Tất cả loại</option>
                      <option value="bug">Lỗi kỹ thuật</option>
                      <option value="payment">Thanh toán</option>
                      <option value="account">Tài khoản</option>
                      <option value="general">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Người phụ trách
                    </label>
                    <select
                      value={ticketFilter.assignee}
                      onChange={(event) =>
                        setTicketFilter((current) => ({
                          ...current,
                          assignee: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="all">Tất cả nhân viên</option>
                      <option value="unassigned">Chưa bàn giao</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            )}

            <SectionCard
              icon={Ticket}
              title="Trung tâm điều phối ticket"
              description="Chọn ticket ở hàng đợi bên trái và xử lý toàn bộ hội thoại hỗ trợ ở cột bên phải."
              action={
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: `Tất cả (${counts.total})` },
                    { id: 'pending', label: `Đang chờ (${counts.open})` },
                    { id: 'in_progress', label: `Đang xử lý (${counts.inProgress})` },
                    { id: 'closed', label: `Đã đóng (${counts.resolved})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabFilter(tab.id)}
                      className={cn(
                        'rounded-full px-4 py-2 text-xs font-semibold transition',
                        tabFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Hàng đợi hiện tại
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {filteredTickets.length} ticket khớp bộ lọc
                        </p>
                      </div>
                      <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Trang {Math.min(page, totalPages)}/{totalPages}
                      </Badge>
                    </div>
                  </div>

                  {paginatedTickets.length ? (
                    <div className="divide-y divide-slate-200">
                      {paginatedTickets.map((ticket) => {
                        const sender =
                          [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') ||
                          ticket.email ||
                          `User #${ticket.user_id}`;
                        const categoryMeta = getCategoryMeta(ticket.category);
                        const priorityMeta = getPriorityMeta(ticket.priority);
                        const statusMeta = getStatusMeta(ticket.status);

                        return (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={cn(
                              'block w-full px-5 py-4 text-left transition',
                              selectedTicketId === ticket.id
                                ? 'bg-emerald-50/80'
                                : 'bg-white hover:bg-slate-50/70'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                                    #{String(ticket.id).padStart(4, '0')} • {ticket.subject || 'Không tiêu đề'}
                                  </p>
                                  <span
                                    className={cn(
                                      'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                      statusMeta.badge
                                    )}
                                  >
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                  {ticket.description || 'Chưa có mô tả thêm cho ticket này.'}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                      categoryMeta.className
                                    )}
                                  >
                                    {categoryMeta.label}
                                  </span>
                                  <span
                                    className={cn(
                                      'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                      priorityMeta.className
                                    )}
                                  >
                                    {priorityMeta.label}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-xs font-semibold text-slate-500">
                                  {formatTime(ticket.created_at)}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                  {ticket.admin_id ? ticket.assignee : 'Chưa bàn giao'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                              <UserIcon className="h-3.5 w-3.5" />
                              <span className="line-clamp-1">{sender}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-950">Không có ticket phù hợp</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Thử thay đổi bộ lọc hoặc tìm kiếm để xem thêm ticket trong hàng đợi.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">
                        Hiển thị {(page - 1) * limit + (paginatedTickets.length ? 1 : 0)} -{' '}
                        {(page - 1) * limit + paginatedTickets.length} trên {filteredTickets.length} ticket
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                          disabled={page <= 1}
                          className="h-9 rounded-xl border-slate-200 px-3"
                        >
                          Trước
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                          disabled={page >= totalPages}
                          className="h-9 rounded-xl border-slate-200 px-3"
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                  {selectedTicket ? (
                    <div className="flex h-full min-h-[720px] flex-col">
                      <div className="border-b border-slate-200 bg-white px-6 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-bold text-slate-950">
                                {selectedTicket.subject || `Ticket #${selectedTicket.id}`}
                              </p>
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                  getStatusMeta(selectedTicket.status).badge
                                )}
                              >
                                {getStatusMeta(selectedTicket.status).label}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                  getCategoryMeta(selectedTicket.category).className
                                )}
                              >
                                {getCategoryMeta(selectedTicket.category).label}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                                  getPriorityMeta(selectedTicket.priority).className
                                )}
                              >
                                {getPriorityMeta(selectedTicket.priority).label}
                              </span>
                            </div>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                              {selectedTicket.description || 'Người dùng chưa nhập mô tả chi tiết cho ticket này.'}
                            </p>
                          </div>

                          <Badge className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            #{String(selectedTicket.id).padStart(4, '0')}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-6 border-b border-slate-200 bg-slate-50/40 px-6 py-5 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Người gửi yêu cầu
                          </p>
                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                              <UserIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-950">
                                {[selectedTicket.first_name, selectedTicket.last_name]
                                  .filter(Boolean)
                                  .join(' ') || 'Người dùng ẩn danh'}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {selectedTicket.email || 'Chưa có email'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Người dùng
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                #{selectedTicket.user_id || 'N/A'}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Phụ trách
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                {selectedTicket.admin_id ? selectedTicket.assignee : 'Chưa bàn giao'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Cập nhật trạng thái
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {STATUS_OPTIONS.map((option) => {
                              const Icon = option.icon;
                              const isCurrent = selectedTicket.status === option.id;
                              const isSaving = savingKey === `status-${selectedTicket.id}`;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  disabled={saving || isCurrent || isSaving}
                                  onClick={() => handleStatusChange(selectedTicket.id, option.id)}
                                  className={cn(
                                    'rounded-2xl border px-4 py-3 text-left transition',
                                    isCurrent
                                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                      : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white hover:border-emerald-200',
                                    (saving || isSaving) && 'cursor-not-allowed opacity-70'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Icon className="h-4 w-4" />
                                    )}
                                    <span className="text-sm font-semibold">{option.label}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Tạo lúc
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                {new Date(selectedTicket.created_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Cập nhật gần nhất
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-950">
                                {formatTime(selectedTicket.updated_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-slate-50/30 px-6 py-6">
                        {messages.length ? (
                          <div className="space-y-6">
                            {messages.map((msg) => {
                              const isSystem = msg.is_internal;
                              const isSupport = msg.role === 'admin' || msg.admin_id;

                              return (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    'flex flex-col gap-2',
                                    isSystem
                                      ? 'items-stretch'
                                      : isSupport
                                        ? 'items-end'
                                        : 'items-start'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'max-w-[82%] rounded-2xl border px-4 py-4 text-sm leading-6 shadow-sm',
                                      isSystem
                                        ? 'max-w-full border-amber-200 bg-amber-50 text-amber-900'
                                        : isSupport
                                          ? 'rounded-tr-md border-emerald-500 bg-emerald-600 text-white'
                                          : 'rounded-tl-md border-slate-200 bg-white text-slate-700'
                                    )}
                                  >
                                    {isSystem ? (
                                      <div className="mb-2 flex items-center gap-2 border-b border-amber-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                                        <Lock className="h-3.5 w-3.5" />
                                        Ghi chú nội bộ
                                      </div>
                                    ) : null}
                                    <p className="whitespace-pre-wrap">{msg.message || msg.content || ''}</p>
                                  </div>

                                  <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
                                    <span className="font-semibold uppercase tracking-[0.12em]">
                                      {isSystem ? 'Hệ thống' : isSupport ? 'Đội hỗ trợ' : 'Khách hàng'}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span>
                                      {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                              <MessageSquare className="h-7 w-7" />
                            </div>
                            <p className="mt-4 text-lg font-semibold text-slate-950">Chưa có hội thoại</p>
                            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                              Ticket này chưa có lịch sử trao đổi. Hãy gửi phản hồi đầu tiên hoặc thêm ghi chú nội bộ để bắt đầu xử lý.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200 bg-white px-6 py-5">
                        <div className="relative">
                          <textarea
                            rows={4}
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            placeholder={
                              isInternal
                                ? 'Nhập ghi chú nội bộ. Khách hàng sẽ không nhìn thấy phần này...'
                                : 'Nhập phản hồi gửi tới khách hàng...'
                            }
                            className={cn(
                              'w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-44 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 resize-none',
                              isInternal
                                ? 'focus:border-amber-400/60 focus:ring-amber-500/10'
                                : 'focus:border-emerald-500/50 focus:ring-emerald-500/10'
                            )}
                          />

                          <div className="absolute bottom-3 right-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsInternal((current) => !current)}
                              className={cn(
                                'rounded-xl border px-3 py-2 text-xs font-semibold transition',
                                isInternal
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                              )}
                            >
                              {isInternal ? 'Đang ghi chú nội bộ' : 'Chuyển sang ghi chú nội bộ'}
                            </button>

                            <Button
                              type="button"
                              onClick={handleReply}
                              disabled={saving || !reply.trim()}
                              className={cn(
                                'h-10 rounded-xl px-4 text-white shadow-sm',
                                isInternal
                                  ? 'bg-amber-500 hover:bg-amber-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              )}
                            >
                              {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              {isInternal ? 'Lưu ghi chú' : 'Gửi phản hồi'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[720px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                        <Ticket className="h-7 w-7" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-950">Chưa có ticket để xử lý</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Khi hàng đợi có dữ liệu, bạn sẽ thấy chi tiết ticket và toàn bộ lịch sử trao đổi tại khu vực này.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSupportPage;
