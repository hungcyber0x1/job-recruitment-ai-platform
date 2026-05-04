import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import InterviewScheduleDialog from '../../components/employer/InterviewScheduleDialog';
import OfferDialog from '../../components/employer/OfferDialog';
import CommunicationCenter from '../../components/employer/ats/CommunicationCenter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  APPLICATION_STATUS,
  APP_STATUS_CONFIG,
  canTransitionApplicationStatus,
  getAppStatusConfig,
  getNextApplicationStatuses,
  getStatusLabel,
  normalizeApplicationStatus,
  TERMINAL_APPLICATION_STATUSES,
} from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import applicationService from '../../services/applicationService';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import { decodeHtml } from '../../utils/sanitizeHtml';

/**
 * Canonical STATUS_OPTIONS cho application status select.
 * Labels/configs từ constants/status.js — KHÔNG hardcode ở đây.
 */
const STATUS_OPTIONS = Object.entries(APP_STATUS_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
  color: cfg.text,
}));

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
  const [status, setStatus] = useState(APPLICATION_STATUS.SUBMITTED);
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [showCommCenter, setShowCommCenter] = useState(false);
  const [pendingStage, setPendingStage] = useState(null);
  const [dialogType, setDialogType] = useState(null);

  const currentStatus = normalizeApplicationStatus(application?.status || status);
  const statusOptions = useMemo(() => {
    const nextStatuses = getNextApplicationStatuses(currentStatus);
    const uniqueStatuses = [currentStatus, ...nextStatuses].filter(
      (value, index, array) => value && array.indexOf(value) === index
    );

    return uniqueStatuses.map((value) => ({
      value,
      label: getStatusLabel(value),
      color: getAppStatusConfig(value).text,
    }));
  }, [currentStatus]);
  const availableNextStatuses = statusOptions.filter((option) => option.value !== currentStatus);
  const canAdvanceStatus = availableNextStatuses.length > 0;
  const isTerminalStatus = TERMINAL_APPLICATION_STATUSES.has(currentStatus);

  const applyApplicationSnapshot = useCallback((applicationData, historyData = null) => {
    const normalizedApplication = applicationData
      ? {
          ...applicationData,
          status: normalizeApplicationStatus(applicationData.status),
        }
      : null;

    setApplication(normalizedApplication);
    setStatus(normalizedApplication?.status || APPLICATION_STATUS.SUBMITTED);

    if (Array.isArray(historyData)) {
      setHistory(historyData);
    }

    return normalizedApplication;
  }, []);

  const refreshApplicationSnapshot = useCallback(async () => {
    const [applicationResponse, historyResponse] = await Promise.all([
      applicationService.getApplication(id),
      applicationService.getApplicationHistory(id),
    ]);

    return applyApplicationSnapshot(
      applicationResponse.data?.data || null,
      historyResponse.data?.data || []
    );
  }, [applyApplicationSnapshot, id]);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoadError(null);
      try {
        const [applicationResponse, historyResponse] = await Promise.all([
          applicationService.getApplication(id),
          applicationService.getApplicationHistory(id),
        ]);

        if (applicationResponse.data.success) {
          applyApplicationSnapshot(applicationResponse.data.data, historyResponse.data?.data || []);
        } else {
          applyApplicationSnapshot(null, historyResponse.data?.data || []);
        }
      } catch (error) {
        const status = error.response?.status;
        if (status === 404) {
          setLoadError('not_found');
          setApplication(null);
          setStatus(APPLICATION_STATUS.SUBMITTED);
        } else if (status === 403) {
          setLoadError('forbidden');
          setApplication(null);
          setStatus(APPLICATION_STATUS.SUBMITTED);
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
  }, [applyApplicationSnapshot, id]);

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
      appliedDate: formatDate(application.applied_at || application.created_at),
      education: parseJson(application.education),
      experience: parseJson(application.experience),
      skills: parseJson(application.skills),
      cvUrl: application.resume_url || '',
    };
  }, [application]);

  const handleStatusUpdate = async (newStatus, notes = null, metadata = {}) => {
    const normalizedTargetStatus = normalizeApplicationStatus(newStatus);

    if (!normalizedTargetStatus || normalizedTargetStatus === currentStatus) {
      setStatus(currentStatus);
      return true;
    }

    if (!canTransitionApplicationStatus(currentStatus, normalizedTargetStatus)) {
      showNotification(
        `Không thể chuyển từ "${getStatusLabel(currentStatus)}" sang "${getStatusLabel(normalizedTargetStatus)}".`,
        'error'
      );
      setStatus(currentStatus);
      return false;
    }

    setSavingStatus(true);

    try {
      const effectiveNotes = notes ?? (note.trim() || undefined);
      await applicationService.updateStatus(
        id,
        normalizedTargetStatus,
        metadata,
        effectiveNotes || undefined
      );
      await refreshApplicationSnapshot();
      setStatus(normalizedTargetStatus);
      showNotification(
        `Đã chuyển hồ sơ sang "${getStatusLabel(normalizedTargetStatus)}".`,
        'success'
      );
      setNote('');
      return true;
    } catch (error) {
      console.error('Update status failed', error);
      const message = error.response?.data?.message || 'Cập nhật trạng thái không thành công.';
      showNotification(message, 'error');
      setStatus(currentStatus);
      return false;
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatusSelect = useCallback(
    async (newStatus) => {
      const normalizedTargetStatus = normalizeApplicationStatus(newStatus);

      if (!normalizedTargetStatus || normalizedTargetStatus === currentStatus) {
        setStatus(currentStatus);
        return;
      }

      if (normalizedTargetStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED) {
        setPendingStage({ targetStatus: normalizedTargetStatus });
        setDialogType('interview');
        return;
      }

      if (normalizedTargetStatus === APPLICATION_STATUS.OFFERED) {
        setPendingStage({ targetStatus: normalizedTargetStatus });
        setDialogType('offer');
        return;
      }

      await handleStatusUpdate(normalizedTargetStatus);
    },
    [currentStatus, handleStatusUpdate]
  );

  const handleDialogConfirm = useCallback(
    async (metadata) => {
      if (!pendingStage?.targetStatus) return;

      const nextStatus = pendingStage.targetStatus;
      setPendingStage(null);
      setDialogType(null);

      const succeeded = await handleStatusUpdate(nextStatus, null, metadata);
      if (!succeeded) {
        setPendingStage({ targetStatus: nextStatus });
        setDialogType(
          nextStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED ? 'interview' : 'offer'
        );
      }
    },
    [handleStatusUpdate, pendingStage]
  );

  const handleDialogCancel = useCallback(() => {
    setPendingStage(null);
    setDialogType(null);
    setStatus(currentStatus);
  }, [currentStatus]);

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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
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
        <p className="text-base text-slate-500 mb-6 max-w-md">{subtitle}</p>
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
      <div className="mb-6 flex items-center justify-end">
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
            to={`/employer/interview-schedule?applicationId=${id}&candidateName=${encodeURIComponent(candidate.name)}&jobTitle=${encodeURIComponent(candidate.role || '')}`}
          >
            <CalendarPlus size={16} className="mr-2" /> Đặt lịch phỏng vấn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Candidate Main Info ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Profile Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar & Screening Summary */}
              <div className="relative group">
                <Avatar
                  src={application.candidate?.avatar_url}
                  size="xl"
                  className="border-4 border-slate-50 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-white bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xl">
                  Da nop
                </div>
              </div>

              {/* Info Detail */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                    {candidate.name}
                  </h1>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{candidate.role}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 text-base text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-base text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-base text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <span>{candidate.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-base text-slate-600">
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
                      className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1 text-base font-bold text-slate-600 uppercase tracking-normal"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                  {candidate.skills.length > 5 && (
                    <span className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-base font-bold text-slate-400 uppercase tracking-normal">
                      +{candidate.skills.length - 5} KỸ NĂNG KHÁC
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experience & Education */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-5">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-normal">
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
                          <h4 className="font-bold text-slate-900">{exp.title || exp.position}</h4>
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-base font-bold text-slate-500">
                            {exp.period}
                          </span>
                        </div>
                        <p className="text-base font-bold text-emerald-600 mb-2 uppercase tracking-normal">
                          {exp.company}
                        </p>
                        <p className="text-base text-slate-500 leading-relaxed">
                          {decodeHtml(exp.description || exp.desc)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-slate-400 italic">Chưa có thông tin kinh nghiệm</p>
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
                        <p className="text-base font-bold text-slate-500 mb-3">{edu.school}</p>
                        <div className="text-base font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded-md w-fit border border-slate-100">
                          {edu.period || edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-slate-400 italic">Chưa có thông tin học vấn</p>
                )}
              </section>
            </div>
          </div>

          {/* CV Preview Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <FileText className="text-slate-400" size={20} />
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-normal">
                  Tài liệu CV
                </h3>
              </div>
              <div className="flex gap-3">
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-bold text-slate-600 hover:bg-muted/35 transition-all"
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
              <p className="text-base text-slate-500 mb-6 uppercase tracking-normal font-bold">
                Hệ thống đã xử lý xong tài liệu ứng viên
              </p>
              <a
                href={candidate.cvUrl}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download size={18} /> Tải hồ sơ (PDF)
              </a>
            </div>
          </div>
        </div>

        {/* ── Right Column: Status & Notes ── */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Update Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-normal mb-6">
              Trạng thái hồ sơ
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-base font-bold text-slate-400 uppercase tracking-normal mb-2 px-1">
                  Cập nhật Trạng thái
                </p>
                <div className="relative group">
                  <select
                    value={status}
                    onChange={(e) => handleStatusSelect(e.target.value)}
                    disabled={savingStatus || !canAdvanceStatus}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-base font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 appearance-none shadow-sm cursor-pointer transition-all"
                  >
                    {statusOptions.map((o) => (
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
                  <p className="text-base font-bold text-slate-400 uppercase tracking-normal mb-1">
                    Hiện tại
                  </p>
                  <span
                    className={`text-base font-bold ${getAppStatusConfig(status).text || 'text-slate-900'}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm text-emerald-500">
                  <Zap size={20} className="animate-pulse" />
                </div>
              </div>

              {!canAdvanceStatus ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                  {isTerminalStatus
                    ? 'Hồ sơ đã ở trạng thái kết thúc và không còn bước chuyển tiếp nào.'
                    : 'Trạng thái hiện tại chỉ cho phép thao tác qua lịch phỏng vấn hoặc offer có cấu hình chi tiết.'}
                </div>
              ) : null}

              {/* Reject action */}
              {currentStatus !== APPLICATION_STATUS.REJECTED &&
                currentStatus !== APPLICATION_STATUS.HIRED &&
                currentStatus !== APPLICATION_STATUS.WITHDRAWN && (
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-xl border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 font-bold shadow-sm transition-all"
                    onClick={() => {
                      const reason = window.prompt(
                        `Từ chối ứng viên "${candidate.name}"?\n\nNhập lý do từ chối (không bắt buộc, nhấn OK để xác nhận):`
                      );
                      if (reason !== null) {
                        handleStatusUpdate(
                          APPLICATION_STATUS.REJECTED,
                          reason || 'Không đạt yêu cầu'
                        );
                      }
                    }}
                  >
                    <XCircle size={18} className="mr-2" /> TỪ CHỐI ỨNG VIÊN
                  </Button>
                )}

              <Button
                onClick={() =>
                  navigate(
                    `/employer/messages?applicationId=${id}&candidateName=${encodeURIComponent(candidate.name)}&jobTitle=${encodeURIComponent(candidate.role || '')}`
                  )
                }
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold italic rounded-xl shadow-xl transition-all"
              >
                <MessageSquare size={18} className="mr-2 not-italic" /> GỬI TIN NHẮN TRỰC TIẾP
              </Button>

              {/* Communication Actions */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-normal">
                  Liên lạc nhanh
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-12 border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-bold"
                    to={`/employer/interview-schedule?applicationId=${id}&candidateName=${encodeURIComponent(candidate.name)}&jobTitle=${encodeURIComponent(candidate.role || '')}`}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                    Mời PV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-12 border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-bold"
                    onClick={() => setShowCommCenter(true)}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    Gửi Email
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Activity Card */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col max-h-[700px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-normal leading-none">
                  Ghi chú đánh giá
                </h3>
              </div>
              <span className="h-6 min-w-[24px] rounded-full bg-white border border-slate-200 px-2 flex items-center justify-center text-base font-bold text-slate-500">
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
                      <p className="text-base font-bold text-slate-900 uppercase">
                        {item.first_name || 'Hệ thống'} {item.last_name}
                      </p>
                      <time className="text-base font-bold text-slate-400 uppercase">
                        {formatTimeAgo(item.created_at)}
                      </time>
                    </div>
                    <p className="text-base text-slate-600 leading-snug">{item.notes}</p>
                  </div>
                ))
              ) : (
                <div className="flex h-32 flex-col items-center justify-center text-center opacity-40">
                  <MessageSquare size={24} className="mb-2" />
                  <p className="text-base font-bold uppercase tracking-normal text-slate-400">
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
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-base font-medium text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 appearance-none shadow-sm min-h-[100px] resize-none transition-all placeholder:text-slate-400"
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
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-400 uppercase tracking-normal mb-6">
              Lịch sử hoạt động
            </h3>
            <div className="space-y-6">
              <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-slate-100">
                <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-base font-bold text-slate-900">Ứng tuyển thành công</p>
                <p className="text-base text-slate-400 mt-0.5">
                  {formatDate(application.applied_at || application.created_at)}
                </p>
              </div>

              {history.map((item) => (
                <div
                  key={item.id}
                  className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-px before:bg-slate-100 last:before:hidden"
                >
                  <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-base font-medium text-slate-600 leading-tight">
                    {item.notes || `Chuyển trạng thái sang ${getStatusLabel(item.new_status)}`}
                  </p>
                  <p className="text-base text-slate-400 mt-1 font-bold">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {dialogType === 'interview' && pendingStage ? (
        <InterviewScheduleDialog
          applicantName={candidate.name}
          jobTitle={candidate.role || ''}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      ) : null}

      {dialogType === 'offer' && pendingStage ? (
        <OfferDialog
          applicantName={candidate.name}
          jobTitle={candidate.role || ''}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      ) : null}

      {/* Communication Center Dialog */}
      <Dialog open={showCommCenter} onOpenChange={setShowCommCenter}>
        <DialogContent className="max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Gửi email cho {candidate.name}
            </DialogTitle>
            <DialogDescription>Sử dụng mẫu có sẵn hoặc viết email tùy chỉnh</DialogDescription>
          </DialogHeader>
          <CommunicationCenter
            applicationId={id}
            candidateName={candidate.name}
            jobTitle={candidate.role}
            onClose={() => setShowCommCenter(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationDetailPage;
