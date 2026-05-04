import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  FileText,
  Globe2,
  GraduationCap,
  Info,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
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

const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Chưa cập nhật' },
  { value: 'high_school', label: 'Trung học phổ thông' },
  { value: 'college', label: 'Cao đẳng' },
  { value: 'bachelor', label: 'Đại học' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'phd', label: 'Tiến sĩ' },
  { value: 'other', label: 'Khác' },
];

const EMPTY_LANGUAGE_FORM = { name: '', level: '' };
const EMPTY_CERTIFICATION_FORM = { name: '', organization: '', year: '', url: '' };

const normalizeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const normalizeLanguage = (language) => {
  if (typeof language === 'string') {
    return { name: language, level: '' };
  }

  return {
    id: language?.id,
    name: language?.name || language?.language || '',
    level: language?.level || language?.proficiency || language?.proficiency_level || '',
  };
};

const normalizeCertification = (certification) => ({
  id: certification?.id,
  name: certification?.name || certification?.title || '',
  organization:
    certification?.organization || certification?.issuer || certification?.provider || '',
  year: certification?.year || certification?.issue_year || '',
  url: certification?.url || certification?.credential_url || '',
});

const getProfileDisplayName = (user, profile) =>
  user?.fullName ||
  `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
  `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
  'Ứng viên';

const ProfileSignalCard = ({ icon: Icon, label, value, helper, done }) => (
  <div className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
          done
            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
            : 'border-amber-100 bg-amber-50 text-amber-700'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{helper}</p>
      </div>
    </div>
  </div>
);

const ProfileExtrasSection = ({ languages = [], certifications = [], onSave, loading }) => {
  const sourceLanguages = useMemo(
    () =>
      normalizeList(languages)
        .map(normalizeLanguage)
        .filter((item) => item.name),
    [languages]
  );
  const sourceCertifications = useMemo(
    () =>
      normalizeList(certifications)
        .map(normalizeCertification)
        .filter((item) => item.name),
    [certifications]
  );

  const [localLanguages, setLocalLanguages] = useState(sourceLanguages);
  const [localCertifications, setLocalCertifications] = useState(sourceCertifications);
  const [languageForm, setLanguageForm] = useState(EMPTY_LANGUAGE_FORM);
  const [certificationForm, setCertificationForm] = useState(EMPTY_CERTIFICATION_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalLanguages(sourceLanguages);
  }, [sourceLanguages]);

  useEffect(() => {
    setLocalCertifications(sourceCertifications);
  }, [sourceCertifications]);

  const hasChanges =
    JSON.stringify(localLanguages) !== JSON.stringify(sourceLanguages) ||
    JSON.stringify(localCertifications) !== JSON.stringify(sourceCertifications);

  const handleAddLanguage = () => {
    const name = languageForm.name.trim();
    if (!name) return;

    setLocalLanguages((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        level: languageForm.level.trim(),
      },
    ]);
    setLanguageForm(EMPTY_LANGUAGE_FORM);
    setSaved(false);
  };

  const handleAddCertification = () => {
    const name = certificationForm.name.trim();
    if (!name) return;

    setLocalCertifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        organization: certificationForm.organization.trim(),
        year: certificationForm.year.trim(),
        url: certificationForm.url.trim(),
      },
    ]);
    setCertificationForm(EMPTY_CERTIFICATION_FORM);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        languages: localLanguages,
        certifications: localCertifications,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">Ngôn ngữ & chứng chỉ</h3>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Các minh chứng này được hiển thị trên hồ sơ ứng viên và hỗ trợ nhà tuyển dụng đánh giá
              độ phù hợp.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã lưu
            </span>
          ) : null}
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu mục này
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-bold text-slate-900">Ngôn ngữ</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
            <Input
              value={languageForm.name}
              onChange={(event) =>
                setLanguageForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ví dụ: Tiếng Anh"
              className="h-11 rounded-xl bg-white text-sm"
            />
            <Input
              value={languageForm.level}
              onChange={(event) =>
                setLanguageForm((prev) => ({ ...prev, level: event.target.value }))
              }
              placeholder="Ví dụ: B2"
              className="h-11 rounded-xl bg-white text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLanguage}
              className="h-11 rounded-xl bg-white text-sm font-bold text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Thêm
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {localLanguages.length > 0 ? (
              localLanguages.map((language, index) => (
                <div
                  key={language.id || `${language.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{language.name}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {language.level || 'Trình độ chưa cập nhật'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalLanguages((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index)
                      );
                      setSaved(false);
                    }}
                    className="h-8 w-8 rounded-lg p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                Chưa có ngôn ngữ nào.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-bold text-slate-900">Chứng chỉ</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={certificationForm.name}
              onChange={(event) =>
                setCertificationForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Tên chứng chỉ"
              className="h-11 rounded-xl bg-white text-sm"
            />
            <Input
              value={certificationForm.organization}
              onChange={(event) =>
                setCertificationForm((prev) => ({ ...prev, organization: event.target.value }))
              }
              placeholder="Đơn vị cấp"
              className="h-11 rounded-xl bg-white text-sm"
            />
            <Input
              value={certificationForm.year}
              onChange={(event) =>
                setCertificationForm((prev) => ({ ...prev, year: event.target.value }))
              }
              placeholder="Năm cấp"
              className="h-11 rounded-xl bg-white text-sm"
            />
            <Input
              value={certificationForm.url}
              onChange={(event) =>
                setCertificationForm((prev) => ({ ...prev, url: event.target.value }))
              }
              placeholder="URL xác thực nếu có"
              className="h-11 rounded-xl bg-white text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCertification}
            className="mt-3 h-11 rounded-xl bg-white text-sm font-bold text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Thêm chứng chỉ
          </Button>

          <div className="mt-4 space-y-2">
            {localCertifications.length > 0 ? (
              localCertifications.map((certification, index) => (
                <div
                  key={certification.id || `${certification.name}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold text-slate-900">
                      {certification.name}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                      {[certification.organization, certification.year]
                        .filter(Boolean)
                        .join(' • ') || 'Thông tin cấp chưa cập nhật'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalCertifications((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index)
                      );
                      setSaved(false);
                    }}
                    className="h-8 w-8 rounded-lg p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                Chưa có chứng chỉ nào.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    experience_years: '',
    education_level: '',
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
        bio: data?.bio || '',
        title: data?.title || data?.current_job_title || '',
        experience_years: data?.experience_years ?? data?.years_of_experience ?? '',
        education_level: data?.education_level || '',
        phone: data?.phone || '',
        location: data?.location || '',
        gender: data?.gender || '',
        region: data?.region || '',
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
    setBasicForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setBasicForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await candidateService.updateProfile({
        ...basicForm,
        experience_years:
          basicForm.experience_years === '' || basicForm.experience_years === null
            ? null
            : Number(basicForm.experience_years),
      });
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

  const handleSaveExtras = async ({ languages, certifications }) => {
    try {
      await candidateService.updateProfile({ languages, certifications });
      showNotification('Cập nhật ngôn ngữ và chứng chỉ thành công!', 'success');
      await fetchProfile();
    } catch (error) {
      console.error('Failed to save profile extras', error);
      showNotification(
        error.response?.data?.message || 'Có lỗi khi lưu ngôn ngữ và chứng chỉ',
        'error'
      );
      throw error;
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
      throw error;
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
  const displayName = getProfileDisplayName(user, profile);
  const avatarUrl = user?.avatar_url || profile?.avatar_url || user?.avatar;
  const skills = normalizeList(profile?.skills);
  const education = normalizeList(profile?.education);
  const experience = normalizeList(profile?.experience || profile?.experiences);
  const languages = normalizeList(profile?.languages);
  const certifications = normalizeList(profile?.certifications);
  const socialLinks =
    profile?.social_links && typeof profile.social_links === 'object' ? profile.social_links : {};
  const hasResume = Boolean(profile?.resume_url);
  const hasBasicInfo = Boolean(
    basicForm.title && basicForm.phone && basicForm.location && basicForm.bio
  );
  const hasCareerDepth = skills.length > 0 && (education.length > 0 || experience.length > 0);
  const hasTrustSignals =
    certifications.length > 0 || languages.length > 0 || Object.values(socialLinks).some(Boolean);
  const profileSignals = [
    {
      icon: BriefcaseBusiness,
      label: 'Thông tin chính',
      value: hasBasicInfo ? 'Đủ liên hệ' : 'Cần bổ sung',
      helper: 'Chức danh, giới thiệu, số điện thoại và khu vực sinh sống.',
      done: hasBasicInfo,
    },
    {
      icon: GraduationCap,
      label: 'Năng lực',
      value: `${skills.length} kỹ năng`,
      helper: 'Kỹ năng, học vấn và kinh nghiệm được dùng cho matching.',
      done: hasCareerDepth,
    },
    {
      icon: FileText,
      label: 'CV ứng tuyển',
      value: hasResume ? 'Đã có CV' : 'Chưa có CV',
      helper: hasResume ? 'Sẵn sàng dùng khi ứng tuyển nhanh.' : 'Tải CV tại trang CV & Portfolio.',
      done: hasResume,
    },
    {
      icon: Sparkles,
      label: 'Minh chứng',
      value: hasTrustSignals ? 'Đã bổ sung' : 'Nên thêm',
      helper: 'Ngôn ngữ, chứng chỉ và liên kết xã hội tăng độ tin cậy.',
      done: hasTrustSignals,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 pb-16 pt-8 md:pb-24 md:pt-10">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/candidate/profile')}
          className="group -ml-2 gap-2 px-2 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-base font-medium">Quay lại hồ sơ</span>
        </Button>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-6 text-white sm:px-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Hồ sơ ứng viên
                </span>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Chỉnh sửa hồ sơ chuyên môn
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-300 sm:text-base">
                  Cập nhật đúng các trường đang được hệ thống dùng cho matching, tìm kiếm ứng viên,
                  ứng tuyển nhanh và hồ sơ công khai với nhà tuyển dụng.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-xl border-white/20 bg-white/10 text-sm font-bold text-white hover:bg-white hover:text-slate-950"
                >
                  <Link to="/candidate/resume">
                    <FileText className="h-4 w-4" />
                    CV & Portfolio
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-10 rounded-xl bg-emerald-500 text-sm font-bold text-white hover:bg-emerald-400"
                >
                  <Link to="/candidate/profile">Xem hồ sơ</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-3 bg-slate-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {profileSignals.map((item) => (
              <ProfileSignalCard key={item.label} {...item} />
            ))}
          </div>
          <div className="flex items-start gap-3 border-t border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm font-medium leading-6 text-emerald-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <p>
              Nên lưu từng nhóm thông tin sau khi chỉnh sửa. Trang này chỉ cập nhật dữ liệu hồ sơ;
              CV và portfolio dự án được quản lý ở trang CV & Portfolio để đúng luồng hoạt động của
              dự án.
            </p>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]">
          <div className="border-b border-slate-100 bg-white px-6 py-5 md:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                  Bước 1
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Thông tin liên hệ & định danh
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Đây là dữ liệu nền cho hồ sơ công khai, bộ lọc ứng viên và quá trình nhà tuyển
                  dụng liên hệ.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Lưu trực tiếp vào hồ sơ
              </span>
            </div>
          </div>

          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleBasicSubmit} className="space-y-8">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-20 w-20 rounded-2xl border border-white/80 shadow-sm">
                    <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
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
                <p className="text-base text-muted-foreground">Ví dụ: Lập trình viên Full-stack</p>
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

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="experience_years" className="text-slate-700">
                    Số năm kinh nghiệm
                  </Label>
                  <p className="text-base text-muted-foreground">
                    Dùng để nhà tuyển dụng lọc theo cấp độ kinh nghiệm
                  </p>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min={0}
                    max={60}
                    value={basicForm.experience_years}
                    onChange={handleBasicChange}
                    className={cn(fieldClass)}
                    placeholder="Ví dụ: 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education_level" className="text-slate-700">
                    Trình độ học vấn cao nhất
                  </Label>
                  <p className="text-base text-muted-foreground">
                    Đồng bộ với hồ sơ hiển thị cho nhà tuyển dụng
                  </p>
                  <select
                    id="education_level"
                    name="education_level"
                    value={basicForm.education_level}
                    onChange={handleBasicChange}
                    className={cn(fieldClass, 'w-full px-3')}
                  >
                    {EDUCATION_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
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

        <Card className="overflow-hidden rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <ProfileExtrasSection
              languages={profile?.languages || []}
              certifications={profile?.certifications || []}
              onSave={handleSaveExtras}
              loading={loading}
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
              key={JSON.stringify(profile?.social_links || {})}
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
