import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Loader2 } from 'lucide-react';
import candidateService from '../../services/candidateService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { cn } from '@/utils/index';
import IdentityFormFields from '../../components/profile/IdentityFormFields';
import {
  SkillsSection,
  EducationSection,
  ExperienceSection,
  JobPreferencesSection,
  SocialLinksSection,
} from '@/components/candidate/profile/index';

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const avatarInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [basicForm, setBasicForm] = useState({
    bio: '',
    title: '',
    phone: '',
    location: '',
    gender: '',
    region: '',
  });

  // Section loading states
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [eduLoading, setEduLoading] = useState(false);
  const [expLoading, setExpLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await candidateService.getFullProfile();
      const data = response.data.data;
      setProfile(data);

      setBasicForm({
        bio:     data?.bio     || '',
        title:   data?.title   || data?.current_job_title || '',
        phone:   data?.phone   || '',
        location: data?.location || '',
        gender:  data?.gender  || '',
        region:  data?.region  || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      showNotification('Không thể tải thông tin hồ sơ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setBasicForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await candidateService.updateProfile(basicForm);
      showNotification('Cập nhật thông tin cơ bản thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update profile', error);
      showNotification(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Skills handlers
  const handleAddSkill = async (data) => {
    setSkillsLoading(true);
    try {
      await candidateService.addSkill(data);
      showNotification('Thêm kỹ năng thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to add skill', error);
      throw error;
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleUpdateSkill = async (skillId, data) => {
    setSkillsLoading(true);
    try {
      await candidateService.updateSkill(skillId, data);
      showNotification('Cập nhật kỹ năng thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update skill', error);
      throw error;
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    setSkillsLoading(true);
    try {
      await candidateService.deleteSkill(skillId);
      showNotification('Đã xóa kỹ năng', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to delete skill', error);
      showNotification('Không thể xóa kỹ năng', 'error');
    } finally {
      setSkillsLoading(false);
    }
  };

  // Education handlers
  const handleAddEducation = async (data) => {
    setEduLoading(true);
    try {
      await candidateService.addEducationItem(data);
      showNotification('Thêm học vấn thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to add education', error);
      throw error;
    } finally {
      setEduLoading(false);
    }
  };

  const handleUpdateEducation = async (eduId, data) => {
    setEduLoading(true);
    try {
      await candidateService.updateEducationItem(eduId, data);
      showNotification('Cập nhật học vấn thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update education', error);
      throw error;
    } finally {
      setEduLoading(false);
    }
  };

  const handleDeleteEducation = async (eduId) => {
    setEduLoading(true);
    try {
      await candidateService.deleteEducationItem(eduId);
      showNotification('Đã xóa học vấn', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to delete education', error);
      showNotification('Không thể xóa học vấn', 'error');
    } finally {
      setEduLoading(false);
    }
  };

  // Experience handlers
  const handleAddExperience = async (data) => {
    setExpLoading(true);
    try {
      await candidateService.addExperienceItem(data);
      showNotification('Thêm kinh nghiệm thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to add experience', error);
      throw error;
    } finally {
      setExpLoading(false);
    }
  };

  const handleUpdateExperience = async (expId, data) => {
    setExpLoading(true);
    try {
      await candidateService.updateExperienceItem(expId, data);
      showNotification('Cập nhật kinh nghiệm thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to update experience', error);
      throw error;
    } finally {
      setExpLoading(false);
    }
  };

  const handleDeleteExperience = async (expId) => {
    setExpLoading(true);
    try {
      await candidateService.deleteExperienceItem(expId);
      showNotification('Đã xóa kinh nghiệm', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to delete experience', error);
      showNotification('Không thể xóa kinh nghiệm', 'error');
    } finally {
      setExpLoading(false);
    }
  };

  // Preferences handler
  const handleSavePreferences = async (prefs) => {
    try {
      await candidateService.updatePreferences(prefs);
      showNotification('Cập nhật tùy chọn thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to save preferences', error);
      showNotification('Có lỗi khi lưu tùy chọn', 'error');
    }
  };

  // Social links handler
  const handleSaveSocialLinks = async (links) => {
    try {
      await candidateService.updateProfile({ social_links: links });
      showNotification('Cập nhật liên kết thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to save social links', error);
      showNotification('Có lỗi khi lưu liên kết', 'error');
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn tệp ảnh hợp lệ.', 'error');
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      showNotification('Ảnh đại diện không được vượt quá 5MB.', 'error');
      return;
    }

    setAvatarUploading(true);
    try {
      const response = await candidateService.uploadAvatar(file);
      const nextAvatarUrl = response.data?.data?.avatar_url || response.data?.avatar_url;

      if (nextAvatarUrl) {
        updateUser({ avatar_url: nextAvatarUrl });
        setProfile((prev) => (prev ? { ...prev, avatar_url: nextAvatarUrl } : prev));
      }

      showNotification('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (error) {
      console.error('Failed to upload avatar', error);
      showNotification(
        error.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const fieldClass =
    'h-12 rounded-lg border-slate-200 bg-white text-base shadow-sm transition-shadow focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20';
  const displayName =
    user?.fullName ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    'Ứng viên';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 pb-16 pt-8 md:pb-24 md:pt-10">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/candidate/profile')}
          className="group -ml-2 gap-2 px-2 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-base font-medium">Quay lại hồ sơ</span>
        </Button>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Cap nhat cac muc con thieu de ho so day du va ro rang hon voi nha tuyen dung.</p>
        </div>

        {/* Basic Info Card */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]">
          <div className="relative border-b border-slate-800/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6 py-8 text-white md:px-10 md:py-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10 max-w-2xl space-y-3">
              <p className="text-base font-semibold uppercase tracking-normal text-emerald-400">
                Hồ sơ ứng viên
              </p>
              <h1 className="text-2xl font-semibold leading-tight tracking-normal text-white md:text-3xl">
                Chỉnh sửa thông tin chuyên môn
              </h1>
              <p className="text-base leading-relaxed text-slate-300 md:text-base">
                Thông tin chính xác giúp nhà tuyển dụng đọc hồ sơ nhanh hơn và liên hệ đúng thời điểm.
              </p>
            </div>
            <div className="absolute right-0 top-0 h-1 w-32 bg-emerald-500 md:w-40" />
          </div>

          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleBasicSubmit} className="space-y-8">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-20 w-20 rounded-2xl border border-white/80 shadow-sm">
                    <AvatarImage
                      src={user?.avatar_url || user?.avatar}
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-white text-xl font-bold text-emerald-700">
                      {displayName.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-950">Ảnh đại diện</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Ảnh này hiển thị ở hồ sơ cá nhân, thanh điều hướng và các điểm chạm ứng viên.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="border-white bg-white text-slate-700 hover:bg-white/90"
                      >
                        <Camera className="h-4 w-4" />
                        {avatarUploading ? 'Đang tải ảnh...' : 'Tải ảnh mới'}
                      </Button>
                      <p className="text-xs font-medium text-slate-500">
                        PNG, JPG, WEBP hoặc GIF - tối đa 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700">
                  Chức danh công việc
                </Label>
                <p className="text-base text-muted-foreground">
                  Ví dụ: Lập trình viên Full-stack
                </p>
                <Input
                  id="title"
                  name="title"
                  value={basicForm.title}
                  onChange={handleBasicChange}
                  className={cn(fieldClass)}
                  placeholder="Nhập chức danh hiện tại hoặc mong muốn"
                  autoComplete="organization-title"
                />
              </div>

              <IdentityFormFields
                formData={basicForm}
                handleChange={handleBasicChange}
                handleSelectChange={handleSelectChange}
                addressFieldName="location"
              />

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-700">
                  Giới thiệu bản thân
                </Label>
                <p className="text-base text-muted-foreground">
                  Kinh nghiệm, kỹ năng nổi bật và định hướng nghề nghiệp (khuyến nghị 2–6 câu)
                </p>
                <Textarea
                  id="bio"
                  name="bio"
                  value={basicForm.bio}
                  onChange={handleBasicChange}
                  rows={6}
                  className="min-h-[140px] resize-y rounded-lg border-slate-200 bg-white text-base shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 md:min-h-[160px]"
                  placeholder="Mô tả ngắn gọn về chuyên môn, dự án tiêu biểu và mục tiêu nghề nghiệp…"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-center text-base text-muted-foreground sm:text-left">
                  Nhấn &quot;Lưu thay đổi&quot; để cập nhật hồ sơ.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/candidate/profile')}
                    disabled={saving}
                    className="h-12 rounded-xl border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-11 gap-2 rounded-xl bg-emerald-600 px-8 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:text-white focus-visible:ring-emerald-500"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang lưu…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <SkillsSection
              skills={profile?.skills || []}
              onAdd={handleAddSkill}
              onUpdate={handleUpdateSkill}
              onRemove={handleDeleteSkill}
              loading={skillsLoading}
            />
          </CardContent>
        </Card>

        {/* Education Section */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <EducationSection
              education={profile?.education || []}
              onAdd={handleAddEducation}
              onUpdate={handleUpdateEducation}
              onDelete={handleDeleteEducation}
              loading={eduLoading}
            />
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <ExperienceSection
              experience={profile?.experience || []}
              onAdd={handleAddExperience}
              onUpdate={handleUpdateExperience}
              onDelete={handleDeleteExperience}
              loading={expLoading}
            />
          </CardContent>
        </Card>

        {/* Job Preferences Section */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <JobPreferencesSection
              job_search_status={profile?.job_search_status}
              expected_salary_min={profile?.expected_salary_min}
              expected_salary_max={profile?.expected_salary_max}
              salary_currency={profile?.salary_currency}
              preferred_job_types={profile?.preferred_job_types}
              preferred_locations={profile?.preferred_locations}
              willing_to_relocate={profile?.willing_to_relocate}
              onSave={handleSavePreferences}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <SocialLinksSection
              social_links={profile?.social_links || {}}
              onSave={handleSaveSocialLinks}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfilePage;
