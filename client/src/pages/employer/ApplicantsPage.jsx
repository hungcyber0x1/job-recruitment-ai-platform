import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bookmark,
  ChevronRight,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  ScanSearch,
  Search,
  Sparkles,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

import applicationService from '../../services/applicationService';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import jobService from '../../services/jobService';
import { APPLICATION_STATUS } from '../../constants/status';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const COLUMNS = [
  { id: APPLICATION_STATUS.PENDING, label: 'Mới ứng tuyển', accent: 'bg-slate-400' },
  { id: APPLICATION_STATUS.SCREENING, label: 'AI Screening', accent: 'bg-blue-400' },
  { id: APPLICATION_STATUS.SHORTLISTED, label: 'Shortlisted', accent: 'bg-amber-400' },
  { id: APPLICATION_STATUS.INTERVIEWING, label: 'Phỏng vấn', accent: 'bg-violet-400' },
  { id: APPLICATION_STATUS.OFFERED, label: 'Offer', accent: 'bg-emerald-400' },
  { id: APPLICATION_STATUS.HIRED, label: 'Đã nhận việc', accent: 'bg-emerald-600' },
];

function getMatchColor(score) {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-amber-600';
  return 'text-slate-500';
}

function getMatchBg(score) {
  if (score >= 90) return 'bg-emerald-50 border-emerald-100';
  if (score >= 75) return 'bg-amber-50 border-amber-100';
  return 'bg-slate-50 border-slate-200';
}

// ─────────────────────────────────────────────
// Applicant Card
// ─────────────────────────────────────────────
function ApplicantCard({ app, onStatusChange, isDragging, aiScreeningEnabled, onBookmark }) {
  const score = app.matchScore ?? 0;

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition-all select-none ${
        isDragging
          ? 'border-emerald-500/40 bg-emerald-50/50 shadow-[0_16px_48px_rgba(16,185,129,0.1)] scale-105 rotate-1'
          : 'border-slate-200 hover:border-emerald-500/20 hover:-translate-y-0.5 hover:shadow-lg cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-base font-bold text-white uppercase">
          {app.name?.charAt(0) ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900 truncate">
            {app.name || 'Ứng viên'}
          </p>
          <p className="text-base text-slate-500 truncate">{app.role || app.jobTitle || '—'}</p>
        </div>
        {/* Match score badge */}
        <span
          className={`shrink-0 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-base font-bold ${getMatchBg(score)} ${getMatchColor(score)}`}
        >
          MATCH {score}%
        </span>
      </div>

      {/* Applied time */}
      <p className="text-base text-slate-600 mb-3">
        {app.appliedDate ? `${app.appliedDate}` : 'Vừa nộp'}
        {app.statusNote && <span className="text-slate-500 ml-1">• {app.statusNote}</span>}
      </p>

      {/* Skills / tags */}
      {app.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {app.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-base font-medium text-slate-500"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-slate-50 pt-3">
        <Link
          to={`/employer/applications/${app.id}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-primary/10 transition-all"
          title="Xem hồ sơ"
        >
          <FileText size={13} />
        </Link>
        {aiScreeningEnabled && (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-primary/10 transition-all"
            title="AI Screening"
            onClick={() => onStatusChange(app.id, 'screening')}
          >
            <ScanSearch size={13} />
          </button>
        )}
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-primary/10 transition-all"
          title="Shortlist"
          onClick={() => onStatusChange(app.id, APPLICATION_STATUS.SHORTLISTED)}
        >
          <Star size={13} />
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-destructive/10 transition-all"
          title="Từ chối"
          onClick={() => onStatusChange(app.id, APPLICATION_STATUS.REJECTED)}
        >
          <XCircle size={13} />
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-all ml-auto"
          title="Bookmark"
          onClick={() => onBookmark?.(app.id)}
        >
          <Bookmark size={13} />
        </button>
      </div>
    </div>
  );
}

ApplicantCard.propTypes = {
  app: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string,
    role: PropTypes.string,
    jobTitle: PropTypes.string,
    matchScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    appliedDate: PropTypes.string,
    statusNote: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    cover_letter: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  isDragging: PropTypes.bool,
  aiScreeningEnabled: PropTypes.bool,
  onBookmark: PropTypes.func,
};

ApplicantCard.defaultProps = {
  isDragging: false,
  aiScreeningEnabled: false,
  onBookmark: () => {},
};

// ─────────────────────────────────────────────
// Sortable wrapper
// ─────────────────────────────────────────────
function SortableApplicantCard({ app, onStatusChange, aiScreeningEnabled, onBookmark }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
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
        aiScreeningEnabled={aiScreeningEnabled}
        onBookmark={onBookmark}
      />
    </div>
  );
}

SortableApplicantCard.propTypes = {
  app: ApplicantCard.propTypes.app,
  onStatusChange: PropTypes.func.isRequired,
  aiScreeningEnabled: PropTypes.bool.isRequired,
  onBookmark: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────
// Kanban Column
// ─────────────────────────────────────────────
function KanbanColumn({ column, apps, onStatusChange, aiScreeningEnabled, onBookmark }) {
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div className={`h-2 w-2 rounded-full ${column.accent}`} />
        <span className="text-base font-semibold text-slate-900">{column.label}</span>
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-2 text-base font-bold text-slate-500">
          {apps.length}
        </span>
        <button className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-950 hover:bg-muted/35 transition-all">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Cards */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 flex-1">
        <SortableContext items={apps.map((app) => app.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[120px]">
            {apps.map((app) => (
              <SortableApplicantCard
                key={app.id}
                app={app}
                onStatusChange={onStatusChange}
                aiScreeningEnabled={aiScreeningEnabled}
                onBookmark={onBookmark}
              />
            ))}
            {apps.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-slate-200 text-center">
                <p className="text-base text-slate-400">Kéo thả ứng viên vào đây</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

KanbanColumn.propTypes = {
  column: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
  }).isRequired,
  apps: PropTypes.arrayOf(ApplicantCard.propTypes.app).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  aiScreeningEnabled: PropTypes.bool.isRequired,
  onBookmark: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const ApplicantsPage = () => {
  const { isEnabled } = useFeatureFlags();
  const aiScreeningEnabled = isEnabled('ai_screening_enabled');
  const [searchParams, setSearchParams] = useSearchParams();
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(() => searchParams.get('jobId') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const { showNotification } = useNotification();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsRes = await jobService.getMyJobs();
        const myJobs = jobsRes.data.success ? jobsRes.data.data : [];
        setJobs(myJobs);

        if (!myJobs.length) {
          setApplicants([]);
          return;
        }

        const appResponses = await Promise.all(
          myJobs.map((job) =>
            applicationService.getJobApplications(job.id).catch(() => ({ data: { data: [] } }))
          )
        );

        const allApps = appResponses.flatMap((response, index) => {
          const jobApps = response.data?.data || [];
          return jobApps.map((app) => ({
            ...app,
            jobTitle: myJobs[index].title,
            jobId: myJobs[index].id,
            matchScore: app.score || 0,
            role: myJobs[index].title,
            appliedDate: new Date(app.applied_at || app.created_at).toLocaleDateString('vi-VN'),
            name: app.first_name ? `${app.first_name} ${app.last_name}` : app.name || 'Ứng viên',
            status: app.status || 'pending',
          }));
        });

        setApplicants(allApps);
      } catch (error) {
        console.error('Failed to fetch applicants', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (selectedJob !== 'all') nextParams.set('jobId', selectedJob);
    if (searchQuery.trim()) nextParams.set('search', searchQuery.trim());
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, searchQuery, selectedJob, setSearchParams]);

  const [showOnlyHighMatch, setShowOnlyHighMatch] = useState(false);

  const filtered = applicants.filter((app) => {
    if (selectedJob !== 'all' && String(app.jobId) !== String(selectedJob)) return false;
    if (showOnlyHighMatch && (app.matchScore ?? 0) < 80) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return app.name?.toLowerCase().includes(q) || app.email?.toLowerCase().includes(q);
  });

  const getColumnApps = (colId) => filtered.filter((app) => app.status === colId);

  const handleStatusChange = async (appId, newStatus) => {
    if (newStatus === 'screening' && !aiScreeningEnabled) return;
    try {
      await applicationService.updateStatus(appId, newStatus);
      setApplicants((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (error) {
      console.error(error);
      showNotification('Không thể cập nhật trạng thái.', 'error');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showNotification('Không có dữ liệu để xuất.', 'error');
      return;
    }
    const headers = ['Tên', 'Vị trí', 'Email', 'Điểm Match', 'Trạng thái', 'Ngày ứng tuyển'];
    const rows = filtered.map((a) => [
      a.name,
      a.jobTitle,
      a.email || 'N/A',
      `${a.matchScore}%`,
      a.status,
      a.appliedDate,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `candidates_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    showNotification('Đã xuất danh sách ứng viên thành công!', 'success');
  };

  const handleBookmark = (_appId) => {
    showNotification(`Đã lưu ứng viên vào danh sách quan tâm!`, 'success');
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) {
      setActiveId(null);
      return;
    }
    const activeApp = applicants.find((app) => app.id === active.id);
    if (!activeApp) {
      setActiveId(null);
      return;
    }
    const overContainer = COLUMNS.some((col) => col.id === over.id)
      ? over.id
      : applicants.find((app) => app.id === over.id)?.status;
    if (overContainer && overContainer !== activeApp.status) {
      await handleStatusChange(active.id, overContainer);
    }
    setActiveId(null);
  };

  const activeApp = applicants.find((app) => app.id === activeId);
  const visibleColumns = aiScreeningEnabled
    ? COLUMNS
    : COLUMNS.filter((col) => col.id !== 'screening');

  // Select job for the pipeline title
  const activeJob =
    selectedJob !== 'all' ? jobs.find((j) => String(j.id) === String(selectedJob)) : null;

  const totalActive = filtered.filter((a) => a.status !== 'rejected').length;

  return (
    <div className="pb-20">
      {/* ── Header ── */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-base text-slate-500 mb-3">
          <span className="hover:text-emerald-600 cursor-pointer transition-colors">
            Chiến dịch
          </span>
          <ChevronRight size={12} />
          <span className="text-slate-500 font-medium">
            {activeJob?.title || 'Tất cả công việc'}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pipeline Tuyển Dụng
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-base text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang hoạt động
              </span>
              <span className="text-base text-slate-600">•</span>
              <span className="text-base text-slate-500">{totalActive} ứng viên ứng tuyển</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnlyHighMatch(!showOnlyHighMatch)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-base font-semibold transition-all shadow-sm ${showOnlyHighMatch ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-muted/35'}`}
            >
              <Filter size={14} />
              {showOnlyHighMatch ? 'Chỉ High Match' : 'Lọc Match Score'}
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
              <Users size={14} />
              Thêm ứng viên
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Job selector */}
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 appearance-none cursor-pointer shadow-sm min-w-[180px]"
        >
          <option value="all">Tất cả công việc</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm ứng viên..."
            className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 w-52 transition-all shadow-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-500 hover:text-foreground transition-all shadow-sm"
          >
            <Download size={13} />
            Xuất CSV
          </button>
          {aiScreeningEnabled && (
            <div className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-base font-bold text-blue-600">
              <Sparkles size={12} />
              {filtered.filter((a) => a.status === 'screening').length} AI Screening
            </div>
          )}
        </div>
      </div>

      {/* ── Kanban board ── */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] flex-1 h-64 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-5 overflow-x-auto pb-6" style={{ minHeight: '480px' }}>
            {visibleColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                apps={getColumnApps(column.id)}
                onStatusChange={handleStatusChange}
                aiScreeningEnabled={aiScreeningEnabled}
                onBookmark={handleBookmark}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApp ? (
              <ApplicantCard
                app={activeApp}
                onStatusChange={() => {}}
                isDragging
                aiScreeningEnabled={aiScreeningEnabled}
                onBookmark={handleBookmark}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Empty indicator for rejected */}
      {!loading && filtered.filter((a) => a.status === 'rejected').length > 0 && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-base text-red-600">
            <XCircle size={15} />
            <span>
              <strong className="font-bold">
                {filtered.filter((a) => a.status === 'rejected').length}
              </strong>{' '}
              ứng viên đã bị từ chối
            </span>
          </div>
          <button className="text-base text-slate-500 hover:text-foreground transition-colors font-medium">
            Xem tất cả
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicantsPage;
