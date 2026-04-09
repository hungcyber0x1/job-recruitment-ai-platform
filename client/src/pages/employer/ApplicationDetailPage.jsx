import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  XCircle,
  Zap,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { getStatusLabel } from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import applicationService from '../../services/applicationService';
import { formatDate, formatTimeAgo } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Mới ứng tuyển', color: 'text-amber-500' },
  { value: 'screening', label: 'AI Screening', color: 'text-blue-500' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'text-violet-500' },
  { value: 'interviewing', label: 'Phỏng vấn', color: 'text-emerald-500' },
  { value: 'offered', label: 'Offer', color: 'text-indigo-500' },
  { value: 'hired', label: 'Đã nhận việc', color: 'text-emerald-600' },
  { value: 'rejected', label: 'Đã từ chối', color: 'text-red-500' },
];

const parseJson = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data || [];
  } catch {
    return [];
  }
};

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [application, setApplication] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoadError(null);
      try {
        const [applicationResponse, historyResponse] = await Promise.all([
          applicationService.getApplication(id),
          applicationService.getApplicationHistory(id),
        ]);

        if (applicationResponse.data.success) {
          const data = applicationResponse.data.data;
          setApplication(data);
          setStatus(data.status || 'pending');
        }

        setHistory(historyResponse.data.data || []);
      } catch (error) {
        const status = error.response?.status;
        if (status === 404) {
          setLoadError('not_found');
          setApplication(null);
        } else if (status === 403) {
          setLoadError('forbidden');
          setApplication(null);
        } else {
          setLoadError('unknown');
          console.error('Failed to fetch application', error);
        }
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const candidate = useMemo(() => {
    if (!application) return null;

    return {
      name: application.first_name
        ? `${application.first_name} ${application.last_name}`
        : 'Ứng viên',
      role: application.job_title || 'N/A',
      email: application.email,
      phone: application.phone || 'N/A',
      location: application.location || 'Remote',
      matchScore: application.score || 0,
      appliedDate: formatDate(application.applied_at || application.created_at),
      education: parseJson(application.education),
      experience: parseJson(application.experience),
      skills: parseJson(application.skills),
      cvUrl: application.resume_url || '#',
    };
  }, [application]);

  const handleStatusUpdate = async (newStatus) => {
    setStatus(newStatus);
    setSavingStatus(true);

    try {
      await applicationService.updateStatus(id, newStatus, note || undefined);
      const historyResponse = await applicationService.getApplicationHistory(id);
      setHistory(historyResponse.data.data || []);
      setApplication((prev) => (prev ? { ...prev, status: newStatus } : prev));
      showNotification('Đã cập nhật trạng thái ứng viên.', 'success');
      if (note) setNote('');
    } catch (error) {
      console.error('Update status failed', error);
      showNotification('Cập nhật trạng thái không thành công.', 'error');
      setStatus(application?.status || 'pending');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      showNotification('Vui lòng nhập nội dung ghi chú.', 'error');
      return;
    }

    setSavingNote(true);
    try {
      const response = await applicationService.addNote(id, note);
      setHistory((prev) => [response.data.data, ...prev]);
      setNote('');
      showNotification('Đã thêm ghi chú thành công.', 'success');
    } catch (error) {
      console.error('Add note failed', error);
      showNotification('Thêm ghi chú thất bại.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!application || !candidate) {
    const title =
      loadError === 'forbidden'
        ? 'Không có quyền xem đơn này'
        : loadError === 'not_found'
          ? 'Đơn ứng tuyển không tồn tại'
          : 'Không tải được hồ sơ';
    const subtitle =
      loadError === 'forbidden'
        ? 'Đơn chỉ dành cho nhà tuyển dụng của tin đăng.'
        : loadError === 'not_found'
          ? 'Kiểm tra lại đường dẫn hoặc mở từ danh sách ứng viên.'
          : 'Thử lại sau hoặc quay về danh sách.';
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="text-slate-300 mb-4" size={64} />
        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md">{subtitle}</p>
        <Button onClick={() => navigate('/employer/applications')} variant="outline">
          Quay về danh sách
        </Button>
      </div>
    );
  }

  const noteItems = history.filter((item) => item.notes);

  return (
    <div className="pb-20 pt-4 animate-fade-in bg-slate-50 min-h-screen">
      {/* ── Breadcrumbs & Navigation ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/employer/applications" className="hover:text-emerald-600 transition-colors">
            Tuyển dụng
          </Link>
          <ChevronRight size={12} />
          <span className="font-medium text-slate-900">Chi tiết ứng viên</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-xl border-slate-200"
          >
            <ChevronLeft size={16} className="mr-1" /> Quay lại
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10"
            asChild
          >
            <Link
              to={`/employer/interview-schedule?applicationId=${id}&candidateName=${encodeURIComponent(candidate.name)}&jobTitle=${encodeURIComponent(candidate.role || '')}`}
            >
              <CalendarPlus size={16} className="mr-2" /> Đặt lịch phỏng vấn
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Candidate Main Info ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar & Match Score */}
              <div className="relative group">
                <Avatar
                  src={application.candidate?.avatar_url}
                  size="xl"
                  className="border-4 border-slate-50 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border-4 border-white text-white font-black text-sm shadow-xl">
                  {candidate.matchScore}%
                </div>
              </div>

              {/* Info Detail */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 leading-tight">
                    {candidate.name}
                  </h1>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{candidate.role}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <span>Ứng tuyển: {candidate.appliedDate}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {candidate.skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                  {candidate.skills.length > 5 && (
                    <span className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      +{candidate.skills.length - 5} MORE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Education */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-5">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Hồ sơ năng lực
              </h2>
            </div>
            <div className="p-8 space-y-10">
              {/* Experience Info */}
              <section>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                  <h3 className="font-bold text-slate-900">Kinh nghiệm làm việc</h3>
                </div>
                {candidate.experience.length > 0 ? (
                  <div className="space-y-8">
                    {candidate.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-[calc(100%-8px)] before:w-px before:bg-slate-200 transition-all hover:before:bg-emerald-400 group"
                      >
                        <div className="absolute left-[-3px] top-2 h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-black text-slate-900">{exp.title || exp.position}</h4>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                            {exp.period}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-emerald-600 mb-2 uppercase tracking-wide">
                          {exp.company}
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {exp.description || exp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa có thông tin kinh nghiệm</p>
                )}
              </section>

              {/* Education Info */}
              <section>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="h-6 w-1 bg-blue-500 rounded-full" />
                  <h3 className="font-bold text-slate-900">Học vấn</h3>
                </div>
                {candidate.education.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {candidate.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-5 hover:border-blue-200 transition-all"
                      >
                        <h4 className="font-bold text-slate-900 mb-1">{edu.degree}</h4>
                        <p className="text-xs font-bold text-slate-500 mb-3">{edu.school}</p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded-md w-fit border border-slate-100">
                          {edu.period || edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Chưa có thông tin học vấn</p>
                )}
              </section>
            </div>
          </div>

          {/* CV Preview Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText className="text-slate-400" size={20} />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Tài liệu CV
                </h3>
              </div>
              <div className="flex gap-3">
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-muted/35 transition-all"
                >
                  <ExternalLink size={16} /> Xem bản gốc
                </a>
              </div>
            </div>
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center group cursor-pointer hover:border-emerald-300 hover:bg-primary/10 transition-all">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4 transition-transform group-hover:scale-110">
                <Paperclip size={24} className="text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Preview sẵn sàng</h4>
              <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold">
                Hệ thống AI đã xử lý xong tài liệu ứng viên
              </p>
              <a
                href={candidate.cvUrl}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download size={18} /> Tải hồ sơ (PDF)
              </a>
            </div>
          </div>
        </div>

        {/* ── Right Column: Status & Notes ── */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Update Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">
              Trạng thái hồ sơ
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">
                  Cập nhật Trạng thái
                </p>
                <div className="relative group">
                  <select
                    value={status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={savingStatus}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 appearance-none shadow-sm cursor-pointer transition-all"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-5 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Hiện tại
                  </p>
                  <span
                    className={`text-sm font-black ${STATUS_OPTIONS.find((o) => o.value === status)?.color || 'text-slate-900'}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm text-emerald-500">
                  <Zap size={20} className="animate-pulse" />
                </div>
              </div>

              <Button
                onClick={() =>
                  navigate(
                    `/employer/messages?applicationId=${id}&candidateName=${encodeURIComponent(candidate.name)}`
                  )
                }
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black italic rounded-2xl shadow-xl transition-all"
              >
                <MessageSquare size={18} className="mr-2 not-italic" /> GỬI TIN NHẮN TRỰC TIẾP
              </Button>
            </div>
          </div>

          {/* Notes & Activity Card */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col max-h-[700px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-none">
                  Ghi chú đánh giá
                </h3>
              </div>
              <span className="h-6 min-w-[24px] rounded-full bg-white border border-slate-200 px-2 flex items-center justify-center text-[10px] font-black text-slate-500">
                {noteItems.length}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {noteItems.length > 0 ? (
                noteItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative pl-4 border-l-2 border-slate-100 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-[10px] font-black text-slate-900 uppercase">
                        {item.first_name || 'Hệ thống'} {item.last_name}
                      </p>
                      <time className="text-[9px] font-bold text-slate-400 uppercase">
                        {formatTimeAgo(item.created_at)}
                      </time>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug">{item.notes}</p>
                  </div>
                ))
              ) : (
                <div className="flex h-32 flex-col items-center justify-center text-center opacity-40">
                  <MessageSquare size={24} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Chưa có ghi chú nào
                  </p>
                </div>
              )}
            </div>

            {/* Input form */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm đánh giá về ứng viên..."
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-xs font-medium text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 appearance-none shadow-sm min-h-[100px] resize-none transition-all placeholder:text-slate-400"
              />
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAddNote}
                  disabled={savingNote || !note.trim()}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 h-10 shadow-lg shadow-emerald-500/10"
                >
                  <Send size={14} className="mr-2" /> Lưu ghi chú
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Timeline Mini */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
              Lịch sử hoạt động
            </h3>
            <div className="space-y-6">
              <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-slate-100">
                <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-slate-900">Ứng tuyển thành công</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatDate(application.applied_at || application.created_at)}
                </p>
              </div>

              {history.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-slate-100 last:before:hidden"
                >
                  <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-xs font-medium text-slate-600 leading-tight">
                    {item.notes || `Chuyển trạng thái sang ${getStatusLabel(item.new_status)}`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
