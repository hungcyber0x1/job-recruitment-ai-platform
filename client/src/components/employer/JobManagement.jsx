import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  Edit,
  Eye,
  FileText,
  Filter,
  Globe,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EmployerStatCard from './EmployerStatCard';
import { cn } from '../../utils/cn';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'published', label: 'Đang đăng' },
  { key: 'pending_review', label: 'Chờ duyệt' },
  { key: 'closed', label: 'Đã đóng' },
  { key: 'draft', label: 'Bản nháp' },
];

const TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  remote: 'Từ xa',
};

function formatShortDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('vi-VN', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Vừa đăng';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Vừa đăng';

  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Vài phút trước';
  if (hours < 24) return `${hours}h trước`;

  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function calculateResponseRate(applicants, views) {
  if (!views) return 0;
  return Math.round((applicants / views) * 100);
}

function getStatusConfig(status) {
  const configs = {
    published: {
      label: 'Đang mở',
      badgeClass: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 backdrop-blur',
      dotClass: 'bg-emerald-500 animate-pulse',
      iconClass: 'bg-emerald-500',
    },
    draft: {
      label: 'Bản nháp',
      badgeClass: 'border-amber-200/80 bg-amber-50/80 text-amber-700 backdrop-blur',
      dotClass: 'bg-amber-500',
      iconClass: 'bg-amber-500',
    },
    pending_review: {
      label: 'Chờ duyệt',
      badgeClass: 'border-sky-200/80 bg-sky-50/80 text-sky-700 backdrop-blur',
      dotClass: 'bg-sky-500 animate-pulse',
      iconClass: 'bg-sky-500',
    },
    closed: {
      label: 'Đã đóng',
      badgeClass: 'border-slate-200/80 bg-slate-100/80 text-slate-600 backdrop-blur',
      dotClass: 'bg-slate-400',
      iconClass: 'bg-slate-400',
    },
  };

  return configs[status] || configs.closed;
}

function getJobTypeLabel(type) {
  return TYPE_LABELS[type] || type || 'Chưa cập nhật loại hình';
}

function getTopJob(jobs, field) {
  return [...jobs].sort((a, b) => Number(b?.[field] || 0) - Number(a?.[field] || 0))[0] || null;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Modern Glassmorphism Stat Card
const GlassStatCard = ({ icon: Icon, label, value, sublabel, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
      icon: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
      accent: 'text-emerald-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      icon: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
      accent: 'text-blue-600',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5',
      icon: 'bg-violet-500/15 text-violet-600 border-violet-500/20',
      accent: 'text-violet-600',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5',
      icon: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
      accent: 'text-amber-600',
    },
    rose: {
      bg: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5',
      icon: 'bg-rose-500/15 text-rose-600 border-rose-500/20',
      accent: 'text-rose-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        'bg-white/80 border-white/50',
        colors.bg
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500/80">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            {sublabel && (
              <p className="text-sm text-slate-500">{sublabel}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl border',
              colors.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                trend > 0
                  ? 'bg-emerald-100/80 text-emerald-700'
                  : trend < 0
                    ? 'bg-rose-100/80 text-rose-700'
                    : 'bg-slate-100/80 text-slate-600'
              )}
            >
              <TrendingUp
                className={cn('h-3 w-3', trend < 0 && 'rotate-180')}
              />
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-slate-500">so với tuần trước</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          'absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-20 blur-2xl',
          color === 'emerald' && 'bg-emerald-500',
          color === 'blue' && 'bg-blue-500',
          color === 'violet' && 'bg-violet-500',
          color === 'amber' && 'bg-amber-500',
          color === 'rose' && 'bg-rose-500'
        )}
      />
    </motion.div>
  );
};

// Modern Filter Tab
const ModernFilterTab = ({ label, count, active, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      'relative inline-flex min-h-11 items-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-all duration-200',
      active
        ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/25'
        : 'bg-white/60 text-slate-600 hover:bg-white/90 hover:text-slate-900 border border-slate-200/50 backdrop-blur'
    )}
  >
    {label}
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-bold',
        active
          ? 'bg-white/20 text-white/90'
          : 'bg-slate-100 text-slate-500'
      )}
    >
      {count}
    </span>
  </motion.button>
);

// Modern Job Card
const ModernJobCard = ({ job, index, deletingId, onDelete }) => {
  const statusConfig = getStatusConfig(job.status);
  const applicants = Number(job.applicant_count || 0);
  const views = Number(job.views || 0);
  const vacancies = Number.parseInt(job.vacancies, 10);
  const vacanciesLabel = Number.isFinite(vacancies) && vacancies > 0
    ? `${formatCompactNumber(vacancies)} người`
    : null;
  const responseRate = calculateResponseRate(applicants, views);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95',
          'shadow-sm backdrop-blur transition-all duration-300',
          'hover:border-emerald-200/80 hover:shadow-xl hover:shadow-emerald-500/5'
        )}
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" />
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              {/* Left: Job Info */}
              <div className="flex min-w-0 flex-1 gap-4">
                {/* Company Avatar */}
                <div className="relative">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg ring-1 ring-black/10">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={cn(
                      'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white',
                      statusConfig.iconClass
                    )}
                  />
                </div>

                {/* Job Details */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">
                      {job.title || 'Vị trí tuyển dụng'}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur',
                        statusConfig.badgeClass
                      )}
                    >
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotClass)}
                      />
                      {statusConfig.label}
                    </span>
                    <Badge className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 font-semibold text-slate-600 backdrop-blur">
                      {getJobTypeLabel(job.type || job.job_type)}
                    </Badge>
                    {vacanciesLabel ? (
                      <Badge className="rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 font-semibold text-sky-700 backdrop-blur">
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Tuyển {vacanciesLabel}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        {job.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      Đăng {formatRelativeTime(job.created_at)}
                    </span>
                    {job.deadline && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-amber-500" />
                        Hạn {formatShortDate(job.deadline)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats & Actions */}
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end xl:w-64">
                {/* Response Rate */}
                <div className="hidden rounded-xl border border-slate-200/60 bg-white/90 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500/80">
                        Tỷ lệ phản hồi
                      </p>
                      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                        {responseRate}%
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50/80 text-emerald-600 ring-1 ring-emerald-500/20">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, responseRate)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  </div>
                </div>

                {/* Applicants Button */}
                <Button
                  asChild
                  className={cn(
                    'h-11 rounded-xl font-semibold shadow-sm transition-all duration-200',
                    'bg-gradient-to-r from-slate-900 to-slate-800 text-white',
                    'hover:from-emerald-600 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25'
                  )}
                >
                  <Link to={`/employer/jobs/${job.id}/applicants`}>
                    <Users className="mr-2 h-4 w-4" />
                    {formatCompactNumber(applicants)} ứng viên
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100/60 bg-slate-50/30 p-5 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200/50 bg-white/80 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50/80 text-emerald-600 ring-1 ring-emerald-500/20">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{applicants > 0 ? 'Hồ sơ đã nhận' : 'Chưa có hồ sơ'}</p>
                <p className="text-lg font-bold text-slate-900">{formatCompactNumber(applicants)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/50 bg-white/80 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50/80 text-blue-600 ring-1 ring-blue-500/20">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{views > 0 ? 'Lượt quan tâm' : 'Cần tiếp cận'}</p>
                <p className="text-lg font-bold text-slate-900">{formatCompactNumber(views)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/50 bg-white/80 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50/80 text-amber-600 ring-1 ring-amber-500/20">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{job.deadline ? 'Hạn nhận HS' : 'Chưa đặt'}</p>
                <p className="text-lg font-bold text-slate-900">
                  {job.deadline ? formatShortDate(job.deadline) : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100/60 bg-white/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur">
              <Workflow className="h-3.5 w-3.5 text-emerald-500" />
              {applicants > 0 ? `${formatCompactNumber(applicants)} hồ sơ đang theo dõi` : 'Sẵn sàng nhận hồ sơ mới'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="h-9 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-700"
            >
              <Link to={`/employer/jobs/${job.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onDelete(job.id)}
              disabled={deletingId === job.id}
              className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 hover:bg-rose-50/80 hover:text-rose-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingId === job.id ? 'Đang xóa...' : 'Xóa'}
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-slate-200/80 bg-white/80 px-4 text-sm font-medium backdrop-blur hover:bg-white"
            >
              <Link to={`/jobs/${job.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Xem tin
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Modern Sidebar Card
const SidebarCard = ({ icon: Icon, title, children, className }) => (
  <motion.div variants={fadeInUp} className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-600 ring-1 ring-emerald-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
    </div>
    <div className={cn('rounded-xl border border-slate-200/60 bg-white/90 p-4 backdrop-blur', className)}>
      {children}
    </div>
  </motion.div>
);

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, to, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'hover:from-emerald-50/80 hover:to-emerald-100/50 hover:border-emerald-200/80 hover:text-emerald-700',
    blue: 'hover:from-blue-50/80 hover:to-blue-100/50 hover:border-blue-200/80 hover:text-blue-700',
    violet: 'hover:from-violet-50/80 hover:to-violet-100/50 hover:border-violet-200/80 hover:text-violet-700',
  };

  return (
    <Link
      to={to}
      className={cn(
        'group flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-4 backdrop-blur',
        'transition-all duration-200',
        colorMap[color],
        'hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm',
          'transition-transform duration-200 group-hover:scale-110'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-current">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 group-hover:text-current">
          {description}
        </p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-current" />
    </Link>
  );
};

// Alert Card
const AlertCard = ({ title, description, type = 'info' }) => {
  const typeConfig = {
    info: {
      bg: 'bg-blue-50/80 border-blue-200/60',
      text: 'text-blue-800',
      icon: <Bell className="h-5 w-5 text-blue-500" />,
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200/60',
      text: 'text-amber-800',
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200/60',
      text: 'text-emerald-800',
      icon: <Sparkles className="h-5 w-5 text-emerald-500" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <motion.div
      variants={fadeInUp}
      className={cn('flex items-start gap-3 rounded-xl border p-4 backdrop-blur', config.bg)}
    >
      <div className="shrink-0">{config.icon}</div>
      <div>
        <p className={cn('text-sm font-semibold', config.text)}>{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
      </div>
    </motion.div>
  );
};

const JobManagement = ({ jobs = [], onDelete }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const tabCounts = useMemo(() => {
    const counts = { all: jobs.length };
    STATUS_TABS.forEach((tab) => {
      if (tab.key !== 'all') {
        counts[tab.key] = jobs.filter((job) => job.status === tab.key).length;
      }
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = activeTab === 'all' ? [...jobs] : jobs.filter((job) => job.status === activeTab);
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) || job.location?.toLowerCase().includes(query)
      );
    }
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [jobs, activeTab, searchQuery]);

  const stats = useMemo(
    () => ({
      total: jobs.length,
      published: jobs.filter((job) => job.status === 'published').length,
      totalApplicants: jobs.reduce((sum, job) => sum + Number(job.applicant_count || 0), 0),
      totalViews: jobs.reduce((sum, job) => sum + Number(job.views || 0), 0),
    }),
    [jobs]
  );

  const performanceRate = useMemo(
    () => calculateResponseRate(stats.totalApplicants, stats.totalViews),
    [stats.totalApplicants, stats.totalViews]
  );

  const openCoverage = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.published / stats.total) * 100);
  }, [stats.published, stats.total]);

  const mostViewedJob = useMemo(() => getTopJob(jobs, 'views'), [jobs]);
  const mostAppliedJob = useMemo(() => getTopJob(jobs, 'applicant_count'), [jobs]);

  const operationalNotes = useMemo(() => {
    const notes = [];
    if (stats.total === 0) {
      notes.push({
        title: 'Khởi động pipeline tuyển dụng',
        description: 'Bạn chưa có tin nào hiển thị. Hãy đăng vị trí đầu tiên để bắt đầu nhận hồ sơ.',
        type: 'success',
      });
      return notes;
    }
    if (tabCounts.pending_review > 0) {
      notes.push({
        title: `${tabCounts.pending_review} tin đang chờ duyệt`,
        description: 'Theo dõi trạng thái kiểm duyệt để đưa vị trí lên live đúng kế hoạch.',
        type: 'info',
      });
    }
    if (tabCounts.draft > 0) {
      notes.push({
        title: `${tabCounts.draft} bản nháp cần hoàn thiện`,
        description: 'Hoàn tất mô tả công việc, quyền lợi và deadline để không bị đứt nhịp tuyển dụng.',
        type: 'warning',
      });
    }
    if (false && performanceRate > 0 && performanceRate < 5) {
      notes.push({
        title: 'Tỷ lệ phản hồi đang khá thấp',
        description: 'Nên rà soát lại tiêu đề, mức lương hoặc CTA để tăng chất lượng chuyển đổi.',
        type: 'warning',
      });
    }
    if (notes.length === 0) {
      notes.push({
        title: 'Nhịp tuyển dụng đang ổn định',
        description: 'Các chỉ số chính đang cân bằng. Bạn có thể tập trung tối ưu chất lượng hồ sơ đầu vào.',
        type: 'success',
      });
    }
    return notes.slice(0, 3);
  }, [performanceRate, stats.total, tabCounts.draft, tabCounts.pending_review]);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin tuyển dụng này không?')) return;
    setDeletingId(jobId);
    try {
      if (onDelete) {
        await onDelete(jobId);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pb-20">
      {/* Modern Header Section */}
      <section className="relative overflow-hidden border-b border-slate-200/40 bg-white/60 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-1.5 font-semibold text-emerald-700 backdrop-blur">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                Employer Hub
              </Badge>
              <Badge className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-1.5 font-semibold text-slate-600 backdrop-blur">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                AI-Powered
              </Badge>
            </div>

            <div className="mt-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Quản lý tuyển dụng thông minh
              </h1>
              <p className="mt-3 text-base text-slate-600">
                Theo dõi toàn bộ tin tuyển dụng, hiệu suất ứng tuyển và các điểm cần xử lý trong cùng một không gian làm việc chuyên nghiệp.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <EmployerStatCard
              icon={Briefcase}
              label="Tổng tin tuyển dụng"
              value={stats.total}
              sublabel={`${stats.published} tin đang mở`}
              color="emerald"
            />
            <EmployerStatCard
              icon={Users}
              label="Tổng ứng viên"
              value={formatCompactNumber(stats.totalApplicants)}
              sublabel="Hồ sơ đã nhận"
              color="blue"
            />
            <EmployerStatCard
              icon={Eye}
              label="Lượt xem tin"
              value={formatCompactNumber(stats.totalViews)}
              sublabel="Mức quan tâm"
              color="violet"
            />
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <Card className="flex-1 border-slate-200/60 bg-white/90 backdrop-blur">
              <CardContent className="p-3">
                <form onSubmit={(event) => event.preventDefault()} className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Tìm theo tên vị trí hoặc địa điểm..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-12 rounded-xl border-transparent bg-transparent pl-12 pr-4 shadow-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </form>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                asChild
                className={cn(
                  'h-12 rounded-xl font-semibold shadow-sm',
                  'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white',
                  'hover:from-emerald-500 hover:to-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25'
                )}
              >
                <Link to="/employer/jobs/post">
                  <Plus className="mr-2 h-5 w-5" />
                  Đăng tin mới
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-slate-200/80 bg-white/80 font-semibold backdrop-blur hover:bg-white"
              >
                <Link to="/employer/reports">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Báo cáo
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <ModernFilterTab
                  key={tab.key}
                  label={tab.label}
                  count={tabCounts[tab.key] || 0}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>

            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Xóa tìm kiếm: "{searchQuery}"
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Job List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Danh sách tin tuyển dụng</h2>
                <span className="rounded-full bg-slate-100/80 px-3 py-1 text-sm font-medium text-slate-600 backdrop-blur">
                  {filteredJobs.length} tin
                </span>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <Card className="overflow-hidden border-2 border-dashed border-slate-200/60 bg-white/90 backdrop-blur">
                <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 backdrop-blur">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {jobs.length === 0 ? 'Chưa có tin tuyển dụng nào' : 'Không tìm thấy tin phù hợp'}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                    {jobs.length === 0
                      ? 'Bắt đầu xây dựng pipeline tuyển dụng bằng cách đăng vị trí đầu tiên của doanh nghiệp.'
                      : 'Bộ lọc hiện tại chưa trả về kết quả. Hãy thử đổi tab trạng thái hoặc xóa từ khóa tìm kiếm.'}
                  </p>
                  <Button
                    asChild
                    className="mt-6 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-400"
                  >
                    <Link to="/employer/jobs/post">
                      <Plus className="mr-2 h-5 w-5" />
                      Đăng tin ngay
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job, index) => (
                    <ModernJobCard
                      key={job.id}
                      job={job}
                      index={index}
                      deletingId={deletingId}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Performance Overview */}
            <SidebarCard icon={Target} title="Hiệu suất tuyển dụng">
              <div className="space-y-4">
                {/* Response Rate */}
                <div className="hidden rounded-xl border border-slate-200/50 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Tỷ lệ phản hồi</p>
                    <span className="text-lg font-bold text-slate-900">{performanceRate}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, performanceRate)}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Mức chuyển đổi từ lượt xem sang hồ sơ</p>
                </div>

                {/* Open Coverage */}
                <div className="rounded-xl border border-slate-200/50 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Độ phủ tin đang mở</p>
                    <span className="text-lg font-bold text-slate-900">{openCoverage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, openCoverage)}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    />
                  </div>
                </div>

                {/* Top Jobs */}
                {mostViewedJob && (
                  <div className="rounded-xl border border-slate-200/50 bg-slate-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500/80">
                      Tin có lượt xem cao nhất
                    </p>
                    <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-900">
                      {mostViewedJob.title}
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-600">
                      {formatCompactNumber(mostViewedJob.views || 0)} lượt xem
                    </p>
                  </div>
                )}

                {mostAppliedJob && (
                  <div className="rounded-xl border border-slate-200/50 bg-slate-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500/80">
                      Tin nhận nhiều hồ sơ nhất
                    </p>
                    <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-900">
                      {mostAppliedJob.title}
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-600">
                      {formatCompactNumber(mostAppliedJob.applicant_count || 0)} hồ sơ
                    </p>
                  </div>
                )}
              </div>
            </SidebarCard>

            {/* Operational Notes */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <AlertCircle className="h-5 w-5 text-emerald-500" />
                Gợi ý vận hành
              </h3>
              <AnimatePresence mode="popLayout">
                {operationalNotes.map((note) => (
                  <AlertCard
                    key={note.title}
                    title={note.title}
                    description={note.description}
                    type={note.type}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <SidebarCard icon={Zap} title="Hành động nhanh">
              <div className="space-y-2">
                <QuickActionCard
                  icon={Plus}
                  title="Đăng tin mới"
                  description="Tạo JD và đưa vị trí mới vào pipeline"
                  to="/employer/jobs/post"
                  color="emerald"
                />
                <QuickActionCard
                  icon={Users}
                  title="Quản lý ứng viên"
                  description="Xem, lọc và cập nhật trạng thái hồ sơ"
                  to="/employer/applications"
                  color="blue"
                />
                <QuickActionCard
                  icon={BarChart3}
                  title="Báo cáo tuyển dụng"
                  description="Theo dõi chất lượng nguồn ứng viên"
                  to="/employer/reports"
                  color="violet"
                />
              </div>
            </SidebarCard>
          </motion.aside>
        </div>
      </main>
    </div>
  );
};

GlassStatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sublabel: PropTypes.string,
  trend: PropTypes.number,
  color: PropTypes.string,
};

GlassStatCard.defaultProps = {
  sublabel: '',
  trend: undefined,
  color: 'emerald',
};

ModernFilterTab.propTypes = {
  label: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

ModernFilterTab.defaultProps = {
  active: false,
};

ModernJobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string,
    location: PropTypes.string,
    type: PropTypes.string,
    job_type: PropTypes.string,
    vacancies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
    applicant_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    views: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    created_at: PropTypes.string,
    deadline: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  deletingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onDelete: PropTypes.func.isRequired,
};

ModernJobCard.defaultProps = {
  deletingId: null,
};

SidebarCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

SidebarCard.defaultProps = {
  icon: null,
  title: '',
  children: null,
  className: '',
};

QuickActionCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  color: PropTypes.string,
};

QuickActionCard.defaultProps = {
  color: 'emerald',
};

AlertCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  type: PropTypes.string,
};

AlertCard.defaultProps = {
  type: 'info',
};

JobManagement.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      location: PropTypes.string,
      type: PropTypes.string,
      job_type: PropTypes.string,
      vacancies: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      applicant_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      views: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      created_at: PropTypes.string,
      deadline: PropTypes.string,
    })
  ),
  onDelete: PropTypes.func,
};

JobManagement.defaultProps = {
  jobs: [],
  onDelete: null,
};

export default JobManagement;
