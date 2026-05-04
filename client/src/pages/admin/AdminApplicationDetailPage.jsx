import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
  XCircle,
  FileText,
  User,
  Activity,
  Calendar,
  Briefcase,
  History,
  MessageSquare,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/admin';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import InterviewScheduleDialog from '../../components/employer/InterviewScheduleDialog';
import OfferDialog from '../../components/employer/OfferDialog';
import {
  APPLICATION_STATUS,
  getNextApplicationStatuses,
  getStatusLabel,
  normalizeApplicationStatus,
} from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import adminService from '../../services/adminService';
import { formatDate, formatTimeAgo } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', color: 'amber', icon: FileText },
  { value: APPLICATION_STATUS.SHORTLISTED, label: 'Sơ tuyển', color: 'indigo', icon: Star },
  { value: APPLICATION_STATUS.INTERVIEW_SCHEDULED, label: 'Lịch PV', color: 'sky', icon: Calendar },
  { value: APPLICATION_STATUS.INTERVIEWED, label: 'Đã PV', color: 'teal', icon: CheckCircle },
  { value: APPLICATION_STATUS.OFFERED, label: 'Offer', color: 'emerald', icon: Send },
  { value: APPLICATION_STATUS.HIRED, label: 'Đã tuyển', color: 'green', icon: CheckCircle },
  { value: APPLICATION_STATUS.REJECTED, label: 'Từ chối', color: 'red', icon: XCircle },
  { value: APPLICATION_STATUS.WITHDRAWN, label: 'Đã rút', color: 'slate', icon: XCircle },
];

function getAvailableStatusOptions(currentStatus) {
  const normalizedStatus = normalizeApplicationStatus(currentStatus);
  const allowedStatuses = new Set([
    normalizedStatus,
    ...getNextApplicationStatuses(normalizedStatus).filter(
      (statusValue) => statusValue !== APPLICATION_STATUS.WITHDRAWN
    ),
  ]);

  return STATUS_OPTIONS.filter((option) => allowedStatuses.has(option.value));
}

const parseJson = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data || [];
  } catch {
    return [];
  }
};

const AdminApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [application, setApplication] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(APPLICATION_STATUS.SUBMITTED);
  const [note, setNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingInternalNote, setSavingInternalNote] = useState(false);

  const [statusDialog, setStatusDialog] = useState(null);

  const oversightModules = [
    {
      title: 'Hồ sơ và Trust Signal',
      description: 'Đánh giá tín hiệu hồ sơ, thâm niên và học vấn để xác thực năng lực ứng viên.',
      icon: ShieldCheck,
    },
    {
      title: 'Pipeline Governance',
      description:
        'Điều phối trạng thái đơn ứng tuyển và ghi chú nội bộ để tối ưu quy trình tuyển dụng.',
      icon: Activity,
    },
    {
      title: 'Audit & Tracking',
      description: 'Truy xuất lịch sử thay đổi trạng thái và dấu vết thao tác của người điều hành.',
      icon: History,
    },
  ];

  useEffect(() => {
    let isActive = true;

    const fetchApplication = async () => {
      try {
        const [applicationResponse, historyResponse] = await Promise.all([
          adminService.getApplication(id),
          adminService.getApplicationHistory(id),
        ]);

        if (isActive && applicationResponse.data?.success) {
          const rawApp = applicationResponse.data.data;
          setApplication(rawApp);
          setStatus(normalizeApplicationStatus(rawApp.status));
          setInternalNote(rawApp.internal_notes || '');
        }
        if (isActive) {
          setHistory(historyResponse.data?.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch admin application detail', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchApplication();

    return () => {
      isActive = false;
    };
  }, [id]);

  const candidate = useMemo(() => {
    if (!application) return null;

    return {
      name:
        `${application.first_name || ''} ${application.last_name || ''}`.trim() ||
        'Ứng viên chưa xác định',
      role: application.job_title || 'N/A',
      email: application.email,
      phone: application.phone || 'Chưa cập nhật',
      location: application.location || 'Chưa cập nhật',
      appliedDate: application.applied_at || application.created_at,
      education: parseJson(application.education),
      experience: parseJson(application.experience),
      skills: application.skills || [],
      cvUrl: application.resume_url || '',
      companyName: application.company_name,
    };
  }, [application]);

  const hasResume = Boolean(candidate?.cvUrl);

  const availableStatusOptions = useMemo(() => getAvailableStatusOptions(status), [status]);
  const availableStatusValues = useMemo(
    () => new Set(availableStatusOptions.map((option) => option.value)),
    [availableStatusOptions]
  );

  const handleStatusUpdate = async (newStatus, metadata = null) => {
    const normalizedStatus = normalizeApplicationStatus(newStatus);
    if (!normalizedStatus || normalizedStatus === status) return;

    if (normalizedStatus === APPLICATION_STATUS.INTERVIEW_SCHEDULED && !metadata) {
      setStatusDialog({ type: 'interview', status: normalizedStatus });
      return;
    }

    if (normalizedStatus === APPLICATION_STATUS.OFFERED && !metadata) {
      setStatusDialog({ type: 'offer', status: normalizedStatus });
      return;
    }

    setStatus(normalizedStatus);
    setSavingStatus(true);
    try {
      await adminService.updateApplicationStatus(id, normalizedStatus, note, metadata || {});
      showNotification(`Đã chuyển trạng thái sang ${getStatusLabel(normalizedStatus)}`, 'success');
      setNote('');
      setStatusDialog(null);
      const [applicationResponse, historyResponse] = await Promise.all([
        adminService.getApplication(id),
        adminService.getApplicationHistory(id),
      ]);
      if (applicationResponse.data?.success) {
        setApplication(applicationResponse.data.data);
        setStatus(
          normalizeApplicationStatus(applicationResponse.data.data.status || normalizedStatus)
        );
        setInternalNote(applicationResponse.data.data.internal_notes || '');
      }
      setHistory(historyResponse.data?.data || []);
    } catch (error) {
      console.error('Failed to update admin application status', error);
      showNotification('Lỗi cập nhật trạng thái', 'error');
      setStatus(normalizeApplicationStatus(application?.status));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleUpdateInternalNote = async () => {
    setSavingInternalNote(true);
    try {
      await adminService.updateApplicationInternalNote(id, internalNote);
      showNotification('Đã lưu ghi chú nội bộ', 'success');
    } catch {
      showNotification('Không thể lưu ghi chú', 'error');
    } finally {
      setSavingInternalNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
          <p className="text-sm font-bold text-slate-500">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!application)
    return <div className="p-10 text-center font-bold">Không tìm thấy hồ sơ ứng tuyển</div>;

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={FileText}
        eyebrow="Vận hành hồ sơ ứng tuyển"
        badge={getStatusLabel(status)}
        title={candidate.name}
        description={
          candidate.role +
          ' · ' +
          application.company_name +
          ' · Nộp lúc ' +
          formatDate(candidate.appliedDate)
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/admin/applications')}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronLeft size={18} strokeWidth={3} />
              Quay lại danh sách
            </button>
            <Button
              variant="ghost"
              className="h-11 rounded-xl px-5 font-bold text-red-500 hover:bg-red-50"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={savingStatus || !availableStatusValues.has(APPLICATION_STATUS.REJECTED)}
            >
              <XCircle size={18} className="mr-2" />
              Từ chối
            </Button>
            <Button
              className="h-11 rounded-xl bg-slate-900 px-5 font-bold text-white shadow-sm hover:bg-slate-800"
              onClick={() => handleStatusUpdate('shortlisted')}
              disabled={savingStatus || !availableStatusValues.has(APPLICATION_STATUS.SHORTLISTED)}
            >
              <Star size={18} className="mr-2" />
              Shortlist
            </Button>
          </>
        }
      >
        <div className="grid gap-3 xl:grid-cols-3">
          {oversightModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-950">{module.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{module.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <Card className="overflow-hidden border-none shadow-xl ring-1 ring-slate-200/60">
            <div className="bg-gradient-to-br from-slate-50 to-white p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-tr from-slate-200 to-slate-50 blur opacity-40 group-hover:opacity-60 transition" />
                    <Avatar
                      name={candidate.name}
                      size="xl"
                      className="relative h-28 w-28 rounded-[2rem] border-4 border-white shadow-2xl"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg border border-slate-100">
                      <User size={18} className="text-slate-900" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold tracking-normal text-slate-900">
                        {candidate.name}
                      </h1>
                      <span className="rounded-full bg-slate-100 px-3.5 py-2 text-xs font-bold uppercase tracking-normal text-slate-500 border border-slate-200/50">
                        Ứng viên
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-500">
                      {candidate.role} ·{' '}
                      <span className="text-slate-400">{application.company_name}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-3">
                      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                        <Mail size={14} className="text-slate-400" /> {candidate.email}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                        <Phone size={14} className="text-slate-400" /> {candidate.phone}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/60">
                        <MapPin size={14} className="text-slate-400" /> {candidate.location}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 self-start md:self-center">
                  <p className="text-xs font-bold text-slate-400 px-2 tracking-normal uppercase">
                    Nộp lúc: {formatDate(candidate.appliedDate)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Detailed Info Tabs-like Card */}
          <Card className="p-0 border-none shadow-xl ring-1 ring-slate-200/60 overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 p-6">
              <div className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-slate-200/50 cursor-pointer">
                <ClipboardList size={16} /> Chi tiết hồ sơ
              </div>
              <Link
                to={application.user_id ? `/admin/users/${application.user_id}` : '#'}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-all hover:shadow-sm"
              >
                <User size={16} /> Tài khoản người dùng
              </Link>
              <Link
                to={application.job_id ? `/admin/jobs/${application.job_id}` : '#'}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-all hover:shadow-sm"
              >
                <Briefcase size={16} /> Thông tin công việc
              </Link>
            </div>

            <div className="p-8 space-y-12">
              {/* Experience */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-slate-900 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900">Kinh nghiệm làm việc</h3>
                </div>
                {candidate.experience.length ? (
                  <div className="space-y-6">
                    {candidate.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="group relative rounded-xl bg-slate-50 p-6 transition-colors hover:bg-slate-100/60"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-bold text-slate-900">
                              {exp.title || exp.position}
                            </h4>
                            <p className="font-bold text-slate-500">{exp.company}</p>
                          </div>
                          <span className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-400 shadow-sm ring-1 ring-slate-200/60 uppercase tracking-normal">
                            {exp.period}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed text-slate-500 font-medium">
                          {exp.description || exp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-400 font-bold">
                    Chưa cập nhật kinh nghiệm
                  </div>
                )}
              </section>

              {/* Education */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-slate-900 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900">Học vấn</h3>
                </div>
                {candidate.education.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {candidate.education.map((edu, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-6">
                        <h4 className="text-lg font-bold text-slate-900">{edu.degree}</h4>
                        <p className="font-bold text-slate-500">{edu.school}</p>
                        <p className="mt-2 inline-block rounded-lg bg-white px-3.5 py-2 text-xs font-bold uppercase text-slate-400 shadow-sm ring-1 ring-slate-200/50 tracking-normal">
                          {edu.period || edu.year}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-400 font-bold">
                    Chưa cập nhật học vấn
                  </div>
                )}
              </section>

              {/* Skills */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-slate-900 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900">Kỹ năng chuyên môn</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {candidate.skills.length ? (
                    candidate.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-md shadow-slate-200"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-400 font-bold w-full">
                      Chưa liệt kê kỹ năng
                    </div>
                  )}
                </div>
              </section>
            </div>
          </Card>
        </div>

        {/* Right Column: Actions & Notes */}
        <div className="space-y-8">
          {/* Status & Quick Actions */}
          <Card className="border-none shadow-xl ring-1 ring-slate-200/60 p-8">
            <h3 className="text-xs font-bold uppercase tracking-normal text-slate-400 mb-6 flex items-center gap-2">
              <Activity size={14} className="text-slate-900" /> Quản lý trạng thái
            </h3>
            <div className="space-y-5">
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full appearance-none cursor-pointer rounded-xl bg-slate-50 border-2 border-slate-100 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all hover:bg-slate-100/50 focus:border-slate-900"
                  disabled={savingStatus || availableStatusOptions.length <= 1}
                >
                  {availableStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronLeft className="-rotate-90" size={20} strokeWidth={3} />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/5 border border-slate-900/10">
                <p className="text-sm font-bold text-slate-500 mb-1">Trạng thái hiện tại:</p>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-900 animate-pulse" />
                  <span className="text-lg font-bold text-slate-900 tracking-normal">
                    {getStatusLabel(status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {hasResume ? (
                  <>
                    <a
                      href={candidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center gap-2 rounded-[28px] bg-slate-50 border border-slate-100 p-4 transition-all hover:bg-white hover:shadow-md group"
                    >
                      <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <ExternalLink size={18} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
                        Mở CV
                      </span>
                    </a>
                    <a
                      href={candidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center gap-2 rounded-[28px] bg-slate-50 border border-slate-100 p-4 transition-all hover:bg-white hover:shadow-md group"
                    >
                      <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Download size={18} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-normal text-slate-500">
                        Tải File
                      </span>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-slate-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
                        <ExternalLink size={18} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-normal">
                        Chưa có CV
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-slate-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
                        <Download size={18} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-normal">Thiếu tệp</span>
                    </div>
                  </>
                )}
              </div>
              {!hasResume && (
                <p className="text-xs font-bold text-slate-400">
                  Hồ sơ này chưa có tệp CV đính kèm, nên admin đang duyệt theo dữ liệu profile hiện
                  có.
                </p>
              )}
            </div>
          </Card>

          {/* Internal Notes - THE PERSISTENT ONE */}
          <Card className="border-none shadow-xl ring-1 ring-slate-200/60 p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageSquare size={80} strokeWidth={3} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-normal text-slate-400 mb-6 flex items-center gap-2 relative">
              <ShieldCheck size={14} className="text-slate-900" /> Ghi chú nội bộ
            </h3>
            <div className="relative space-y-4">
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Nhập ghi chú quan trọng về ứng viên này (chỉ Admin/Owner thấy)..."
                className="w-full h-40 resize-none rounded-xl bg-slate-50 border-2 border-slate-100 p-5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900"
              />
              <Button
                onClick={handleUpdateInternalNote}
                disabled={savingInternalNote}
                className="w-full h-12 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
              >
                {savingInternalNote ? 'Đang lưu...' : 'Lưu ghi chú bền vững'}
              </Button>
            </div>
          </Card>

          {/* Activity Timeline (notes from history) */}
          <Card className="border-none shadow-xl ring-1 ring-slate-200/60 p-0 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-normal text-slate-400 flex items-center gap-2">
                <History size={14} className="text-slate-900" /> Lịch sử Pipeline
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-8 pt-6 scrollbar-hide">
              <div className="relative ml-2 space-y-8 border-l-2 border-slate-100">
                <div className="relative pl-8">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-slate-900 shadow-md ring-1 ring-slate-200" />
                  <p className="text-sm font-bold text-slate-900">Nộp hồ sơ</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-400">
                    {formatDate(application.applied_at || application.created_at)}
                  </p>
                </div>

                {history.map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-white shadow-sm ring-1 ring-slate-200" />
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {getStatusLabel(item.new_status)}
                      </p>
                      {item.changed_by_name && (
                        <span className="text-xs font-bold text-slate-400 tracking-normal uppercase px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                          Bởi {item.changed_by_name}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="mt-2 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500 italic border border-slate-100/60 leading-relaxed">
                        "{item.notes}"
                      </p>
                    )}
                    <p className="mt-1.5 text-xs font-bold text-slate-300 uppercase tracking-normal">
                      {formatDate(item.created_at)} · {formatTimeAgo(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Note Input */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Lưu lý do chuyển trạng thái..."
                  className="w-full h-12 pl-5 pr-12 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:border-slate-900 outline-none transition-all shadow-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <MessageSquare size={16} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {statusDialog?.type === 'interview' ? (
        <InterviewScheduleDialog
          applicantName={candidate.name}
          jobTitle={candidate.role}
          onConfirm={(metadata) => handleStatusUpdate(statusDialog.status, metadata)}
          onCancel={() => setStatusDialog(null)}
        />
      ) : null}

      {statusDialog?.type === 'offer' ? (
        <OfferDialog
          applicantName={candidate.name}
          jobTitle={candidate.role}
          onConfirm={(metadata) => handleStatusUpdate(statusDialog.status, metadata)}
          onCancel={() => setStatusDialog(null)}
        />
      ) : null}
    </div>
  );
};

export default AdminApplicationDetailPage;
