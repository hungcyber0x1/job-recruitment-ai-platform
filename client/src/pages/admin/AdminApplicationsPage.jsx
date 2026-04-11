import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Hourglass,
  MoreVertical,
  Download,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';

const STATUS_LABELS = {
  pending: 'Đang chờ',
  screening: 'Đang sàng lọc',
  reviewed: 'Đã xem xét',
  shortlisted: 'Shortlist',
  interviewing: 'Phỏng vấn',
  offered: 'Đã offer',
  hired: 'Đã tuyển',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút',
};

const STATUS_STYLE = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  screening: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  reviewed: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
  shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  interviewing: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  offered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  withdrawn: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
};

const AdminApplicationsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      };
      const response = await adminService.getApplications(params);
      const rawData = response.data;
      if (rawData?.success) {
        const appsData = Array.isArray(rawData?.data) ? rawData.data : [];
        const sanitized = appsData.map((a) => ({
          id: a?.id ?? 0,
          candidate_name: String(a?.candidate_name ?? ''),
          candidate_email: String(a?.candidate_email ?? ''),
          job_title: String(a?.job_title ?? ''),
          company_name: String(a?.company_name ?? ''),
          status: String(a?.status ?? ''),
          user_id: a?.user_id ?? null,
          job_id: a?.job_id ?? null,
          employer_id: a?.employer_id ?? null,
          ai_match_score: typeof a?.ai_match_score === 'number' ? a.ai_match_score : null,
          match_score: typeof a?.match_score === 'number' ? a.match_score : null,
          applied_at: a?.applied_at ?? a?.created_at ?? new Date().toISOString(),
        }));
        setApplications(sanitized);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (page > 1) nextParams.set('page', String(page));
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, statusFilter, page, searchParams, setSearchParams]);
  const handleExportApplications = async () => {
    try {
      setExporting(true);
      const params = {
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const response = await adminService.exportApplications(params);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất danh sách ứng tuyển thành công!', 'success');
    } catch (error) {
      console.error('Error exporting applications:', error);
      showNotification('Không thể xuất danh sách ứng tuyển.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalCount = applications.length;
  const displayedApplications = applications.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const interviewCount = applications.filter((a) =>
    ['shortlisted', 'interviewing', 'offered'].includes(a.status)
  ).length;
  const hiredCount = applications.filter((a) => a.status === 'hired').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const trafficTotal = totalCount || 0;
  const trafficChange = '0%';

  const kpiCards = [
    { label: 'ĐANG CHỜ', value: pendingCount || 0, icon: Hourglass },
    { label: 'PHỎNG VẤN', value: interviewCount || 0, icon: Calendar },
    { label: 'ĐÃ TUYỂN', value: hiredCount || 0, icon: CheckCircle },
    { label: 'TỪ CHỐI', value: rejectedCount || 0, icon: XCircle },
  ];

  const filterTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'screening', label: 'Sàng lọc' },
    { id: 'interviewing', label: 'Phỏng vấn' },
    { id: 'hired', label: 'Đã tuyển' },
    { id: 'rejected', label: 'Từ chối' },
  ];

  const getAiScore = (app) => {
    if (app.ai_match_score != null) return Math.round(Number(app.ai_match_score) * 100);
    if (app.match_score != null) return Math.round(Number(app.match_score) * 100);
    return 0;
  };

  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const trafficData = weekDays.map(() => 0);

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Ứng tuyển</h1>
          <p className="mt-1 text-base text-slate-500">
            Theo dõi đơn ứng tuyển và pipeline tuyển dụng
          </p>
        </div>

        {/* Card lưu lượng 7 ngày + 4 KPI */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-500 uppercase tracking-wide">
                  Lưu lượng ứng tuyển (7 ngày qua)
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {trafficTotal.toLocaleString('vi-VN')}
                  <span className="ml-2 text-base font-semibold text-emerald-400">
                    {trafficChange}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportApplications}
                disabled={exporting}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-base font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Download size={16} />
                {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
              </button>
            </div>
            <div className="mt-6 h-32 flex items-end gap-2">
              {trafficData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/60 hover:bg-emerald-500/80 transition-colors min-h-[4px]"
                    style={{ height: `${(val / 200) * 100}%` }}
                  />
                  <span className="text-base font-medium text-slate-500">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col items-center justify-center text-center"
                >
                  <Icon className="text-slate-500 mb-2" size={24} />
                  <p className="text-base font-bold text-slate-500 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thanh lọc + tìm kiếm (debounce → API) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'border border-border text-muted-foreground transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Tìm ứng viên, việc làm hoặc công ty…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full min-w-[220px] max-w-md rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:w-auto"
          />
        </div>

        {/* Bảng ứng viên */}
        <div className="data-table-shell">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            </div>
          ) : (
            <>
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Ứng viên</th>
                      <th className="px-6 py-4">Vị trí</th>
                      <th className="px-6 py-4">AI Match Score</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 !text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedApplications.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                          <FileText className="mx-auto mb-2 text-slate-500" size={40} />
                          Không tìm thấy đơn ứng tuyển
                        </td>
                      </tr>
                    ) : (
                      displayedApplications.map((app) => {
                        const score = getAiScore(app);
                        const barColor =
                          score >= 70
                            ? 'bg-emerald-500'
                            : score >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-500';
                        const statusStyle = STATUS_STYLE[app.status] || STATUS_STYLE.pending;
                        return (
                          <tr key={app.id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                                  {(app.candidate_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <Link
                                    to={
                                      app.user_id ? `/admin/users/${app.user_id}` : '/admin/users'
                                    }
                                    className="font-semibold text-slate-900 hover:text-emerald-400"
                                  >
                                    {app.candidate_name || 'Ứng viên'}
                                  </Link>
                                  <p className="text-base text-slate-500 mt-0.5">
                                    {app.candidate_email || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={app.job_id ? `/admin/jobs/${app.job_id}` : '/admin/jobs'}
                                className="font-medium text-slate-900 hover:text-emerald-400"
                              >
                                {app.job_title || '—'}
                              </Link>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className="text-base font-semibold text-slate-900">
                                  {score}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-base font-semibold ${statusStyle}`}
                              >
                                {STATUS_LABELS[app.status] || app.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Link
                                to={`/admin/applications/${app.id}`}
                                className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-muted/55 hover:text-foreground"
                                aria-label="Chi tiết đơn"
                              >
                                <MoreVertical size={18} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border bg-muted/25 px-6 py-4">
                  <p className="text-base text-slate-500 uppercase tracking-wide">
                    Hiển thị {(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} trên{' '}
                    {totalCount.toLocaleString('vi-VN')} ứng viên
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[36px] h-9 rounded-lg text-base font-semibold ${
                          page === p
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground'
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
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminApplicationsPage;
