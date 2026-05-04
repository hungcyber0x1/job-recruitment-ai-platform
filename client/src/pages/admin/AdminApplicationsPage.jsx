import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Hourglass,
  Loader2,
  RotateCcw,
  Search,
  Star,
  User,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { ContentCard, PageHeader } from '@/components/admin';
import AdminTable from '../../components/admin/AdminTable';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';
import adminService from '../../services/adminService';
import InterviewScheduleDialog from '../../components/employer/InterviewScheduleDialog';
import OfferDialog from '../../components/employer/OfferDialog';
import {
  APPLICATION_STATUS,
  getNextApplicationStatuses,
  getStatusLabel as getCanonicalStatusLabel,
  normalizeApplicationStatus,
} from '../../constants/status';

const PAGE_SIZE = 10;

const APPLICATION_PIPELINE_STAGES = [
  {
    id: 'all',
    label: 'Tất cả',
    statKey: 'total',
    updateStatus: null,
    icon: FileText,
    accentClass: 'bg-slate-100 text-slate-600',
  },
  {
    id: APPLICATION_STATUS.SUBMITTED,
    label: 'Đã nộp',
    statKey: APPLICATION_STATUS.SUBMITTED,
    updateStatus: APPLICATION_STATUS.SUBMITTED,
    statuses: [APPLICATION_STATUS.SUBMITTED],
    icon: Hourglass,
    accentClass: 'bg-amber-100 text-amber-700',
  },
  {
    id: APPLICATION_STATUS.SHORTLISTED,
    label: 'Sơ tuyển',
    statKey: APPLICATION_STATUS.SHORTLISTED,
    updateStatus: APPLICATION_STATUS.SHORTLISTED,
    statuses: [APPLICATION_STATUS.SHORTLISTED],
    icon: Star,
    accentClass: 'bg-violet-100 text-violet-700',
  },
  {
    id: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    label: 'Lịch PV',
    statKey: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    updateStatus: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    statuses: [APPLICATION_STATUS.INTERVIEW_SCHEDULED],
    icon: Calendar,
    accentClass: 'bg-sky-100 text-sky-700',
  },
  {
    id: APPLICATION_STATUS.INTERVIEWED,
    label: 'Đã PV',
    statKey: APPLICATION_STATUS.INTERVIEWED,
    updateStatus: APPLICATION_STATUS.INTERVIEWED,
    statuses: [APPLICATION_STATUS.INTERVIEWED],
    icon: CheckCircle,
    accentClass: 'bg-teal-100 text-teal-700',
  },
  {
    id: APPLICATION_STATUS.OFFERED,
    label: 'Offer',
    statKey: APPLICATION_STATUS.OFFERED,
    updateStatus: APPLICATION_STATUS.OFFERED,
    statuses: [APPLICATION_STATUS.OFFERED],
    icon: Briefcase,
    accentClass: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: APPLICATION_STATUS.HIRED,
    label: 'Tuyển',
    statKey: APPLICATION_STATUS.HIRED,
    updateStatus: APPLICATION_STATUS.HIRED,
    statuses: [APPLICATION_STATUS.HIRED],
    icon: User,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: APPLICATION_STATUS.REJECTED,
    label: 'Từ chối',
    statKey: APPLICATION_STATUS.REJECTED,
    updateStatus: APPLICATION_STATUS.REJECTED,
    statuses: [APPLICATION_STATUS.REJECTED],
    icon: XCircle,
    accentClass: 'bg-rose-100 text-rose-700',
  },
  {
    id: APPLICATION_STATUS.WITHDRAWN,
    label: 'Đã rút',
    statKey: APPLICATION_STATUS.WITHDRAWN,
    updateStatus: APPLICATION_STATUS.WITHDRAWN,
    statuses: [APPLICATION_STATUS.WITHDRAWN],
    icon: RotateCcw,
    accentClass: 'bg-slate-100 text-slate-600',
  },
];

const STATUS_TO_STAGE = APPLICATION_PIPELINE_STAGES.reduce((map, stage) => {
  (stage.statuses || []).forEach((status) => {
    map[status] = stage;
  });
  return map;
}, {});

const STAGE_UPDATE_OPTIONS = APPLICATION_PIPELINE_STAGES.filter(
  (stage) => stage.updateStatus && stage.updateStatus !== APPLICATION_STATUS.WITHDRAWN
);
const BULK_STATUS_OPTIONS = new Set([
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEWED,
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
]);

const SectionCard = ContentCard;

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function getInitials(name = '') {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return 'UV';

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return normalizedName.slice(0, 2).toUpperCase();
}

function formatAppliedDate(value) {
  if (!value) return 'Chưa có thời gian';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getPipelineStageByStatus(status) {
  return STATUS_TO_STAGE[status] || null;
}

function getStatusLabel(status) {
  return getPipelineStageByStatus(status)?.label || getCanonicalStatusLabel(status);
}

const AdminApplicationsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, pages: 1 });
  const [serverStats, setServerStats] = useState({
    total: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    [APPLICATION_STATUS.SUBMITTED]: 0,
    [APPLICATION_STATUS.SHORTLISTED]: 0,
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 0,
    [APPLICATION_STATUS.INTERVIEWED]: 0,
    [APPLICATION_STATUS.OFFERED]: 0,
    hired: 0,
    [APPLICATION_STATUS.HIRED]: 0,
    rejected: 0,
    [APPLICATION_STATUS.REJECTED]: 0,
    [APPLICATION_STATUS.WITHDRAWN]: 0,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState(APPLICATION_STATUS.SHORTLISTED);
  const [updatingBulk, setUpdatingBulk] = useState(false);
  const [statusDialog, setStatusDialog] = useState(null);

  const normalizeStats = useCallback((stats = {}) => {
    const statusCounts = Object.values(APPLICATION_STATUS).reduce((summary, status) => {
      summary[status] = Number(stats[status] || 0);
      return summary;
    }, {});

    return {
      ...statusCounts,
      total: Number(stats.total || 0),
      applied: Number(stats.applied ?? statusCounts[APPLICATION_STATUS.SUBMITTED] ?? 0),
      screening: Number(stats.screening ?? statusCounts[APPLICATION_STATUS.SHORTLISTED] ?? 0),
      interview: Number(
        stats.interview ??
          statusCounts[APPLICATION_STATUS.INTERVIEW_SCHEDULED] +
            statusCounts[APPLICATION_STATUS.INTERVIEWED]
      ),
      hired: Number(stats.hired ?? statusCounts[APPLICATION_STATUS.HIRED] ?? 0),
      rejected: Number(stats.rejected ?? statusCounts[APPLICATION_STATUS.REJECTED] ?? 0),
    };
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: PAGE_SIZE,
      };

      const response = await adminService.getApplications(params);
      const resData = response.data;
      const appsData = resData?.success
        ? resData.data
        : Array.isArray(resData?.data)
          ? resData.data
          : Array.isArray(resData)
            ? resData
            : [];

      const sanitizedApplications = (Array.isArray(appsData) ? appsData : []).map(
        (application) => ({
          id: application?.id ?? 0,
          candidate_name: String(application?.candidate_name ?? ''),
          candidate_email: String(application?.candidate_email ?? ''),
          job_title: String(application?.job_title ?? ''),
          company_name: String(application?.company_name ?? ''),
          status: normalizeApplicationStatus(application?.status),
          user_id: application?.user_id ?? null,
          job_id: application?.job_id ?? null,
          employer_id: application?.employer_id ?? null,
          applied_at: application?.applied_at ?? application?.created_at ?? null,
        })
      );

      const pagination = resData?.pagination ?? {
        total: sanitizedApplications.length,
        pages: 1,
      };
      const nextPages = Math.max(1, Number(pagination?.pages ?? 1));
      const nextTotal = Math.max(0, Number(pagination?.total ?? sanitizedApplications.length));

      setApplications(sanitizedApplications);
      setPaginationMeta({ total: nextTotal, pages: nextPages });
      setServerStats(normalizeStats(resData?.stats));

      if (nextTotal > 0 && page > nextPages) {
        setPage(nextPages);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      setPaginationMeta({ total: 0, pages: 1 });
      setServerStats(normalizeStats());
      showNotification(
        error?.response?.data?.message || 'Không thể tải danh sách ứng tuyển.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, normalizeStats, page, showNotification, statusFilter]);

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
  }, [debouncedSearch, page, searchParams, setSearchParams, statusFilter]);

  const selectedApplications = useMemo(
    () =>
      applications.filter((application) =>
        selectedIds.map(String).includes(String(application.id))
      ),
    [applications, selectedIds]
  );

  const bulkStatusOptions = useMemo(() => {
    if (!selectedApplications.length) {
      return STAGE_UPDATE_OPTIONS.filter((stage) => BULK_STATUS_OPTIONS.has(stage.updateStatus));
    }

    const allowedStatuses = selectedApplications.reduce((allowed, application, index) => {
      const nextStatuses = getNextApplicationStatuses(application.status).filter(
        (status) => status !== application.status && BULK_STATUS_OPTIONS.has(status)
      );
      const nextSet = new Set(nextStatuses);

      if (index === 0) return nextSet;

      return new Set([...allowed].filter((status) => nextSet.has(status)));
    }, new Set());

    return STAGE_UPDATE_OPTIONS.filter((stage) => allowedStatuses.has(stage.updateStatus));
  }, [selectedApplications]);

  useEffect(() => {
    if (!bulkStatusOptions.length) {
      if (bulkTargetStatus) setBulkTargetStatus('');
      return;
    }
    if (!bulkStatusOptions.some((option) => option.updateStatus === bulkTargetStatus)) {
      setBulkTargetStatus(bulkStatusOptions[0].updateStatus);
    }
  }, [bulkStatusOptions, bulkTargetStatus]);

  const getStatusOptionsForApplication = useCallback((application) => {
    const currentStatus = application?.status || APPLICATION_STATUS.SUBMITTED;
    const nextStatuses = getNextApplicationStatuses(currentStatus).filter(
      (status) => status !== APPLICATION_STATUS.WITHDRAWN
    );
    const allowed = new Set([currentStatus, ...nextStatuses]);

    return APPLICATION_PIPELINE_STAGES.filter(
      (stage) => stage.updateStatus && allowed.has(stage.updateStatus)
    );
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await adminService.exportApplications({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification('Đã xuất báo cáo ứng tuyển CSV.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Không thể xuất dữ liệu ứng tuyển.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusUpdate = async (application, status, metadata = {}) => {
    const id = application?.id ?? application;
    if (!id || !status || status === application?.status) return;

    try {
      setUpdatingId(id);
      await adminService.updateApplicationStatus(id, status, '', metadata);
      setStatusDialog(null);
      showNotification(`Đã chuyển trạng thái đơn sang ${getStatusLabel(status)}.`, 'success');
      await fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể cập nhật trạng thái ứng tuyển.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const requestStatusUpdate = (application, status) => {
    if (!application || !status || status === application.status) return;

    if (status === APPLICATION_STATUS.INTERVIEW_SCHEDULED) {
      setStatusDialog({ type: 'interview', application, status });
      return;
    }

    if (status === APPLICATION_STATUS.OFFERED) {
      setStatusDialog({ type: 'offer', application, status });
      return;
    }

    handleStatusUpdate(application, status);
  };

  const confirmDialogStatusUpdate = async (metadata) => {
    if (!statusDialog?.application || !statusDialog?.status) return;
    await handleStatusUpdate(statusDialog.application, statusDialog.status, metadata);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0 || !bulkTargetStatus) return;
    if (!bulkStatusOptions.some((option) => option.updateStatus === bulkTargetStatus)) {
      showNotification('Không có bước pipeline hợp lệ cho các hồ sơ đã chọn.', 'error');
      return;
    }

    try {
      setUpdatingBulk(true);
      await adminService.bulkUpdateApplicationsStatus(selectedIds, bulkTargetStatus);
      showNotification(
        `Đã cập nhật ${selectedIds.length} đơn sang trạng thái ${getStatusLabel(bulkTargetStatus)}.`,
        'success'
      );
      setSelectedIds([]);
      await fetchApplications();
    } catch (error) {
      console.error('Error bulk updating applications:', error);
      showNotification(
        error?.response?.data?.message || 'Không thể cập nhật hàng loạt đơn ứng tuyển.',
        'error'
      );
    } finally {
      setUpdatingBulk(false);
    }
  };

  const resetFilters = () => {
    setInputValue('');
    setStatusFilter('all');
    setPage(1);
    setSelectedIds([]);
  };

  const pageStart = paginationMeta.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = paginationMeta.total === 0 ? 0 : Math.min(page * PAGE_SIZE, paginationMeta.total);
  const activeStatusLabel =
    APPLICATION_PIPELINE_STAGES.find((status) => status.id === statusFilter)?.label || 'Tất cả';
  const selectedCount = selectedIds.length;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Tổng đơn',
        value: formatNumber(serverStats.total),
        helper: 'Hồ sơ đang được theo dõi',
        icon: FileText,
        className: 'bg-slate-50 text-slate-700 ring-slate-100',
      },
      {
        label: 'Đã nộp',
        value: formatNumber(serverStats.applied),
        helper: 'Nguồn đầu vào mới',
        icon: Hourglass,
        className: 'bg-amber-50 text-amber-700 ring-amber-100',
      },
      {
        label: 'Sàng lọc',
        value: formatNumber(serverStats.screening),
        helper: 'Hồ sơ qua vòng đầu',
        icon: Star,
        className: 'bg-violet-50 text-violet-700 ring-violet-100',
      },
      {
        label: 'Phỏng vấn',
        value: formatNumber(serverStats.interview),
        helper: 'Đang trao đổi trực tiếp',
        icon: Calendar,
        className: 'bg-sky-50 text-sky-700 ring-sky-100',
      },
      {
        label: 'Đã tuyển',
        value: formatNumber(serverStats.hired),
        helper: 'Kết quả đã chốt',
        icon: CheckCircle,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      },
    ],
    [serverStats]
  );

  const bulkActions = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={bulkTargetStatus}
        onChange={(event) => setBulkTargetStatus(event.target.value)}
        disabled={updatingBulk || selectedCount === 0 || bulkStatusOptions.length === 0}
        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {bulkStatusOptions.map((stage) => (
          <option key={stage.id} value={stage.updateStatus}>
            {stage.label}
          </option>
        ))}
        {bulkStatusOptions.length === 0 ? <option value="">Không có bước hợp lệ</option> : null}
      </select>
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-xl border-emerald-200 bg-white font-bold text-emerald-700 hover:bg-emerald-50"
        onClick={handleBulkStatusUpdate}
        disabled={updatingBulk || selectedCount === 0 || bulkStatusOptions.length === 0}
      >
        {updatingBulk ? (
          <Loader2 size={14} className="mr-2 animate-spin" />
        ) : (
          <CheckCircle size={14} className="mr-2" />
        )}
        Cập nhật pipeline
      </Button>
    </div>
  );

  const columns = [
    {
      header: 'Ứng viên',
      width: '300px',
      render: (application) => (
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
            {getInitials(application.candidate_name)}
          </div>
          <div className="min-w-0">
            <Link
              to={`/admin/applications/${application.id}`}
              className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700"
            >
              {application.candidate_name || 'Ứng viên chưa cập nhật tên'}
            </Link>
            <p className="mt-1 truncate text-sm text-slate-500">
              {application.candidate_email || 'Chưa cập nhật email'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Tin tuyển dụng',
      width: '270px',
      render: (application) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {application.job_title || 'Tin tuyển dụng đã ẩn'}
          </p>
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{application.company_name || 'Chưa có công ty'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Pipeline',
      width: '160px',
      render: (application) => (
        <div className="space-y-2">
          <StatusBadge entityType="application" status={application.status} />
          <p className="text-xs font-medium text-slate-400">{getStatusLabel(application.status)}</p>
        </div>
      ),
    },
    {
      header: 'Ngày nộp',
      width: '140px',
      render: (application) => (
        <p className="text-sm font-semibold text-slate-700">
          {formatAppliedDate(application.applied_at)}
        </p>
      ),
    },
    {
      header: 'Cập nhật trạng thái',
      width: '210px',
      render: (application) => {
        const statusOptions = getStatusOptionsForApplication(application);
        const selectValue = application.status || APPLICATION_STATUS.SUBMITTED;
        const isUpdating = updatingId === application.id;
        const hasNextStep = statusOptions.some((option) => option.updateStatus !== selectValue);

        return (
          <div className="flex items-center gap-2">
            <select
              value={selectValue}
              onChange={(event) => requestStatusUpdate(application, event.target.value)}
              disabled={isUpdating || !hasNextStep}
              className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              title="Cập nhật trạng thái ứng tuyển"
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.updateStatus}>
                  {option.label}
                </option>
              ))}
            </select>
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : null}
          </div>
        );
      },
    },
    {
      header: 'Chi tiết',
      width: '90px',
      align: 'right',
      render: (application) => (
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          title="Xem chi tiết ứng tuyển"
        >
          <Link to={`/admin/applications/${application.id}`}>
            <Eye size={16} />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={FileText}
        eyebrow="Vận hành hồ sơ ứng tuyển"
        badge="Pipeline ứng tuyển"
        title="Quản lý ứng tuyển"
        description="Theo dõi pipeline ứng viên từ Đã nộp, Sàng lọc, Phỏng vấn đến Đã tuyển hoặc Từ chối; mọi thao tác cập nhật trạng thái đều gọi API quản trị thật."
        actions={
          <>
            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-11 rounded-xl bg-white px-5 font-bold shadow-sm"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm sạch bộ lọc
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={card.value}
              subtitle={card.helper}
              icon={card.icon}
              type={card.className}
            />
          ))}
        </div>
      </PageHeader>

      <section className="space-y-6">
        <SectionCard
          icon={Search}
          title="Bộ lọc pipeline"
          description="Tìm ứng viên theo tên, email hoặc vị trí, sau đó lọc theo các chặng tuyển dụng đang vận hành."
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm ứng viên, email hoặc vị trí..."
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {APPLICATION_PIPELINE_STAGES.map((status) => {
                const Icon = status.icon;
                const isActive = statusFilter === status.id;
                const count = serverStats[status.statKey] ?? 0;

                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status.id);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : status.accentClass
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {status.label}
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
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <span>
                Từ khóa:{' '}
                <strong className="text-slate-700">
                  {debouncedSearch.trim() || 'Tất cả ứng viên'}
                </strong>
              </span>
              <span>
                Pipeline: <strong className="text-slate-700">{activeStatusLabel}</strong>
              </span>
              <span>
                Đang hiển thị:{' '}
                <strong className="text-slate-700">
                  {pageStart}-{pageEnd} / {formatNumber(paginationMeta.total)}
                </strong>
              </span>
              <span>
                Đã chọn: <strong className="text-slate-700">{formatNumber(selectedCount)}</strong>
              </span>
            </div>
          </div>
        </SectionCard>

        <AdminTable
          title="Danh sách ứng viên"
          subtitle="Bảng ứng tuyển bên dưới pipeline, cho phép xem chi tiết và cập nhật trạng thái qua dropdown."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-600">
                {pageStart}-{pageEnd} / {formatNumber(paginationMeta.total)}
              </Badge>
              {statusFilter !== 'all' ? (
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {activeStatusLabel}
                </Badge>
              ) : null}
            </div>
          }
          columns={columns}
          data={applications}
          loading={loading}
          pagination={{
            currentPage: page,
            totalPages: paginationMeta.pages,
            totalItems: paginationMeta.total,
            pageSize: PAGE_SIZE,
            onPageChange: setPage,
          }}
          selectable={{
            selectedIds,
            onSelectChange: setSelectedIds,
          }}
          bulkActions={bulkActions}
          emptyTitle="Không có hồ sơ phù hợp"
          emptyDescription="Hãy điều chỉnh lại bộ lọc hoặc mở rộng từ khóa để xem thêm các đơn ứng tuyển."
        />
      </section>

      {statusDialog?.type === 'interview' ? (
        <InterviewScheduleDialog
          applicantName={statusDialog.application.candidate_name || 'Ứng viên'}
          jobTitle={statusDialog.application.job_title || 'Vị trí đang cập nhật'}
          onConfirm={confirmDialogStatusUpdate}
          onCancel={() => setStatusDialog(null)}
        />
      ) : null}

      {statusDialog?.type === 'offer' ? (
        <OfferDialog
          applicantName={statusDialog.application.candidate_name || 'Ứng viên'}
          jobTitle={statusDialog.application.job_title || 'Vị trí đang cập nhật'}
          onConfirm={confirmDialogStatusUpdate}
          onCancel={() => setStatusDialog(null)}
        />
      ) : null}
    </div>
  );
};

export default AdminApplicationsPage;
