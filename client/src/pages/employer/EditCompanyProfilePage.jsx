import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Camera, FileText, Globe, Mail, MapPin, Save, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import IdentityFormFields from '../../components/profile/IdentityFormFields';
import { useAuth } from '../../context/AuthContext';
import { employerService } from '../../services';
import uploadService from '../../services/uploadService';
import { buildEmployerProfilePayload, normalizeCompanyEntity } from '../../utils/domain';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { toast } from 'react-hot-toast';

const COVER_FALLBACK =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

const EMPTY_PROFILE = normalizeCompanyEntity({
  first_name: '',
  last_name: '',
  company_name: '',
  industry: '',
  company_size: '',
  location: '',
  company_website: '',
  email: '',
  phone: '',
  company_description: '',
  company_logo: '',
  cover_image: '',
  gender: '',
  region: '',
});

const COMPANY_SIZE_OPTIONS = [
  '1-10 nhân viên',
  '11-50 nhân viên',
  '51-200 nhân viên',
  '201-500 nhân viên',
  '500+ nhân viên',
];

const FIELD_LABEL_CLASS = 'ml-1 text-xs font-bold text-slate-500';
const FIELD_INPUT_CLASS =
  'h-11 rounded-lg border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm focus:border-emerald-500/50 focus:ring-emerald-500/20';

const EditCompanyProfilePage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState({ logo: false, cover: false });

  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const response = await employerService.getProfile();
        if (!cancelled) {
          setProfile(normalizeCompanyEntity(response.data?.data || EMPTY_PROFILE));
        }
      } catch (error) {
        console.error('Failed to fetch employer profile', error);
        if (!cancelled) {
          toast.error('Không thể tải thông tin hồ sơ công ty.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => normalizeCompanyEntity({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setProfile((prev) => normalizeCompanyEntity({ ...prev, [name]: value }));
  };

  const handleFileChange = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tải lên không được vượt quá 5MB.');
      return;
    }

    setIsUploading((prev) => ({ ...prev, [type]: true }));

    try {
      if (type === 'logo') {
        const response = await uploadService.uploadCompanyLogo(file);
        const logoUrl = response.data?.data?.company_logo;

        if (!logoUrl) {
          throw new Error('Missing company_logo in upload response');
        }

        setProfile((prev) => normalizeCompanyEntity({ ...prev, company_logo: logoUrl }));
        updateUser({ avatar_url: logoUrl, company_logo: logoUrl });
        toast.success('Đã cập nhật logo công ty.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setProfile((prev) => normalizeCompanyEntity({ ...prev, cover_image: previewUrl }));
      toast.success('Đã cập nhật ảnh bìa xem trước.');
    } catch (error) {
      console.error('Failed to upload company asset', error);
      toast.error(type === 'logo' ? 'Không tải lên được logo.' : 'Không xử lý được ảnh bìa.');
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = buildEmployerProfilePayload(profile);
      const response = await employerService.updateProfile(payload);
      const nextProfile = normalizeCompanyEntity(response.data?.data || profile);

      setProfile(nextProfile);
      updateUser({
        first_name: nextProfile.first_name,
        last_name: nextProfile.last_name,
        company_name: nextProfile.company_name,
        company_logo: nextProfile.company_logo,
        ...(nextProfile.company_logo ? { avatar_url: nextProfile.company_logo } : {}),
      });

      toast.success('Hồ sơ công ty đã được cập nhật.');
      navigate('/employer/company-profile');
    } catch (error) {
      console.error('Failed to update employer profile', error);
      toast.error(error.response?.data?.message || 'Không cập nhật được hồ sơ công ty.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-transparent pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 pb-8 pt-10 sm:px-6 lg:flex-row lg:items-end lg:px-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Chế độ chỉnh sửa
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-white/70 px-3 py-1 font-bold text-slate-600"
              >
                Hồ sơ công ty
              </Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
              Chỉnh sửa hồ sơ công ty
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              Đồng nhất thông tin doanh nghiệp, người đại diện và kênh liên hệ trong cùng một biểu
              mẫu. Những dữ liệu này sẽ được dùng ở hồ sơ công ty, tin tuyển dụng và pipeline ứng
              viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/80 bg-white/85 p-3 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/employer/company-profile')}
              className="h-11 rounded-lg px-5 font-bold text-slate-600 transition-colors duration-200 ease-out hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 gap-2 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-emerald-700"
            >
              <Save size={17} />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md">
            <input
              type="file"
              ref={logoInputRef}
              onChange={(event) => handleFileChange(event, 'logo')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={coverInputRef}
              onChange={(event) => handleFileChange(event, 'cover')}
              accept="image/*"
              className="hidden"
            />

            <div
              className="group relative h-56 cursor-pointer overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70 md:h-72"
              onClick={() => coverInputRef.current?.click()}
            >
              <img
                src={profile.cover_image || COVER_FALLBACK}
                alt="Company cover"
                className={`h-full w-full rounded-2xl object-cover transition-all duration-700 ${
                  isUploading.cover ? 'blur-sm grayscale' : ''
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/20 transition-all group-hover:bg-slate-950/45">
                {isUploading.cover ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                    <span className="text-base font-bold uppercase tracking-normal text-white">
                      Đang tải lên...
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 rounded-lg border-white/40 bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 hover:bg-white hover:text-emerald-600"
                  >
                    <Camera size={18} />
                    Đổi ảnh bìa
                  </Button>
                )}
              </div>
            </div>

            <div className="relative -mt-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur sm:p-5">
              <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[132px_minmax(0,1fr)] lg:items-start">
                <div
                  className="group relative z-10 mx-auto w-fit cursor-pointer overflow-hidden rounded-[22px] bg-white p-2.5 shadow-xl shadow-slate-900/10 ring-1 ring-white lg:mx-0"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[16px] bg-white p-1 sm:h-28 sm:w-28">
                    {isUploading.logo ? (
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                    ) : profile.company_logo ? (
                      <img
                        src={resolveMediaUrl(profile.company_logo)}
                        alt="Company logo"
                        className="h-full w-full rounded-[14px] object-contain"
                      />
                    ) : (
                      <Building2 className="h-12 w-12 text-emerald-500" />
                    )}
                  </div>
                  <div className="absolute inset-0 m-2.5 flex items-center justify-center rounded-[16px] bg-slate-950/45 opacity-0 transition-all group-hover:opacity-100">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="space-y-2">
                    <Label className={FIELD_LABEL_CLASS}>Tên công ty *</Label>
                    <Input
                      name="company_name"
                      value={profile.company_name}
                      onChange={handleChange}
                      placeholder="Nhập tên doanh nghiệp..."
                      className="h-12 rounded-lg border-slate-200 bg-white text-base font-bold text-slate-900 shadow-sm focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>Lĩnh vực</Label>
                  <Input
                    name="industry"
                    value={profile.industry}
                    onChange={handleChange}
                    placeholder="Công nghệ, tài chính, giáo dục..."
                    className={FIELD_INPUT_CLASS}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>Quy mô nhân sự</Label>
                  <select
                    name="company_size"
                    value={profile.company_size}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Chọn quy mô</option>
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <FileText size={16} />
              </div>
              <h3 className="text-base font-bold tracking-normal text-slate-950">
                Giới thiệu công ty
              </h3>
            </div>

            <Textarea
              name="company_description"
              value={profile.company_description}
              onChange={handleChange}
              placeholder="Chia sẻ về sứ mệnh, tầm nhìn và cách công ty vận hành..."
              className="min-h-[260px] rounded-lg border-slate-200 bg-white p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm focus:ring-emerald-500/20"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <MapPin size={16} />
              </div>
              <h3 className="text-base font-bold tracking-normal text-slate-950">
                Đại diện và liên hệ
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>Họ người đại diện</Label>
                  <Input
                    name="first_name"
                    value={profile.first_name || ''}
                    onChange={handleChange}
                    placeholder="Nhập họ"
                    className={FIELD_INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>Tên người đại diện</Label>
                  <Input
                    name="last_name"
                    value={profile.last_name || ''}
                    onChange={handleChange}
                    placeholder="Nhập tên"
                    className={FIELD_INPUT_CLASS}
                  />
                </div>
              </div>

              {[
                {
                  label: 'Website',
                  name: 'company_website',
                  icon: Globe,
                  placeholder: 'https://company.io',
                },
                {
                  label: 'Email liên hệ',
                  name: 'email',
                  icon: Mail,
                  placeholder: 'hr@company.com',
                },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className={FIELD_LABEL_CLASS}>{field.label}</Label>
                  <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500">
                      <field.icon size={18} />
                    </div>
                    <Input
                      name={field.name}
                      value={profile[field.name] || ''}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="h-11 rounded-lg border-slate-200 bg-white pl-12 text-sm font-semibold text-slate-800 shadow-sm focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <IdentityFormFields
                formData={profile}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                addressFieldName="location"
                className="gap-x-4 gap-y-4"
              />
            </div>
          </Card>
        </div>
      </main>
    </form>
  );
};

export default EditCompanyProfilePage;
