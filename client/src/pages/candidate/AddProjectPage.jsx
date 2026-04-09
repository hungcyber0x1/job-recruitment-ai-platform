import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Save,
  Globe,
  LayoutGrid,
  Bold,
  Italic,
  List,
  ListOrdered,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import candidateService from '../../services/candidateService';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import useUpload from '../../hooks/useUpload';
import { useNotification } from '../../context/NotificationContext';
import { API_ORIGIN } from '../../config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MAX_IMAGE_SIZE_MB = 5;

const AddProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { upload, isUploading } = useUpload();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    image: null,
    imagePreview: null,
    technologies: [],
    techInput: '',
    startDate: '',
    endDate: '',
    githubUrl: '',
    projectUrl: '',
    description: '',
  });

  const profileCompletion = React.useMemo(
    () => calculateProfileCompletion(profile || {}, user || {}),
    [profile, user]
  );

  const fetchProfile = useCallback(async () => {
    try {
      const response = await candidateService.getProfile();
      setProfile(response.data?.data ?? null);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTech = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = (formData.techInput || '').trim();
      if (value && !formData.technologies.includes(value)) {
        setFormData((prev) => ({
          ...prev,
          technologies: [...prev.technologies, value],
          techInput: '',
        }));
      }
    }
  };

  const removeTech = (tech) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showNotification(`Kích thước tối đa: ${MAX_IMAGE_SIZE_MB}MB`, 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showNotification('Chỉ chấp nhận file ảnh (PNG, JPG)', 'error');
      return;
    }
    try {
      const res = await upload('projectImage', file);
      const url = res?.url || res?.data?.url;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          image: url,
          imagePreview: url.startsWith('data:') ? url : url,
        }));
        showNotification('Tải ảnh lên thành công.', 'success');
      }
    } catch (err) {
      showNotification(err?.message || 'Lỗi khi tải ảnh lên.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, role, description } = formData;
    if (!title?.trim()) {
      showNotification('Vui lòng nhập tên dự án.', 'error');
      return;
    }
    if (!role?.trim()) {
      showNotification('Vui lòng nhập vai trò của bạn.', 'error');
      return;
    }
    if (!description?.trim()) {
      showNotification('Vui lòng nhập mô tả dự án.', 'error');
      return;
    }
    setSaving(true);
    try {
      const existingProjects = Array.isArray(profile?.projects) ? profile.projects : [];
      const newProject = {
        id: Date.now(),
        title: formData.title.trim(),
        role: formData.role.trim(),
        image: formData.image || null,
        tags: formData.technologies,
        category: 'Dự án',
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        github_url: formData.githubUrl?.trim() || null,
        project_url: formData.projectUrl?.trim() || null,
        description: formData.description.trim(),
      };
      await candidateService.updateProfile({
        projects: [...existingProjects, newProject],
      });
      showNotification('Đã lưu dự án.', 'success');
      navigate('/candidate/resume');
    } catch (error) {
      console.error('Failed to save project', error);
      showNotification(error?.response?.data?.message || 'Lỗi khi lưu dự án.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Ứng viên';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Thêm dự án mới</h1>
            <p className="text-sm text-muted-foreground">Xây dựng hồ sơ năng lực ấn tượng</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/candidate/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại profile
          </Link>
          <Avatar className="h-8 w-8 rounded-full border border-primary/20">
            <AvatarImage src={user?.avatar_url} alt={displayName} />
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {displayName.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile completion */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Độ hoàn thiện hồ sơ</span>
          <span className="text-muted-foreground">{profileCompletion.completion}%</span>
        </div>
        <Progress value={profileCompletion.completion} className="h-2 bg-muted" />
        <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <p>Thêm dự án thực tế giúp tăng 35% khả năng lọt vào mắt xanh của nhà tuyển dụng.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Thông tin dự án */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Thông tin dự án</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">
                    Tên dự án <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ví dụ: Hệ thống quản lý kho thông minh"
                    className="rounded-lg border-input bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground">
                    Vai trò của bạn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Ví dụ: Lead Frontend Developer"
                    className="rounded-lg border-input bg-background"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hình ảnh dự án */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Hình ảnh dự án</h3>
              <div className="grid gap-6 sm:grid-cols-3">
                <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                  {formData.image ? (
                    <div className="relative h-full w-full p-2">
                      <img
                        src={
                          formData.image.startsWith('http')
                            ? formData.image
                            : `${API_ORIGIN}${formData.image}`
                        }
                        alt="Preview"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      <span className="mt-2 text-center text-sm font-medium text-muted-foreground">
                        {isUploading ? 'Đang tải...' : 'Tải ảnh lên (PNG, JPG)'}
                      </span>
                    </>
                  )}
                </label>
                <ul className="flex list-disc flex-col gap-1 text-sm text-muted-foreground sm:col-span-2 sm:list-inside">
                  <li>Kích thước tối đa: {MAX_IMAGE_SIZE_MB}MB</li>
                  <li>Khuyên dùng tỷ lệ: 16:9</li>
                  <li>Hình ảnh rõ nét giúp dự án nổi bật hơn</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Công nghệ sử dụng */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Công nghệ sử dụng</h3>
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="rounded p-0.5 hover:bg-primary/20"
                      aria-label={`Xóa ${tech}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <Input
                  placeholder="Thêm tag (VD: Node.js, Python...)"
                  value={formData.techInput}
                  onChange={(e) => setFormData((p) => ({ ...p, techInput: e.target.value }))}
                  onKeyDown={handleAddTech}
                  className="min-w-[180px] flex-1 rounded-lg border-input bg-background sm:max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ngày bắt đầu / kết thúc */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Thời gian</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-foreground">
                    Ngày bắt đầu
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="rounded-lg border-input bg-background pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-foreground">
                    Ngày kết thúc
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="rounded-lg border-input bg-background pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Liên kết</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="githubUrl" className="text-foreground">
                    Link Github
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="githubUrl"
                      name="githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="github.com/username/project"
                      className="rounded-lg border-input bg-background pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectUrl" className="text-foreground">
                    Link dự án (Live Demo)
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="projectUrl"
                      name="projectUrl"
                      type="url"
                      value={formData.projectUrl}
                      onChange={handleChange}
                      placeholder="myproject.com"
                      className="rounded-lg border-input bg-background pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mô tả dự án */}
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Mô tả dự án <span className="text-destructive">*</span>
              </h3>
              <div className="rounded-lg border border-input bg-background">
                <div className="flex gap-1 border-b border-input p-2">
                  <button type="button" className="rounded p-2 hover:bg-muted" title="Bold">
                    <Bold className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded p-2 hover:bg-muted" title="Italic">
                    <Italic className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded p-2 hover:bg-muted" title="Bullet list">
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-2 hover:bg-muted"
                    title="Numbered list"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                </div>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết các tính năng, thách thức và kết quả đạt được của dự án..."
                  className="min-h-[200px] resize-none rounded-none border-0 focus-visible:ring-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/candidate/profile')}
              disabled={saving}
              className="text-muted-foreground hover:text-foreground"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Đang lưu...' : 'Lưu dự án'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProjectPage;
