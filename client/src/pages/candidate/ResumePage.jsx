import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  GraduationCap,
  LayoutGrid,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/utils';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { useNotification } from '../../context/NotificationContext';
import useUpload from '../../hooks/useUpload';
import candidateService from '../../services/candidateService';

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
const EMPTY_LIST = [];

const formatDate = (value) => {
  if (!value) return 'Chưa có dữ liệu cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Đã cập nhật trước đó';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getFileNameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return 'CV hiện tại';
  const cleanUrl = url.split('?')[0].split('#')[0];
  const rawName = cleanUrl.split('/').filter(Boolean).pop();
  if (!rawName) return 'CV hiện tại';

  try {
    const decoded = decodeURIComponent(rawName);
    return /^resume-\d+-\d+/i.test(decoded) ? 'CV hiện tại' : decoded;
  } catch {
    return /^resume-\d+-\d+/i.test(rawName) ? 'CV hiện tại' : rawName;
  }
};

const getFileExtension = (fileName = '') => {
  const normalized = String(fileName).toLowerCase().split('?')[0].split('#')[0];
  const extension = normalized.includes('.') ? normalized.split('.').pop() : '';
  return extension || 'file';
};

const normalizeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : EMPTY_LIST);

const normalizeExternalHref = (href) => {
  if (!href || typeof href !== 'string') return '';
  const trimmed = href.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const getProjectPeriod = (project = {}) => {
  const start = project.startDate || project.start_date;
  const end = project.endDate || project.end_date;
  if (!start && !end) return 'Thời gian chưa cập nhật';
  return [formatDate(start), end ? formatDate(end) : 'Hiện tại'].filter(Boolean).join(' - ');
};

const getProfileDisplayName = (profile) => {
  const safeProfile = profile || {};
  const fullName = [safeProfile.first_name, safeProfile.last_name].filter(Boolean).join(' ').trim();
  return fullName || safeProfile.name || safeProfile.full_name || 'Ứng viên';
};

const UploadControl = ({
  children,
  disabled,
  isUploading,
  onUpload,
  className,
  variant = 'primary',
}) => {
  const baseClasses =
    'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-200';
  const variantClasses =
    variant === 'outline'
      ? 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
      : 'border border-transparent bg-emerald-600 text-white shadow-sm hover:bg-emerald-700';

  return (
    <label
      className={cn(
        baseClasses,
        variantClasses,
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <input
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onUpload}
        disabled={disabled}
      />
      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {children}
    </label>
  );
};

const MetricCard = ({ icon: Icon, label, value, helper, tone = 'emerald' }) => {
  const toneClasses = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  };

  return (
    <Card className="rounded-lg border-slate-200 bg-white/90 p-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
              toneClasses[tone] || toneClasses.emerald
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {label}
            </p>
            <p className="mt-1 truncate text-2xl font-bold leading-tight text-slate-950">{value}</p>
            {helper ? (
              <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">{helper}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const EmptyPanel = ({ icon: Icon, title, description, children }) => (
  <div className="flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{description}</p>
    {children ? <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div> : null}
  </div>
);

const StatusPill = ({ icon: Icon, children, tone = 'emerald' }) => {
  const toneClasses = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
        toneClasses[tone] || toneClasses.emerald
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
};

const ResumePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { upload, isUploading } = useUpload();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const cvUploadSectionRef = useRef(null);
  const [highlightCvUpload, setHighlightCvUpload] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await candidateService.getFullProfile();
      setProfile(response.data?.data ?? null);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      showNotification('Không thể tải thông tin hồ sơ ứng tuyển', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (searchParams.get('upload') !== '1') return undefined;
    const timer = window.setTimeout(() => {
      cvUploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightCvUpload(true);
      window.setTimeout(() => setHighlightCvUpload(false), 2400);
      const next = new URLSearchParams(searchParams);
      next.delete('upload');
      setSearchParams(next, { replace: true });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  const resume = useMemo(() => {
    const rawUrl = profile?.resume_url;
    if (!rawUrl) return null;

    const name = profile?.resume_name || getFileNameFromUrl(rawUrl);
    return {
      rawUrl,
      url: resolveMediaUrl(rawUrl),
      name,
      extension: getFileExtension(name === 'CV hiện tại' ? rawUrl : name).toUpperCase(),
      updatedAt: profile?.resume_updated_at || profile?.updated_at,
    };
  }, [profile]);

  const projects = useMemo(() => normalizeList(profile?.projects), [profile]);
  const certifications = useMemo(() => normalizeList(profile?.certifications), [profile]);
  const displayName = useMemo(() => getProfileDisplayName(profile), [profile]);
  const currentTitle =
    profile?.title || profile?.current_job_title || 'Chưa cập nhật vị trí mong muốn';
  const location = profile?.location || 'Chưa cập nhật khu vực';
  const updatedAtLabel = formatDate(profile?.updated_at || profile?.updatedAt);
  const uploadDisabled = isUploading;

  const checklist = useMemo(
    () => [
      {
        label: 'CV ứng tuyển',
        done: Boolean(resume),
        helper: resume ? 'Sẵn sàng dùng khi ứng tuyển nhanh' : 'Tải lên CV trước khi nộp hồ sơ',
      },
      {
        label: 'Portfolio dự án',
        done: projects.length > 0,
        helper:
          projects.length > 0
            ? `${projects.length} dự án đã bổ sung`
            : 'Thêm dự án nổi bật để tăng độ tin cậy',
      },
      {
        label: 'Chứng chỉ & bằng cấp',
        done: certifications.length > 0,
        helper:
          certifications.length > 0
            ? `${certifications.length} minh chứng năng lực`
            : 'Bổ sung chứng chỉ nếu có để hoàn thiện hồ sơ',
      },
    ],
    [certifications.length, projects.length, resume]
  );

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const extension = getFileExtension(file.name).toLowerCase();
    if (!ACCEPTED_RESUME_EXTENSIONS.includes(extension)) {
      showNotification('CV chỉ hỗ trợ định dạng PDF, DOC hoặc DOCX.', 'error');
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      showNotification('CV không được vượt quá 5MB.', 'error');
      return;
    }

    try {
      const uploadRes = await upload('resume', file);
      const uploadedUrl = uploadRes.url || uploadRes.payload?.resume_url;
      if (!uploadedUrl) throw new Error('Không lấy được đường dẫn CV sau khi tải lên');

      setProfile((prev) => ({
        ...(prev || {}),
        ...(uploadRes.payload || {}),
        resume_url: uploadedUrl,
        resume_name: file.name,
        resume_updated_at: new Date().toISOString(),
      }));
      showNotification('CV ứng tuyển đã được cập nhật.', 'success');
    } catch (error) {
      console.warn('ResumePage upload error:', error?.message);
      showNotification(
        error.response?.data?.message || 'Lỗi khi tải CV lên. Vui lòng thử lại.',
        'error'
      );
    }
  };

  const handleRemoveResume = async () => {
    if (!resume) return;
    const confirmed = window.confirm('Bạn muốn gỡ CV hiện tại khỏi hồ sơ ứng tuyển?');
    if (!confirmed) return;

    try {
      const response = await candidateService.updateProfile({ resume_url: null });
      setProfile((prev) => ({
        ...(prev || {}),
        ...(response.data?.data || {}),
        resume_url: null,
        resume_name: '',
        resume_updated_at: null,
      }));
      showNotification('Đã gỡ CV khỏi hồ sơ ứng tuyển.', 'success');
    } catch (error) {
      console.error('Failed to remove resume', error);
      showNotification(
        error.response?.data?.message || 'Không thể gỡ CV. Vui lòng thử lại.',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-lg border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải CV & Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <FileText className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Hồ sơ ứng tuyển
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  CV & Portfolio
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  Quản lý CV hiện tại, dự án portfolio và chứng chỉ theo đúng dữ liệu hồ sơ ứng viên
                  trong hệ thống.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-lg bg-white text-sm font-bold"
              >
                <Link to="/candidate/profile/edit">Chỉnh sửa hồ sơ</Link>
              </Button>
              <UploadControl
                disabled={uploadDisabled}
                isUploading={isUploading}
                onUpload={handleFileUpload}
              >
                {resume ? 'Thay CV hiện tại' : 'Tải CV'}
              </UploadControl>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              icon={resume ? CheckCircle2 : AlertCircle}
              label="CV ứng tuyển"
              value={resume ? 'Sẵn sàng' : 'Chưa có'}
              helper={
                resume
                  ? `Cập nhật ${formatDate(resume.updatedAt)}`
                  : 'Cần tải CV trước khi ứng tuyển'
              }
              tone={resume ? 'emerald' : 'amber'}
            />
            <MetricCard
              icon={LayoutGrid}
              label="Portfolio"
              value={`${projects.length} dự án`}
              helper="Dữ liệu lấy từ hồ sơ cá nhân"
              tone="blue"
            />
            <MetricCard
              icon={GraduationCap}
              label="Chứng chỉ"
              value={`${certifications.length}`}
              helper="Minh chứng bổ sung năng lực"
              tone="violet"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section ref={cvUploadSectionRef} className="space-y-5">
            <Card
              className={cn(
                'rounded-lg border-slate-200 bg-white shadow-sm transition-colors',
                highlightCvUpload && 'border-emerald-300 ring-4 ring-emerald-100'
              )}
            >
              <CardContent className="p-5">
                <SectionHeader
                  icon={FileText}
                  title="CV ứng tuyển hiện tại"
                  subtitle="Dự án đang lưu một CV chính trên hồ sơ ứng viên. Khi tải CV mới, hệ thống sẽ thay thế CV hiện tại để dùng khi ứng tuyển nhanh."
                  action={
                    <StatusPill
                      icon={resume ? CheckCircle2 : AlertCircle}
                      tone={resume ? 'emerald' : 'amber'}
                    >
                      {resume ? 'Đã có CV' : 'Chưa có CV'}
                    </StatusPill>
                  }
                />

                {resume ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                          <FileText className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-950">
                              {resume.name}
                            </h3>
                            <StatusPill tone="slate">{resume.extension}</StatusPill>
                          </div>
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              Cập nhật {formatDate(resume.updatedAt)}
                            </span>
                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
                            <span>Dùng làm CV mặc định khi ứng tuyển nhanh</span>
                          </p>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                            CV này được đồng bộ trực tiếp với hồ sơ ứng viên. Nhà tuyển dụng sẽ thấy
                            đường dẫn CV này trong đơn ứng tuyển nếu bạn chọn dùng CV hiện tại.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 rounded-lg bg-white text-sm font-bold"
                            >
                              <Eye className="h-4 w-4" />
                              Xem trước
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full max-w-4xl overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle>Xem trước CV</SheetTitle>
                              <SheetDescription>
                                Nếu trình duyệt không hiển thị DOC/DOCX, hãy tải xuống để xem file
                                gốc.
                              </SheetDescription>
                            </SheetHeader>
                            <div className="mt-4 h-[80vh] overflow-hidden rounded-lg border bg-slate-50">
                              <iframe
                                src={resume.url}
                                title={resume.name}
                                className="h-full w-full"
                              />
                            </div>
                          </SheetContent>
                        </Sheet>

                        <Button
                          variant="outline"
                          className="h-10 rounded-lg bg-white text-sm font-bold"
                          asChild
                        >
                          <a href={resume.url} download target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                            Tải xuống
                          </a>
                        </Button>

                        <UploadControl
                          disabled={uploadDisabled}
                          isUploading={isUploading}
                          onUpload={handleFileUpload}
                          variant="outline"
                        >
                          {isUploading ? 'Đang tải...' : 'Thay thế'}
                        </UploadControl>

                        <Button
                          variant="outline"
                          className="h-10 rounded-lg bg-white text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={handleRemoveResume}
                        >
                          <Trash2 className="h-4 w-4" />
                          Gỡ CV
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyPanel
                    icon={FileText}
                    title="Chưa có CV ứng tuyển"
                    description="Tải lên CV đầu tiên để hồ sơ sẵn sàng khi ứng tuyển. File sẽ được lưu trực tiếp vào hồ sơ ứng viên của bạn."
                  >
                    <UploadControl
                      disabled={uploadDisabled}
                      isUploading={isUploading}
                      onUpload={handleFileUpload}
                    >
                      {isUploading ? 'Đang tải...' : 'Tải CV đầu tiên'}
                    </UploadControl>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-lg bg-white text-sm font-bold"
                    >
                      <Link to="/candidate/profile/edit">Cập nhật hồ sơ</Link>
                    </Button>
                  </EmptyPanel>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <SectionHeader
                  icon={LayoutGrid}
                  title="Portfolio dự án"
                  subtitle="Các dự án nổi bật giúp nhà tuyển dụng đánh giá rõ hơn kinh nghiệm thực tế của bạn."
                  action={
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-lg bg-white text-sm font-bold"
                    >
                      <Link to="/candidate/profile/projects/new">
                        <Plus className="h-4 w-4" />
                        Thêm dự án
                      </Link>
                    </Button>
                  }
                />

                {projects.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project, index) => {
                      const title = project.title || project.name || `Dự án ${index + 1}`;
                      const projectUrl = normalizeExternalHref(
                        project.project_url || project.projectUrl
                      );
                      const githubUrl = normalizeExternalHref(
                        project.github_url || project.githubUrl
                      );
                      const imageUrl = resolveMediaUrl(project.image || project.image_url || '');
                      const tags = normalizeList(project.tags || project.technologies).slice(0, 4);

                      return (
                        <Card
                          key={`${title}-${project.id || index}`}
                          className="overflow-hidden rounded-lg border-slate-200 bg-white p-0 shadow-sm"
                        >
                          {imageUrl ? (
                            <div className="h-36 overflow-hidden bg-slate-100">
                              <img
                                src={imageUrl}
                                alt={title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : null}
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                                <LayoutGrid className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="line-clamp-1 text-sm font-bold text-slate-950">
                                  {title}
                                </h3>
                                <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                                  {project.role || 'Vai trò chưa cập nhật'}
                                </p>
                                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {getProjectPeriod(project)}
                                </p>
                              </div>
                            </div>

                            {project.description ? (
                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                                {project.description}
                              </p>
                            ) : null}

                            {tags.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {projectUrl || githubUrl ? (
                              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                {projectUrl ? (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg bg-white text-xs font-bold"
                                  >
                                    <a href={projectUrl} target="_blank" rel="noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      Demo
                                    </a>
                                  </Button>
                                ) : null}
                                {githubUrl ? (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg bg-white text-xs font-bold"
                                  >
                                    <a href={githubUrl} target="_blank" rel="noreferrer">
                                      <Github className="h-3.5 w-3.5" />
                                      GitHub
                                    </a>
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPanel
                    icon={LayoutGrid}
                    title="Chưa có dự án portfolio"
                    description="Thêm dự án thực tế, sản phẩm cá nhân hoặc đồ án nổi bật để tăng sức thuyết phục cho hồ sơ."
                  >
                    <Button
                      asChild
                      className="h-10 rounded-lg bg-emerald-600 text-sm font-bold hover:bg-emerald-700"
                    >
                      <Link to="/candidate/profile/projects/new">
                        <Plus className="h-4 w-4" />
                        Thêm dự án đầu tiên
                      </Link>
                    </Button>
                  </EmptyPanel>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <SectionHeader
                  icon={GraduationCap}
                  title="Chứng chỉ & Bằng cấp"
                  subtitle="Bổ sung chứng chỉ, khóa học hoặc bằng cấp để hồ sơ đáng tin cậy hơn."
                  action={
                    <Button
                      variant="outline"
                      asChild
                      className="h-10 rounded-lg bg-white text-sm font-bold"
                    >
                      <Link to="/candidate/profile/edit">
                        <Plus className="h-4 w-4" />
                        Cập nhật
                      </Link>
                    </Button>
                  }
                />

                {certifications.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {certifications.map((cert, index) => {
                      const title = cert.name || cert.title || `Chứng chỉ ${index + 1}`;
                      const issuer =
                        cert.issuer || cert.organization || cert.school || cert.provider;
                      const certUrl = normalizeExternalHref(cert.url || cert.credential_url);

                      return (
                        <Card
                          key={`${title}-${index}`}
                          className="rounded-lg border-slate-200 bg-white p-0 shadow-sm"
                        >
                          <CardContent className="flex items-start gap-3 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
                              <Award className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-sm font-bold text-slate-950">
                                {title}
                              </h3>
                              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                                {[issuer, cert.year || cert.issue_year]
                                  .filter(Boolean)
                                  .join(' • ') || 'Tổ chức cấp chưa cập nhật'}
                              </p>
                              {certUrl ? (
                                <a
                                  href={certUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                  Xem chứng chỉ
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPanel
                    icon={GraduationCap}
                    title="Chưa có chứng chỉ nào"
                    description="Bổ sung chứng chỉ, bằng cấp hoặc khóa học liên quan trong hồ sơ cá nhân để hoàn thiện hồ sơ ứng tuyển."
                  >
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-lg bg-white text-sm font-bold text-emerald-700"
                    >
                      <Link to="/candidate/profile/edit">Cập nhật chứng chỉ</Link>
                    </Button>
                  </EmptyPanel>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <SidebarCard title="Tóm tắt hồ sơ" icon={ShieldCheck}>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Ứng viên
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{displayName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Vị trí
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{currentTitle}</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {location}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Cập nhật hồ sơ: {updatedAtLabel}
                </p>
              </div>
            </SidebarCard>

            <SidebarCard title="Quy tắc hoạt động" icon={AlertCircle}>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Hệ thống hiện lưu <strong>một CV chính</strong> trong hồ sơ ứng viên. CV này được
                  dùng làm nguồn mặc định cho luồng ứng tuyển nhanh.
                </p>
                <p>
                  Tải CV mới sẽ thay thế CV hiện tại. Nếu cần tùy biến CV theo từng tin tuyển dụng,
                  hãy tải file phù hợp ngay trong bước ứng tuyển.
                </p>
              </div>
            </SidebarCard>

            <SidebarCard title="Tải CV" icon={Upload}>
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-medium leading-6 text-slate-500">
                  Hỗ trợ PDF, DOC, DOCX. Kích thước tối đa 5MB.
                </p>
                <UploadControl
                  disabled={uploadDisabled}
                  isUploading={isUploading}
                  onUpload={handleFileUpload}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  {isUploading ? 'Đang tải...' : resume ? 'Thay CV' : 'Tải CV'}
                </UploadControl>
              </div>
            </SidebarCard>

            <SidebarCard title="Mức độ sẵn sàng" icon={Sparkles}>
              <div className="mt-4 space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                        item.done
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500">
                        {item.helper}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ResumePage;
