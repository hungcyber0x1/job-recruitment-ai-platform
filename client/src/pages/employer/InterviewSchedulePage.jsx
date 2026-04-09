import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Video,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

// ─── Mock data ────────────────────────────────────
const INITIAL_INTERVIEWS = [
  {
    id: 1,
    candidateName: 'Lê Văn A',
    candidateRole: 'Senior UX Designer',
    candidateInitial: 'A',
    gradient: 'from-emerald-600 to-teal-800',
    date: '2026-03-18', // "today" for demo
    timeStart: '14:00',
    timeEnd: '15:00',
    duration: 60,
    type: 'online',
    platform: 'Google Meet',
    meetUrl: 'https://meet.google.com/abc-def-ghi',
    status: 'confirmed',
    badge: 'HÔM NAY',
    badgeClass: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  {
    id: 2,
    candidateName: 'Trần Thị B',
    candidateRole: 'NodeJS Developer',
    candidateInitial: 'B',
    gradient: 'from-blue-600 to-blue-900',
    date: '2026-03-19',
    timeStart: '09:30',
    timeEnd: '10:30',
    duration: 60,
    type: 'online',
    platform: 'Zoom Meeting',
    status: 'pending',
    badge: 'NGÀY MAI',
    badgeClass: 'bg-blue-50 border-blue-100 text-blue-600',
  },
  {
    id: 3,
    candidateName: 'Phạm Minh C',
    candidateRole: 'Product Manager',
    candidateInitial: 'C',
    gradient: 'from-amber-600 to-orange-800',
    date: '2026-03-22',
    timeStart: '15:00',
    timeEnd: '16:00',
    duration: 60,
    type: 'online',
    platform: 'Google Meet',
    status: 'pending',
    badge: '22 TH.03',
    badgeClass: 'bg-slate-50 border-slate-200 text-slate-600',
  },
];

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const MONTHS_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

// ─── Calendar helpers ─────────────────────────────
function pad2(n) {
  return String(n).padStart(2, '0');
}
function formatDateStrFromParts(y, m0, d) {
  return `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
}
function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatDateStr(date) {
  return formatDateStrFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
/** Thứ hai = đầu tuần (khớp cột T2…CN) */
function startOfWeekMonday(date) {
  const x = new Date(date);
  const wd = x.getDay();
  const diff = wd === 0 ? -6 : 1 - wd;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year, month) {
  const raw = new Date(year, month, 1).getDay();
  return raw === 0 ? 6 : raw - 1;
}
function getNavLabel(currentView, visibleMonth, weekStartMondayStr, selectedDateStr) {
  const { year, month } = visibleMonth;
  if (currentView === 'month') {
    return `${MONTHS_VI[month]} ${year}`;
  }
  if (currentView === 'week') {
    const start = parseDateStr(weekStartMondayStr);
    const end = addDays(start, 6);
    const sameM = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameM) {
      return `${start.getDate()}–${end.getDate()} ${MONTHS_VI[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS_VI[start.getMonth()]} – ${end.getDate()} ${MONTHS_VI[end.getMonth()]} ${end.getFullYear()}`;
  }
  const d = parseDateStr(selectedDateStr);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_VI[d.getMonth()]} ${d.getFullYear()}`;
}

const InterviewSchedulePage = () => {
  const { showNotification } = useNotification();
  const today = new Date(2026, 2, 18);
  const todayStr = formatDateStr(today);

  const [visibleMonth, setVisibleMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [weekStartMondayStr, setWeekStartMondayStr] = useState(() =>
    formatDateStr(startOfWeekMonday(today))
  );
  const [currentView, setCurrentView] = useState('month');
  const [isCreating, setIsCreating] = useState(false);
  const [interviews] = useState(INITIAL_INTERVIEWS);

  const { year, month } = visibleMonth;
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);

  const interviewsByDate = useMemo(() => {
    const map = {};
    interviews.forEach((iv) => {
      if (!map[iv.date]) map[iv.date] = [];
      map[iv.date].push(iv);
    });
    return map;
  }, [interviews]);

  const navigateMonth = (dir) => {
    setVisibleMonth((prev) => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { year: y, month: m };
    });
  };

  const navigateCalendar = (dir) => {
    if (currentView === 'month') {
      navigateMonth(dir);
      return;
    }
    if (currentView === 'week') {
      setWeekStartMondayStr((prev) => formatDateStr(addDays(parseDateStr(prev), dir * 7)));
      return;
    }
    setSelectedDateStr((prev) => formatDateStr(addDays(parseDateStr(prev), dir)));
  };

  const handleViewChange = (v) => {
    setCurrentView(v);
    if (v === 'week') {
      setWeekStartMondayStr(formatDateStr(startOfWeekMonday(parseDateStr(selectedDateStr))));
    }
  };

  const navLabel = getNavLabel(currentView, visibleMonth, weekStartMondayStr, selectedDateStr);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateStr = formatDateStrFromParts(year, month, d);
      cells.push({ day: d, dateStr, events: interviewsByDate[dateStr] || [] });
    }
    return cells;
  }, [year, month, daysInMonth, firstWeekday, interviewsByDate]);

  const weekDayCells = useMemo(() => {
    const mon = parseDateStr(weekStartMondayStr);
    const out = [];
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(mon, i);
      const dateStr = formatDateStr(d);
      out.push({
        dateStr,
        day: d.getDate(),
        events: interviewsByDate[dateStr] || [],
      });
    }
    return out;
  }, [weekStartMondayStr, interviewsByDate]);

  const dayViewEvents = interviewsByDate[selectedDateStr] || [];

  const eventPillClass =
    'truncate rounded-full border border-blue-100 px-2 py-0.5 text-base font-black uppercase tracking-tight shadow-sm';

  const handleCreateInterview = () => {
    setIsCreating(true);
    setTimeout(() => {
      showNotification('Đã mở trình tạo buổi phỏng vấn mới!', 'success');
      setIsCreating(false);
    }, 800);
  };

  const handleSelectDate = (dateStr, dayLabel) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    const d = parseDateStr(dateStr);
    showNotification(
      `Bạn đã chọn ${dayLabel ?? `ngày ${d.getDate()} ${MONTHS_VI[d.getMonth()]}`} để xem / lên lịch.`,
      'info'
    );
  };

  return (
    <div className="pb-12 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight text-emerald-600">
            Lịch trình phỏng vấn
          </h1>
          <p className="text-base font-medium text-slate-500 mt-1">
            Quản lý các buổi phỏng vấn và điều phối ứng viên hiệu quả.
          </p>
        </div>
        <button
          onClick={handleCreateInterview}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-base font-black text-white hover:bg-black transition-all shadow-xl active:scale-95 uppercase tracking-widest disabled:opacity-50"
        >
          <Plus size={16} />
          {isCreating ? 'ĐANG KHỞI TẠO...' : 'TẠO BUỔI PHỎNG VẤN MỚI'}
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        {/* ── Left: Calendar ── */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="flex flex-col gap-4 px-6 py-5 border-b border-slate-100 bg-slate-50/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex w-fit max-w-full bg-slate-100 p-1 rounded-xl">
                {['month', 'week', 'day'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleViewChange(v)}
                    className={`px-4 py-1.5 text-base font-black uppercase tracking-wider rounded-lg transition-all ${
                      currentView === v
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : 'Ngày'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => navigateCalendar(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-foreground hover:bg-muted/35 transition-all"
                  aria-label="Trước"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-base font-black text-slate-900 min-w-[140px] max-w-[280px] text-center tracking-tight uppercase sm:min-w-[180px]">
                  {navLabel}
                </h2>
                <button
                  type="button"
                  onClick={() => navigateCalendar(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-foreground hover:bg-muted/35 transition-all"
                  aria-label="Sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {currentView !== 'day' && (
            <div className="grid grid-cols-7 px-0 border-b border-slate-100 bg-white">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-base font-black uppercase text-slate-400 py-4 tracking-widest border-r border-slate-50 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
          )}

          {currentView === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-slate-100 border-t border-slate-100">
              {calendarCells.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-32 bg-slate-50/30" />;
                const isSelected = cell.dateStr === selectedDateStr;
                return (
                  <div
                    key={cell.dateStr}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDate(cell.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectDate(cell.dateStr);
                      }
                    }}
                    className={`h-32 p-3 bg-white hover:bg-primary/10 transition-all cursor-pointer group relative outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${isSelected ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/10' : ''}`}
                  >
                    <div
                      className={`mb-2 flex h-7 w-7 shrink-0 items-center justify-center text-base font-black ${isSelected ? 'rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : 'rounded-lg text-slate-400 group-hover:text-foreground'}`}
                    >
                      {cell.day}
                    </div>
                    <div className="space-y-1">
                      {cell.events.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`${eventPillClass} ${ev.type === 'online' ? 'border-l-[3px] border-l-blue-500 bg-blue-50 text-blue-800' : 'border-l-[3px] border-l-amber-500 bg-amber-50 text-amber-800'}`}
                        >
                          {ev.candidateName}
                        </div>
                      ))}
                      {cell.events.length > 2 && (
                        <div className="px-1 text-base font-black text-slate-400">
                          +{cell.events.length - 2} KHÁC
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentView === 'week' && (
            <div className="grid grid-cols-7 gap-px bg-slate-100 border-t border-slate-100">
              {weekDayCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDateStr;
                return (
                  <div
                    key={cell.dateStr}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDate(cell.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectDate(cell.dateStr);
                      }
                    }}
                    className={`min-h-[200px] p-3 bg-white hover:bg-primary/10 transition-all cursor-pointer group relative outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset sm:min-h-[240px] ${isSelected ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/10' : ''}`}
                  >
                    <div
                      className={`mb-2 flex h-7 w-7 shrink-0 items-center justify-center text-base font-black ${isSelected ? 'rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : 'rounded-lg text-slate-400 group-hover:text-foreground'}`}
                    >
                      {cell.day}
                    </div>
                    <div className="space-y-1">
                      {cell.events.map((ev) => (
                        <div
                          key={ev.id}
                          className={`${eventPillClass} ${ev.type === 'online' ? 'border-l-[3px] border-l-blue-500 bg-blue-50 text-blue-800' : 'border-l-[3px] border-l-amber-500 bg-amber-50 text-amber-800'}`}
                        >
                          {ev.candidateName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentView === 'day' && (
            <div className="border-t border-slate-100 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
                <p className="text-base font-black uppercase tracking-widest text-slate-400">
                  {WEEKDAYS_LONG[parseDateStr(selectedDateStr).getDay()]}
                </p>
                <p className="text-lg font-black uppercase tracking-tight text-slate-900">
                  {parseDateStr(selectedDateStr).getDate()}{' '}
                  {MONTHS_VI[parseDateStr(selectedDateStr).getMonth()]}{' '}
                  {parseDateStr(selectedDateStr).getFullYear()}
                </p>
              </div>
              {dayViewEvents.length === 0 ? (
                <p className="text-base font-medium text-slate-500">
                  Không có buổi phỏng vấn trong ngày này.
                </p>
              ) : (
                <ul className="space-y-3">
                  {dayViewEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 ${ev.type === 'online' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-amber-500'}`}
                    >
                      <span className="text-base font-black uppercase tracking-tight text-slate-900">
                        {ev.candidateName}
                      </span>
                      <span className="shrink-0 text-base font-bold text-slate-500">
                        {ev.timeStart} – {ev.timeEnd}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Upcoming Interviews ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">
              PHỎNG VẤN SẮP TỚI
            </h3>
            <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-500 border border-slate-200 font-black">
              {interviews.length}
            </span>
          </div>

          <div className="space-y-4">
            {interviews.map((iv) => (
              <div
                key={iv.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-200 hover:shadow-md transition-all group border-l-4 border-l-emerald-500"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${iv.gradient} flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      {iv.candidateInitial}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                        {iv.candidateName}
                      </p>
                      <p className="text-base font-bold text-slate-500 uppercase tracking-widest">
                        {iv.candidateRole}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-base font-black uppercase tracking-tight border ${iv.badgeClass}`}
                  >
                    {iv.badge}
                  </span>
                </div>

                <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-card transition-colors duration-200 ease-out">
                  <div className="flex items-center gap-2 text-base font-black text-slate-700 uppercase tracking-tight">
                    <Clock size={14} className="text-emerald-500" />
                    {iv.timeStart} – {iv.timeEnd} ({iv.duration}M)
                  </div>
                  <div className="flex items-center gap-2 text-base font-black text-slate-700 uppercase tracking-tight">
                    {iv.type === 'online' ? (
                      <>
                        <Video size={14} className="text-blue-500" />
                        <span className="text-blue-600">{iv.platform}</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={14} className="text-amber-500" />
                        <span>Phòng họp 302</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {iv.status === 'confirmed' ? (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-base font-black text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest">
                      <ExternalLink size={14} />
                      THAM GIA
                    </button>
                  ) : (
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-base font-black text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 uppercase tracking-widest">
                      <CalendarPlus size={14} />
                      XÁC NHẬN
                    </button>
                  )}
                  <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-foreground hover:bg-muted/35 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 text-base font-black text-slate-400 hover:text-emerald-600 hover:bg-primary/10 rounded-2xl transition-all uppercase tracking-widest border border-dashed border-slate-200">
            Xem tất cả <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSchedulePage;
