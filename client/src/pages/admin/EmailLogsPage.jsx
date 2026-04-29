import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import { Button } from '../../components/ui/button';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../../components/common/Modal';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const EmailLogsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, pages: 1 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [recipientFilter, setRecipientFilter] = useState(searchParams.get('recipient') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        recipient: recipientFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 15,
      };
      
      const response = await adminService.getEmailLogs(params);
      if (response.data.success) {
        setLogs(response.data.data || []);
        if (response.data.pagination) {
          setPaginationMeta({
            total: Number(response.data.pagination.total) || 0,
            pages: Number(response.data.pagination.pages) || 1
          });
        }
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      showNotification('Không thể tải lịch sử email.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, recipientFilter, statusFilter, showNotification]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (recipientFilter) nextParams.set('recipient', recipientFilter);
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (page > 1) nextParams.set('page', String(page));
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [page, recipientFilter, searchParams, setSearchParams, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const openDetails = (log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const columns = [
    {
      header: 'Trạng thái',
      width: '140px',
      render: (log) => (
        log.status === 'sent' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-normal">
            <CheckCircle className="w-3 h-3" strokeWidth={2.5} />Thành công
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-normal">
            <AlertCircle className="w-3 h-3" strokeWidth={2.5} />Thất bại
          </span>
        )
      ),
    },
    {
      header: 'Người nhận',
      render: (log) => (
        <span className="text-sm font-bold text-slate-700">{log.recipient}</span>
      ),
    },
    {
      header: 'Tiêu đề',
      render: (log) => (
        <span className="text-sm font-medium text-slate-600 truncate max-w-[350px] block">{log.subject}</span>
      ),
    },
    {
      header: 'Ngày gửi',
      width: '180px',
      render: (log) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 italic">
          <Clock className="w-3.5 h-3.5" />
          {new Date(log.sent_at).toLocaleString('vi-VN')}
        </div>
      ),
    },
    {
      header: 'Thao tác',
      width: '80px',
      align: 'right',
      render: (log) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openDetails(log)}
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Lịch sử Email Hệ thống"
        description="Theo dõi và quản lý tất cả thông báo email đã gửi đi."
        actions={
          <Button variant="outline" onClick={fetchLogs} disabled={loading} className="h-12 rounded-xl px-4 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Làm mới
          </Button>
        }
      />

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email người nhận..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="sent">Thành công</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>

          <Button type="submit" className="h-12 px-8 rounded-xl bg-slate-900 text-white font-bold uppercase tracking-normal hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all">
            Lọc kết quả
          </Button>
        </form>
      </div>

      <AdminTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{
          currentPage: page,
          totalPages: paginationMeta.pages,
          totalItems: paginationMeta.total,
          onPageChange: setPage,
        }}
        emptyTitle="Không tìm thấy lịch sử email"
        emptyDescription="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
      />

      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Chi tiết Email"
        maxWidth="max-w-4xl"
      >
        {selectedLog && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-normal block mb-1.5">Người nhận</span>
                <p className="text-slate-900 font-bold">{selectedLog.recipient}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-normal block mb-1.5">Tiêu đề</span>
                <p className="text-slate-900 font-bold">{selectedLog.subject}</p>
              </div>
            </div>

            {selectedLog.status === 'failed' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-red-700 uppercase tracking-normal">Lỗi gửi email:</span>
                    <p className="text-sm font-semibold text-red-600 mt-1 italic">{selectedLog.error_message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-normal block">Nội dung (Preview)</span>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                <div className="bg-slate-900 p-2.5 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-normal">email-render-view.html</span>
                  <div className="w-12"></div>
                </div>
                <div
                  className="p-8 bg-white overflow-y-auto max-h-[450px]"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLog.body_html) }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmailLogsPage;
