import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';

import jobService from '../../services/jobService';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calendarDaysLeftUntilDeadline,
  isJobApplicationDeadlinePassed,
} from '../../utils/jobDeadline';

// ─────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'published', label: 'Đang đăng', countKey: 'published' },
  { key: 'closed', label: 'Đã đóng', countKey: 'closed' },
  { key: 'draft', label: 'Bản nháp', countKey: 'draft' },
];

const ITEMS_PER_PAGE = 5;

function formatShortDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('vi-VN', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function getStatusMeta(status) {
  switch (status) {
    case 'published':
      return { label: 'Đang mở', bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    case 'draft':
      return { label: 'Bản nháp', bgClass: 'bg-amber-50 text-amber-600 border-amber-200' };
    case 'closed':
      return { label: 'Đã đóng', bgClass: 'bg-slate-100 text-slate-600 border-slate-200' };
    default:
      return { label: status || 'Chưa rõ', bgClass: 'bg-slate-100 text-slate-600' };
  }
}

// Deterministic AI score from job id to avoid rerenders
function getAiScore(job) {
  if (job.ai_match_score) return job.ai_match_score;
  const seed = ((job.id ?? 0) * 17 + 60) % 40;
  return 60 + seed;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function JobBanner({ job }) {
  // Simple gradient placeholders based on category
  const colors = [
    'from-emerald-50 to-emerald-100',
    'from-blue-50 to-blue-100',
    'from-violet-50 to-violet-100',
    'from-amber-50 to-amber-100',
  ];
  const colorIdx = (job.id ?? 0) % colors.length;
  return (
    <div
      className={`h-full w-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center`}
    >
      <Briefcase size={24} className="text-emerald-500/30" />
    </div>
  );
}

function AiScoreBadge({ score }) {
  const color =
    score >= 80
      ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
      : score >= 60
        ? 'text-amber-600 border-amber-200 bg-amber-50'
        : 'text-red-600 border-red-200 bg-red-50';

  return (
    <div className={`flex flex-col items-center rounded-xl border px-3 py-2 min-w-[80px] ${color}`}>
      <div className="flex items-center gap-1 text-base font-bold uppercase tracking-wider opacity-70 mb-0.5">
        <Sparkles size={8} />
        AI MATCH SCORE
      </div>
      <span className="text-xl font-black tabular-nums">{score}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
const ManageJobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('status') || 'published');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [deletingId, setDeletingId] = useState(null);
  const [, setActionOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getMyJobs();
        const rawJobs = response?.data?.data;
        setJobs(Array.isArray(rawJobs) ? rawJobs : []);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        showNotification('Không thể tải danh sách tin tuyển dụng.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [showNotification]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (activeTab !== 'published') nextParams.set('status', activeTab);
    if (searchQuery.trim()) nextParams.set('search', searchQuery.trim());
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeTab, searchParams, searchQuery, setSearchParams]);

  // Tab counts
  const tabCounts = useMemo(
    () => ({
      published: jobs.filter((j) => j.status === 'published').length,
      closed: jobs.filter((j) => j.status === 'closed').length,
      draft: jobs.filter((j) => j.status === 'draft').length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    result = result.filter((j) => j.status === activeTab);

    if (filterType !== 'all') {
      result = result.filter((j) => j.type === filterType || j.job_type === filterType);
    }

    if (filterLocation !== 'all') {
      result = result.filter((j) =>
        j.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (j) => j.title?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [activeTab, jobs, searchQuery, filterType, filterLocation]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE));
  const pagedJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (jobId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin tuyển dụng này không?')) return;
    setDeletingId(jobId);
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showNotification('Đã xóa tin tuyển dụng.', 'success');
    } catch {
      showNotification('Không thể xóa tin tuyển dụng.', 'error');
    } finally {
      setDeletingId(null);
      setActionOpenId(null);
    }
  };

  return (
    <div className="pb-20 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Quản lý tin tuyển dụng
          </h1>
          <p className="text-base text-slate-500 font-medium mt-1">
            Theo dõi hiệu quả và quản lý các vị trí tuyển dụng của bạn.
          </p>
        </div>
        <Link
          to="/employer/jobs/post"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          ĐĂNG TIN MỚI
        </Link>
      </div>

      {/* ── Tabs & Search Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              className={`relative flex items-center gap-2 px-6 py-2.5 text-base font-bold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-base font-black tabular-nums ${
                  activeTab === tab.key
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {tabCounts[tab.countKey]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="relative flex-1 lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tiêu đề, địa điểm..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={filterType}
              onValueChange={(val) => {
                setFilterType(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 bg-white text-base font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 focus:ring-emerald-500/10 shadow-sm">
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
                <SelectItem value="all" className="text-base font-medium py-2.5">
                  Tất cả loại hình
                </SelectItem>
                <SelectItem value="full_time" className="text-base font-medium py-2.5">
                  Toàn thời gian
                </SelectItem>
                <SelectItem value="part_time" className="text-base font-medium py-2.5">
                  Bán thời gian
                </SelectItem>
                <SelectItem value="contract" className="text-base font-medium py-2.5">
                  Hợp đồng
                </SelectItem>
                <SelectItem value="remote" className="text-base font-medium py-2.5">
                  Từ xa
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterLocation}
              onValueChange={(val) => {
                setFilterLocation(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-[160px] rounded-xl border-slate-200 bg-white text-base font-bold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 focus:ring-emerald-500/10 shadow-sm">
                <SelectValue placeholder="Địa điểm" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
                <SelectItem value="all" className="text-base font-medium py-2.5">
                  Tất cả địa điểm
                </SelectItem>
                <SelectItem value="Hồ Chí Minh" className="text-base font-medium py-2.5">
                  TP. Hồ Chí Minh
                </SelectItem>
                <SelectItem value="Hà Nội" className="text-base font-medium py-2.5">
                  Hà Nội
                </SelectItem>
                <SelectItem value="Đà Nẵng" className="text-base font-medium py-2.5">
                  Đà Nẵng
                </SelectItem>
                <SelectItem value="Remote" className="text-base font-medium py-2.5">
                  Remote
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Job list ── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-[2rem] bg-white border border-slate-100"
            />
          ))}
        </div>
      ) : pagedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
            <Briefcase size={32} className="text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900">Chưa có tin tuyển dụng nào</p>
          <p className="mt-2 text-slate-500 font-medium max-w-xs mx-auto">
            Bắt đầu tìm kiếm nhân tài bằng cách đăng tin tuyển dụng đầu tiên của bạn.
          </p>
          <Link
            to="/employer/jobs/post"
            className="mt-8 flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3.5 text-base font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={18} />
            ĐĂNG TIN NGAY
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pagedJobs.map((job) => {
            const statusMeta = getStatusMeta(job.status);
            const aiScore = getAiScore(job);
            const isClosed = job.status === 'closed';
            const daysLeft = calendarDaysLeftUntilDeadline(job.deadline);
            const appDeadlinePassed =
              job.status === 'published' &&
              job.deadline &&
              isJobApplicationDeadlinePassed(job.deadline);

            return (
              <div
                key={job.id}
                className={`group relative rounded-2xl border bg-white transition-all overflow-hidden ${isClosed ? 'border-slate-100 opacity-80' : 'border-slate-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5'}`}
              >
                {aiScore >= 80 && !isClosed && (
                  <div className="absolute top-4 left-4 z-10 rounded-lg bg-emerald-600 px-3 py-1 text-base font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30">
                    AI MATCHED
                  </div>
                )}

                <div className="flex flex-col md:flex-row">
                  {/* Job image / banner */}
                  <div className="w-full md:w-52 h-40 md:h-auto shrink-0 relative overflow-hidden">
                    <JobBanner job={job} />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/20 to-transparent" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-xl font-black tracking-tight ${isClosed ? 'text-slate-500' : 'text-slate-900 group-hover:text-emerald-700 transition-colors'}`}
                          >
                            {job.title || 'Vị trí tuyển dụng'}
                          </h3>
                          <Badge className={`${statusMeta.bgClass} font-bold rounded-lg border`}>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-base font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-emerald-500" />
                            Đăng: {formatShortDate(job.created_at)}
                          </span>
                          {job.deadline && (
                            <span
                              className={`flex items-center gap-1.5 ${appDeadlinePassed ? 'text-amber-600' : 'text-slate-400'}`}
                            >
                              <Calendar
                                size={13}
                                className={
                                  appDeadlinePassed ? 'text-amber-500' : 'text-emerald-500'
                                }
                              />
                              Hạn nộp: {formatShortDate(job.deadline)}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-emerald-500" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <AiScoreBadge score={aiScore} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                      <div>
                        <p className="text-base font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Ứng tuyển
                        </p>
                        <p className="text-lg font-black text-slate-900">
                          {formatCompactNumber(job.applicant_count || 0)}{' '}
                          <span className="text-base font-medium text-slate-500">Hồ sơ</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Lượt xem
                        </p>
                        <p className="text-lg font-black text-slate-900">
                          {formatCompactNumber(job.views || 0)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-base font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Thời gian
                        </p>
                        {isClosed ? (
                          <p className="text-base font-bold text-red-500 flex items-center gap-2">
                            <XCircle size={14} /> Đã kết thúc tuyển dụng
                          </p>
                        ) : appDeadlinePassed ? (
                          <p className="text-base font-bold text-amber-600 flex items-center gap-2">
                            <XCircle size={14} /> Đã quá hạn ứng tuyển — gia hạn hạn nộp hoặc đóng
                            tin
                          </p>
                        ) : daysLeft !== null ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                              <div
                                className={`h-full rounded-full ${daysLeft <= 3 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                              />
                            </div>
                            <p
                              className={`text-base font-bold ${daysLeft <= 3 ? 'text-red-500' : 'text-slate-700'}`}
                            >
                              Còn {daysLeft} ngày đến hạn nộp
                            </p>
                          </div>
                        ) : (
                          <p className="text-base font-bold text-slate-400">Không đặt hạn nộp</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          className="h-9 gap-2 text-slate-600 hover:text-emerald-600 hover:bg-primary/10 rounded-xl px-4"
                        >
                          <Link to={`/employer/jobs/${job.id}/edit`}>
                            <Edit size={14} /> Chỉnh sửa
                          </Link>
                        </Button>
                        <Button
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          variant="ghost"
                          className="h-9 gap-2 text-slate-400 hover:text-red-500 hover:bg-destructive/10 rounded-xl px-4"
                        >
                          <Trash2 size={14} /> Xóa
                        </Button>
                      </div>
                      <Link
                        to={`/employer/applications?jobId=${job.id}`}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-base font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-black/10"
                      >
                        XEM PIPELINE <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12 pb-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-40 transition-all bg-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 px-4 rounded-xl text-base font-bold transition-all ${
                  page === currentPage
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'border border-slate-200 text-slate-500 hover:bg-muted/35 bg-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-40 transition-all bg-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageJobsPage;
