import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  APPLICATION_STATUS,
  PIPELINE_STAGES,
  getAppStatusConfig,
  getActiveStatuses,
  getInterviewStatuses,
  getSuccessStatuses,
  normalizeApplicationStatus,
} from '../../constants/status';
import {
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  RotateCcw,
  ScanSearch,
  Search,
  Square,
  Star,
  Trash2,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import ChartSurface, { CHART_TICK_STYLE } from '@/components/charts/ChartSurface';
import StatCard from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ApplicationDetailModal from '../../components/candidate/applications/ApplicationDetailModal';
import applicationService from '../../services/applicationService';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { isHandledAuthError } from '../../utils/authErrors';

const STAGE_ICONS = {
  all: Star,
  submitted: Clock,
  screening: ScanSearch,
  shortlisted: Star,
  interview_scheduled: Calendar,
  interviewed: Award,
  offered: Award,
  hired: UserCheck,
  rejected: XCircle,
  withdrawn: RotateCcw,
};

const STATUS_TONES = {
  amber: {
    accent: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    soft: 'bg-amber-50 text-amber-700',
  },
  emerald: {
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    soft: 'bg-emerald-50 text-emerald-700',
  },
  red: {
    accent: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    icon: 'bg-red-50 text-red-600 ring-red-100',
    soft: 'bg-red-50 text-red-700',
  },
  slate: {
    accent: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-700 ring-slate-200',
    icon: 'bg-slate-50 text-slate-600 ring-slate-100',
    soft: 'bg-slate-50 text-slate-700',
  },
};

function getStatusTone(status) {
  const color = getAppStatusConfig(status)?.color || 'slate';
  return STATUS_TONES[color] || STATUS_TONES.slate;
}

function getApplicationTitle(application) {
  return application.job_title || application.job?.title || 'Vị trí đang cập nhật';
}

function getCompanyName(application) {
  return application.company_name || application.company?.name || 'Công ty đang cập nhật';
}

const SUMMARY_FILTER_META = {
  interviews: { label: 'Phỏng vấn' },
  successful: { label: 'Kết quả tích cực' },
};

function normalizeCandidateApplication(application) {
  if (!application) return null;
  return {
    ...application,
    status: normalizeApplicationStatus(application.status),
  };
}

const StageTabs = ({ activeTab, counts, onChange }) => (
  <div className="overflow-x-auto">
    <div className="flex min-w-max gap-2 pb-1">
      {PIPELINE_STAGES.map((stage) => {
        const StageIcon = STAGE_ICONS[stage.key] || Clock;
        const active = activeTab === stage.key;
        const count = counts[stage.key] || 0;
        const tone = stage.key === 'all' ? STATUS_TONES.emerald : getStatusTone(stage.key);

        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onChange(stage.key)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors duration-200',
              active
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
            )}
          >
            <StageIcon className="h-3.5 w-3.5" />
            <span>{stage.label}</span>
            <span
              className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                active ? 'bg-white/20 text-white' : tone.soft
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const ApplicationSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="p-5">
      <div className="flex gap-4">
        <div className="h-5 w-5 rounded bg-slate-100 animate-pulse" />
        <div className="h-14 w-14 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-50 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const ApplicationCard = ({
  application,
  selected,
  onToggleSelect,
  onOpenDetails,
  onDelete,
  deleting,
  interviewStatuses,
}) => {
  const cfg = getAppStatusConfig(application.status);
  const StatusIcon = STAGE_ICONS[application.status] || Clock;
  const tone = getStatusTone(application.status);
  const title = getApplicationTitle(application);
  const company = getCompanyName(application);

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
      <div className={cn('absolute inset-y-0 left-0 w-1', tone.accent)} />
      <div className="p-5 pl-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <button
              type="button"
              onClick={onToggleSelect}
              className="mt-1 shrink-0 text-slate-300 transition-colors hover:text-emerald-600"
              aria-label={selected ? 'Bỏ chọn đơn ứng tuyển' : 'Chọn đơn ứng tuyển'}
            >
              {selected ? (
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>

            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-inset',
                tone.icon
              )}
            >
              {application.company_logo ? (
                <img
                  src={application.company_logo}
                  alt={company}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Briefcase className="h-6 w-6" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 text-base font-bold leading-tight tracking-normal text-slate-950 group-hover:text-emerald-700">
                  {title}
                </h3>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">{company}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                  <Clock className="h-3 w-3" />
                  Nộp: {formatDate(application.applied_at || application.created_at)}
                </span>
                {application.cv_name && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                    <FileText className="h-3 w-3" />
                    {application.cv_name}
                  </span>
                )}
                {application.location && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-100">
                    <MapPin className="h-3 w-3" />
                    {application.location}
                  </span>
                )}
              </div>

              {(application.candidate_note || application.notes) && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{application.candidate_note || application.notes}</span>
                </div>
              )}

              {application.interview_date && interviewStatuses.includes(application.status) && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-100">
                  <Calendar className="h-3.5 w-3.5" />
                  Lịch PV: {formatDate(application.interview_date)}
                  {application.interview_time && ` lúc ${application.interview_time}`}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 lg:items-end">
            <span
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ring-1 ring-inset',
                tone.badge
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={onOpenDetails}
                className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
              >
                Chi tiết
              </Button>
              {application.job_id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-xs font-bold"
                  asChild
                >
                  <Link to={`/candidate/jobs/${application.job_id}`}>Xem việc</Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-emerald-200 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                asChild
              >
                <Link to={`/candidate/messages?applicationId=${application.id}`}>
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Nhắn tin
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                disabled={deleting}
                onClick={onDelete}
                aria-label="Xóa đơn ứng tuyển"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const ApplicationsPage = () => {
  const { showNotification } = useNotification();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedNote, setSelectedNote] = useState('');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const activeStatuses = useMemo(() => getActiveStatuses(), []);
  const interviewStatuses = useMemo(() => getInterviewStatuses(), []);
  const successStatuses = useMemo(() => getSuccessStatuses(), []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await applicationService.getMyApplications();
        const list = Array.isArray(response.data?.data) ? response.data.data : [];
        setApplications(list.map(normalizeCandidateApplication));
      } catch (error) {
        if (isHandledAuthError(error)) {
          setApplications([]);
          return;
        }
        console.error('Failed to fetch applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const openApplicationDetails = async (applicationId) => {
    setDetailLoading(true);
    try {
      const [appRes, historyRes] = await Promise.all([
        applicationService.getMyApplication(applicationId),
        applicationService.getMyApplicationHistory(applicationId),
      ]);
      setSelectedApplication(normalizeCandidateApplication(appRes.data?.data) || null);
      setApplicationHistory(historyRes.data?.data || []);
      setSelectedNote(appRes.data?.data?.candidate_note || '');
    } catch (error) {
      if (isHandledAuthError(error)) {
        setSelectedApplication(null);
        setApplicationHistory([]);
        setSelectedNote('');
        return;
      }
      console.error('Failed to fetch application details:', error);
      setSelectedApplication(null);
      setApplicationHistory([]);
      setSelectedNote('');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeApplicationDetails = () => {
    setSelectedApplication(null);
    setApplicationHistory([]);
    setSelectedNote('');
  };

  const handleNoteSaved = (note) => {
    setSelectedNote(note);
    if (selectedApplication) {
      setApplications((prev) =>
        prev.map((application) =>
          application.id === selectedApplication.id
            ? { ...application, candidate_note: note }
            : application
        )
      );
    }
  };

  const pipelineCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach((stage) => {
      counts[stage.key] =
        stage.key === 'all'
          ? applications.length
          : applications.filter((application) => application.status === stage.key).length;
    });
    return counts;
  }, [applications]);

  const interviewCount = useMemo(
    () =>
      applications.filter((application) => interviewStatuses.includes(application.status)).length,
    [applications, interviewStatuses]
  );

  const activeCount = useMemo(
    () => applications.filter((application) => activeStatuses.includes(application.status)).length,
    [applications, activeStatuses]
  );

  const successCount = useMemo(
    () => applications.filter((application) => successStatuses.includes(application.status)).length,
    [applications, successStatuses]
  );

  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    if (activeTab === 'interviews') {
      filtered = filtered.filter((application) => interviewStatuses.includes(application.status));
    } else if (activeTab === 'successful') {
      filtered = filtered.filter((application) => successStatuses.includes(application.status));
    } else if (activeTab !== 'all') {
      filtered = filtered.filter((application) => application.status === activeTab);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (application) =>
          getApplicationTitle(application).toLowerCase().includes(term) ||
          getCompanyName(application).toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at || b.applied_at) - new Date(a.created_at || a.applied_at);
      }
      if (sortBy === 'company') {
        return getCompanyName(a).localeCompare(getCompanyName(b), 'vi');
      }
      return 0;
    });
  }, [applications, activeTab, interviewStatuses, searchTerm, sortBy, successStatuses]);

  const funnelData = useMemo(
    () => [
      { name: 'Ứng tuyển', value: pipelineCounts.all || 0 },
      { name: 'Đang xử lý', value: activeCount },
      { name: 'Phỏng vấn', value: interviewCount },
      { name: 'Thành công', value: successCount },
    ],
    [activeCount, interviewCount, pipelineCounts.all, successCount]
  );

  const upcomingInterviews = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            interviewStatuses.includes(application.status) && application.interview_date
        )
        .slice(0, 3),
    [applications, interviewStatuses]
  );

  const activeStageTab =
    PIPELINE_STAGES.find((stage) => stage.key === activeTab) || SUMMARY_FILTER_META[activeTab];
  const isDetailOpen = detailLoading || Boolean(selectedApplication);
  const selectedVisibleCount = filteredApplications.filter((application) =>
    bulkSelected.includes(application.id)
  ).length;
  const allVisibleSelected =
    filteredApplications.length > 0 && selectedVisibleCount === filteredApplications.length;

  const resetFilters = () => {
    setSearchTerm('');
    setActiveTab('all');
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredApplications.map((application) => application.id);
    if (allVisibleSelected) {
      setBulkSelected((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setBulkSelected((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const deleteApplications = useCallback(
    async (ids) => {
      if (!ids.length) return;
      const confirmed = window.confirm(
        `Xóa ${ids.length} đơn ứng tuyển đã chọn?\n\nHành động này không thể hoàn tác.`
      );
      if (!confirmed) return;

      const previousSelection = [...bulkSelected];
      setBulkSelected((prev) => prev.filter((id) => !ids.includes(id)));

      try {
        await Promise.all(ids.map((id) => applicationService.deleteMyApplication(id)));
        setApplications((prev) => prev.filter((application) => !ids.includes(application.id)));
        showNotification('Đã xóa các đơn đã chọn.', 'success');
      } catch (error) {
        if (isHandledAuthError(error)) return;
        setBulkSelected(previousSelection);
        showNotification('Không xóa được đơn. Vui lòng thử lại.', 'error');
      }
    },
    [bulkSelected, showNotification]
  );

  const deleteApplication = useCallback(
    async (application) => {
      const title = getApplicationTitle(application);
      const confirmed = window.confirm(
        `Bạn có chắc muốn xóa đơn ứng tuyển cho vị trí "${title}"?\n\nHành động này không thể hoàn tác.`
      );
      if (!confirmed) return;

      setDeleteLoading(application.id);
      try {
        await applicationService.deleteMyApplication(application.id);
        setApplications((prev) => prev.filter((item) => item.id !== application.id));
        setBulkSelected((prev) => prev.filter((id) => id !== application.id));
        showNotification('Đã xóa đơn ứng tuyển thành công.', 'success');
      } catch (error) {
        if (isHandledAuthError(error)) return;
        showNotification('Không xóa được đơn. Vui lòng thử lại.', 'error');
      } finally {
        setDeleteLoading(null);
      }
    },
    [showNotification]
  );

  const summaryCards = [
    {
      id: 'all',
      label: 'Tổng đơn',
      value: pipelineCounts.all || 0,
      helper: 'Toàn bộ hồ sơ',
      icon: Briefcase,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      id: 'interviews',
      label: 'Phỏng vấn',
      value: interviewCount,
      helper: 'Đã lên lịch hoặc đã PV',
      icon: Calendar,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
    {
      id: APPLICATION_STATUS.SHORTLISTED,
      label: 'Phù hợp sơ bộ',
      value: pipelineCounts[APPLICATION_STATUS.SHORTLISTED] || 0,
      helper: 'Đang được cân nhắc',
      icon: Star,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      id: 'successful',
      label: 'Đề nghị/Đã tuyển',
      value: successCount,
      helper: 'Có đề nghị tuyển dụng hoặc đã tuyển',
      icon: Award,
      tone: 'bg-violet-50 text-violet-600 ring-violet-100',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Trung tâm ứng tuyển
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  Pipeline ứng tuyển
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Theo dõi toàn bộ hành trình ứng tuyển, từ lúc nộp hồ sơ đến phỏng vấn và offer.
                </p>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map(({ id, ...card }) => (
                <StatCard
                  key={id}
                  {...card}
                  active={activeTab === id}
                  onClick={() => setActiveTab(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <StageTabs activeTab={activeTab} counts={pipelineCounts} onChange={setActiveTab} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm kiếm theo công việc, công ty..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="recent">Mới nhất</option>
                  <option value="company">Tên công ty A-Z</option>
                </select>
              </div>

              {bulkSelected.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    {bulkSelected.length} đơn đã chọn
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBulkSelected([])}
                      className="h-9 rounded-lg text-xs font-bold"
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Bỏ chọn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteApplications([...bulkSelected])}
                      className="h-9 rounded-lg border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Xóa đơn
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!loading && applications.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {filteredApplications.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-emerald-700"
                    >
                      {allVisibleSelected ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                      Chọn tất cả ({filteredApplications.length})
                    </button>
                  )}
                  {activeStageTab && <span className="hidden h-4 w-px bg-slate-200 sm:block" />}
                  {activeStageTab && (
                    <span className="text-sm font-medium text-slate-500">
                      {activeStageTab.label}:{' '}
                      <b className="text-slate-800">{filteredApplications.length}</b> đơn
                    </span>
                  )}
                </div>

                {(searchTerm || activeTab !== 'all') && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <ApplicationSkeleton key={item} />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
                    <Briefcase className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Không tìm thấy đơn ứng tuyển nào
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    {searchTerm || activeTab !== 'all'
                      ? 'Thử thay đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ pipeline.'
                      : 'Hãy bắt đầu ứng tuyển để theo dõi tiến trình tại đây.'}
                  </p>
                  <Button
                    asChild
                    className="mt-6 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Link to="/candidate/jobs">Khám phá việc làm</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    selected={bulkSelected.includes(application.id)}
                    onToggleSelect={() => {
                      setBulkSelected((prev) =>
                        prev.includes(application.id)
                          ? prev.filter((id) => id !== application.id)
                          : [...prev, application.id]
                      );
                    }}
                    onOpenDetails={() => openApplicationDetails(application.id)}
                    onDelete={(event) => {
                      event.stopPropagation();
                      deleteApplication(application);
                    }}
                    deleting={deleteLoading === application.id}
                    interviewStatuses={interviewStatuses}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <SidebarCard title="Pipeline ứng tuyển" icon={BarChart3}>
              <div className="mt-4 h-44 w-full">
                <ChartSurface className="h-full" minChartHeight={160}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={88} tick={CHART_TICK_STYLE} />
                    <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} minPointSize={2} />
                  </BarChart>
                </ChartSurface>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-500">
                Dựa trên {pipelineCounts.all || 0} đơn ứng tuyển
              </p>
            </SidebarCard>

            <SidebarCard title="Lịch phỏng vấn sắp tới" icon={Calendar}>
              {upcomingInterviews.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {upcomingInterviews.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                        {formatDate(application.interview_date || '').split('/')[0] || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {getApplicationTitle(application)}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-500">
                          {getCompanyName(application)}
                        </p>
                        {application.interview_time && (
                          <p className="mt-1 text-xs font-bold text-emerald-700">
                            {application.interview_time}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <Calendar className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-slate-500">Không có lịch phỏng vấn</p>
                </div>
              )}
              {interviewCount > 0 && (
                <Button
                  variant="outline"
                  className="mt-4 h-10 w-full rounded-lg text-xs font-bold"
                  asChild
                >
                  <Link to="/candidate/interviews">Xem tất cả lịch PV</Link>
                </Button>
              )}
            </SidebarCard>

            <SidebarCard title="Gợi ý" icon={Star} className="bg-emerald-50/70">
              <ul className="mt-4 space-y-2.5">
                {activeCount > 0 && (
                  <li className="flex gap-2 text-sm font-medium text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Bạn có {activeCount} đơn đang chờ. Nhà tuyển dụng thường review trong 3-7 ngày.
                  </li>
                )}
                {interviewCount > 0 && (
                  <li className="flex gap-2 text-sm font-medium text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Chuẩn bị kỹ cho {interviewCount} lịch phỏng vấn sắp tới.
                  </li>
                )}
                <li className="flex gap-2 text-sm font-medium text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Tối ưu từ khóa CV để tăng tỷ lệ qua sơ loại.
                </li>
                <li className="flex gap-2 text-sm font-medium text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Theo dõi đơn thường xuyên để không bỏ lỡ phản hồi.
                </li>
              </ul>
              <Button
                asChild
                className="mt-4 h-10 w-full rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <Link to="/candidate/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Hỏi trợ lý
                </Link>
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </main>

      <ApplicationDetailModal
        isOpen={isDetailOpen}
        onClose={closeApplicationDetails}
        application={selectedApplication}
        history={applicationHistory}
        loading={detailLoading}
        notes={selectedNote}
        onNoteSaved={handleNoteSaved}
      />
    </div>
  );
};

export default ApplicationsPage;
