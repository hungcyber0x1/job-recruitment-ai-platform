import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import useUpload from '../../hooks/useUpload';
import { useNotification } from '../../context/NotificationContext';
import candidateService from '../../services/candidateService';
import { cn } from '@/utils';

const defaultCerts = [];
const MAX_CV_COUNT = 5;

const CV_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'default', label: 'Mặc định' },
  { value: 'others', label: 'CV khác' },
];

const UploadControl = ({
  children,
  disabled,
  isUploading,
  onUpload,
  className,
  variant = 'primary',
}) => {
  const baseClasses =
    'inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-200';
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
        accept=".pdf,.doc,.docx"
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
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  };

  return (
    <Card className="rounded-lg border-slate-200 bg-white/90 p-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
              toneClasses[tone]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            <p className="mt-0.5 truncate text-xl font-bold leading-tight text-slate-950">{value}</p>
            {helper && <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">{helper}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {subtitle && <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const SidebarCard = ({ title, icon: Icon, children, className }) => (
  <Card className={cn('overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm', className)}>
    <CardContent className="p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </h3>
      {children}
    </CardContent>
  </Card>
);

const EmptyPanel = ({ icon: Icon, title, description, children, compact = false }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 text-center',
      compact ? 'min-h-[128px] px-4 py-6' : 'min-h-[180px] px-6 py-8'
    )}
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
    <p className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">{description}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

const ResumePage = () => {
  const [profile, setProfile] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [defaultCvId, setDefaultCvId] = useState(null);
  const [editingCvName, setEditingCvName] = useState(null);
  const [editingCvNameValue, setEditingCvNameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cvFilter, setCvFilter] = useState('all');
  const { upload, isUploading } = useUpload();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const cvUploadSectionRef = useRef(null);
  const [highlightCvUpload, setHighlightCvUpload] = useState(false);

  useEffect(() => {
    if (searchParams.get('upload') !== '1') return;
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        const data = response.data?.data ?? null;
        setProfile(data);
        if (data?.resume_url) {
          const mainCv = {
            id: 'main',
            name: data.resume_name || 'CV_Hien_Tai.pdf',
            url: data.resume_url,
            date: data.resume_updated_at
              ? new Date(data.resume_updated_at).toLocaleDateString('vi-VN')
              : 'Cập nhật trước đó',
            is_default: true,
          };
          setCvList([mainCv]);
          setDefaultCvId('main');
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
        showNotification('Không thể tải thông tin hồ sơ', 'error');
      }
    };

    fetchProfile();
  }, [showNotification]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await upload('resume', file);
      if (!uploadRes.url) throw new Error('Không lấy được đường dẫn CV');
      await candidateService.updateProfile({ resume_url: uploadRes.url });

      const newCv = {
        id: `cv-${Date.now()}`,
        name: file.name,
        url: uploadRes.url,
        date: new Date().toLocaleDateString('vi-VN'),
        is_default: cvList.length === 0,
      };

      setProfile((prev) => ({
        ...(prev || {}),
        resume_url: uploadRes.url,
        resume_name: file.name,
        resume_updated_at: new Date().toISOString(),
      }));
      setCvList((prev) => [...prev, newCv]);
      if (cvList.length === 0) setDefaultCvId(newCv.id);
      showNotification('Tải CV lên thành công.', 'success');
    } catch (error) {
      console.warn('ResumePage upload error:', error?.message);
      showNotification(
        error.response?.data?.message || 'Lỗi khi tải CV lên. Vui lòng thử lại.',
        'error'
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveCv = async (cv) => {
    if (cv.id === 'main') {
      try {
        await candidateService.updateProfile({ resume_url: '' });
        setProfile((prev) => ({ ...(prev || {}), resume_url: '', resume_name: '' }));
        setCvList((prev) => prev.filter((item) => item.id !== cv.id));
        if (defaultCvId === cv.id) setDefaultCvId(null);
        showNotification('Đã xóa CV.', 'success');
      } catch {
        showNotification('Không thể xóa CV.', 'error');
      }
      return;
    }

    setCvList((prev) => prev.filter((item) => item.id !== cv.id));
    if (defaultCvId === cv.id) setDefaultCvId(null);
    showNotification('Đã xóa CV.', 'success');
  };

  const handleSetDefault = (cvId) => {
    setCvList((prev) => prev.map((cv) => ({ ...cv, is_default: cv.id === cvId })));
    setDefaultCvId(cvId);
    showNotification('Đã đặt CV mặc định.', 'success');
  };

  const handleRenameCv = (cv) => {
    setEditingCvName(cv.id);
    setEditingCvNameValue(cv.name);
  };

  const handleSaveRename = (cvId) => {
    if (editingCvNameValue.trim()) {
      setCvList((prev) =>
        prev.map((cv) => (cv.id === cvId ? { ...cv, name: editingCvNameValue.trim() } : cv))
      );
      showNotification('Đã đổi tên CV.', 'success');
    }
    setEditingCvName(null);
    setEditingCvNameValue('');
  };

  const defaultCv =
    (defaultCvId ? cvList.find((cv) => cv.id === defaultCvId) : null) ||
    cvList.find((cv) => cv.is_default) ||
    null;
  const uploadDisabled = isUploading || cvList.length >= MAX_CV_COUNT;

  const filteredCvList = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return cvList.filter((cv) => {
      const matchesSearch = !normalizedSearch || cv.name.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        cvFilter === 'all' ||
        (cvFilter === 'default' && cv.is_default) ||
        (cvFilter === 'others' && !cv.is_default);

      return matchesSearch && matchesFilter;
    });
  }, [cvList, cvFilter, searchTerm]);

  const certifications = profile?.certifications?.length ? profile.certifications : defaultCerts;

  return (
    <div className="min-h-screen bg-slate-50/40 pb-12">
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
                  Quản lý CV
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Quản lý CV, đặt bản mặc định và tối ưu nhanh trước khi ứng tuyển.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard
              icon={FileText}
              label="Tổng số CV"
              value={`${cvList.length}/${MAX_CV_COUNT}`}
              helper="Số CV đang lưu trong hệ thống"
              tone="blue"
            />

            <MetricCard
              icon={Star}
              label="CV mặc định"
              value={defaultCv?.name || 'Chưa đặt'}
              helper="Dùng khi ứng tuyển nhanh"
              tone="violet"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm CV..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-12 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 transition-colors hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {CV_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setCvFilter(filter.value)}
                    className={cn(
                      'inline-flex h-9 items-center rounded-md px-3 text-xs font-bold transition-colors',
                      cvFilter === filter.value
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <UploadControl
                disabled={uploadDisabled}
                isUploading={isUploading}
                onUpload={handleFileUpload}
                className="sm:min-w-[132px]"
              >
                {isUploading ? 'Đang tải...' : 'Tải CV mới'}
              </UploadControl>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section ref={cvUploadSectionRef} className="space-y-4">
            <Card
              className={cn(
                'rounded-lg border-slate-200 bg-white shadow-sm transition-colors',
                highlightCvUpload && 'border-emerald-300 ring-4 ring-emerald-100'
              )}
            >
              <CardContent className="p-4">
                <SectionHeader
                  icon={FileText}
                  title={`Danh sách CV (${filteredCvList.length})`}
                  subtitle="Xem trước, đổi tên, tải xuống, đặt mặc định hoặc xóa CV không còn dùng."
                  action={
                    <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">
                      {cvList.length}/{MAX_CV_COUNT} CV
                    </span>
                  }
                />

                {filteredCvList.length === 0 && cvList.length === 0 ? (
                  <EmptyPanel
                    icon={FileText}
                    title="Chưa có CV nào"
                    description="Tải lên CV đầu tiên để dùng khi ứng tuyển và quản lý hồ sơ tập trung hơn."
                    compact
                  >
                    <UploadControl
                      disabled={uploadDisabled}
                      isUploading={isUploading}
                      onUpload={handleFileUpload}
                    >
                      Tải CV đầu tiên
                    </UploadControl>
                  </EmptyPanel>
                ) : filteredCvList.length === 0 ? (
                  <EmptyPanel
                    icon={Search}
                    title="Không tìm thấy CV phù hợp"
                    description="Thử đổi từ khóa hoặc chuyển bộ lọc để xem thêm CV."
                    compact
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg bg-white text-xs font-bold"
                      onClick={() => {
                        setSearchTerm('');
                        setCvFilter('all');
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </EmptyPanel>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCvList.map((cv) => (
                      <Card
                        key={cv.url || cv.id}
                        className={cn(
                          'rounded-lg border bg-white p-0 shadow-sm transition-colors hover:border-emerald-200',
                          cv.is_default ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                              <FileText className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              {cv.is_default && (
                                <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <Star className="h-3 w-3 fill-emerald-500" />
                                  Mặc định
                                </span>
                              )}

                              {editingCvName === cv.id ? (
                                <div className="mt-1 flex gap-2">
                                  <Input
                                    value={editingCvNameValue}
                                    onChange={(event) => setEditingCvNameValue(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') handleSaveRename(cv.id);
                                      if (event.key === 'Escape') setEditingCvName(null);
                                    }}
                                    className="h-9 rounded-lg text-xs"
                                    autoFocus
                                  />
                                  <Button size="sm" className="h-9 rounded-lg text-xs" onClick={() => handleSaveRename(cv.id)}>
                                    Lưu
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <p className="truncate text-sm font-bold text-slate-950">{cv.name}</p>
                                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    {cv.date}
                                  </p>
                                </>
                              )}
                            </div>

                            {editingCvName !== cv.id && (
                              <button
                                type="button"
                                onClick={() => handleRenameCv(cv)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                title="Đổi tên CV"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 flex-1 rounded-lg bg-white text-xs font-bold">
                                  <Eye className="h-3.5 w-3.5" />
                                  Xem
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-full max-w-3xl overflow-y-auto">
                                <SheetHeader>
                                  <SheetTitle>Xem trước: {cv.name}</SheetTitle>
                                  <SheetDescription>CV đang lưu trên hệ thống</SheetDescription>
                                </SheetHeader>
                                <div className="mt-4 h-[80vh] overflow-hidden rounded-lg border bg-slate-50">
                                  <iframe src={cv.url} title={cv.name} className="h-full w-full" />
                                </div>
                              </SheetContent>
                            </Sheet>

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-white"
                              asChild
                              title="Tải xuống CV"
                            >
                              <a href={cv.url} download target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>

                            {!cv.is_default && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-white text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                onClick={() => handleSetDefault(cv.id)}
                                title="Đặt làm CV mặc định"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-white text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleRemoveCv(cv)}
                              title="Xóa CV"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <SectionHeader
                  icon={GraduationCap}
                  title="Chứng chỉ & Bằng cấp"
                  subtitle="Bổ sung chứng chỉ để hồ sơ đáng tin cậy hơn khi nhà tuyển dụng đánh giá năng lực."
                  action={
                    <Button variant="outline" size="sm" asChild className="h-9 rounded-lg bg-white text-xs font-bold">
                      <Link to="/candidate/profile/edit">
                        <Plus className="h-3.5 w-3.5" />
                        Thêm mới
                      </Link>
                    </Button>
                  }
                />

                {certifications.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {certifications.map((cert, index) => (
                      <Card
                        key={`${cert.name || cert.title || 'cert'}-${index}`}
                        className="rounded-lg border-slate-200 bg-white p-0 shadow-sm"
                      >
                        <CardContent className="flex items-start gap-3 p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-700">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-slate-950">{cert.name || cert.title}</h3>
                            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                              {cert.issuer || cert.organization || cert.school || 'Tổ chức cấp chưa cập nhật'}
                              {cert.year ? ` • ${cert.year}` : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel
                    icon={GraduationCap}
                    title="Chưa có chứng chỉ nào"
                    description="Thêm chứng chỉ, bằng cấp hoặc khóa học liên quan để hoàn thiện hồ sơ ứng tuyển."
                    compact
                  >
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-lg bg-white text-xs font-bold text-emerald-700">
                      <Link to="/candidate/profile/edit">Thêm chứng chỉ</Link>
                    </Button>
                  </EmptyPanel>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <SidebarCard title="Tải CV" icon={Upload}>
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs font-medium leading-5 text-slate-500">
                  Hỗ trợ PDF, DOC, DOCX. Tối đa {MAX_CV_COUNT} CV.
                </p>
                <UploadControl
                  disabled={uploadDisabled}
                  isUploading={isUploading}
                  onUpload={handleFileUpload}
                  className="mt-3 w-full"
                  variant="outline"
                >
                  {cvList.length >= MAX_CV_COUNT ? 'Đã đạt giới hạn' : isUploading ? 'Đang tải...' : 'Tải CV'}
                </UploadControl>
              </div>
            </SidebarCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ResumePage;
