import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Download, MoreVertical, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved'];
const TAB_MAP = { all: 'all', pending: 'open', in_progress: 'in_progress', closed: 'resolved' };

const getStatusLabel = (status) => {
  switch (status) {
    case 'open':
      return 'Đang chờ';
    case 'in_progress':
      return 'Đang xử lý';
    case 'resolved':
      return 'Đã đóng';
    default:
      return status || 'Không rõ';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    default:
      return priority || 'Bình thường';
  }
};

const CATEGORY_STYLE = {
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  payment: 'bg-primary/20 text-primary border-primary/30',
  account: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  general: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
};

const PRIORITY_STYLE = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
};

const ASSIGNEE_MOCK = ['Lê Tuấn', 'Trần Anh', 'Minh Châu'];

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Ngày hôm qua';
  return d.toLocaleDateString('vi-VN');
};

const AdminSupportPage = () => {
  const { showNotification } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [tabFilter, setTabFilter] = useState('all');
  const [searchTicket, setSearchTicket] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ticketFilter, setTicketFilter] = useState({
    priority: 'all',
    category: 'all',
    assignee: 'all',
  });
  const limit = 10;

  const statusFilter = TAB_MAP[tabFilter] || undefined;

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getTickets({
        limit: 500,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      const rawTickets = Array.isArray(response.data?.data) ? response.data.data : [];
      const nextTickets = rawTickets.map((t, i) => ({
        id: t?.id ?? 0,
        subject: String(t?.subject ?? ''),
        description: String(t?.description ?? ''),
        status: String(t?.status ?? 'open'),
        priority: String(t?.priority ?? 'medium'),
        category: t?.category || (t?.subject?.toLowerCase().includes('lỗi') ? 'bug' : 'general'),
        user_id: t?.user_id ?? null,
        admin_id: t?.admin_id ?? null,
        assignee: t?.assignee_name ?? ASSIGNEE_MOCK[i % ASSIGNEE_MOCK.length],
        first_name: t?.first_name,
        last_name: t?.last_name,
        email: t?.email,
        created_at: t?.created_at ?? new Date().toISOString(),
        updated_at: t?.updated_at ?? new Date().toISOString(),
      }));
      setTickets(nextTickets);
      setSelectedTicket((current) => {
        if (!nextTickets.length) return null;
        if (!current) return nextTickets[0];
        return nextTickets.find((t) => t.id === current.id) || nextTickets[0];
      });
    } catch (error) {
      console.error('Error loading tickets:', error);
      showNotification('Không thể tải danh sách ticket.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showNotification]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return;
    }
    adminService
      .getTicketMessages(selectedTicket.id)
      .then((res) => setMessages(res.data?.data || []))
      .catch(() => setMessages([]));
  }, [selectedTicket?.id]);

  const counts = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const total = tickets.length;
    return {
      total,
      pending: open,
      inProgress,
      resolved,
      resolvedPct: total ? ((resolved / total) * 100).toFixed(1) : '0',
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (searchTicket.trim()) {
      const q = searchTicket.toLowerCase();
      list = list.filter(
        (t) =>
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.email && t.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tickets, searchTicket]);

  const paginatedTickets = useMemo(
    () => filteredTickets.slice((page - 1) * limit, page * limit),
    [filteredTickets, page, limit]
  );
  const totalPages = Math.ceil(filteredTickets.length / limit) || 1;

  const handleStatusChange = async (ticketId, status) => {
    try {
      setSaving(true);
      await adminService.updateTicketStatus(ticketId, status);
      await fetchTickets();
      showNotification('Đã cập nhật trạng thái ticket.', 'success');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showNotification('Không thể cập nhật trạng thái ticket.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket?.id || !reply.trim()) {
      showNotification('Vui lòng nhập nội dung phản hồi.', 'error');
      return;
    }
    try {
      setSaving(true);
      await adminService.replyToTicket(selectedTicket.id, { message: reply.trim(), isInternal });
      await fetchTickets();
      const res = await adminService.getTicketMessages(selectedTicket.id);
      setMessages(res.data?.data || []);
      setReply('');
      setIsInternal(false);
      showNotification(
        isInternal ? 'Đã lưu ghi chú nội bộ.' : 'Đã gửi phản hồi ticket.',
        'success'
      );
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
        format: 'csv',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất báo cáo thành công!', 'success');
    } catch (error) {
      console.error('Error exporting tickets:', error);
      showNotification('Không thể xuất báo cáo.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'bug') return 'BUG / KỸ THUẬT';
    if (cat === 'payment') return 'THANH TOÁN';
    if (cat === 'account') return 'TÀI KHOẢN';
    return 'KHÁC';
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Breadcrumb */}
        <nav className="text-base text-slate-500">
          <Link to="/admin/dashboard" className="hover:text-foreground">
            Trang chủ
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-900">Quản lý Ticket</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Hệ thống hỗ trợ</h1>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm ticket..."
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55"
            >
              <Filter size={18} />
              Lọc
            </button>
            <button
              type="button"
              onClick={handleExportTickets}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55 disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lọc ticket nâng cao</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={ticketFilter.priority}
                  onChange={(e) => setTicketFilter({ ...ticketFilter, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900"
                >
                  <option value="all">Tất cả</option>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                  Phân loại
                </label>
                <select
                  value={ticketFilter.category}
                  onChange={(e) => setTicketFilter({ ...ticketFilter, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900"
                >
                  <option value="all">Tất cả</option>
                  <option value="bug">BUG</option>
                  <option value="payment">Thanh toán</option>
                  <option value="account">Tài khoản</option>
                  <option value="general">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                  Người phụ trách
                </label>
                <select
                  value={ticketFilter.assignee}
                  onChange={(e) => setTicketFilter({ ...ticketFilter, assignee: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900"
                >
                  <option value="all">Tất cả</option>
                  <option value="unassigned">Chưa phân công</option>
                  <option value="Lê Tuấn">Lê Tuấn</option>
                  <option value="Trần Anh">Trần Anh</option>
                  <option value="Minh Châu">Minh Châu</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setTicketFilter({ priority: 'all', category: 'all', assignee: 'all' })
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-500 hover:text-foreground"
              >
                Xóa lọc
              </button>
              <button
                type="button"
                onClick={() => {
                  fetchTickets();
                  setShowFilterPanel(false);
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-base font-semibold text-white hover:bg-emerald-600"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}

        {/* 4 KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-bold uppercase tracking-wider text-slate-500">
              Tổng ticket
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {counts.total.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-bold uppercase tracking-wider text-slate-500">Đang chờ</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{counts.pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-bold uppercase tracking-wider text-slate-500">
              Thời gian phản hồi
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">1.2h</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-base font-bold uppercase tracking-wider text-slate-500">
              Đã giải quyết
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{counts.resolvedPct}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: `Đang chờ (${counts.pending})` },
            { id: 'in_progress', label: 'Đang xử lý' },
            { id: 'closed', label: 'Đã đóng' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTabFilter(tab.id);
                setPage(1);
              }}
              className={`px-4 py-3 text-base font-semibold border-b-2 transition-all ${
                tabFilter === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="data-table-shell">
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-5 py-4">ID / Tiêu đề</th>
                  <th className="px-5 py-4">Phân loại</th>
                  <th className="px-5 py-4">Mức độ</th>
                  <th className="px-5 py-4">Phụ trách</th>
                  <th className="px-5 py-4">Thời gian</th>
                  <th className="px-5 py-4 !text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                    </td>
                  </tr>
                ) : paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Chưa có ticket nào.
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => {
                    const sender =
                      [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') ||
                      ticket.email ||
                      `User #${ticket.user_id}`;
                    const categoryStyle = CATEGORY_STYLE[ticket.category] || CATEGORY_STYLE.general;
                    const priorityStyle = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.medium;
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`cursor-pointer ${isSelected ? 'bg-emerald-500/10' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              #TK-{String(ticket.id).slice(-4)} -{' '}
                              {ticket.subject || 'Không tiêu đề'}
                            </p>
                            <p className="text-base text-slate-500">Người gửi: {sender}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-base font-semibold ${categoryStyle}`}
                          >
                            {getCategoryLabel(ticket.category)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-base font-semibold ${priorityStyle}`}
                          >
                            {getPriorityLabel(ticket.priority)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-base font-bold text-slate-600">
                              {(ticket.assignee || '?').charAt(0)}
                            </div>
                            <span className="text-base text-slate-900">
                              {ticket.admin_id ? ticket.assignee : 'Chưa bàn giao'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-base text-slate-500">
                          {formatTime(ticket.created_at)}
                          <br />
                          <span className="text-base text-slate-500">
                            {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-2 rounded-lg text-slate-500 hover:bg-muted/55 hover:text-foreground"
                          >
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border bg-muted/25 px-5 py-4">
              <p className="text-base text-slate-500">
                Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, filteredTickets.length)}{' '}
                trong số {filteredTickets.length} tickets
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 disabled:opacity-40"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-base font-semibold ${
                        page === p
                          ? 'bg-emerald-500 text-white'
                          : 'border border-border text-muted-foreground hover:bg-muted/55 hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel: keep existing list + conversation */}
        {selectedTicket && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <h2 className="text-base font-bold text-slate-900">Chi tiết ticket</h2>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-base text-slate-500">Trạng thái</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={saving || selectedTicket.status === status}
                        onClick={() => handleStatusChange(selectedTicket.id, status)}
                        className={`rounded-lg px-3 py-1.5 text-base font-semibold ${
                          selectedTicket.status === status
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-200 text-slate-500 hover:text-foreground'
                        }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 text-base text-slate-600">
                  <p className="font-semibold text-slate-900">Người gửi</p>
                  <p>
                    {[selectedTicket.first_name, selectedTicket.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                      selectedTicket.email ||
                      '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 text-base text-slate-600">
                  <p className="font-semibold text-slate-900">Mốc thời gian</p>
                  <p>Tạo: {new Date(selectedTicket.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedTicket.subject || `#${selectedTicket.id}`}
                </h2>
                <p className="text-base text-slate-500 mt-1">
                  {selectedTicket.description || 'Không có mô tả.'}
                </p>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-base text-slate-500">Chưa có hội thoại.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl border px-4 py-3 ${
                        msg.is_internal
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-slate-900">
                          {[msg.first_name, msg.last_name].filter(Boolean).join(' ') ||
                            msg.role ||
                            'Hỗ trợ'}
                        </span>
                        <span className="text-base text-slate-500">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      {msg.is_internal && (
                        <span className="inline-block mt-1 rounded bg-amber-500/20 px-2 py-0.5 text-base font-semibold text-amber-400">
                          Ghi chú nội bộ
                        </span>
                      )}
                      <p className="mt-2 text-base text-slate-600">
                        {msg.message || msg.content || ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 p-5">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
                <label className="mt-3 flex items-center gap-2 text-base text-slate-500">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-slate-200 text-emerald-500"
                  />
                  Ghi chú nội bộ
                </label>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={saving || !reply.trim()}
                    onClick={handleReply}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Send size={16} />
                    Gửi phản hồi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupportPage;
