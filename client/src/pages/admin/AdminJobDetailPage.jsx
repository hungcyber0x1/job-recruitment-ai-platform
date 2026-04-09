import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { formatDate, formatSalaryRange } from '../../utils/formatters';

const EMPTY = 'Chưa cập nhật';

const JOB_STATUS_VI = {
  draft: { label: 'Bản nháp', variant: 'default' },
  pending: { label: 'Chờ duyệt', variant: 'warning' },
  published: { label: 'Đã đăng', variant: 'success' },
  rejected: { label: 'Từ chối', variant: 'error' },
  closed: { label: 'Đã đóng', variant: 'default' },
};

const EMPLOYMENT_TYPE_VI = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  remote: 'Remote',
};

const EDUCATION_VI = {
  high_school: 'Trung học phổ thông',
  college: 'Cao đẳng',
  bachelor: 'Đại học',
  master: 'Thạc sĩ',
  phd: 'Tiến sĩ',
  any: 'Không bắt buộc',
};

function displayOrEmpty(value, fallback = EMPTY) {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

const AdminJobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

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
        description: 'Có thể bổ sung lịch sử duyệt, lý do gắn cờ và điểm rủi ro AI cho từng tin.',
        icon: Sparkles,
      },
    ],
    []
  );

  useEffect(() => {
    let isActive = true;

    const fetchJob = async () => {
      try {
        const response = await adminService.getJob(id);
        if (isActive && response.data?.success) {
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
              employment_type: employmentType,
              experience_required: String(
                rawJob.experience_required ?? rawJob.experience_level ?? ''
              ),
              education_required: String(rawJob.education_required ?? ''),
              flagged: Boolean(rawJob.is_flagged ?? rawJob.flagged ?? false),
              moderation_note: rawJob.moderation_note != null ? String(rawJob.moderation_note) : '',
              ai_risk: typeof rawJob.ai_risk === 'number' ? rawJob.ai_risk : null,
              deadline: rawJob.deadline ?? null,
              created_at: rawJob.created_at ?? new Date().toISOString(),
              updated_at: rawJob.updated_at ?? new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin job detail', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    return () => {
      isActive = false;
    };
  }, [id]);

  const statusMeta = job ? JOB_STATUS_VI[job.status] : null;
  const educationLabel = job
    ? EDUCATION_VI[job.education_required] || displayOrEmpty(job.education_required, EMPTY)
    : EMPTY;
  const employmentLabel = job
    ? EMPLOYMENT_TYPE_VI[job.employment_type] || displayOrEmpty(job.employment_type, EMPTY)
    : EMPTY;
  const salaryText = job ? formatSalaryRange(job.salary_min, job.salary_max) : '';
  const deadlineText = job?.deadline ? formatDate(job.deadline) : null;
  const locationLine = job
    ? [job.location, job.city].filter((x) => String(x).trim()).join(', ') || EMPTY
    : EMPTY;

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  }

  if (!job) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Không tìm thấy job.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        <section
          aria-label="Hướng dẫn moderation"
          className="rounded-2xl border border-border/80 bg-gradient-to-br from-muted/40 via-card to-card p-5 shadow-sm sm:p-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Job governance
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {jobModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.title}
                  className="flex gap-3 rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-foreground">{module.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin/jobs"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
              <ArrowLeft size={18} />
            </span>
            Quay lại danh sách
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              className="min-w-[10rem] border border-primary/20"
              to={`/admin/applications?search=${encodeURIComponent(job.title || '')}`}
              leftIcon={Users}
            >
              Xem ứng tuyển
            </Button>
            {job.employer_id ? (
              <Button
                variant="primary"
                size="md"
                className="min-w-[10rem]"
                to={`/admin/companies/${job.employer_id}`}
                leftIcon={Building2}
              >
                Xem công ty
              </Button>
            ) : (
              <Button type="button" variant="primary" size="md" disabled className="min-w-[10rem]">
                Chưa có công ty
              </Button>
            )}
          </div>
        </div>

        <Card className="overflow-hidden border-border/80 p-0 shadow-md">
          <div className="border-b border-border/60 bg-muted/25 px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-bold text-muted-foreground shadow-sm ring-1 ring-border/60">
                    <Briefcase size={14} className="text-primary" />
                    Job #{job.id}
                  </span>
                  {statusMeta ? (
                    <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  ) : (
                    <Badge variant="default">{displayOrEmpty(job.status, EMPTY)}</Badge>
                  )}
                  {job.flagged && (
                    <Badge variant="warning" className="uppercase">
                      Đã gắn cờ
                    </Badge>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                    {job.title || EMPTY}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
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
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Loại hình
                  </p>
                  <p className="mt-2 text-base font-bold text-foreground">{employmentLabel}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Danh mục
                  </p>
                  <p className="mt-2 text-base font-bold text-foreground">
                    {displayOrEmpty(job.category_name)}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mức lương
                  </p>
                  <p className="mt-2 text-base font-bold leading-snug text-foreground">
                    {salaryText || 'Thương lượng'}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Hạn nộp
                  </p>
                  <p className="mt-2 text-base font-bold text-foreground">
                    {deadlineText ?? EMPTY}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(job.experience_required || job.education_required) && (
            <div className="flex flex-wrap gap-4 border-b border-border/60 px-6 py-4 text-sm sm:px-8">
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
                  <h2 className="text-lg font-black tracking-tight text-foreground">
                    {block.title}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.7] text-foreground/85">
                    {String(block.body || '').trim() ? block.body : block.empty}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="border-border/80 p-6 shadow-sm">
              <h2 className="text-lg font-black text-foreground">Thông tin liên quan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Liên kết nhanh tới công ty, hồ sơ và trang công khai.
              </p>
              <div className="mt-5 space-y-3">
                {job.employer_id ? (
                  <Link
                    to={`/admin/companies/${job.employer_id}`}
                    className="group block rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Công ty
                    </p>
                    <p className="mt-2 font-bold text-foreground group-hover:text-primary">
                      {displayOrEmpty(job.company_name)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {displayOrEmpty(job.company_location)}
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Chưa gắn nhà tuyển dụng hợp lệ.
                  </div>
                )}
                <Link
                  to={`/admin/applications?search=${encodeURIComponent(job.title || '')}`}
                  className="group block rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-sm"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ứng tuyển
                  </p>
                  <p className="mt-2 font-bold text-foreground group-hover:text-primary">
                    Xem hồ sơ theo tin này
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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
      </div>
    </AdminLayout>
  );
};

export default AdminJobDetailPage;
