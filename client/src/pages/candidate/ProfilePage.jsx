import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Github,
  Globe,
  Globe2,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Puzzle,
  Sparkles,
  Target,
  User,
} from 'lucide-react';

import StatCard from '@/components/common/StatCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { getUserFullName } from '@/utils';
import { decodeHtml } from '@/utils/sanitizeHtml';
import { JOB_SEARCH_STATUS_CONFIG, JOB_TYPES_LIST } from '@/constants/candidateProfile';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import candidateService from '../../services/candidateService';

const SURFACE_CARD_CLASS =
  'rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md';
const PROFILE_SECTION_CLASS =
  'overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md';

const toneStyles = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-50 text-slate-700 ring-slate-100',
};

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

function cleanText(value) {
  if (!value) return '';
  return decodeHtml(String(value));
}

function normalizeList(value, pickName = true) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item) return null;
      return pickName ? item.name || item.title || item.label || item.value : item;
    })
    .filter(Boolean);
}

const MILLION_VND = 1000000;

function normalizeSalaryAmount(value, currency = 'VND') {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Dữ liệu cũ từng nhập theo "triệu" vẫn được hiển thị hợp lý,
  // còn dữ liệu chuẩn mới luôn lưu VND đầy đủ để đồng bộ bộ lọc recruiter.
  if (currency === 'VND' && amount < 1000) return amount * MILLION_VND;
  return amount;
}

function formatCurrencyAmount(value, currency = 'VND') {
  if (value === null) return '';
  if (currency === 'VND') {
    if (value >= MILLION_VND) return `${Math.round(value / MILLION_VND)} triệu`;
    return `${value.toLocaleString('vi-VN')} VND`;
  }

  return `${value.toLocaleString('vi-VN')} ${currency}`;
}

function formatSalary(profile) {
  const currency = profile?.salary_currency || 'VND';
  const salaryMin = normalizeSalaryAmount(profile?.expected_salary_min, currency);
  const salaryMax = normalizeSalaryAmount(profile?.expected_salary_max, currency);

  if (salaryMin === null && salaryMax === null) return 'Thỏa thuận';
  if (salaryMin !== null && salaryMax !== null) {
    return `${formatCurrencyAmount(salaryMin, currency)} - ${formatCurrencyAmount(salaryMax, currency)}`;
  }
  if (salaryMin !== null) return `Từ ${formatCurrencyAmount(salaryMin, currency)}`;
  return `Đến ${formatCurrencyAmount(salaryMax, currency)}`;
}

function getJobTypeLabel(value) {
  const option = JOB_TYPES_LIST.find((item) => item.value === value || item.label === value);
  return option?.label || value;
}

function getProfileDisplayName(user, profile) {
  return (
    getUserFullName(user) ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    'Ứng viên'
  );
}

function formatPeriod(item) {
  if (item?.period) return item.period;
  if (item?.startDate && item?.endDate) return `${item.startDate} - ${item.endDate}`;
  if (item?.start_date && item?.end_date) return `${item.start_date} - ${item.end_date}`;
  if (item?.start_date) return `${item.start_date} - Hiện tại`;
  return 'Chưa cập nhật';
}

function languageProgress(language) {
  if (typeof language?.value === 'number') {
    return Math.min(100, Math.max(0, language.value));
  }

  const level = String(language?.level || '').toLowerCase();
  if (level.includes('expert') || level.includes('native') || level.includes('thành thạo')) {
    return 100;
  }
  if (level.includes('advanced') || level.includes('nâng cao')) return 80;
  if (level.includes('intermediate') || level.includes('trung')) return 60;
  if (level.includes('beginner') || level.includes('cơ bản')) return 35;
  return 70;
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 transition-colors hover:border-emerald-100 hover:bg-white">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-100">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || 'Chưa cập nhật'}
      </p>
    </div>
  </div>
);

const MetricTile = ({ label, value, helper, icon: Icon, tone = 'emerald' }) => (
  <StatCard title={label} value={value} subtitle={helper} icon={Icon} type={tone} />
);

const SectionHeader = ({ icon: Icon, title, subtitle, meta, tone = 'emerald', action }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
          toneStyles[tone] || toneStyles.emerald
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {meta ? (
        <span className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600">
          {meta}
        </span>
      ) : null}
      {action}
    </div>
  </div>
);

const ChipList = ({ items, tone = 'slate', empty = 'Chưa cập nhật' }) => {
  if (!items.length) {
    return <p className="text-sm font-medium text-slate-400">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset',
            toneStyles[tone]
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const EmptyPanel = ({ message, action }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
    <p className="text-sm font-medium leading-6 text-slate-500">{message}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

const SocialLink = ({ href, icon: Icon, label, className }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className={cn(
      'flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset transition-transform hover:-translate-y-0.5',
      className
    )}
  >
    <Icon size={16} />
  </a>
);

const CertificationCard = ({ item }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-amber-200 hover:bg-white">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-slate-900">{item.name || 'Chứng chỉ'}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {[item.organization, item.year].filter(Boolean).join(' • ') || 'Chưa cập nhật'}
        </p>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Xem chứng chỉ
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getFullProfile();
        setProfile(response.data?.data ?? null);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        showNotification('Không thể tải thông tin hồ sơ', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [showNotification]);

  const {
    displayName,
    title,
    location,
    email,
    phone,
    bio,
    skillList,
    languages,
    experiences,
    education,
    certifications,
    socialLinks,
    jobSearchStatusMeta,
    expectedSalary,
    preferredWorkTypes,
    preferredLocations,
    willingToRelocate,
    yearsExperience,
    projects,
    hasResume,
    lastUpdatedStr,
  } = useMemo(() => {
    const updatedAt = profile?.updated_at || user?.updated_at || new Date().toISOString();

    return {
      displayName: getProfileDisplayName(user, profile),
      title: profile?.title || profile?.current_job_title || 'Chuyên viên',
      location: profile?.location || 'Chưa cập nhật',
      email: user?.email || 'Chưa cập nhật',
      phone: profile?.phone || 'Chưa cập nhật',
      bio: cleanText(profile?.bio),
      skillList: normalizeList(profile?.skills),
      languages: Array.isArray(profile?.languages) ? profile.languages : [],
      experiences: Array.isArray(profile?.experiences)
        ? profile.experiences
        : Array.isArray(profile?.experience)
          ? profile.experience
          : [],
      education: Array.isArray(profile?.education) ? profile.education : [],
      certifications: Array.isArray(profile?.certifications) ? profile.certifications : [],
      socialLinks: profile?.social_links || {},
      jobSearchStatusMeta: JOB_SEARCH_STATUS_CONFIG[profile?.job_search_status] || null,
      expectedSalary: formatSalary(profile),
      preferredWorkTypes: normalizeList(profile?.preferred_job_types).map(getJobTypeLabel),
      preferredLocations: normalizeList(profile?.preferred_locations),
      willingToRelocate: Boolean(profile?.willing_to_relocate),
      yearsExperience: profile?.years_of_experience ?? profile?.experience_years ?? null,
      projects: normalizeList(profile?.projects, false),
      hasResume: Boolean(profile?.resume_url),
      lastUpdatedStr: new Date(updatedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
  }, [profile, user]);

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
        setProfile((prev) => ({ ...(prev || {}), avatar_url: nextAvatarUrl }));
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const numericYearsExperience = Number(yearsExperience || 0);
  const experienceMetricValue = numericYearsExperience > 0 ? `${yearsExperience}+` : '0';
  const experienceText = numericYearsExperience > 0 ? `${yearsExperience} năm` : 'Chưa cập nhật';
  const avatarUrl = user?.avatar_url || profile?.avatar_url;
  const hasSocialLinks = Boolean(
    socialLinks?.linkedin || socialLinks?.github || socialLinks?.portfolio || socialLinks?.website
  );
  const JobStatusIcon = jobSearchStatusMeta?.icon || Briefcase;

  return (
    <div className="min-h-screen bg-transparent pb-14 animate-fade-in">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:items-stretch">
            <Card className="rounded-lg border-white/80 bg-white/90 shadow-sm backdrop-blur">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="group relative mx-auto shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:mx-0"
                    aria-label="Đổi ảnh đại diện"
                  >
                    <Avatar className="h-28 w-28 rounded-2xl border border-white shadow-lg shadow-emerald-900/10 ring-1 ring-slate-200/80">
                      <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                      <AvatarFallback className="bg-emerald-50 text-4xl font-bold text-emerald-700">
                        {displayName.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-slate-950 text-white shadow-sm transition group-hover:scale-105 group-hover:bg-emerald-600">
                      <Camera className="h-4 w-4" />
                    </span>
                  </button>

                  <div className="min-w-0 flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <User className="h-3.5 w-3.5" />
                        Hồ sơ ứng viên
                      </span>
                      {jobSearchStatusMeta ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold',
                            jobSearchStatusMeta.bg,
                            jobSearchStatusMeta.text,
                            jobSearchStatusMeta.border
                          )}
                        >
                          <JobStatusIcon className="h-3.5 w-3.5" />
                          {jobSearchStatusMeta.label}
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        Cập nhật {lastUpdatedStr}
                      </span>
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {displayName}
                    </h1>
                    <p className="mt-2 text-base font-semibold text-emerald-700">{title}</p>
                    <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                      Hồ sơ nghề nghiệp dùng chung cho tìm kiếm ứng viên, matching việc làm và luồng
                      ứng tuyển nhanh. Các mục CV, portfolio và chứng chỉ được đồng bộ từ dữ liệu hồ
                      sơ thật của dự án.
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        {location}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                        <Clock3 className="h-3.5 w-3.5 text-emerald-600" />
                        {experienceText}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        {expectedSalary}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center md:justify-start">
                      <Button
                        asChild
                        className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        <Link to="/candidate/profile/edit">
                          <Pencil className="h-4 w-4" />
                          Chỉnh sửa hồ sơ
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-lg bg-white px-4 text-sm font-bold text-slate-700"
                      >
                        <Link to="/candidate/resume">
                          <Briefcase className="h-4 w-4 text-emerald-600" />
                          Quản lý CV
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile
                    label="Năm kinh nghiệm"
                    value={experienceMetricValue}
                    helper="Kinh nghiệm đã khai báo"
                    icon={Clock3}
                    tone="emerald"
                  />
                  <MetricTile
                    label="Kỹ năng"
                    value={skillList.length}
                    helper="Kỹ năng chuyên môn"
                    icon={Puzzle}
                    tone="sky"
                  />
                  <MetricTile
                    label="Ngôn ngữ"
                    value={languages.length}
                    helper="Ngoại ngữ sử dụng"
                    icon={Globe}
                    tone="violet"
                  />
                  <MetricTile
                    label="CV ứng tuyển"
                    value={hasResume ? 'Có' : 'Chưa'}
                    helper={hasResume ? 'Sẵn sàng ứng tuyển nhanh' : 'Quản lý tại CV & Portfolio'}
                    icon={FileText}
                    tone={hasResume ? 'emerald' : 'amber'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-5">
            <Card className={PROFILE_SECTION_CLASS}>
              <CardContent className="p-5 sm:p-6">
                <SectionHeader
                  icon={Sparkles}
                  title="Giới thiệu bản thân"
                  subtitle="Tóm tắt thế mạnh, phong cách làm việc và giá trị bạn có thể mang lại."
                  tone="emerald"
                />
                {bio ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{bio}</p>
                ) : (
                  <EmptyPanel
                    message="Chưa có phần giới thiệu cá nhân. Hãy bổ sung để nhà tuyển dụng hiểu rõ thế mạnh của bạn."
                    action={
                      <Button
                        asChild
                        size="sm"
                        className="rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                      >
                        <Link to="/candidate/profile/edit">Bổ sung giới thiệu</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className={PROFILE_SECTION_CLASS}>
              <CardContent className="p-5 sm:p-6">
                <SectionHeader
                  icon={Briefcase}
                  title="Kinh nghiệm làm việc"
                  subtitle="Các vai trò, trách nhiệm và kết quả nổi bật trong quá trình làm việc."
                  meta={`${experiences.length} mục`}
                  tone="emerald"
                  action={
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white text-xs font-bold"
                    >
                      <Link to="/candidate/profile/edit">Cập nhật</Link>
                    </Button>
                  }
                />

                {experiences.length > 0 ? (
                  <div className="space-y-4">
                    {experiences.map((experience, index) => {
                      const description = cleanText(experience.description || experience.desc);

                      return (
                        <div
                          key={experience.id || `${experience.company}-${index}`}
                          className="relative rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-emerald-200 hover:bg-white"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-slate-950">
                                {experience.title || experience.position || 'Vị trí chưa cập nhật'}
                              </h3>
                              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <Building2 className="h-4 w-4" />
                                {experience.company || 'Công ty chưa cập nhật'}
                              </p>
                            </div>
                            <span className="inline-flex w-fit rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                              {formatPeriod(experience)}
                            </span>
                          </div>
                          {description ? (
                            <ul className="mt-4 space-y-2 border-t border-slate-200/80 pt-4">
                              {description
                                .split(/\n|•|\.\s+/)
                                .filter(Boolean)
                                .slice(0, 5)
                                .map((line, lineIndex) => (
                                  <li
                                    key={`${experience.id || index}-${lineIndex}`}
                                    className="flex gap-2 text-sm leading-6 text-slate-600"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{line.trim()}</span>
                                  </li>
                                ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPanel
                    message="Dữ liệu kinh nghiệm làm việc chưa được bổ sung."
                    action={
                      <Button
                        asChild
                        size="sm"
                        className="rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                      >
                        <Link to="/candidate/profile/edit">Thêm kinh nghiệm</Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card className={PROFILE_SECTION_CLASS}>
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={GraduationCap}
                    title="Học vấn"
                    subtitle="Nền tảng đào tạo và chứng nhận học thuật."
                    meta={`${education.length} mục`}
                    tone="violet"
                  />
                  {education.length > 0 ? (
                    <div className="space-y-3">
                      {education.map((item, index) => (
                        <div
                          key={item.id || `${item.school}-${index}`}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-violet-200 hover:bg-white"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100">
                              <GraduationCap size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-slate-950">
                                {item.degree || item.major || item.school || 'Chương trình học'}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {item.school || item.university || 'Trường chưa cập nhật'}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-100">
                                  {formatPeriod(item)}
                                </span>
                                {item.gpa ? (
                                  <span className="inline-flex rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                    GPA: {item.gpa}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel message="Thông tin học vấn đang được cập nhật." />
                  )}
                </CardContent>
              </Card>

              <Card className={PROFILE_SECTION_CLASS}>
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={Sparkles}
                    title="Chứng chỉ & giải thưởng"
                    subtitle="Minh chứng bổ sung cho năng lực chuyên môn."
                    meta={`${certifications.length} mục`}
                    tone="amber"
                  />
                  {certifications.length > 0 ? (
                    <div className="space-y-3">
                      {certifications.map((item, index) => (
                        <CertificationCard key={item.id || `${item.name}-${index}`} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel message="Chưa có chứng chỉ hoặc giải thưởng được thêm vào hồ sơ." />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={User} title="Thông tin liên hệ" tone="emerald" />
                <div className="grid gap-2.5">
                  <InfoRow icon={MapPin} label="Vị trí" value={location} />
                  <InfoRow icon={Mail} label="Email" value={email} />
                  <InfoRow icon={Phone} label="Điện thoại" value={phone} />
                  <InfoRow icon={DollarSign} label="Lương kỳ vọng" value={expectedSalary} />
                  <InfoRow icon={Clock3} label="Kinh nghiệm" value={experienceText} />
                </div>

                {hasSocialLinks ? (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Liên kết
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.linkedin ? (
                        <SocialLink
                          href={socialLinks.linkedin}
                          icon={Linkedin}
                          label="LinkedIn"
                          className="bg-sky-50 text-sky-700 ring-sky-100"
                        />
                      ) : null}
                      {socialLinks.github ? (
                        <SocialLink
                          href={socialLinks.github}
                          icon={Github}
                          label="GitHub"
                          className="bg-slate-950 text-white ring-slate-900"
                        />
                      ) : null}
                      {socialLinks.portfolio ? (
                        <SocialLink
                          href={socialLinks.portfolio}
                          icon={Globe2}
                          label="Hồ sơ dự án"
                          className="bg-violet-50 text-violet-700 ring-violet-100"
                        />
                      ) : null}
                      {socialLinks.website ? (
                        <SocialLink
                          href={socialLinks.website}
                          icon={Globe}
                          label="Website"
                          className="bg-emerald-50 text-emerald-700 ring-emerald-100"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={Briefcase} title="Mong muốn công việc" tone="sky" />
                <div className="space-y-4">
                  <InfoRow
                    icon={Target}
                    label="Trạng thái"
                    value={jobSearchStatusMeta?.label || 'Chưa cập nhật'}
                  />
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Hình thức làm việc
                    </p>
                    <ChipList
                      items={preferredWorkTypes}
                      tone="sky"
                      empty="Chưa chọn hình thức làm việc"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Địa điểm ưu tiên
                    </p>
                    <ChipList items={preferredLocations} empty="Chưa chọn địa điểm ưu tiên" />
                  </div>
                  <div
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-sm font-semibold',
                      willingToRelocate
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    )}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {willingToRelocate
                        ? 'Sẵn sàng chuyển địa điểm làm việc khi có cơ hội phù hợp.'
                        : 'Chưa bật tùy chọn sẵn sàng chuyển địa điểm.'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader
                  icon={FileText}
                  title="CV & Portfolio"
                  tone={hasResume ? 'emerald' : 'amber'}
                  action={
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white text-xs font-bold"
                    >
                      <Link to="/candidate/resume">Quản lý</Link>
                    </Button>
                  }
                />
                <div className="grid gap-2.5">
                  <InfoRow
                    icon={FileText}
                    label="CV ứng tuyển"
                    value={hasResume ? 'Đã có CV chính' : 'Chưa có CV chính'}
                  />
                  <InfoRow
                    icon={Globe2}
                    label="Portfolio"
                    value={projects.length > 0 ? `${projects.length} dự án` : 'Chưa có dự án'}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader
                  icon={Puzzle}
                  title="Kỹ năng"
                  meta={`${skillList.length}`}
                  tone="emerald"
                />
                <ChipList items={skillList} tone="emerald" empty="Chưa xác định kỹ năng cốt lõi" />
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={Globe} title="Ngôn ngữ" tone="sky" />
                {languages.length > 0 ? (
                  <div className="space-y-4">
                    {languages.map((language, index) => {
                      const name = language.name || language.language || language;
                      const level = language.level || 'Chưa cập nhật';
                      const progress = languageProgress(language);

                      return (
                        <div key={language.id || name || index}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-800">{name}</span>
                            <span className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-100">
                              {level}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-sky-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400">
                    Hệ thống chưa ghi nhận ngoại ngữ
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
