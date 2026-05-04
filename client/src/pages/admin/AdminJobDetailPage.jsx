import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Link2,
  MapPin,
  Sparkles,
  Tag,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/admin';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { formatDate, formatSalaryRange } from '../../utils/formatters';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../../components/common/Modal';
import {
  JOB_STATUS_CONFIG,
  JOB_STATUS,
  JOB_TYPE_FORM_LABELS,
  statusToBadgeVariant,
} from '../../constants/status';
import { EDUCATION_LEVEL_CONFIG } from '../../constants/candidateProfile';

const EMPTY = 'Chưa cập nhật';

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

/**
 * Canonical job status display — dùng JOB_STATUS_CONFIG từ constants/status.js.
 * Bỏ 'flagged' (trạng thái giả) — chỉ dùng 7 trạng thái chính thức.
 */
const getJobDisplayStatus = (status) =>
  JOB_STATUS_CONFIG[status] || JOB_STATUS_CONFIG[JOB_STATUS.DRAFT];

/**
 * Canonical employment type display — từ JOB_TYPE_FORM_LABELS.
 */
const getEmploymentTypeLabel = (type) => JOB_TYPE_FORM_LABELS[type] || type || EMPTY;

/**
 * Canonical education display — từ EDUCATION_LEVEL_CONFIG.
 */
const getEducationLabel = (level) =>
  EDUCATION_LEVEL_CONFIG[level]?.label || (level === 'any' ? 'Không bắt buộc' : level || EMPTY);

function displayOrEmpty(value, fallback = EMPTY) {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

const AdminJobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const { showNotification } = useNotification();

  const jobModules = useMemo(
    () => [
      {
        title: 'Thông tin job',
        description:
          'Rà soát tiêu đề, lương, hạn nộp và loại hình để đánh giá độ đầy đủ của tin đăng.',
        icon: FileText,
      },
      {
        title: 'Liên kết moderation',
        description:
          'Kết nối tin với công ty và hồ sơ ứng tuyển để xử lý vi phạm hoặc khiếu nại theo chuỗi.',
        icon: Link2,
      },
      {
        title: 'Trust & mở rộng',
        description: 'Có thể bổ sung lịch sử duyệt và lý do gắn cờ cho từng tin tuyển dụng.',
        icon: Sparkles,
      },
    ],
    []
  );

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getJob(id);
      if (response.data?.success) {
        const rawJob = response.data.data;
        if (rawJob && typeof rawJob === 'object') {
          const employmentType = String(rawJob.type ?? rawJob.job_type ?? '').trim();
          setJob({
            id: rawJob.id ?? 0,
            title: String(rawJob.title ?? ''),
            company_name: String(rawJob.company_name ?? ''),
            employer_id: rawJob.employer_id ?? null,
            company_location:
              rawJob.company_location != null ? String(rawJob.company_location) : '',
            category_name: rawJob.category_name != null ? String(rawJob.category_name) : '',
            status: String(rawJob.status ?? '').toLowerCase(),
            description: String(rawJob.description ?? ''),
            requirements: String(rawJob.requirements ?? ''),
            benefits: String(rawJob.benefits ?? ''),
            location: String(rawJob.location ?? ''),
            city: String(rawJob.city ?? ''),
            salary_min: rawJob.salary_min ?? null,
            salary_max: rawJob.salary_max ?? null,
            salary_negotiable: isTruthyFlag(rawJob.salary_negotiable),
            vacancies: rawJob.vacancies ?? 1,
            employment_type: employmentType,
            education_required: String(rawJob.education_required ?? ''),
            flagged: Boolean(rawJob.is_flagged ?? rawJob.flagged ?? false),
            moderation_note: rawJob.moderation_note != null ? String(rawJob.moderation_note) : '',
            deadline: rawJob.deadline ?? null,
            created_at: rawJob.created_at ?? new Date().toISOString(),
            updated_at: rawJob.updated_at ?? new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin job detail', error);
      showNotification('Không thể tải thông tin công việc.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const updateStatus = async (status, successMessage, note = null) => {
    setUpdating(true);
    try {
      await adminService.updateJobStatus(id, status, note);
      showNotification(successMessage, 'success');
      await fetchJob();
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.warn('AdminJobDetailPage status update error:', error?.message);
      showNotification('Không thể cập nhật trạng thái tin tuyển dụng.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const statusMeta = job ? getJobDisplayStatus(job.status) : null;
  const educationLabel = job ? getEducationLabel(job.education_required || job.education) : EMPTY;
  const employmentLabel = job ? getEmploymentTypeLabel(job.type || job.employment_type) : EMPTY;
  const salaryText = job?.salary_negotiable
    ? 'Thỏa thuận'
    : job
      ? formatSalaryRange(job.salary_min, job.salary_max)
      : '';
  const vacanciesText = job?.vacancies ? `${job.vacancies} người` : 'Chưa cập nhật';
  const deadlineText = job?.deadline ? formatDate(job.deadline) : null;
  const locationLine = job
    ? [job.location, job.city].filter((x) => String(x).trim()).join(', ') || EMPTY
    : EMPTY;

  if (loading) {
    return (
      <div className="p-10 text-center font-medium text-muted-foreground">Đang tải dữ liệu...</div>
    );
  }

  if (!job) {
    return (
      <div className="p-10 text-center font-medium text-muted-foreground">Không tìm thấy job.</div>
    );
  }

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={Briefcase}
        eyebrow="Quản trị tin tuyển dụng"
        badge={statusMeta?.label || displayOrEmpty(job.status, EMPTY)}
        title={job.title || EMPTY}
        description={
          displayOrEmpty(job.company_name) +
          ' · ' +
          locationLine +
          ' · Đăng ' +
          formatDate(job.created_at)
        }
        actions={
          <>
            <Link
              to="/admin/jobs"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
            >
              <ArrowLeft size={18} />
              Quay lại danh sách
            </Link>
            {updating ? <RefreshCw size={18} className="animate-spin text-primary" /> : null}
            {job.status === 'pending_review' ? (
              <>
                <button
                  disabled={updating}
                  onClick={() => updateStatus('published', 'Đã duyệt và xuất bản tin tuyển dụng.')}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  Duyệt tin
                </button>
                <button
                  disabled={updating}
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Từ chối
                </button>
              </>
            ) : null}
            {job.status === 'published' ? (
              <button
                disabled={updating}
                onClick={() => updateStatus('closed', 'Đã ẩn tin tuyển dụng khỏi nền tảng.')}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-900 disabled:opacity-50"
              >
                <XCircle size={18} />
                Khóa tin
              </button>
            ) : null}
            {job.status === 'closed' ? (
              <button
                disabled={updating}
                onClick={() => updateStatus('published', 'Đã tái bản tin tuyển dụng.')}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Đăng lại
              </button>
            ) : null}
            {job.status !== 'pending_review' ? (
              <button
                disabled={updating}
                onClick={() =>
                  updateStatus('pending_review', 'Đã đưa tin tuyển dụng về trạng thái chờ duyệt.')
                }
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
              >
                <RefreshCw size={18} />
                Chờ duyệt
              </button>
            ) : null}
            <Button
              variant="secondary"
              size="md"
              className="border border-slate-200 px-4"
              to={'/admin/applications?search=' + encodeURIComponent(job.title || '')}
              leftIcon={Users}
            >
              Xem ứng tuyển
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {jobModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-950">{module.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{module.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageHeader>

      <Card className="overflow-hidden border-border/80 p-0 shadow-md">
        <div className="border-b border-border/60 bg-muted/25 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-base font-bold text-muted-foreground shadow-sm ring-1 ring-border/60">
                  <Briefcase size={14} className="text-primary" />
                  Job #{job.id}
                </span>
                {statusMeta ? (
                  <Badge variant={statusToBadgeVariant(job.status)}>{statusMeta.label}</Badge>
                ) : (
                  <Badge variant="default">{displayOrEmpty(job.status, EMPTY)}</Badge>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
                  {job.title || EMPTY}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-base text-muted-foreground">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <Building2 size={17} className="shrink-0 text-primary/80" />
                    {displayOrEmpty(job.company_name)}
                  </span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <MapPin size={17} className="shrink-0 text-primary/80" />
                    {locationLine}
                  </span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <Calendar size={17} className="shrink-0 text-primary/80" />
                    Đăng {formatDate(job.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:max-w-md lg:w-[22rem]">
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Loại hình
                </p>
                <p className="mt-2 text-base font-bold text-foreground">{employmentLabel}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Danh mục
                </p>
                <p className="mt-2 text-base font-bold text-foreground">
                  {displayOrEmpty(job.category_name)}
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:col-span-2">
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Mức lương
                </p>
                <p className="mt-2 text-base font-bold leading-snug text-foreground">
                  {salaryText || 'Thương lượng'}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Số lượng
                </p>
                <p className="mt-2 text-base font-bold text-foreground">{vacanciesText}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Hạn nộp
                </p>
                <p className="mt-2 text-base font-bold text-foreground">{deadlineText ?? EMPTY}</p>
              </div>
            </div>
          </div>
        </div>

        {(job.experience_required || job.education_required) && (
          <div className="flex flex-wrap gap-4 border-b border-border/60 px-6 py-4 text-base sm:px-8">
            {job.experience_required ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 font-medium text-foreground">
                <Briefcase size={15} className="text-muted-foreground" />
                Kinh nghiệm: {displayOrEmpty(job.experience_required, EMPTY)}
              </span>
            ) : null}
            {job.education_required ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 font-medium text-foreground">
                <Tag size={15} className="text-muted-foreground" />
                Học vấn: {educationLabel}
              </span>
            ) : null}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {[
            { title: 'Mô tả công việc', body: job.description, empty: 'Chưa có mô tả.' },
            { title: 'Yêu cầu', body: job.requirements, empty: 'Chưa có yêu cầu.' },
            { title: 'Phúc lợi', body: job.benefits, empty: 'Chưa có phúc lợi.' },
          ].map((block) => (
            <Card key={block.title} className="border-border/80 p-6 shadow-sm sm:p-8">
              <div className="border-l-4 border-primary/50 pl-5">
                <h2 className="text-lg font-bold tracking-normal text-foreground">{block.title}</h2>
                <div
                  className="mt-4 prose prose-slate max-w-none text-base leading-[1.7] text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.body) || block.empty }}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="border-border/80 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Thông tin liên quan</h2>
            <p className="mt-1 text-base text-muted-foreground">
              Liên kết nhanh tới công ty, hồ sơ và trang công khai.
            </p>
            <div className="mt-5 space-y-3">
              {job.employer_id ? (
                <Link
                  to={`/admin/companies/${job.employer_id}`}
                  className="group block rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm"
                >
                  <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                    Công ty
                  </p>
                  <p className="mt-2 font-bold text-foreground group-hover:text-primary">
                    {displayOrEmpty(job.company_name)}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {displayOrEmpty(job.company_location)}
                  </p>
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-base text-muted-foreground">
                  Chưa gắn nhà tuyển dụng hợp lệ.
                </div>
              )}
              <Link
                to={`/admin/applications?search=${encodeURIComponent(job.title || '')}`}
                className="group block rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm"
              >
                <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                  Ứng tuyển
                </p>
                <p className="mt-2 font-bold text-foreground group-hover:text-primary">
                  Xem hồ sơ theo tin này
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  Lọc theo tiêu đề job trong trang quản trị.
                </p>
              </Link>
              <a
                href={`/jobs/${job.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm"
              >
                <div>
                  <p className="text-base font-bold uppercase tracking-normal text-muted-foreground">
                    Trang công khai
                  </p>
                  <p className="mt-2 font-bold text-foreground">Mở trên cổng ứng viên</p>
                </div>
                <ExternalLink size={20} className="shrink-0 text-muted-foreground" />
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="🚫 Lý do từ chối tin đăng"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-500 italic">
            Vui lòng cung cấp lý do cụ thể để nhà tuyển dụng có thể chỉnh sửa và gửi lại tin.
          </p>
          <textarea
            className="w-full rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all font-medium"
            rows={4}
            placeholder="Ví dụ: Nội dung thiếu mô tả chi tiết, hoặc có dấu hiệu spam..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button
              disabled={!rejectReason.trim() || updating}
              onClick={() => updateStatus('rejected', 'Đã từ chối tin tuyển dụng.', rejectReason)}
              className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95"
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminJobDetailPage;
