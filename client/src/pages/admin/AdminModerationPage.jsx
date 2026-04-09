import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import applicationService from '../../services/applicationService';
import { useNotification } from '../../context/NotificationContext';

const FILTERS = ['all', 'jobs', 'companies', 'applications'];

const AdminModerationPage = () => {
  const { showNotification } = useNotification();
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState('');
  const [queue, setQueue] = useState({ jobs: [], companies: [], applications: [] });
  const [stats, setStats] = useState({ moderation: {}, pipeline: {} });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, jobsRes, companiesRes, applicationsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getJobs({ limit: 8, status: 'pending' }),
        adminService.getCompanies({ limit: 8, is_verified: false }),
        adminService.getApplications({ limit: 8, status: 'screening' }),
      ]);

      if (statsRes.data?.success) {
        const rawStats = statsRes.data.data || {};
        setStats({
          moderation: {
            pendingJobs: Number(rawStats.moderation?.pendingJobs) || 0,
            flaggedJobs: Number(rawStats.moderation?.flaggedJobs) || 0,
          },
          pipeline: rawStats.pipeline || {},
        });
      }

      const sanitizeArray = (arr) =>
        Array.isArray(arr)
          ? arr.map((item) => ({
              id: item?.id ?? 0,
              title: String(item?.title ?? item?.name ?? ''),
              status: String(item?.status ?? ''),
              flagged: Boolean(item?.flagged ?? false),
              created_at: item?.created_at ?? new Date().toISOString(),
            }))
          : [];

      setQueue({
        jobs: sanitizeArray(jobsRes.data?.data),
        companies: sanitizeArray(companiesRes.data?.data),
        applications: sanitizeArray(applicationsRes.data?.data),
      });
    } catch (error) {
      console.error('Error loading moderation queue:', error);
      showNotification('Không thể tải danh sách chờ kiểm duyệt.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJobStatus = useCallback(
    async (jobId, status) => {
      const key = `job-${jobId}-${status}`;
      try {
        setActionKey(key);
        await adminService.updateJobStatus(jobId, status);
        showNotification(
          status === 'published' ? 'Đã phê duyệt job thành công.' : 'Đã từ chối job.',
          'success'
        );
        await fetchData();
      } catch (error) {
        console.error('Error updating job moderation:', error);
        showNotification('Không thể cập nhật trạng thái job.', 'error');
      } finally {
        setActionKey('');
      }
    },
    [fetchData, showNotification]
  );

  const handleCompanyVerification = useCallback(
    async (companyId, isVerified) => {
      const key = `company-${companyId}-${isVerified}`;
      try {
        setActionKey(key);
        await adminService.verifyCompany(companyId, isVerified);
        showNotification(
          isVerified ? 'Đã xác minh công ty.' : 'Đã hủy xác minh công ty.',
          'success'
        );
        await fetchData();
      } catch (error) {
        console.error('Error updating company verification:', error);
        showNotification('Không thể cập nhật trạng thái công ty.', 'error');
      } finally {
        setActionKey('');
      }
    },
    [fetchData, showNotification]
  );

  const handleApplicationStatus = useCallback(
    async (applicationId, status) => {
      const key = `application-${applicationId}-${status}`;
      try {
        setActionKey(key);
        await applicationService.updateStatus(applicationId, status);
        showNotification(
          status === 'reviewed' ? 'Đã chuyển hồ sơ sang đã xem.' : 'Đã từ chối hồ sơ.',
          'success'
        );
        await fetchData();
      } catch (error) {
        console.error('Error updating application moderation:', error);
        showNotification('Không thể cập nhật trạng thái hồ sơ.', 'error');
      } finally {
        setActionKey('');
      }
    },
    [fetchData, showNotification]
  );

  const items = useMemo(() => {
    const jobItems = queue.jobs.map((item) => ({
      id: `job-${item.id}`,
      entityId: item.id,
      type: 'jobs',
      title: item.title || 'Công việc chưa đặt tên',
      subtitle: item.company_name || 'Công ty chưa rõ',
      reason: item.flag_reason || 'Đang chờ kiểm duyệt nội dung.',
      action: `/admin/jobs/${item.id}`,
      badge: 'Job chờ duyệt',
      icon: Briefcase,
      cta: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionKey === `job-${item.id}-published`}
            onClick={() => handleJobStatus(item.id, 'published')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60 active:scale-95"
          >
            <CheckCircle2 size={16} /> Phê duyệt
          </button>
          <button
            type="button"
            disabled={actionKey === `job-${item.id}-rejected`}
            onClick={() => handleJobStatus(item.id, 'rejected')}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60 active:scale-95"
          >
            <XCircle size={16} /> Từ chối
          </button>
        </div>
      ),
    }));

    const companyItems = queue.companies.map((item) => ({
      id: `company-${item.id}`,
      entityId: item.id,
      type: 'companies',
      title: item.company_name || item.name || 'Công ty chưa đặt tên',
      subtitle: item.email || item.company_website || 'Thông tin xác minh chưa đầy đủ',
      reason: 'Cần xác minh hồ sơ công ty trước khi nhà tuyển dụng vận hành đầy đủ.',
      action: `/admin/companies/${item.id}`,
      badge: 'Công ty chờ xác minh',
      icon: Building2,
      cta: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionKey === `company-${item.id}-true`}
            onClick={() => handleCompanyVerification(item.id, true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60 active:scale-95 shadow-sm shadow-emerald-500/10"
          >
            <CheckCircle2 size={16} /> Xác minh
          </button>
        </div>
      ),
    }));

    const applicationItems = queue.applications.map((item) => ({
      id: `application-${item.id}`,
      entityId: item.id,
      type: 'applications',
      title: item.candidate_name || item.user_name || `Application #${item.id}`,
      subtitle: item.job_title || 'Hồ sơ đang screening',
      reason: 'Đang trong giai đoạn sàng lọc AI và cần admin theo dõi backlog xử lý.',
      action: `/admin/applications/${item.id}`,
      badge: 'Sàng lọc AI',
      icon: FileText,
      cta: (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionKey === `application-${item.id}-reviewed`}
            onClick={() => handleApplicationStatus(item.id, 'reviewed')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60 active:scale-95"
          >
            <CheckCircle2 size={16} /> Đánh dấu đã xem
          </button>
          <button
            type="button"
            disabled={actionKey === `application-${item.id}-rejected`}
            onClick={() => handleApplicationStatus(item.id, 'rejected')}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60 active:scale-95"
          >
            <XCircle size={16} /> Từ chối
          </button>
          <Link
            to={`/admin/applications/${item.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors duration-200 ease-out hover:bg-muted/35 hover:text-foreground active:scale-95"
          >
            <ExternalLink size={16} /> Xem chi tiết
          </Link>
        </div>
      ),
    }));

    const merged = [...jobItems, ...companyItems, ...applicationItems];
    if (activeFilter === 'all') return merged;
    return merged.filter((item) => item.type === activeFilter);
  }, [
    activeFilter,
    actionKey,
    handleApplicationStatus,
    handleCompanyVerification,
    handleJobStatus,
    queue,
  ]);

  const summary = [
    { label: 'Job chờ duyệt', value: stats.moderation?.pendingJobs || 0 },
    { label: 'Job bị gắn cờ', value: stats.moderation?.flaggedJobs || 0 },
    { label: 'Công ty chưa xác minh', value: stats.moderation?.unverifiedCompanies || 0 },
    { label: 'Sàng lọc AI', value: stats.pipeline?.screening || 0 },
  ];
  const moderationModules = [
    {
      title: 'Kiểm duyệt Job',
      description: 'Phê duyệt nhanh tin đăng, rút ngắn thời gian đưa job hợp lệ lên nền tảng.',
    },
    {
      title: 'Xác minh doanh nghiệp',
      description: 'Xác minh công ty và giảm rủi ro trước khi nhà tuyển dụng tiếp cận ứng viên.',
    },
    {
      title: 'Backlog sàng lọc AI',
      description: 'Theo dõi backlog hồ sơ screening để cân bằng chất lượng và tốc độ xử lý.',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 border-b border-border pb-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            <ShieldAlert size={14} /> Trung tâm kiểm duyệt
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hàng đợi kiểm duyệt tập trung
          </h1>
          <p className="max-w-3xl text-sm font-medium text-slate-500">
            Duyệt nhanh công ty, job và backlog sàng lọc AI từ cùng một màn hình. Mục tiêu của trang
            này là giảm số lần admin phải chuyển qua lại giữa các module vận hành.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-black text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {moderationModules.map((module) => (
            <div
              key={module.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Moderation module
              </p>
              <h2 className="mt-3 text-xl font-black text-foreground">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${activeFilter === filter ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-500/30 hover:text-emerald-500'}`}
              >
                {filter === 'all'
                  ? 'Tất cả'
                  : filter === 'jobs'
                    ? 'Job'
                    : filter === 'companies'
                      ? 'Công ty'
                      : 'Hồ sơ'}
              </button>
            ))}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {items.length} mục trong hàng đợi kiểm duyệt
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-xl font-black text-foreground">Hàng đợi hiện tại</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Tập trung các mục cần admin thao tác ngay.
            </p>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-6 py-12 text-sm font-medium text-muted-foreground">
                Đang tải hàng đợi kiểm duyệt...
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm font-medium text-muted-foreground">
                Không có mục nào cần kiểm duyệt ở bộ lọc hiện tại.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-muted p-3 text-foreground">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-black text-foreground">{item.title}</h3>
                        <span className="rounded-full bg-state-warning/10 px-3 py-1 text-xs font-bold text-state-warning">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        {item.subtitle}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                      <Link
                        to={item.action}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary"
                      >
                        Xem trang chi tiết <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">{item.cta}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminModerationPage;
