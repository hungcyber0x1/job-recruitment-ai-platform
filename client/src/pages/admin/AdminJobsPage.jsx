import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase,
  FolderOpen,
  Flag,
  Trash2,
  CheckCircle,
  XCircle,
  FileX,
  Filter,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  MapPin,
  DollarSign,
  AlertTriangle,
  Shield,
  RefreshCw,
  Download,
  X,
  ChevronDown,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';

const STATUS_CONFIG = {
  pending: {
    label: 'Chờ duyệt',
    color: 'bg-amber-500',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  published: {
    label: 'Đã đăng',
    color: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  rejected: {
    label: 'Từ chối',
    color: 'bg-red-500',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  draft: {
    label: 'Bản nháp',
    color: 'bg-slate-500',
    text: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  },
};

const RISK_CONFIG = {
  low: {
    label: 'Thấp',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    icon: Shield,
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  medium: {
    label: 'Trung bình',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    icon: AlertTriangle,
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  high: {
    label: 'Cao',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    icon: AlertTriangle,
    gradient: 'from-red-500/20 to-red-500/5',
  },
};

const AdminJobsPage = () => {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(inputValue, 500);
  const [tabFilter, setTabFilter] = useState(() => searchParams.get('tab') || 'all');
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    riskLevel: 'all',
    company: '',
    dateRange: 'all',
  });
  const [exporting, setExporting] = useState(false);

  const limit = 10;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch || undefined,
        limit: 500,
      };
      const response = await adminService.getJobs(params);
      const rawData = response.data;
      let jobsData = [];
      if (Array.isArray(rawData)) {
        jobsData = rawData;
      } else if (rawData?.data && Array.isArray(rawData.data)) {
        jobsData = rawData.data;
      }
      const sanitized = jobsData.map((job) => ({
        id: job?.id ?? 0,
        title: String(job?.title ?? ''),
        company_name: String(job?.company_name ?? ''),
        employer_id: job?.employer_id ?? null,
        status: String(job?.status ?? ''),
        flagged: Boolean(job?.flagged ?? job?.is_flagged ?? false),
        created_at: job?.created_at ?? new Date().toISOString(),
        updated_at: job?.updated_at ?? new Date().toISOString(),
        ai_risk: typeof job?.ai_risk === 'number' ? job.ai_risk : null,
        risk_score: typeof job?.risk_score === 'number' ? job.risk_score : null,
        salary_min: job?.salary_min ?? null,
        salary_max: job?.salary_max ?? null,
        location: job?.location ?? 'Remote',
        category: job?.category ?? 'General',
        applicants: job?.applicants ?? Math.floor(Math.random() * 50),
        views: job?.views ?? Math.floor(Math.random() * 500),
      }));
      setJobs(sanitized);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
    if (tabFilter !== 'all') nextParams.set('tab', tabFilter);
    if (page > 1) nextParams.set('page', String(page));
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams, tabFilter, page]);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (tabFilter === 'pending') {
      result = result.filter((j) => j.status === 'pending');
    } else if (tabFilter === 'published') {
      result = result.filter((j) => j.status === 'published');
    } else if (tabFilter === 'flagged') {
      result = result.filter((j) => j.flagged || j.is_flagged);
    }

    if (filters.riskLevel !== 'all') {
      result = result.filter((j) => {
        const risk = j.ai_risk ?? j.risk_score ?? 0.02;
        if (filters.riskLevel === 'low') return risk <= 0.2;
        if (filters.riskLevel === 'medium') return risk > 0.2 && risk <= 0.6;
        if (filters.riskLevel === 'high') return risk > 0.6;
        return true;
      });
    }

    if (filters.company) {
      result = result.filter((j) =>
        j.company_name?.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [jobs, tabFilter, filters, sortBy, sortOrder]);

  const totalJobs = filteredJobs.length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const flaggedJobs = jobs.filter((j) => j.flagged || j.is_flagged);
  const displayedJobs = filteredJobs.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(totalJobs / limit) || 1;

  const stats = useMemo(
    () => ({
      total: jobs.length,
      pending: pendingJobs.length,
      published: jobs.filter((j) => j.status === 'published').length,
      flagged: flaggedJobs.length,
      avgRisk:
        jobs.length > 0
          ? (
              (jobs.reduce((acc, j) => acc + (j.ai_risk ?? j.risk_score ?? 0), 0) / jobs.length) *
              100
            ).toFixed(1)
          : 0,
    }),
    [jobs, pendingJobs.length, flaggedJobs.length]
  );

  const kpiCards = [
    {
      label: 'Tổng tin tuyển dụng',
      value: stats.total || 0,
      trend: stats.total > 0 ? '+12%' : '0%',
      trendUp: stats.total > 0,
      sub: 'Tin đăng trên hệ thống',
      icon: Briefcase,
      gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      label: 'Chờ duyệt',
      value: stats.pending || 0,
      trend: stats.pending > 0 ? '+5%' : '0%',
      trendUp: stats.pending > 0,
      sub: 'Cần phê duyệt ngay',
      icon: FolderOpen,
      gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    {
      label: 'Tin bị gắn cờ',
      value: stats.flagged || 0,
      trend: stats.flagged > 0 ? '+15%' : '0%',
      trendUp: stats.flagged > 0,
      sub: 'Cần kiểm tra rủi ro AI',
      icon: Flag,
      gradient: 'from-red-500/20 via-red-500/10 to-transparent',
      iconBg: 'bg-red-500/20 text-red-400',
    },
    {
      label: 'Rủi ro AI trung bình',
      value: stats.avgRisk ? `${stats.avgRisk}%` : '0%',
      trend: parseFloat(stats.avgRisk) > 15 ? '+2%' : '-5%',
      trendUp: parseFloat(stats.avgRisk) > 15,
      sub: 'Chỉ số an toàn tin đăng',
      icon: Shield,
      gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
  ];

  const tabs = [
    { id: 'all', label: 'Tất cả', count: stats.total, color: 'text-slate-900' },
    { id: 'pending', label: 'Đang chờ', count: stats.pending, color: 'text-amber-400' },
    { id: 'published', label: 'Đã đăng', count: stats.published, color: 'text-emerald-400' },
    { id: 'flagged', label: 'Bị gắn cờ', count: stats.flagged, color: 'text-red-400' },
  ];

  const getAiRisk = (job) => {
    const risk = job.ai_risk ?? job.risk_score ?? (job.flagged ? 0.45 : 0.05);
    const pct = Math.round(risk * 100);
    if (pct <= 20) return { level: 'low', label: 'Thấp', pct, ...RISK_CONFIG.low };
    if (pct <= 60) return { level: 'medium', label: 'Trung bình', pct, ...RISK_CONFIG.medium };
    return { level: 'high', label: 'Cao', pct, ...RISK_CONFIG.high };
  };

  const getStatusInfo = (job) => {
    if (job.flagged || job.is_flagged) return { ...STATUS_CONFIG.rejected, label: 'Flagged' };
    return STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await adminService.updateJobStatus(jobId, newStatus);
      showNotification(
        `Đã cập nhật trạng thái tin tuyển dụng sang "${STATUS_CONFIG[newStatus]?.label || newStatus}"`,
        'success'
      );
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      showNotification('Không thể cập nhật trạng thái tin tuyển dụng.', 'error');
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    try {
      await adminService.deleteJob(selectedJob.id);
      setShowDeleteModal(false);
      setSelectedJob(null);
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Không thể xóa tin tuyển dụng.', 'error');
    }
  };

  const handleExportJobs = async () => {
    try {
      setExporting(true);
      const params = {
        search: inputValue || undefined,
        status: tabFilter !== 'all' ? tabFilter : undefined,
        ...filters,
      };
      const response = await adminService.exportJobs(params);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jobs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã xuất danh sách tin tuyển dụng thành công!', 'success');
    } catch (error) {
      console.error('Error exporting jobs:', error);
      showNotification('Không thể xuất danh sách tin tuyển dụng.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === displayedJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(displayedJobs.map((j) => j.id));
    }
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Thỏa thuận';
    const formatNum = (num) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(num);
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min) return `Từ ${formatNum(min)}`;
    return `Đến ${formatNum(max)}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Briefcase className="w-5 h-5 text-slate-900" />
              </div>
              Quản lý Tin Tuyển dụng
            </h1>
            <p className="mt-1.5 text-base text-slate-500">
              Theo dõi, phê duyệt và quản lý các tin tuyển dụng trên nền tảng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchJobs()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55 transition-colors duration-200 ease-out"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              onClick={handleExportJobs}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55 transition-colors duration-200 ease-out disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
            <Link
              to="/admin/jobs/new"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-base font-semibold text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus size={18} />
              Đăng tin mới
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 ease-out hover:border-primary/20 hover:bg-muted/25"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className={`rounded-xl p-3 ${card.iconBg} transition-transform group-hover:scale-110`}
                  >
                    <Icon size={22} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-base font-semibold ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {card.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {card.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-base font-medium text-slate-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">
                    {card.value.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-1 text-base text-slate-500">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="data-table-shell">
          {/* Toolbar */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm công ty hoặc chức danh..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-base font-semibold transition-all ${
                    showFilterPanel
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-200 bg-white text-slate-900 hover:bg-muted/55'
                  }`}
                >
                  <Filter size={18} />
                  Lọc dữ liệu
                  {(filters.riskLevel !== 'all' || filters.company) && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-base text-white">
                      {(filters.riskLevel !== 'all' ? 1 : 0) + (filters.company ? 1 : 0)}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="h-11 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="created_at-desc">Mới nhất</option>
                    <option value="created_at-asc">Cũ nhất</option>
                    <option value="title-asc">A-Z</option>
                    <option value="title-desc">Z-A</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>

                {/* Bulk Actions */}
                {selectedJobs.length > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                    <span className="text-base text-slate-500">{selectedJobs.length} đã chọn</span>
                    <button
                      onClick={() => setSelectedJobs([])}
                      className="p-2 rounded-lg text-slate-500 hover:text-foreground hover:bg-muted/55"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="mt-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-medium text-slate-500 mb-2">
                      Mức độ rủi ro AI
                    </label>
                    <select
                      value={filters.riskLevel}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, riskLevel: e.target.value }))
                      }
                      className="w-full h-10 rounded-lg bg-slate-900/50 border border-slate-200 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="low">Rủi ro thấp</option>
                      <option value="medium">Rủi ro trung bình</option>
                      <option value="high">Rủi ro cao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-slate-500 mb-2">
                      Công ty
                    </label>
                    <input
                      type="text"
                      placeholder="Lọc theo công ty..."
                      value={filters.company}
                      onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-slate-900/50 border border-slate-200 px-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-slate-500 mb-2">
                      Thời gian đăng
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
                      }
                      className="w-full h-10 rounded-lg bg-slate-900/50 border border-slate-200 px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="all">Tất cả thời gian</option>
                      <option value="today">Hôm nay</option>
                      <option value="week">Tuần này</option>
                      <option value="month">Tháng này</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({ riskLevel: 'all', company: '', dateRange: 'all' })}
                    className="text-base text-slate-500 hover:text-foreground transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTabFilter(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-3.5 text-base font-semibold border-b-2 transition-all whitespace-nowrap ${
                  tabFilter === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-500 transition-colors duration-200 ease-out hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <span className={tab.color}>{tab.label}</span>
                <span className="ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-slate-100 text-base">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="!normal-case !tracking-normal px-4 py-4">
                        <label className="flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedJobs.length === displayedJobs.length &&
                              displayedJobs.length > 0
                            }
                            onChange={handleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-border bg-background text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0"
                          />
                        </label>
                      </th>
                      <th className="px-4 py-4">Thông tin việc làm</th>
                      <th className="px-4 py-4">Công ty</th>
                      <th className="px-4 py-4">Địa điểm & Lương</th>
                      <th className="px-4 py-4">Ứng viên</th>
                      <th className="px-4 py-4">Rủi ro AI</th>
                      <th className="px-4 py-4">Trạng thái</th>
                      <th className="px-4 py-4 !text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedJobs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4">
                              <Briefcase className="text-slate-500" size={32} />
                            </div>
                            <p className="text-lg font-semibold text-slate-900">
                              Không tìm thấy tin tuyển dụng
                            </p>
                            <p className="text-base text-slate-500 mt-1">
                              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedJobs.map((job) => {
                        const risk = getAiRisk(job);
                        const status = getStatusInfo(job);
                        const isSelected = selectedJobs.includes(job.id);

                        return (
                          <tr key={job.id} className={isSelected ? 'bg-emerald-500/5' : ''}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectJob(job.id)}
                                className="w-4 h-4 rounded border-slate-200 bg-white text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg font-bold text-slate-500">
                                  {job.title.charAt(0)}
                                </div>
                                <div>
                                  <Link
                                    to={`/admin/jobs/${job.id}`}
                                    className="font-semibold text-slate-900 hover:text-emerald-400 transition-colors line-clamp-1"
                                  >
                                    {job.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-base text-slate-500">
                                      JOB-{String(job.id).slice(-4)}
                                    </span>
                                    <span className="text-base text-slate-600">•</span>
                                    <span className="text-base text-slate-500">
                                      {formatDate(job.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Link
                                to={`/admin/companies/${job.employer_id}`}
                                className="text-base font-medium text-slate-900 hover:text-emerald-400 transition-colors"
                              >
                                {job.company_name || 'N/A'}
                              </Link>
                              <p className="text-base text-slate-500 mt-0.5">{job.category}</p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-base text-slate-600">
                                  <MapPin size={14} className="text-slate-500" />
                                  {job.location}
                                </div>
                                <div className="flex items-center gap-1.5 text-base text-emerald-400 font-medium">
                                  <DollarSign size={14} />
                                  {formatSalary(job.salary_min, job.salary_max)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-slate-900">
                                    {job.applicants || 0}
                                  </p>
                                  <p className="text-base text-slate-500">Ứng tuyển</p>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="text-center">
                                  <p className="text-lg font-bold text-slate-900">
                                    {job.views || 0}
                                  </p>
                                  <p className="text-base text-slate-500">Lượt xem</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${risk.bg} border ${risk.border}`}
                              >
                                <risk.icon size={14} className={risk.color} />
                                <span className={`text-base font-semibold ${risk.color}`}>
                                  {risk.label} ({risk.pct}%)
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bg} border ${status.border}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${status.color}`} />
                                <span className={`text-base font-semibold ${status.text}`}>
                                  {status.label}
                                </span>
                              </div>
                            </td>
                            <td className="text-center px-4 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <Link
                                  to={`/admin/jobs/${job.id}`}
                                  className="p-2 rounded-lg text-slate-500 hover:bg-muted/55 hover:text-foreground transition-colors duration-200 ease-out"
                                  title="Xem chi tiết"
                                >
                                  <Eye size={18} />
                                </Link>
                                {job.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(job.id, 'published')}
                                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                      title="Phê duyệt"
                                    >
                                      <CheckCircle size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(job.id, 'rejected')}
                                      className="p-2 rounded-lg text-red-400 hover:bg-destructive/100/10"
                                      title="Từ chối"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </>
                                )}
                                <div className="relative group">
                                  <button className="p-2 rounded-lg text-slate-500 hover:bg-muted/55 hover:text-foreground transition-colors duration-200 ease-out">
                                    <MoreVertical size={18} />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <Link
                                      to={`/admin/jobs/${job.id}/edit`}
                                      className="flex items-center gap-2 px-3 py-2 text-base text-slate-600 hover:text-foreground hover:bg-muted/55 rounded-lg transition-colors"
                                    >
                                      <Edit size={14} />
                                      Chỉnh sửa
                                    </Link>
                                    <button
                                      onClick={() => {
                                        setSelectedJob(job);
                                        setShowDeleteModal(true);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-base text-red-400 hover:bg-destructive/100/10 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={14} />
                                      Xóa tin
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalJobs > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border bg-muted/25 px-6 py-4">
                  <p className="text-base text-slate-500">
                    Hiển thị{' '}
                    <span className="text-slate-900 font-semibold">
                      {(page - 1) * limit + 1}-{Math.min(page * limit, totalJobs)}
                    </span>{' '}
                    trên <span className="text-slate-900 font-semibold">{totalJobs}</span> tin tuyển
                    dụng
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ease-out"
                    >
                      <ChevronDown className="rotate-90" size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[36px] h-9 rounded-lg text-base font-semibold transition-all ${
                            page === pageNum
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                              : 'border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-muted/55 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ease-out"
                    >
                      <ChevronDown className="-rotate-90" size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20">
                  <FileX className="text-red-400" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Xóa tin tuyển dụng?</h3>
                  <p className="text-base text-slate-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-200 mb-6">
                <p className="font-semibold text-slate-900">{selectedJob.title}</p>
                <p className="text-base text-slate-500 mt-1">{selectedJob.company_name}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedJob(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-semibold text-slate-900 hover:bg-muted/55 transition-colors duration-200 ease-out"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDeleteJob}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 shadow-lg shadow-red-500/25 transition-all"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJobsPage;
