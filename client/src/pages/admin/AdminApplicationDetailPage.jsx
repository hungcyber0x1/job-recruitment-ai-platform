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
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { getStatusLabel } from '../../constants/status';
import { useNotification } from '../../context/NotificationContext';
import applicationService from '../../services/applicationService';
import { formatDate, formatTimeAgo } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Đang chờ' },
  { value: 'screening', label: 'Sàng lọc AI' },
  { value: 'reviewed', label: 'Đã xem xét' },
  { value: 'shortlisted', label: 'Đã shortlist' },
  { value: 'interviewing', label: 'Đang phỏng vấn' },
  { value: 'offered', label: 'Đã offer' },
  { value: 'hired', label: 'Đã tuyển' },
  { value: 'rejected', label: 'Từ chối' },
];

const parseJson = (data) => {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data || [];
  } catch {
    return [];
  }
};

const AdminApplicationDetailPage = () => {
  const { id } = useParams();
  const { showNotification } = useNotification();
  const [application, setApplication] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const oversightModules = [
    {
      title: 'Hồ sơ và trust signal',
      description:
        'Xem nhanh candidate, employer và match score để đánh giá mức độ hợp lệ của cả hồ sơ.',
    },
    {
      title: 'Pipeline governance',
      description:
        'Admin có thể can thiệp trạng thái và note khi backlog screening hoặc tranh chấp phát sinh.',
    },
    {
      title: 'Audit theo dõi',
      description:
        'Trang detail này là điểm ghép giữa moderation, user, company và lịch sử thao tác.',
    },
  ];

  useEffect(() => {
    let isActive = true;

    const fetchApplication = async () => {
      try {
        const [applicationResponse, historyResponse] = await Promise.all([
          applicationService.getApplication(id),
          applicationService.getApplicationHistory(id),
        ]);

        if (isActive && applicationResponse.data?.success) {
          const rawApp = applicationResponse.data.data;
          if (rawApp && typeof rawApp === 'object') {
            const sanitized = {
              id: rawApp.id ?? 0,
              first_name: String(rawApp.first_name ?? ''),
              last_name: String(rawApp.last_name ?? ''),
              email: String(rawApp.email ?? ''),
              phone: String(rawApp.phone ?? ''),
              job_title: String(rawApp.job_title ?? ''),
              company_name: String(rawApp.company_name ?? ''),
              status: String(rawApp.status ?? 'pending'),
              user_id: rawApp.user_id ?? null,
              job_id: rawApp.job_id ?? null,
              employer_id: rawApp.employer_id ?? null,
              ai_match_score:
                typeof rawApp.ai_match_score === 'number' ? rawApp.ai_match_score : null,
              match_score: typeof rawApp.match_score === 'number' ? rawApp.match_score : null,
              cover_letter: String(rawApp.cover_letter ?? ''),
              resume_url: String(rawApp.resume_url ?? ''),
              applied_at: rawApp.applied_at ?? rawApp.created_at ?? new Date().toISOString(),
            };
            setApplication(sanitized);
            setStatus(sanitized.status);
          }
        }

        if (isActive) {
          setHistory(historyResponse.data.data || []);
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
    if (!application) {
      return null;
    }

    return {
      name: application.first_name
        ? `${application.first_name} ${application.last_name}`
        : 'Ứng viên chưa xác định',
      role: application.job_title || 'Không rõ',
      email: application.email,
      phone: application.phone || 'Không rõ',
      location: application.location || 'Vietnam',
      matchScore: application.score || 0,
      appliedDate: new Date(application.applied_at || application.created_at).toLocaleDateString(
        'vi-VN'
      ),
      education: parseJson(application.education),
      experience: parseJson(application.experience),
      skills: parseJson(application.skills),
      cvUrl: application.resume_url || '#',
      companyName: application.company_name || 'Không rõ',
    };
  }, [application]);

  const refreshHistory = async () => {
    try {
      const historyResponse = await applicationService.getApplicationHistory(id);
      setHistory(historyResponse.data.data || []);
    } catch (error) {
      console.error('Failed to refresh application history', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatus(newStatus);
    setSavingStatus(true);

    try {
      await applicationService.updateStatus(id, newStatus, note || undefined);
      await refreshHistory();
      setApplication((prev) => (prev ? { ...prev, status: newStatus } : prev));
      if (note) {
        setNote('');
      }
      showNotification('Cập nhật trạng thái thành công', 'success');
    } catch (error) {
      console.error('Admin update status failed', error);
      setStatus(application?.status || 'pending');
      showNotification('Cập nhật trạng thái thất bại', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) {
      showNotification('Vui lòng nhập ghi chú', 'error');
      return;
    }

    setSavingNote(true);
    try {
      const response = await applicationService.addNote(id, note);
      setHistory((prev) => [response.data.data, ...prev]);
      setNote('');
      showNotification('Đã lưu ghi chú', 'success');
    } catch (error) {
      console.error('Admin add note failed', error);
      showNotification('Không thể lưu ghi chú', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  }

  if (!application || !candidate) {
    return (
      <AdminLayout>
        <div className="p-10 text-center">Không tìm thấy hồ sơ ứng tuyển</div>
      </AdminLayout>
    );
  }

  const noteItems = history.filter((item) => item.notes);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-20">
        <div className="grid gap-4 xl:grid-cols-3">
          {oversightModules.map((module) => (
            <div
              key={module.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-base font-black uppercase tracking-[0.22em] text-muted-foreground">
                Application oversight
              </p>
              <h2 className="mt-3 text-xl font-black text-foreground">{module.title}</h2>
              <p className="mt-2 text-base leading-6 text-muted-foreground">{module.description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Link
            to="/admin/applications"
            className="flex items-center gap-2 font-bold text-muted-foreground transition-colors hover:text-secondary"
          >
            <ChevronLeft size={20} /> Quay lại danh sách
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-state-danger/20 text-state-danger hover:bg-state-danger/10"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={savingStatus}
            >
              <XCircle size={18} className="mr-2" /> Từ chối
            </Button>
            <Button
              variant="primary"
              className="bg-secondary shadow-card hover:bg-primary"
              onClick={() => handleStatusUpdate('reviewed')}
              disabled={savingStatus}
            >
              <CheckCircle size={18} className="mr-2" /> Đánh dấu đã xem xét
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card className="p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex gap-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted text-4xl font-black text-muted-foreground">
                    <Avatar name={candidate.name} size="lg" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-foreground">{candidate.name}</h1>
                    <p className="text-lg font-bold text-secondary">{candidate.role}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-base font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail size={16} /> {candidate.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone size={16} /> {candidate.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} /> {candidate.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2 font-bold text-secondary">
                    <Star size={16} fill="currentColor" /> {candidate.matchScore}% Match
                  </div>
                  <p className="text-base font-bold text-muted-foreground">
                    Nộp lúc: {candidate.appliedDate}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-border bg-card p-6 shadow-card">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Link
                  to={application.user_id ? `/admin/users/${application.user_id}` : '/admin/users'}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-base font-bold text-muted-foreground hover:bg-card"
                >
                  Hồ sơ ứng viên
                </Link>
                <Link
                  to={application.job_id ? `/admin/jobs/${application.job_id}` : '/admin/jobs'}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-base font-bold text-muted-foreground hover:bg-card"
                >
                  Tin tuyển dụng
                </Link>
                <Link
                  to={
                    application.employer_id
                      ? `/admin/companies/${application.employer_id}`
                      : '/admin/companies'
                  }
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-base font-bold text-muted-foreground hover:bg-card"
                >
                  Hồ sơ công ty
                </Link>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-lg font-bold text-foreground">Kinh nghiệm</h3>
                  {candidate.experience.length ? (
                    candidate.experience.map((experience, index) => (
                      <div key={`experience-${index}`} className="mb-4 rounded-xl bg-muted p-4">
                        <div className="flex justify-between font-bold text-foreground">
                          <h4>{experience.title || experience.position}</h4>
                          <span>{experience.period}</span>
                        </div>
                        <p className="mb-2 font-medium italic text-muted-foreground">
                          {experience.company}
                        </p>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {experience.description || experience.desc}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-base text-muted-foreground">Chưa có dữ liệu kinh nghiệm.</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold text-foreground">Học vấn</h3>
                  {candidate.education.length ? (
                    candidate.education.map((education, index) => (
                      <div key={`education-${index}`} className="mb-3 rounded-xl bg-muted p-4">
                        <div className="flex justify-between font-bold text-foreground">
                          <h4>{education.degree}</h4>
                          <span>{education.period || education.year}</span>
                        </div>
                        <p className="font-medium italic text-muted-foreground">
                          {education.school}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-base text-muted-foreground">Chưa có dữ liệu học vấn.</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold text-foreground">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.length ? (
                      candidate.skills.map((skill, index) => (
                        <span
                          key={`skill-${index}`}
                          className="rounded bg-muted px-3 py-1 text-base font-bold text-muted-foreground"
                        >
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-base text-muted-foreground">Chưa có dữ liệu kỹ năng.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border border-border bg-card p-6 shadow-card">
              <label className="mb-3 block text-base font-bold uppercase tracking-widest text-muted-foreground">
                Trạng thái hồ sơ
              </label>
              <select
                value={status}
                onChange={(event) => handleStatusUpdate(event.target.value)}
                className="mb-3 w-full cursor-pointer rounded-xl border border-border bg-muted px-4 py-3 font-bold text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-secondary/20"
                disabled={savingStatus}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mb-4 text-base text-muted-foreground">
                Trạng thái hiện tại:{' '}
                <span className="font-semibold text-foreground">{getStatusLabel(status)}</span>
              </p>
              <div className="space-y-3">
                <Button
                  asChild
                  className="flex w-full items-center justify-center gap-2"
                  variant="outline"
                >
                  <a href={candidate.cvUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={18} /> Mở CV
                  </a>
                </Button>
                <Button
                  asChild
                  className="flex w-full items-center justify-center gap-2"
                  variant="outline"
                >
                  <a href={candidate.cvUrl} target="_blank" rel="noreferrer">
                    <Download size={18} /> Tải CV
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="flex h-[420px] flex-col border border-border bg-card p-6 shadow-card">
              <h3 className="mb-4 font-bold text-foreground">Đánh giá và ghi chú</h3>

              <div className="mb-4 flex-grow space-y-4 overflow-y-auto pr-2">
                {noteItems.length ? (
                  noteItems.map((item) => (
                    <div key={item.id} className="rounded-xl bg-muted p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-base font-bold text-secondary">
                          {[item.first_name, item.last_name].filter(Boolean).join(' ') ||
                            'Hệ thống'}
                        </span>
                        <span className="text-base text-muted-foreground">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground">{item.notes}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-base text-muted-foreground">Chưa có ghi chú đánh giá nào.</p>
                )}
              </div>

              <div className="relative mt-auto">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Viết ghi chú nội bộ..."
                  className="h-20 w-full resize-none rounded-xl border border-border bg-muted p-3 pr-16 text-base font-medium outline-none transition-all focus:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/10"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={savingNote}
                  className="absolute bottom-3 right-3 rounded-lg bg-secondary p-1.5 text-white transition-colors hover:bg-primary disabled:opacity-60"
                >
                  <Send size={14} />
                </button>
              </div>
            </Card>

            <Card className="border border-border bg-card p-6 shadow-card">
              <h3 className="mb-6 font-bold text-foreground">Lịch sử ứng tuyển</h3>
              <div className="relative ml-3 space-y-6 border-l-2 border-border">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-secondary/20 bg-card" />
                  <p className="text-base font-bold text-foreground">Nộp hồ sơ</p>
                  <p className="mt-0.5 text-base text-muted-foreground">
                    {formatDate(application.applied_at || application.created_at)}
                  </p>
                </div>

                {history.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-accent/20 bg-card" />
                    <p className="text-base font-bold text-foreground">
                      {getStatusLabel(item.new_status)}
                    </p>
                    <p className="mt-0.5 text-base text-muted-foreground">
                      {item.notes ||
                        `Cập nhật từ ${item.old_status || 'ban đầu'} sang ${item.new_status}`}
                    </p>
                    <p className="mt-0.5 text-base text-muted-foreground">
                      {formatDate(item.created_at)} ({formatTimeAgo(item.created_at)})
                    </p>
                  </div>
                ))}

                {!history.length ? (
                  <p className="pl-6 text-base text-muted-foreground">
                    Chưa có cập nhật nào sau khi nhận hồ sơ.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminApplicationDetailPage;
