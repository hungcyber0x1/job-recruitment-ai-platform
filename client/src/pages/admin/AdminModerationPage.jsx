import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Briefcase,
  Check,
  Eye,
  FileText,
  Flag,
  MoreVertical,
  RefreshCw,
  Loader2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/ui/badge';
import PremiumStatCard from '../../components/common/PremiumStatCard';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';
import Modal from '../../components/common/Modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'jobs', label: 'Tin tuyển dụng' },
  { id: 'companies', label: 'Doanh nghiệp' },
  { id: 'blogs', label: 'Bài viết' },
  { id: 'applications', label: 'Hồ sơ' },
];

const AdminModerationPage = () => {
  const { showNotification } = useNotification();
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState({ jobs: [], companies: [], blogs: [], applications: [] });
  const [stats, setStats] = useState({
    pendingJobs: 0,
    flaggedJobs: 0,
    pendingCompanyApprovals: 0,
    pendingBlogs: 0,
  });
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    type: 'job',
    id: null,
    reason: '',
  });
  const [processing, setProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes, companiesRes, blogsRes, applicationsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getJobs({ limit: 50, status: 'pending_review' }),
        adminService.getCompanies({ limit: 50, moderation_status: 'pending' }),
        adminService.getBlogPosts({ limit: 50, status: 'pending' }),
        adminService.getApplications({ limit: 50, status: 'pending' }),
      ]);

      if (statsRes.data?.success) {
        const rawStats = statsRes.data.data || {};
        setStats({
          pendingJobs: Number(rawStats.moderation?.pendingJobs) || 0,
          flaggedJobs: Number(rawStats.moderation?.flaggedJobs) || 0,
          pendingCompanyApprovals:
            Number(
              rawStats.moderation?.pendingCompanyApprovals ??
                rawStats.moderation?.unverifiedCompanies
            ) || 0,
          pendingBlogs: Number(rawStats.moderation?.pendingBlogs) || 0,
        });
      }

      const sanitizeArray = (arr) =>
        Array.isArray(arr)
          ? arr.map((item) => ({
              id: item?.id ?? 0,
              title: String(item?.title ?? item?.name ?? 'Chưa đặt tên'),
              subtitle: String(item?.company_name ?? item?.email ?? 'Thông tin bổ sung'),
              status: String(item?.status ?? ''),
              created_at: item?.created_at ?? new Date().toISOString(),
            }))
          : [];

      setQueue({
        jobs: sanitizeArray(jobsRes.data?.data),
        companies: sanitizeArray(companiesRes.data?.data),
        blogs: sanitizeArray(blogsRes.data?.data),
        applications: sanitizeArray(applicationsRes.data?.data),
      });
    } catch (_error) {
      console.warn('AdminModerationPage fetch error:', _error?.message);
      showNotification('Lỗi khi tải dữ liệu kiểm duyệt.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = useCallback(
    async (type, id) => {
      const key = `${type}-${id}`;
      try {
        setProcessingId(key);
        if (type === 'job') {
          await adminService.updateJobStatus(id, 'published');
        } else {
          await adminService.updateBlogPostStatus(id, 'published');
        }
        showNotification('Đã duyệt thành công.', 'success');
        fetchData();
      } catch {
        showNotification('Lỗi khi duyệt.', 'error');
      } finally {
        setProcessingId(null);
      }
    },
    [fetchData, showNotification]
  );

  const handleOpenReject = useCallback((type, id) => {
    setRejectionModal({ isOpen: true, type, id, reason: '' });
  }, []);

  const handleConfirmRejection = async () => {
    if (!rejectionModal.reason.trim()) {
      showNotification('Vui lòng nhập lý do từ chối.', 'warning');
      return;
    }

    const key = `${rejectionModal.type}-${rejectionModal.id}`;
    try {
      setProcessingId(key);
      setProcessing(true);
      if (rejectionModal.type === 'job') {
        await adminService.updateJobStatus(rejectionModal.id, 'rejected', rejectionModal.reason);
      } else {
        await adminService.updateBlogPostStatus(
          rejectionModal.id,
          'rejected',
          rejectionModal.reason
        );
      }
      showNotification('Đã từ chối.', 'success');
      setRejectionModal({ isOpen: false, type: 'job', id: null, reason: '' });
      fetchData();
    } catch {
      showNotification('Lỗi khi từ chối.', 'error');
    } finally {
      setProcessingId(null);
      setProcessing(false);
    }
  };

  const handleCompanyVerify = useCallback(
    async (id, verify) => {
      try {
        setProcessingId(`company-${id}`);
        await adminService.verifyCompany(id, verify);
        showNotification(verify ? 'Đã xác minh doanh nghiệp.' : 'Đã hủy xác minh.', 'success');
        fetchData();
      } catch (error) {
        showNotification(error.response?.data?.message || 'Lỗi khi xử lý doanh nghiệp.', 'error');
      } finally {
        setProcessingId(null);
      }
    },
    [fetchData, showNotification]
  );

  const buildItems = useCallback(() => {
    const jobItems = queue.jobs.map((item) => ({
      ...item,
      type: 'jobs',
      badge: 'Chờ duyệt',
      icon: Briefcase,
      color: 'amber',
      actionUrl: `/admin/jobs/${item.id}`,
    }));

    const companyItems = queue.companies.map((item) => ({
      ...item,
      type: 'companies',
      badge: 'Chưa xác minh',
      icon: Building2,
      color: 'blue',
      actionUrl: `/admin/companies/${item.id}`,
    }));

    const blogItems = queue.blogs.map((item) => ({
      ...item,
      type: 'blogs',
      badge: 'Bài viết mới',
      icon: FileText,
      color: 'slate',
      actionUrl: `/admin/blog`,
    }));

    const applicationItems = queue.applications.map((item) => ({
      ...item,
      type: 'applications',
      badge: 'Sàng lọc AI',
      icon: FileText,
      color: 'emerald',
      actionUrl: `/admin/applications/${item.id}`,
    }));

    const merged = [...jobItems, ...companyItems, ...blogItems, ...applicationItems].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return activeFilter === 'all' ? merged : merged.filter((i) => i.type === activeFilter);
  }, [activeFilter, queue]);

  const items = buildItems();

  const getActionMenu = (item) => {
    const isProcessing = processingId === `${item.type}-${item.id}`;

    if (item.type === 'jobs' || item.type === 'blogs') {
      return (
        <div className="flex items-center gap-2">
          <Link to={item.actionUrl}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
            >
              <Eye size={14} />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <MoreVertical size={14} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 p-1 shadow-xl border-slate-200/60 rounded-xl"
            >
              <DropdownMenuItem
                className="rounded-lg cursor-pointer font-bold text-emerald-600 hover:bg-emerald-50"
                onClick={() => handleApprove(item.type, item.id)}
              >
                <Check size={14} className="mr-2" />
                Duyệt
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg cursor-pointer font-bold text-red-500 hover:bg-red-50"
                onClick={() => handleOpenReject(item.type, item.id)}
              >
                <X size={14} className="mr-2" />
                Từ chối
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (item.type === 'companies') {
      return (
        <div className="flex items-center gap-2">
          <Link to={item.actionUrl}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
            >
              <Eye size={14} />
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => handleCompanyVerify(item.id, true)}
            disabled={processingId === `company-${item.id}`}
            className="h-8 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
          >
            Xác minh
          </Button>
        </div>
      );
    }

    // Applications - just view
    return (
      <Link to={item.actionUrl}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
        >
          <Eye size={14} />
        </Button>
      </Link>
    );
  };

  if (loading && queue.jobs.length === 0) {
    return (
      <div className="p-32 text-center space-y-6">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-emerald-600" />
        <p className="text-xs font-bold uppercase tracking-normal text-slate-400">
          Đang đồng bộ dữ liệu...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Hàng đợi Kiểm duyệt</h1>
          <p className="text-sm text-slate-500">
            Xử lý nhanh các yêu cầu từ tin tuyển dụng, doanh nghiệp và hồ sơ.
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          className="h-12 rounded-xl"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          <span className="ml-2">Làm mới</span>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-normal text-slate-400">Internal queue</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Man nay la hang doi thao tac nhanh. Nguon quan ly chinh van nam o Jobs, Companies va Blog.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/admin/jobs?status=pending_review"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Jobs cho duyet
          </Link>
          <Link
            to="/admin/companies?status=pending"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Companies chờ xác minh
          </Link>
          <Link
            to="/admin/blog"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Blog cho duyet
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumStatCard
          title="Tin chờ duyệt"
          value={stats.pendingJobs}
          icon={Briefcase}
          variant="amber"
        />
        <PremiumStatCard
          title="Tin bị gắn cờ"
          value={stats.flaggedJobs}
          icon={Flag}
          variant="red"
        />
        <PremiumStatCard
          title="Công ty chờ duyệt"
          value={stats.pendingCompanyApprovals}
          icon={Building2}
          variant="blue"
        />
        <PremiumStatCard
          title="Bài viết mới"
          value={stats.pendingBlogs}
          icon={FileText}
          variant="slate"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold transition-all',
              activeFilter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-normal text-slate-400">
                  Nội dung
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-normal text-slate-400">
                  Loại
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-normal text-slate-400">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-normal text-slate-400">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <ShieldAlert size={32} className="mx-auto mb-3 text-slate-200" />
                    <p className="font-bold text-slate-400">Không có mục nào cần kiểm duyệt</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 line-clamp-1">{item.title}</span>
                        <span className="text-sm text-slate-400 line-clamp-1">{item.subtitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={item.color}
                        className="text-xs font-bold uppercase tracking-normal"
                      >
                        {item.badge}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{getActionMenu(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal((prev) => ({ ...prev, isOpen: false }))}
        title={rejectionModal.type === 'job' ? 'Từ chối tin tuyển dụng' : 'Từ chối bài viết'}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setRejectionModal((prev) => ({ ...prev, isOpen: false }))}
              className="flex-1 rounded-xl h-11 font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmRejection}
              disabled={processing}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20"
            >
              {processing ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận từ chối'}
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-normal">
            Lý do từ chối
          </p>
          <textarea
            className="w-full min-h-[100px] rounded-xl border-2 border-slate-100 bg-slate-50 p-4 text-slate-900 focus:border-red-500/30 focus:outline-none focus:ring-4 focus:ring-red-500/5 text-sm"
            placeholder={`Nhập lý do ${rejectionModal.type === 'job' ? 'tin' : 'bài'} không đạt yêu cầu...`}
            value={rejectionModal.reason}
            onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminModerationPage;
