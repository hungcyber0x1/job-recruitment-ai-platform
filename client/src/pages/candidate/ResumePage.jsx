import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Briefcase,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '../../context/AuthContext';
import candidateService from '../../services/candidateService';
import { cn } from '@/utils';

const defaultProjects = [];

const defaultCerts = [];

const ResumePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [cvList, setCvList] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const { upload, isUploading } = useUpload();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const cvUploadSectionRef = useRef(null);
  const [highlightCvUpload, setHighlightCvUpload] = useState(false);

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';

  useEffect(() => {
    if (searchParams.get('upload') !== '1') return;
    const t = window.setTimeout(() => {
      cvUploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightCvUpload(true);
      window.setTimeout(() => setHighlightCvUpload(false), 2400);
      const next = new URLSearchParams(searchParams);
      next.delete('upload');
      setSearchParams(next, { replace: true });
    }, 80);
    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        const data = response.data?.data ?? null;
        setProfile(data);
        if (data?.resume_url) {
          setCvList([
            {
              name: data.resume_name || 'CV_Hien_Tai.pdf',
              url: data.resume_url,
              date: data.resume_updated_at
                ? new Date(data.resume_updated_at).toLocaleDateString('vi-VN')
                : 'Cập nhật trước đó',
            },
          ]);
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
      setProfile((p) =>
        p
          ? {
              ...p,
              resume_url: uploadRes.url,
              resume_name: file.name,
              resume_updated_at: new Date().toISOString(),
            }
          : null
      );
      setCvList((prev) => [
        ...prev.filter((c) => c.url !== profile?.resume_url),
        { name: file.name, url: uploadRes.url, date: new Date().toLocaleDateString('vi-VN') },
      ]);
      showNotification('Tải CV lên thành công.', 'success');
    } catch (error) {
      console.error(error);
      showNotification(
        error.response?.data?.message || 'Lỗi khi tải CV lên. Vui lòng thử lại.',
        'error'
      );
    }
  };

  const handleRemoveCv = async (url) => {
    try {
      await candidateService.updateProfile({ resume_url: '' });
      setCvList((prev) => prev.filter((c) => c.url !== url));
      setProfile((p) =>
        p ? { ...p, resume_url: '', resume_name: '', resume_updated_at: null } : p
      );
      showNotification('Đã xóa CV.', 'success');
    } catch {
      showNotification('Không thể xóa CV.', 'error');
    }
  };

  const projects = profile?.projects?.length ? profile.projects : defaultProjects;
  const certifications = profile?.certifications?.length ? profile.certifications : defaultCerts;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 animate-slide-up">
      {/* Top: Title + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <FileText className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Hồ sơ năng lực</h1>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hồ sơ..." className="pl-9 rounded-lg" />
        </div>
      </div>

      {/* Welcome */}
      <Card className="mb-8 rounded-xl border bg-card shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-foreground">Xin chào, {displayName}!</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Quản lý và cập nhật hồ sơ năng lực của bạn để gây ấn tượng với nhà tuyển dụng.
          </p>
          <div
            ref={cvUploadSectionRef}
            id="cv-upload-section"
            className="mt-6 flex flex-wrap gap-3"
          >
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button
                type="button"
                className={cn(
                  'gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-emerald-500/20 px-6 h-11',
                  highlightCvUpload &&
                    'ring-4 ring-primary/50 ring-offset-2 ring-offset-card animate-pulse'
                )}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Đang tải...' : 'Tải CV lên'}
                </span>
              </Button>
            </label>
            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 hover:border-emerald-200 hover:bg-primary/10 hover:text-emerald-600 transition-all hover:scale-105 active:scale-95 px-6 h-11"
              asChild
            >
              <Link to="/candidate/profile/projects/new">
                <Plus className="h-4 w-4" />
                Thêm dự án
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quản lý CV */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-4 w-4 text-emerald-500" />
            Quản lý CV
          </h3>
          <Link
            to="/candidate/resume"
            className="text-base font-medium text-emerald-600 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvList.map((cv) => (
            <Card
              key={cv.url}
              className="rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md hover-lift group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-all">
                    <FileText className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{cv.name}</p>
                    <p className="text-base text-muted-foreground">Cập nhật: {cv.date}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full max-w-2xl overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Xem trước: {cv.name}</SheetTitle>
                        <SheetDescription>CV đang lưu trên hệ thống.</SheetDescription>
                      </SheetHeader>
                      <div className="mt-4 h-[80vh] rounded-lg border bg-muted">
                        <iframe src={cv.url} title={cv.name} className="h-full w-full" />
                      </div>
                    </SheetContent>
                  </Sheet>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={cv.url} download target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveCv(cv.url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="flex min-h-[140px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white transition-all hover:border-emerald-500/50 hover:bg-primary/10 group">
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Plus className="h-10 w-10 text-slate-300 group-hover:text-emerald-500 transition-all duration-300 group-hover:scale-110" />
              <span className="mt-2 text-base font-bold text-slate-400 group-hover:text-emerald-600 transition-colors uppercase tracking-wider">
                Tải hồ sơ khác
              </span>
            </label>
          </Card>
        </div>
      </section>

      {/* Dự án tiêu biểu */}
      <section className="mb-10">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Briefcase className="h-4 w-4 text-emerald-500" />
          Dự án tiêu biểu
        </h3>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: 'all', label: `Tất cả ${projects.length}` },
            { key: 'design', label: 'Thiết kế 4' },
            { key: 'dev', label: 'Phát triển 8' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={projectFilter === key ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'rounded-xl px-4 font-bold transition-all',
                projectFilter === key
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                  : 'border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-primary/10 hover:text-emerald-600'
              )}
              onClick={() => setProjectFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.length > 0 ? (
            projects.slice(0, 3).map((proj) => (
              <Card
                key={proj.id ?? proj.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-500/30 hover-lift group"
              >
                <div className="aspect-video w-full bg-slate-50 relative overflow-hidden">
                  {proj.image ? (
                    <img
                      src={proj.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-200 font-bold text-2xl group-hover:text-emerald-100 transition-colors">
                      DỰ ÁN
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-5">
                  <p className="text-base font-bold uppercase tracking-widest text-emerald-600">
                    {proj.category || 'Dự án nổi bật'}
                  </p>
                  <h4 className="mt-2 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {proj.title}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-base text-slate-500 font-medium leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(proj.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1 text-base font-bold text-slate-500 group-hover:bg-primary/10 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center sm:col-span-2 lg:col-span-3">
              <Briefcase className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-base font-medium text-muted-foreground">
                Chưa có dự án tiêu biểu nào được thêm.
              </p>
              <Button variant="link" className="text-emerald-600" asChild>
                <Link to="/candidate/profile/projects/new">Thêm ngay</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Chứng chỉ & Bằng cấp */}
      <section className="mb-10">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <GraduationCap className="h-4 w-4 text-emerald-500" />
          Chứng chỉ & Bằng cấp
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(certifications || []).map((cert, i) => (
            <Card key={i} className="rounded-xl border bg-card shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    cert.color ||
                    (i === 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600')
                  }`}
                >
                  {cert.icon === 'graduation' ? (
                    <GraduationCap className="h-6 w-6" />
                  ) : (
                    <Award className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground">{cert.name || cert.title}</h4>
                  <p className="mt-1 text-base text-muted-foreground">
                    {cert.issuer || cert.organization || cert.school}
                    {cert.year ? ` • ${cert.year}` : ''}
                  </p>
                  {(cert.url || cert.link) && (
                    <a
                      href={cert.url || cert.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center text-base font-medium text-emerald-600 hover:underline"
                    >
                      Xem chi tiết
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-8 text-base text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Hồ sơ năng lực
        </div>
        <p className="text-center">
          © {new Date().getFullYear()} Bản quyền thuộc về {displayName}. Được thiết kế chuyên
          nghiệp.
        </p>
        <div className="flex gap-2 opacity-70">
          <span className="rounded bg-muted p-1.5">🔗</span>
          <span className="rounded bg-muted p-1.5">✉</span>
        </div>
      </footer>
    </div>
  );
};

export default ResumePage;
