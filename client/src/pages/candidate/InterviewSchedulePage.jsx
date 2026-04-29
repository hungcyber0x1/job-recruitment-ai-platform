import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Monitor,
  Phone,
  Sparkles,
  Video,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotification } from '@/context/NotificationContext';
import { applicationService } from '@/services';
import { cn } from '@/utils';

const STATUS_CONFIG = {
  scheduled: {
    label: 'Đã lên lịch',
    icon: CheckCircle2,
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  },
  no_show: {
    label: 'Vắng mặt',
    icon: AlertCircle,
    accent: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    iconBox: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  completed: {
    label: 'Đã hoàn thành',
    icon: CheckCircle2,
    accent: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-700 ring-slate-200',
    iconBox: 'bg-slate-50 text-slate-600 ring-slate-100',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: XCircle,
    accent: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    iconBox: 'bg-red-50 text-red-600 ring-red-100',
  },
};

function formatDate(dateStr) {
  if (!dateStr) return 'Chưa xác định';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định';
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '--/--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '--/--';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return 'Chưa xác định';
  return String(timeStr).slice(0, 5);
}

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
}

function getInterviewTypeMeta(type) {
  if (type === 'phone') {
    return {
      label: 'Điện thoại',
      icon: Phone,
    };
  }

  if (type === 'offline') {
    return {
      label: 'Trực tiếp',
      icon: MapPin,
    };
  }

  return {
    label: 'Trực tuyến',
    icon: Video,
  };
}

function normalizeInterview(interview) {
  const scheduledAt = interview.scheduled_at || interview.interview_scheduled_at || interview.interview_date;
  return {
    ...interview,
    application_id: interview.application_id || interview.id,
    job_id: interview.job_id,
    job_title: interview.job_title || interview.job?.title || 'Vị trí đang cập nhật',
    company_name:
      interview.company_name || interview.company?.name || interview.job?.company_name || 'Công ty đang cập nhật',
    company_logo: interview.company_logo || interview.company?.logo || interview.job?.company_logo,
    status: interview.status || 'scheduled',
    interview_date: scheduledAt,
    interview_time:
      interview.interview_time || (scheduledAt && String(scheduledAt).includes('T') ? String(scheduledAt).slice(11, 16) : ''),
    interview_type: interview.interview_type || (interview.meeting_link ? 'online' : 'offline'),
    location:
      interview.interview_type === 'online'
        ? ''
        : interview.interview_location || interview.location || interview.job?.location || '',
    meeting_link:
      interview.meeting_link ||
      interview.interview_link ||
      (interview.interview_type === 'online' ? interview.location : null),
    notes: interview.candidate_note || interview.interview_notes || interview.notes,
  };
}

function parseInterviewDateTime(interview) {
  if (!interview.interview_date) return null;
  const rawDate = String(interview.interview_date);
  const direct = new Date(rawDate);
  if (rawDate.includes('T') && !Number.isNaN(direct.getTime())) return direct;

  const time = interview.interview_time && /^\d{1,2}:\d{2}/.test(interview.interview_time)
    ? interview.interview_time
    : '00:00';
  const composed = new Date(`${rawDate.slice(0, 10)}T${time}`);
  if (!Number.isNaN(composed.getTime())) return composed;
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function isToday(date) {
  if (!date) return false;
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

const StatCard = ({ icon: Icon, label, value, helper, tone }) => (
  <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-bold leading-none text-slate-950">{value}</div>
          <div className="mt-1 text-sm font-bold text-slate-700">{label}</div>
          <div className="mt-0.5 text-xs font-medium text-slate-500">{helper}</div>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset', tone)}>
          <Icon size={18} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FilterTabs = ({ value, onChange, upcomingCount, pastCount }) => {
  const tabs = [
    { value: 'upcoming', label: 'Sắp tới', count: upcomingCount },
    { value: 'past', label: 'Đã qua', count: pastCount },
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-md px-4 text-sm font-bold transition-colors duration-200',
              active
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const InterviewSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="p-5">
      <div className="flex gap-4">
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

const InterviewCard = ({ interview }) => {
  const statusConfig = getStatusConfig(interview.status);
  const StatusIcon = statusConfig.icon;
  const typeMeta = getInterviewTypeMeta(interview.interview_type);
  const TypeIcon = typeMeta.icon;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
      <div className={cn('absolute inset-y-0 left-0 w-1', statusConfig.accent)} />
      <div className="p-5 pl-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-inset', statusConfig.iconBox)}>
              {interview.company_logo ? (
                <img src={interview.company_logo} alt={interview.company_name} className="h-full w-full object-cover" />
              ) : (
                <CalendarDays className="h-6 w-6" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset', statusConfig.badge)}>
                  <StatusIcon size={13} />
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                  <TypeIcon size={13} />
                  {typeMeta.label}
                </span>
              </div>

              <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-tight tracking-normal text-slate-950 group-hover:text-emerald-700">
                {interview.job_title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Building2 size={14} />
                <span className="truncate">{interview.company_name}</span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CalendarDays size={14} />
                    Ngày phỏng vấn
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatDate(interview.interview_date)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Clock size={14} />
                    Thời gian
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-800">{formatTime(interview.interview_time)}</p>
                </div>
              </div>

              {interview.location && (
                <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-100">
                  <MapPin size={13} />
                  <span className="truncate">{interview.location}</span>
                </div>
              )}

              {interview.notes && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
                  {interview.notes}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
            {interview.meeting_link && (
              <Button asChild className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700">
                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  Vào phòng
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="h-10 rounded-lg px-4 text-sm font-bold">
              <Link to="/candidate/applications">
                Xem pipeline
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

const EmptyState = ({ filter }) => (
  <Card className="rounded-lg border-dashed border-slate-300 bg-white shadow-sm">
    <CardContent className="px-6 py-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
        <Calendar className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">
        {filter === 'upcoming' ? 'Không có lịch phỏng vấn sắp tới' : 'Không có lịch phỏng vấn đã qua'}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
        {filter === 'upcoming'
          ? 'Tiếp tục ứng tuyển và theo dõi pipeline để nhận lời mời phỏng vấn từ nhà tuyển dụng.'
          : 'Các lịch phỏng vấn đã hoàn thành hoặc đã qua thời gian sẽ được lưu tại đây.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild className="rounded-lg bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700">
          <Link to="/candidate/jobs">Tìm việc ngay</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-lg px-5 font-bold">
          <Link to="/candidate/interview-prep">Chuẩn bị phỏng vấn</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PrepChecklist = () => (
  <Card className="mt-8 rounded-lg border-slate-200 bg-white shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-950">Checklist chuẩn bị nhanh</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Một vài việc nên hoàn tất trước buổi phỏng vấn.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[
          'Nghiên cứu công ty và mô tả công việc.',
          'Chuẩn bị CV, portfolio và ví dụ dự án liên quan.',
          'Kiểm tra camera, micro và đường truyền trước 15 phút.',
          'Ghi lại câu hỏi muốn trao đổi với nhà tuyển dụng.',
        ].map((item, index) => (
          <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">
              {index + 1}
            </span>
            <p className="text-sm font-medium text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const InterviewSchedulePage = () => {
  const { showNotification } = useNotification();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const res = await applicationService.getMyInterviews();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setInterviews(list.map(normalizeInterview));
      } catch (error) {
        console.error('Failed to fetch interviews:', error);
        showNotification('Không thể tải lịch phỏng vấn', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [showNotification]);

  const { upcomingInterviews, pastInterviews } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    interviews.forEach((interview) => {
      const date = parseInterviewDateTime(interview);
      const isClosed =
        interview.status === 'completed' ||
        interview.status === 'cancelled' ||
        interview.status === 'no_show';
      if (isClosed || (date && date < now)) {
        past.push(interview);
      } else {
        upcoming.push(interview);
      }
    });

    upcoming.sort((a, b) => {
      const dateA = parseInterviewDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = parseInterviewDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
    past.sort((a, b) => {
      const dateA = parseInterviewDateTime(a)?.getTime() ?? 0;
      const dateB = parseInterviewDateTime(b)?.getTime() ?? 0;
      return dateB - dateA;
    });

    return { upcomingInterviews: upcoming, pastInterviews: past };
  }, [interviews]);

  const filteredInterviews = filter === 'upcoming' ? upcomingInterviews : pastInterviews;
  const todayCount = upcomingInterviews.filter((interview) => isToday(parseInterviewDateTime(interview))).length;
  const onlineCount = upcomingInterviews.filter((interview) => interview.interview_type === 'online').length;
  const nextInterview = upcomingInterviews[0];

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-12">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <Calendar className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Trung tâm phỏng vấn
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">Lịch phỏng vấn</h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Theo dõi các buổi phỏng vấn đã được nhà tuyển dụng sắp xếp và chuẩn bị đúng thời điểm.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/80 bg-white/85 p-3 shadow-sm lg:min-w-[300px]">
              <div className="text-xs font-semibold text-slate-500">Lịch gần nhất</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {nextInterview ? nextInterview.job_title : 'Chưa có lịch mới'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {nextInterview ? `${formatShortDate(nextInterview.interview_date)} · ${formatTime(nextInterview.interview_time)}` : 'Pipeline sẽ cập nhật khi có lời mời'}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <Bell size={17} />
                </div>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Sắp tới"
                value={upcomingInterviews.length}
                helper="Lịch cần chuẩn bị"
                tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
              />
              <StatCard
                icon={Bell}
                label="Hôm nay"
                value={todayCount}
                helper="Cần ưu tiên"
                tone="bg-amber-50 text-amber-600 ring-amber-100"
              />
              <StatCard
                icon={Monitor}
                label="Trực tuyến"
                value={onlineCount}
                helper="Có meeting link"
                tone="bg-sky-50 text-sky-600 ring-sky-100"
              />
              <StatCard
                icon={CheckCircle2}
                label="Đã qua"
                value={pastInterviews.length}
                helper="Lịch hoàn tất"
                tone="bg-violet-50 text-violet-600 ring-violet-100"
              />
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs
            value={filter}
            onChange={setFilter}
            upcomingCount={upcomingInterviews.length}
            pastCount={pastInterviews.length}
          />
          <Button asChild variant="outline" className="h-10 rounded-lg font-bold">
            <Link to="/candidate/interview-prep">
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
              Chuẩn bị phỏng vấn
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <InterviewSkeleton key={item} />
            ))}
          </div>
        ) : filteredInterviews.length > 0 ? (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => (
              <InterviewCard
                key={interview.id || `${interview.application_id}-${interview.interview_date}-${interview.interview_time}`}
                interview={interview}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}

        {upcomingInterviews.length > 0 && <PrepChecklist />}
      </main>
    </div>
  );
};

export default InterviewSchedulePage;
