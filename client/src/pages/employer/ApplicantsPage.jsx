import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Target,
  Users,
  Workflow,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { cn } from '../../utils/cn';
import applicationService from '../../services/applicationService';
import jobService from '../../services/jobService';
import {
  APPLICATION_STATUS,
  canTransitionApplicationStatus,
  getNextApplicationStatuses,
  getStatusLabel,
  normalizeApplicationStatus,
} from '../../constants/status';
import employerCandidateService from '../../services/employerCandidateService';
import InterviewScheduleDialog from '../../components/employer/InterviewScheduleDialog';
import OfferDialog from '../../components/employer/OfferDialog';

// ─────────────────────────────────────────────
// Kanban columns — 6 pipeline stages
// ─────────────────────────────────────────────
const KANBAN_COLUMNS = [
  {
    id: APPLICATION_STATUS.SUBMITTED,
    label: 'Đã nộp',
    subtitle: 'Hồ sơ mới cần được xem',
    accent: 'bg-amber-400',
    pipelineGroup: 'active',
  },
  {
    id: APPLICATION_STATUS.SHORTLISTED,
    label: 'Phù hợp SB',
    subtitle: 'Ứng viên tiềm năng',
    accent: 'bg-violet-400',
    pipelineGroup: 'active',
  },
  {
    id: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    label: 'Lịch PV',
    subtitle: 'Đã lên lịch phỏng vấn',
    accent: 'bg-emerald-400',
    pipelineGroup: 'interview',
  },
  {
    id: APPLICATION_STATUS.INTERVIEWED,
    label: 'Đã PV',
    subtitle: 'Chờ đánh giá tiếp theo',
    accent: 'bg-teal-400',
    pipelineGroup: 'interview',
  },
  {
    id: APPLICATION_STATUS.OFFERED,
    label: 'Đề nghị',
    subtitle: 'Đã gửi đề nghị tuyển dụng',
    accent: 'bg-emerald-500',
    pipelineGroup: 'success',
  },
  {
    id: APPLICATION_STATUS.HIRED,
    label: 'Đã tuyển',
    subtitle: 'Hồ sơ đã chốt thành công',
    accent: 'bg-emerald-600',
    pipelineGroup: 'success',
  },
];

const REJECTED_COLUMN = {
  id: APPLICATION_STATUS.REJECTED,
  label: 'Đã từ chối',
  subtitle: 'Không tiếp tục xử lý',
  accent: 'bg-red-400',
  pipelineGroup: 'closed',
};

const WITHDRAWN_COLUMN = {
  id: APPLICATION_STATUS.WITHDRAWN,
  label: 'Đã rút',
  subtitle: 'Ứng viên chủ động dừng',
  accent: 'bg-slate-400',
  pipelineGroup: 'closed',
};

const ALL_PIPELINE_COLUMNS = [...KANBAN_COLUMNS, REJECTED_COLUMN, WITHDRAWN_COLUMN];

const COLUMN_GROUP_META = {
  active: {
    label: 'Đầu vào',
    tagClass: 'bg-slate-100 text-slate-600',
    iconClass: 'bg-slate-100 text-slate-700 ring-slate-200',
    laneClass: 'border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]',
    emptyClass: 'border-slate-200 bg-slate-50/80 text-slate-400',
  },
  interview: {
    label: 'Phỏng vấn',
    tagClass: 'bg-emerald-50 text-emerald-700',
    iconClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    laneClass: 'border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)]',
    emptyClass: 'border-emerald-100 bg-emerald-50/70 text-emerald-500/80',
  },
  success: {
    label: 'Kết quả',
    tagClass: 'bg-violet-50 text-violet-700',
    iconClass: 'bg-violet-50 text-violet-700 ring-violet-100',
    laneClass: 'border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)]',
    emptyClass: 'border-violet-100 bg-violet-50/70 text-violet-500/80',
  },
  closed: {
    label: 'Đã đóng',
    tagClass: 'bg-rose-50 text-rose-700',
    iconClass: 'bg-rose-50 text-rose-700 ring-rose-100',
    laneClass: 'border-rose-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff1f2_100%)]',
    emptyClass: 'border-rose-100 bg-rose-50/70 text-rose-500/80',
  },
};

const CLOSED_STATUSES = new Set([APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN]);

const LOCKED_STATUSES = new Set([APPLICATION_STATUS.HIRED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN]);

const QUICK_ACTION_PRIORITY = [
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
  APPLICATION_STATUS.OFFERED,
  APPLICATION_STATUS.HIRED,
];

const QUICK_ACTION_META = {
  [APPLICATION_STATUS.SHORTLISTED]: {
    icon: Star,
    label: 'Rút gọn',
    className: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100',
  },
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: {
    icon: Users,
    label: 'Lịch PV',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
  },
  [APPLICATION_STATUS.INTERVIEWED]: {
    icon: Workflow,
    label: 'Đã PV',
    className: 'border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100',
  },
  [APPLICATION_STATUS.OFFERED]: {
    icon: Briefcase,
    label: 'Tạo đề nghị',
    className: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100',
  },
  [APPLICATION_STATUS.HIRED]: {
    icon: Target,
    label: 'Đã tuyển',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
  },
};

const DRAG_STATE_STYLES = {
  allowed: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  },
  blocked: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    panel: 'border-rose-200 bg-rose-50/80 text-rose-700',
  },
  current: {
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
    panel: 'border-slate-200 bg-slate-50 text-slate-600',
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getApplicantStatusBadgeClass = (status) => {
  if ([APPLICATION_STATUS.OFFERED, APPLICATION_STATUS.HIRED].includes(status)) {
    return 'border-violet-200 bg-violet-50 text-violet-700';
  }

  if ([APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.INTERVIEWED].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === APPLICATION_STATUS.SHORTLISTED) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === APPLICATION_STATUS.REJECTED || status === APPLICATION_STATUS.WITHDRAWN) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const parseSkills = (app) => {
  if (Array.isArray(app.skills)) {
    return app.skills
      .map((skill) => (typeof skill === 'string' ? skill : skill?.name))
      .filter(Boolean);
  }
  if (typeof app.skills_csv === 'string') {
    return app.skills_csv.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (typeof app.matched_skills === 'string') {
    try {
      const parsed = JSON.parse(app.matched_skills);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getCandidateName = (app) =>
  app.candidate_name ||
  [app.first_name, app.last_name].filter(Boolean).join(' ').trim() ||
  app.name ||
  app.email ||
  'Ứng viên';

const getQuickActionStatuses = (status) => {
  const normalizedStatus = normalizeApplicationStatus(status);
  const nextStatuses = getNextApplicationStatuses(normalizedStatus).filter(
    (candidateStatus) => candidateStatus !== normalizedStatus && !CLOSED_STATUSES.has(candidateStatus)
  );
  return QUICK_ACTION_PRIORITY.filter((candidateStatus) => nextStatuses.includes(candidateStatus)).slice(0, 2);
};

const getColumnDropState = (activeApp, targetStatus) => {
  if (!activeApp) return null;
  const currentStatus = normalizeApplicationStatus(activeApp.status);
  if (currentStatus === targetStatus) {
    return { state: 'current', label: 'Đang ở cột này', helper: '' };
  }
  if (!canTransitionApplicationStatus(currentStatus, targetStatus)) {
    return { state: 'blocked', label: 'Không thể thả vào đây', helper: '' };
  }
  const helperByStatus = {
    [APPLICATION_STATUS.SHORTLISTED]: 'Thả để đưa vào danh sách rút gọn.',
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: 'Thả để mở bước lên lịch phỏng vấn.',
    [APPLICATION_STATUS.INTERVIEWED]: 'Thả để xác nhận đã hoàn thành vòng phỏng vấn.',
    [APPLICATION_STATUS.OFFERED]: 'Thả để mở bước tạo đề nghị tuyển dụng.',
    [APPLICATION_STATUS.HIRED]: 'Thả để chốt tuyển thành công.',
    [APPLICATION_STATUS.REJECTED]: 'Thả để từ chối hồ sơ.',
    [APPLICATION_STATUS.WITHDRAWN]: 'Thả để ghi nhận hồ sơ đã rút.',
  };
  return {
    state: 'allowed',
    label: `Có thể chuyển`,
    helper: helperByStatus[targetStatus] || '',
  };
};

const normalizeApplication = (app, job = {}) => {
  const rawStatus = app.status || APPLICATION_STATUS.SUBMITTED;
  const status = normalizeApplicationStatus(rawStatus);
  return {
    ...app,
    rawStatus,
    status,
    jobTitle: job.title || job.job_title || app.job_title || 'Chưa rõ vị trí',
    jobId: job.id,
    role: job.title || job.job_title || app.job_title || 'Chưa rõ vị trí',
    appliedDate: (app.applied_at || app.created_at)
      ? new Date(app.applied_at || app.created_at).toLocaleDateString('vi-VN')
      : '',
    name: getCandidateName(app),
    skills: parseSkills(app),
    statusNote: rawStatus !== status ? `Chuẩn hóa từ ${rawStatus}` : app.statusNote,
  };
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function formatCompactNumber(value) {
  return new Intl.NumberFormat('vi-VN', {
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function getColumnGroupMeta(column) {
  return COLUMN_GROUP_META[column.pipelineGroup] || COLUMN_GROUP_META.active;
}

// ─────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────
const StageTabButton = ({ tab, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors duration-200',
      active
        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
    )}
  >
    <span className={cn('h-2 w-2 rounded-full', tab.accent || 'bg-slate-400')} />
    <span>{tab.label}</span>
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
        active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
      )}
    >
      {count ?? 0}
    </span>
  </button>
);

const getQuickActionIconClass = (tone) => {
  if (tone === 'emerald') return 'text-emerald-600';
  if (tone === 'blue') return 'text-sky-600';
  if (tone === 'amber') return 'text-amber-600';
  if (tone === 'violet') return 'text-violet-600';
  return 'text-slate-500';
};

const QuickActionItem = ({ icon: Icon, title, to, onClick, tone }) => {
  const ActionIcon = Icon || ArrowRight;
  const isPrimary = tone === 'emerald';
  const className = cn(
    'h-11 justify-start rounded-xl px-4 text-sm font-semibold shadow-sm shadow-slate-950/[0.03]',
    isPrimary
      ? 'border-slate-950 bg-slate-950 text-white hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
      : 'border-slate-200/90 bg-white/90 text-slate-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700'
  );

  if (to) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link to={to}>
          <ActionIcon className={cn('mr-2 h-4 w-4', isPrimary ? 'text-white' : getQuickActionIconClass(tone))} />
          {title}
        </Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={onClick} className={className}>
      <ActionIcon className={cn('mr-2 h-4 w-4', isPrimary ? 'text-white' : getQuickActionIconClass(tone))} />
      {title}
    </Button>
  );
};

// ─────────────────────────────────────────────
// Applicant Card
// ─────────────────────────────────────────────
function ApplicantCard({ app, onStatusChange, isDragging, onBookmark, isBusy }) {
  const quickActions = getQuickActionStatuses(app.status);
  const canReject = canTransitionApplicationStatus(app.status, APPLICATION_STATUS.REJECTED);
  const isDraggable = !isBusy && !LOCKED_STATUSES.has(app.status);
  const stopPointer = (event) => event.stopPropagation();

  return (
    <article
      className={cn(
        'select-none rounded-lg border bg-white p-4 shadow-sm transition-all',
        isDragging
          ? 'scale-[1.02] rotate-1 border-emerald-400/60 bg-emerald-50/70 shadow-[0_18px_50px_rgba(16,185,129,0.12)]'
          : cn('border-slate-200', isDraggable ? 'cursor-grab hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40 active:cursor-grabbing' : 'cursor-default'),
        isBusy ? 'opacity-75' : ''
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-base font-bold text-white uppercase shadow-sm shadow-emerald-900/10">
          {app.name?.charAt(0) ?? '?'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">{app.name || 'Ứng viên'}</p>
              <p className="truncate text-sm font-medium text-slate-500">{app.role || app.jobTitle || 'Đang chờ gắn vị trí'}</p>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold',
                getApplicantStatusBadgeClass(app.status)
              )}
            >
              <Briefcase className="h-3 w-3" />
              Đang xử lý
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          <Briefcase className="h-3 w-3" />
          {app.jobTitle || 'Vị trí chưa rõ'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          <FileText className="h-3 w-3" />
          {app.appliedDate || 'Vừa nộp'}
        </span>
        {app.email ? (
          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
            <span className="truncate">{app.email}</span>
          </span>
        ) : null}
      </div>

      {app.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {app.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      )}

      {app.statusNote ? (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {app.statusNote}
        </div>
      ) : null}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {quickActions.map((targetStatus) => {
              const actionMeta = QUICK_ACTION_META[targetStatus];
              if (!actionMeta) return null;
              const ActionIcon = actionMeta.icon;
              return (
                <button
                  key={targetStatus}
                  type="button"
                  disabled={isBusy}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                    actionMeta.className
                  )}
                  title={actionMeta.label}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusChange(app.id, targetStatus);
                  }}
                  onPointerDown={stopPointer}
                >
                  <ActionIcon size={13} />
                  {actionMeta.label}
                </button>
              );
            })}
            {canReject && (
              <button
                type="button"
                disabled={isBusy}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(event) => {
                  event.stopPropagation();
                  const reason = window.prompt(
                    `Từ chối ứng viên "${app.name}"?\n\nNhập lý do từ chối (không bắt buộc, nhấn OK để xác nhận):`
                  );
                  if (reason !== null) {
                    onStatusChange(app.id, APPLICATION_STATUS.REJECTED, reason || 'Không đạt yêu cầu');
                  }
                }}
                onPointerDown={stopPointer}
              >
                <XCircle size={13} />
                Từ chối
              </button>
            )}
            {isBusy ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang cập nhật
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <Link
              to={`/employer/applications/${app.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title="Xem hồ sơ"
              onPointerDown={stopPointer}
            >
              <FileText size={13} />
            </Link>
            <button
              type="button"
              disabled={isBusy}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Lưu hồ sơ"
              onClick={(event) => { event.stopPropagation(); onBookmark?.(app.id); }}
              onPointerDown={stopPointer}
            >
              <Bookmark size={13} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────
// Sortable wrapper
// ─────────────────────────────────────────────
function SortableApplicantCard({ app, onStatusChange, onBookmark, isBusy }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    disabled: isBusy || LOCKED_STATUSES.has(app.status),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <ApplicantCard
        app={app}
        onStatusChange={onStatusChange}
        isDragging={isDragging}
        onBookmark={onBookmark}
        isBusy={isBusy}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Kanban Column (compact)
// ─────────────────────────────────────────────
function KanbanColumn({
  column,
  apps,
  onStatusChange,
  onBookmark,
  dragState,
  isDragActive,
  transitioningIds,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const groupMeta = getColumnGroupMeta(column);
  const dragStyles = dragState ? DRAG_STATE_STYLES[dragState.state] || DRAG_STATE_STYLES.current : null;
  const isBlockedColumn = isDragActive && dragState?.state === 'blocked';

  return (
    <div className="flex min-w-[268px] max-w-[288px] flex-col">
      <div className="mb-2 rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', column.accent)} />
            <p className="text-xs font-bold text-slate-900">{column.label}</p>
          </div>
          <span className="inline-flex min-w-[22px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">
            {apps.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl border p-2.5 shadow-sm transition-colors',
          groupMeta.laneClass,
          isOver && dragState?.state === 'allowed' && 'border-emerald-300 bg-emerald-50/60',
          isBlockedColumn && 'opacity-70'
        )}
      >
        <SortableContext items={apps.map((app) => app.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[120px] space-y-2">
            {isDragActive && dragState ? (
              <div className={cn('rounded-lg border px-3 py-2 text-xs shadow-sm', dragStyles?.panel)}>
                <p className="font-semibold">{dragState.label}</p>
                {dragState.helper ? <p className="mt-1 leading-4 opacity-80">{dragState.helper}</p> : null}
              </div>
            ) : null}

            {apps.map((app) => (
              <SortableApplicantCard
                key={app.id}
                app={app}
                onStatusChange={onStatusChange}
                onBookmark={onBookmark}
                isBusy={transitioningIds.has(String(app.id))}
              />
            ))}

            {apps.length === 0 && (
              <div className={cn('flex min-h-[80px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center', groupMeta.emptyClass)}>
                <p className="text-xs font-semibold">
                  {isDragActive && dragState ? dragState.label : 'Kéo thả vào đây'}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const ApplicantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'pipeline';
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showRejected, setShowRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadIssue, setLoadIssue] = useState(null);
  const [selectedJob, setSelectedJob] = useState(() => searchParams.get('jobId') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [activeStatusFilter, setActiveStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [activeId, setActiveId] = useState(null);
  const [transitioningIds, setTransitioningIds] = useState(() => new Set());
  const [pendingStage, setPendingStage] = useState(null);
  const [dialogType, setDialogType] = useState(null);
  const pendingStageRef = useRef(null);

  const { showNotification } = useNotification();

  const columns = useMemo(() => {
    if (!showRejected && !CLOSED_STATUSES.has(activeStatusFilter)) return KANBAN_COLUMNS;
    return [...KANBAN_COLUMNS, REJECTED_COLUMN, WITHDRAWN_COLUMN];
  }, [activeStatusFilter, showRejected]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setLoadIssue(null);
    try {
      const jobsRes = await jobService.getMyJobs();
      const myJobs = Array.isArray(jobsRes.data?.data) ? jobsRes.data.data : [];
      setJobs(myJobs);
      if (!myJobs.length) { setApplicants([]); return; }

      const appResponses = await Promise.allSettled(myJobs.map((job) => applicationService.getJobApplications(job.id)));
      const failedJobs = [];
      const allApps = appResponses.flatMap((response, index) => {
        const job = myJobs[index];
        if (response.status !== 'fulfilled') {
          console.error(`Failed to fetch applicants for job ${job.id}`, response.reason);
          failedJobs.push(job.title || `Job #${job.id}`);
          return [];
        }
        const jobApps = Array.isArray(response.value.data?.data) ? response.value.data.data : [];
        return jobApps.map((app) => normalizeApplication(app, job));
      });
      setApplicants(allApps);
      if (failedJobs.length > 0) {
        const isAllFailed = failedJobs.length === myJobs.length;
        setLoadIssue({
          tone: isAllFailed ? 'error' : 'warning',
          message: isAllFailed
            ? 'Không tải được ứng viên. Backend có thể đang thiếu dữ liệu hoặc migration.'
            : `Có ${failedJobs.length}/${myJobs.length} vị trí chưa tải được.`,
          detail: failedJobs.slice(0, 3).join(', ') + (failedJobs.length > 3 ? '...' : ''),
        });
        showNotification(
          isAllFailed
            ? 'Không tải được ứng viên. Backend có thể đang thiếu dữ liệu.'
            : `Có ${failedJobs.length} vị trí chưa tải được.`,
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to fetch applicants', error);
      const status = error?.response?.status;
      setApplicants([]);
      setLoadIssue({
        tone: 'error',
        message: status === 401 ? 'Phiên đăng nhập đã hết hạn.' : 'Không tải được danh sách ứng viên.',
        detail: status === 401 ? 'Vui lòng đăng nhập lại.' : error?.response?.data?.message || '',
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => { loadApplicants(); }, [loadApplicants]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (viewMode === 'list') nextParams.set('view', 'list');
    if (selectedJob !== 'all') nextParams.set('jobId', selectedJob);
    if (searchQuery.trim()) nextParams.set('search', searchQuery.trim());
    if (activeStatusFilter !== 'all') nextParams.set('status', activeStatusFilter);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeStatusFilter, searchParams, searchQuery, selectedJob, setSearchParams, viewMode]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const switchViewMode = useCallback(
    (nextViewMode) => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextViewMode === 'list') {
        nextParams.set('view', 'list');
      } else {
        nextParams.delete('view');
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const baseFiltered = useMemo(() => applicants.filter((app) => {
    if (selectedJob !== 'all' && String(app.jobId) !== String(selectedJob)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.jobTitle?.toLowerCase().includes(q) ||
      app.skills?.some((s) => s.toLowerCase().includes(q))
    );
  }), [applicants, searchQuery, selectedJob]);

  const filtered = useMemo(
    () =>
      activeStatusFilter === 'all'
        ? baseFiltered
        : baseFiltered.filter((app) => app.status === activeStatusFilter),
    [activeStatusFilter, baseFiltered]
  );

  const visibleApplicants = useMemo(
    () =>
      showRejected || CLOSED_STATUSES.has(activeStatusFilter)
        ? filtered
        : filtered.filter((app) => !CLOSED_STATUSES.has(app.status)),
    [activeStatusFilter, filtered, showRejected]
  );

  const getColumnApps = (colId) => filtered.filter((app) => app.status === colId);
  const getStageCount = useCallback(
    (stageId) =>
      stageId === 'all'
        ? baseFiltered.length
        : baseFiltered.filter((app) => app.status === stageId).length,
    [baseFiltered]
  );

  const pipelineTabs = useMemo(() => {
    const tabColumns = showRejected || CLOSED_STATUSES.has(activeStatusFilter) ? ALL_PIPELINE_COLUMNS : KANBAN_COLUMNS;
    return [
      { id: 'all', label: 'Tất cả', accent: 'bg-slate-900' },
      ...tabColumns,
    ];
  }, [activeStatusFilter, showRejected]);

  // ── Metrics ───────────────────────────────────────────────────────────────
  const totalClosed = filtered.filter((app) => CLOSED_STATUSES.has(app.status)).length;
  const totalRejected = filtered.filter((app) => app.status === APPLICATION_STATUS.REJECTED).length;
  const totalActive = filtered.length - totalClosed;
  const totalInterviewing = filtered.filter((app) =>
    [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.INTERVIEWED].includes(app.status)
  ).length;
  const totalSuccess = filtered.filter((app) =>
    [APPLICATION_STATUS.OFFERED, APPLICATION_STATUS.HIRED].includes(app.status)
  ).length;
  const selectedJobLabel =
    selectedJob === 'all'
      ? 'Tất cả vị trí'
      : jobs.find((job) => String(job.id) === String(selectedJob))?.title || 'Vị trí đã chọn';

  const activeApp = applicants.find((app) => String(app.id) === String(activeId));

  const isListView = viewMode === 'list';
  const displayedApplicantCount = isListView ? visibleApplicants.length : filtered.length;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || selectedJob !== 'all' || activeStatusFilter !== 'all' || showRejected;
  const activeFilterBadges = [
    searchQuery.trim() ? `Từ khóa: ${searchQuery.trim()}` : null,
    selectedJob !== 'all' ? selectedJobLabel : null,
    activeStatusFilter !== 'all'
      ? pipelineTabs.find((tab) => tab.id === activeStatusFilter)?.label || getStatusLabel(activeStatusFilter)
      : null,
    showRejected ? 'Bao gồm hồ sơ đã đóng' : null,
  ].filter(Boolean);
  const activeFilterCount = activeFilterBadges.length;
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedJob('all');
    setActiveStatusFilter('all');
    setShowRejected(false);
  };

  const heroStats = [
    {
      icon: Workflow,
      label: 'Đang xử lý',
      value: formatCompactNumber(totalActive),
      helper: totalActive > 0 ? 'Hồ sơ cần tiếp tục xử lý' : 'Chưa có hồ sơ đang mở',
      tone: 'emerald',
    },
    {
      icon: Users,
      label: 'Phỏng vấn',
      value: formatCompactNumber(totalInterviewing),
      helper: totalInterviewing > 0 ? 'Đã lên lịch hoặc chờ đánh giá' : 'Chưa có lịch phỏng vấn',
      tone: 'amber',
    },
    {
      icon: Target,
      label: 'Kết quả',
      value: formatCompactNumber(totalSuccess),
      helper: totalSuccess > 0 ? 'Đã gửi đề nghị hoặc tuyển thành công' : 'Chưa có kết quả cuối cùng',
      tone: 'violet',
    },
  ];

  // ── Status change ────────────────────────────────────────────────────────
  const isTransitioning = useCallback(
    (appId) => transitioningIds.has(String(appId)),
    [transitioningIds]
  );

  const commitStatusChange = useCallback(async (appId, newStatus, metadata = {}) => {
    const key = String(appId);
    if (transitioningIds.has(key)) return false;
    setTransitioningIds((prev) => new Set(prev).add(key));
    try {
      await applicationService.updateStatus(appId, newStatus, metadata);
      await loadApplicants();
      const labels = {
        interview_scheduled: 'Đã sắp lịch phỏng vấn!',
        offered: 'Đã gửi đề nghị tuyển dụng cho ứng viên!',
        hired: 'Ứng viên đã được tuyển!',
        rejected: 'Đã từ chối ứng viên.',
        shortlisted: 'Đã thêm vào danh sách rút gọn.',
        interviewed: 'Đã chuyển sang trạng thái đã phỏng vấn.',
      };
      showNotification(labels[newStatus] || 'Đã cập nhật trạng thái.', 'success');
      return true;
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Không thể cập nhật trạng thái.', 'error');
      return false;
    } finally {
      setTransitioningIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [loadApplicants, showNotification, transitioningIds]);

  const handleStatusChange = useCallback(async (appId, newStatus, notes = null) => {
    const currentApp = applicants.find((app) => String(app.id) === String(appId));
    if (!currentApp || currentApp.status === newStatus) return;
    if (isTransitioning(appId)) return;
    if (LOCKED_STATUSES.has(currentApp.status)) {
      showNotification('Hồ sơ đã chốt không thể kéo sang trạng thái khác trên Kanban.', 'error');
      return;
    }
    if (!canTransitionApplicationStatus(currentApp.status, newStatus)) {
      showNotification(`Không thể chuyển từ "${getStatusLabel(currentApp.status)}" sang "${getStatusLabel(newStatus)}".`, 'error');
      return;
    }
    if (newStatus === 'interview_scheduled') {
      pendingStageRef.current = { appId, targetStatus: newStatus };
      setPendingStage({ appId, targetStatus: newStatus });
      setDialogType('interview');
      return;
    }
    if (newStatus === 'offered') {
      pendingStageRef.current = { appId, targetStatus: newStatus };
      setPendingStage({ appId, targetStatus: newStatus });
      setDialogType('offer');
      return;
    }
    await commitStatusChange(appId, newStatus, notes ? { notes } : {});
  }, [applicants, commitStatusChange, isTransitioning, showNotification]);

  async function handleDialogConfirm(metadata) {
    if (!pendingStageRef.current) return;
    const { appId, targetStatus } = pendingStageRef.current;
    pendingStageRef.current = null;
    setPendingStage(null);
    setDialogType(null);
    const succeeded = await commitStatusChange(appId, targetStatus, metadata);
    if (!succeeded) {
      pendingStageRef.current = { appId, targetStatus };
      setPendingStage({ appId, targetStatus });
      setDialogType(targetStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED ? 'interview' : 'offer');
    }
  }

  function handleDialogCancel() {
    pendingStageRef.current = null;
    setPendingStage(null);
    setDialogType(null);
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over) { setActiveId(null); return; }
    const draggedApp = applicants.find((app) => String(app.id) === String(active.id));
    if (!draggedApp || isTransitioning(active.id) || LOCKED_STATUSES.has(draggedApp.status)) {
      setActiveId(null);
      return;
    }
    const overContainer = columns.some((col) => col.id === over.id)
      ? over.id
      : applicants.find((app) => String(app.id) === String(over.id))?.status;
    if (overContainer && overContainer !== draggedApp.status) {
      await handleStatusChange(active.id, overContainer);
    }
    setActiveId(null);
  };

  const handleBookmark = async (appId) => {
    const app = applicants.find((item) => String(item.id) === String(appId));
    if (!app?.candidate_id) {
      showNotification('Không tìm thấy hồ sơ ứng viên để lưu.', 'error');
      return;
    }
    try {
      await employerCandidateService.saveCandidate(app.candidate_id, {
        folder: 'pipeline',
        notes: `Lưu từ Kanban ứng viên - ${app.jobTitle}`,
      });
      showNotification('Đã lưu ứng viên vào kho ứng viên.', 'success');
    } catch (error) {
      showNotification(error?.response?.data?.message || 'Không lưu được ứng viên.', 'error');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showNotification('Không có dữ liệu để xuất.', 'error');
      return;
    }
    const headers = ['Tên', 'Vị trí', 'Email', 'Trạng thái', 'Ngày ứng tuyển'];
    const rows = filtered.map((a) => [
      a.name,
      a.jobTitle,
      a.email || 'Không có',
      getStatusLabel(a.status),
      a.appliedDate,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\ufeff' +
      [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `candidates_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    showNotification('Đã xuất danh sách ứng viên thành công!', 'success');
  };

  const jobOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả vị trí' },
    ...jobs.map((j) => ({ value: String(j.id), label: j.title || `Vị trí #${j.id}` })),
  ], [jobs]);

  const quickActions = [
    {
      icon: Users,
      title: 'Thêm ứng viên',
      to: '/employer/search-candidates',
      tone: 'emerald',
    },
    {
      icon: Plus,
      title: 'Đăng tin tuyển dụng',
      to: '/employer/jobs/post',
      tone: 'blue',
    },
    {
      icon: Download,
      title: 'Xuất danh sách CSV',
      onClick: handleExport,
      tone: 'slate',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
        {/* ── Header đồng bộ trang quản lý việc ── */}
        <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
            <div className="mb-6 max-w-4xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                  <Building2 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-inset ring-slate-200/80">
                    Quy trình ứng viên
                  </span>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2.35rem]">
                    Trung tâm quy trình tuyển dụng
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    Theo dõi ứng viên theo từng giai đoạn, lọc nhanh theo vị trí và xử lý hồ sơ trong một không gian đồng bộ với trang quản lý việc.
                  </p>
                </div>
              </div>
            </div>

            {!loading && baseFiltered.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {heroStats.map((card) => (
                  <EmployerStatCard key={card.label} {...card} />
                ))}
              </div>
            )}

            {quickActions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {quickActions.map((item) => (
                  <QuickActionItem key={item.title} {...item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {pipelineTabs.map((tab) => (
                  <StageTabButton
                    key={tab.id}
                    tab={tab}
                    count={getStageCount(tab.id)}
                    active={activeStatusFilter === tab.id}
                    onClick={() => setActiveStatusFilter(tab.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <section className="min-w-0 space-y-4">
              {/* Search + filter bar */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm theo tên, email, vị trí..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex h-12 items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => switchViewMode('pipeline')}
                        className={cn(
                          'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors',
                          !isListView
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <Workflow className="h-4 w-4" />
                        Pipeline
                      </button>
                      <button
                        type="button"
                        onClick={() => switchViewMode('list')}
                        className={cn(
                          'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors',
                          isListView
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <Users className="h-4 w-4" />
                        Hồ sơ
                      </button>
                    </div>

                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {jobOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetFilters}
                        className="h-12 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      >
                        Xóa lọc
                      </Button>
                    )}

                    {totalRejected > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejected(!showRejected)}
                        className={cn(
                          'h-12 rounded-lg px-4 text-sm font-semibold transition-colors',
                          showRejected
                            ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {showRejected ? 'Ẩn từ chối' : `${totalRejected} từ chối`}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filter summary */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-500" />
                    Hiển thị <strong className="text-slate-700">{displayedApplicantCount}</strong> hồ sơ
                  </span>
                  <span>
                    <strong className="text-slate-700">{formatCompactNumber(baseFiltered.length)}</strong> hồ sơ trong tập lọc vị trí/từ khóa
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {activeFilterCount} bộ lọc
                    </span>
                  )}
                  {activeFilterBadges.map((badge) => (
                    <span key={badge} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {badge}
                    </span>
                  ))}
                  {totalInterviewing > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {formatCompactNumber(totalInterviewing)} đang phỏng vấn
                    </span>
                  )}
                  {totalSuccess > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                      {formatCompactNumber(totalSuccess)} kết quả
                    </span>
                  )}
                </div>
              </div>

              {/* Kanban board */}
              {loadIssue ? (
                <div className={cn('rounded-lg border px-4 py-3 shadow-sm', loadIssue.tone === 'error' ? 'border-rose-200 bg-rose-50/90 text-rose-700' : 'border-amber-200 bg-amber-50/90 text-amber-700')}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{loadIssue.message}</p>
                      {loadIssue.detail ? <p className="mt-1 text-xs leading-4 opacity-80">{loadIssue.detail}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-slate-700">
                        {isListView ? 'Danh sách hồ sơ' : 'Kanban ứng viên'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {isListView ? `${visibleApplicants.length} hồ sơ` : `${columns.length} cột`}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {isListView
                        ? 'Mở hồ sơ, lưu kho ứng viên hoặc chuyển nhanh trạng thái.'
                        : activeApp
                          ? `Đang kéo: ${activeApp.name || 'Ứng viên này'}`
                          : 'Kéo thả để cập nhật trạng thái'}
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex gap-4 overflow-x-auto px-4 py-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-64 min-w-[260px] animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : isListView ? (
                  <div className="px-4 py-4">
                    {visibleApplicants.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                        <Users className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-4 text-base font-semibold text-slate-700">
                          Chưa có hồ sơ phù hợp với bộ lọc hiện tại
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Thử đổi vị trí, từ khóa hoặc bật lại hồ sơ đã đóng để xem thêm ứng viên.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {visibleApplicants.map((app) => (
                          <ApplicantCard
                            key={app.id}
                            app={app}
                            onStatusChange={handleStatusChange}
                            isDragging={false}
                            onBookmark={handleBookmark}
                            isBusy={isTransitioning(app.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={({ active }) => setActiveId(active.id)}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveId(null)}
                  >
                    <div className="overflow-x-auto px-4 py-4">
                      <div className="flex min-w-max gap-4" style={{ minHeight: '420px' }}>
                        {columns.map((column) => (
                          <KanbanColumn
                            key={column.id}
                            column={column}
                            apps={getColumnApps(column.id)}
                            onStatusChange={handleStatusChange}
                            onBookmark={handleBookmark}
                            dragState={getColumnDropState(activeApp, column.id)}
                            isDragActive={Boolean(activeApp)}
                            transitioningIds={transitioningIds}
                          />
                        ))}
                      </div>
                    </div>
                    <DragOverlay>
                      {activeApp ? (
                        <ApplicantCard
                          app={activeApp}
                          onStatusChange={() => { }}
                          isDragging
                          onBookmark={handleBookmark}
                          isBusy={false}
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </Card>
            </section>

          </div>
        </main>
      </div>

      {/* ── Dialogs ── */}
      {dialogType === 'interview' && pendingStage && (() => {
        const app = applicants.find((a) => a.id === pendingStage.appId);
        return (
          <InterviewScheduleDialog
            applicantName={app?.name || 'Ứng viên'}
            jobTitle={app?.jobTitle || app?.role || ''}
            onConfirm={handleDialogConfirm}
            onCancel={handleDialogCancel}
          />
        );
      })()}

      {dialogType === 'offer' && pendingStage && (() => {
        const app = applicants.find((a) => a.id === pendingStage.appId);
        return (
          <OfferDialog
            applicantName={app?.name || 'Ứng viên'}
            jobTitle={app?.jobTitle || app?.role || ''}
            onConfirm={handleDialogConfirm}
            onCancel={handleDialogCancel}
          />
        );
      })()}
    </>
  );
};

export default ApplicantsPage;
