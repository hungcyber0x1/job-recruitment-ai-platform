import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  LogIn,
  Bug,
  Sparkles,
  Server,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const EVENT_TYPES = [
  { id: 'all', label: 'Tất cả', icon: Activity },
  { id: 'login', label: 'Đăng nhập', icon: LogIn },
  { id: 'job_approval', label: 'Duyệt việc làm', icon: CheckCircle2 },
  { id: 'api_error', label: 'Lỗi API', icon: Bug },
  { id: 'ai_update', label: 'Cập nhật AI', icon: Sparkles },
  { id: 'system', label: 'Hệ thống', icon: Server },
];

/** Badge trên nền card sáng — dùng màu chữ đậm hơn để đồng bộ contrast với admin theme */
const EVENT_TYPE_STYLE = {
  job_approval: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25',
  ai_update: 'bg-amber-500/10 text-amber-900 border-amber-500/25',
  api_error: 'bg-red-500/10 text-red-800 border-red-500/25',
  login: 'bg-primary/10 text-emerald-800 border-primary/25',
  system: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/20',
  default: 'bg-muted text-muted-foreground border-border',
};

const mapActionToEventType = (action, details) => {
  const a = (action || '').toLowerCase();
  const d = (details || '').toLowerCase();
  if (a.includes('login') || d.includes('đăng nhập')) return 'login';
  if (
    a.includes('approval') ||
    a.includes('job') ||
    d.includes('phê duyệt') ||
    d.includes('tuyển dụng')
  )
    return 'job_approval';
  if (a.includes('error') || d.includes('timeout') || d.includes('forbidden') || d.includes('lỗi'))
    return 'api_error';
  if (a.includes('ai') || d.includes('mô hình') || d.includes('huấn luyện')) return 'ai_update';
  if (a.includes('system') || d.includes('sao lưu') || d.includes('backup')) return 'system';
  return 'default';
};

const getEventTypeLabel = (type) => {
  const t = EVENT_TYPES.find((e) => e.id === type);
  return t ? t.label.toUpperCase() : type?.toUpperCase() || 'KHÁC';
};

const getStatusIcon = (type, action) => {
  if (type === 'api_error') return <AlertTriangle size={18} className="text-red-600" />;
  if (type === 'ai_update' && (action || '').toLowerCase().includes('train'))
    return <Loader2 size={18} className="animate-spin text-amber-600" />;
  return <CheckCircle2 size={18} className="text-emerald-600" />;
};

const AdminLogsPage = () => {
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState({ startDate: '', endDate: '', adminId: '' });
  const [exporting, setExporting] = useState(false);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 500 };
      if (advancedFilter.startDate) params.start_date = advancedFilter.startDate;
      if (advancedFilter.endDate) params.end_date = advancedFilter.endDate;
      if (advancedFilter.adminId) params.admin_id = advancedFilter.adminId;
      const response = await adminService.getLogs(params);
      const rawLogs = Array.isArray(response.data?.data) ? response.data.data : [];
      setLogs(
        rawLogs.map((l) => ({
          id: l?.id ?? 0,
          action: String(l?.action ?? ''),
          target_type: String(l?.target_type ?? ''),
          details: String(l?.details ?? ''),
          admin_email: String(l?.admin_email ?? ''),
          created_at: l?.created_at ?? new Date().toISOString(),
          eventType: mapActionToEventType(l?.action, l?.details),
        }))
      );
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [advancedFilter]);

  const handleExportLogs = async () => {
    try {
      setExporting(true);
      const response = await adminService.exportLogs({
        ...advancedFilter,
        format: 'csv',
      });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất nhật ký hệ thống thành công!', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showNotification('Không thể xuất nhật ký hệ thống.', 'error');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (eventFilter !== 'all') {
      list = list.filter((l) => l.eventType === eventFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.admin_email && l.admin_email.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q))
      );
    }
    return list;
  }, [logs, eventFilter, search]);

  const paginatedLogs = useMemo(
    () => filteredLogs.slice((page - 1) * limit, page * limit),
    [filteredLogs, page, limit]
  );
  const totalPages = Math.ceil(filteredLogs.length / limit) || 1;

  return (
    <AdminLayout>
      <div className="space-y-6 text-foreground">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Nhật ký hệ thống
              </h1>
              <p className="text-base text-muted-foreground">Giám sát hoạt động thời gian thực</p>
            </div>
          </div>
          <div className="relative max-w-md flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm nhật ký..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Event type filters */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((ev) => {
            const Icon = ev.icon;
            const count =
              ev.id === 'all' ? logs.length : logs.filter((l) => l.eventType === ev.id).length;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => {
                  setEventFilter(ev.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-base font-semibold transition-all ${
                  eventFilter === ev.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {ev.label}
                {ev.id === 'all' && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-base text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold text-foreground hover:bg-muted/60"
          >
            <Filter size={18} />
            Lọc nâng cao
          </button>
          <button
            type="button"
            onClick={handleExportLogs}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold text-foreground hover:bg-muted/60 disabled:opacity-50"
          >
            <Download size={18} />
            {exporting ? 'Đang xuất...' : 'Xuất File'}
          </button>
        </div>

        {/* Advanced Filter Panel */}
        {showAdvancedFilter && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground">Lọc nâng cao</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-base font-semibold uppercase text-muted-foreground">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={advancedFilter.startDate}
                  onChange={(e) =>
                    setAdvancedFilter({ ...advancedFilter, startDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-base font-semibold uppercase text-muted-foreground">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={advancedFilter.endDate}
                  onChange={(e) =>
                    setAdvancedFilter({ ...advancedFilter, endDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-base font-semibold uppercase text-muted-foreground">
                  Admin ID
                </label>
                <input
                  type="text"
                  placeholder="Lọc theo admin ID"
                  value={advancedFilter.adminId}
                  onChange={(e) =>
                    setAdvancedFilter({ ...advancedFilter, adminId: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdvancedFilter({ startDate: '', endDate: '', adminId: '' })}
                className="rounded-xl border border-border bg-card px-4 py-2 text-base font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                Xóa lọc
              </button>
              <button
                type="button"
                onClick={() => {
                  fetchLogs();
                  setShowAdvancedFilter(false);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}

        {/* Table — cùng token card/muted/border với AdminLayout & shadcn */}
        <div className="data-table-shell">
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dấu thời gian</th>
                  <th>Loại sự kiện</th>
                  <th>Mô tả chi tiết</th>
                  <th>Người thực hiện</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr className="bg-muted/20">
                    <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" aria-hidden />
                      <p className="text-base font-medium text-foreground/80">
                        Chưa có nhật ký phù hợp
                      </p>
                      <p className="mt-1 text-base text-muted-foreground">
                        Thử đổi bộ lọc hoặc khoảng thời gian.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const style = EVENT_TYPE_STYLE[log.eventType] || EVENT_TYPE_STYLE.default;
                    return (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-base font-medium text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-base font-semibold ${style}`}
                          >
                            {getEventTypeLabel(log.eventType)}
                          </span>
                        </td>
                        <td className="max-w-md truncate px-5 py-4 text-base text-muted-foreground">
                          {log.details || log.action || '—'}
                        </td>
                        <td className="px-5 py-4 text-base font-medium text-foreground">
                          {log.admin_email || 'System'}
                        </td>
                        <td className="px-5 py-4">{getStatusIcon(log.eventType, log.action)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredLogs.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/25 px-5 py-4 sm:flex-row">
              <p className="text-base text-muted-foreground">
                Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, filteredLogs.length)} của{' '}
                {filteredLogs.length} kết quả nhật ký
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-9 min-w-[36px] rounded-lg text-base font-semibold ${
                      page === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogsPage;
