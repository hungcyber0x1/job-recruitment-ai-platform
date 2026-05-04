import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmployerStatCard from '../../components/employer/EmployerStatCard';
import { cn } from '@/utils/cn';
import { employerService } from '../../services';
import { normalizeCompanyEntity } from '../../utils/domain';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { decodeHtml } from '../../utils/sanitizeHtml';

const COVER_FALLBACK =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop';

const SURFACE_CARD_CLASS =
  'rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md';
const PROFILE_SECTION_CLASS =
  'overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200/80 hover:shadow-md';

const toneStyles = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-50 text-slate-700 ring-slate-100',
};

const getModerationStatus = (profile) => {
  if (profile?.flagged) {
    return {
      icon: ShieldAlert,
      label: 'Cần Admin xem xét',
      badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
      tone: 'rose',
      summary:
        'Hồ sơ công ty đang có cảnh báo. Nhà tuyển dụng nên cập nhật lại thông tin và theo dõi ghi chú kiểm duyệt.',
    };
  }

  if (profile?.is_verified) {
    return {
      icon: BadgeCheck,
      label: 'Đã xác minh',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tone: 'emerald',
      summary:
        'Hồ sơ công ty đã được Admin kiểm duyệt và sẵn sàng hiển thị cho ứng viên trên toàn hệ thống.',
    };
  }

  return {
    icon: Clock3,
    label: 'Chờ xác minh',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    tone: 'amber',
    summary:
      'Admin chưa xác minh công ty. Việc hoàn thiện hồ sơ sẽ giúp hoạt động đăng tuyển ổn định hơn.',
  };
};

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

const InfoRow = ({ icon: Icon, label, value, link }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 transition-colors hover:border-emerald-100 hover:bg-white">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-100">
      <Icon size={16} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-semibold text-slate-800 hover:text-emerald-700"
        >
          <span className="min-w-0 break-all">{value || 'Chưa cập nhật'}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || 'Chưa cập nhật'}
        </p>
      )}
    </div>
  </div>
);

const EmptyPanel = ({ message, action }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
    <p className="text-sm font-medium leading-6 text-slate-500">{message}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

const FactChip = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
    <Icon className="h-3.5 w-3.5 text-emerald-600" />
    {children}
  </span>
);

const CompanyProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const response = await employerService.getProfile();
        const raw = response.data?.data || {};

        if (!cancelled) {
          setProfile({
            ...normalizeCompanyEntity(raw),
            is_verified: Boolean(raw?.is_verified),
            flagged: Boolean(raw?.flagged),
            moderation_note: String(raw?.moderation_note ?? '').trim(),
            tax_code: String(raw?.tax_code ?? '').trim(),
          });
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
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

  const requiredFields = useMemo(
    () => [
      ['company_name', 'Tên công ty'],
      ['company_description', 'Mô tả doanh nghiệp'],
      ['company_website', 'Website'],
      ['company_size', 'Quy mô công ty'],
      ['industry', 'Lĩnh vực'],
      ['location', 'Địa điểm'],
      ['phone', 'Số điện thoại'],
      ['email', 'Email liên hệ'],
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const moderationStatus = getModerationStatus(profile);
  const ModerationIcon = moderationStatus.icon;

  const missingFields = requiredFields
    .filter(([key]) => !String(profile?.[key] ?? '').trim())
    .map(([, label]) => label);

  const completedFields = requiredFields.length - missingFields.length;

  const websiteValue = String(profile?.company_website ?? '').trim();
  const websiteHref = websiteValue
    ? /^https?:\/\//i.test(websiteValue)
      ? websiteValue
      : `https://${websiteValue}`
    : '';
  const coverImage = resolveMediaUrl(profile?.cover_image) || COVER_FALLBACK;
  const logoImage = resolveMediaUrl(profile?.company_logo);
  const lastUpdatedStr = formatDate(profile?.updated_at || profile?.created_at);

  const descriptionText = decodeHtml(profile?.company_description);
  const companyName = profile?.company_name || 'Hồ sơ công ty chưa định danh';
  const companyInitial = companyName.charAt(0).toUpperCase() || 'C';
  const companySubtitle = profile?.industry || 'Doanh nghiệp tuyển dụng';

  const infoItems = [
    {
      icon: Globe,
      label: 'Website',
      value: websiteValue || 'Chưa cập nhật',
      link: websiteHref || '',
    },
    { icon: Mail, label: 'Email', value: profile?.email || 'Chưa cập nhật' },
    { icon: Phone, label: 'Điện thoại', value: profile?.phone || 'Chưa cập nhật' },
    { icon: MapPin, label: 'Địa điểm', value: profile?.location || 'Chưa cập nhật' },
    { icon: Users, label: 'Quy mô', value: profile?.company_size || 'Chưa cập nhật' },
    { icon: Target, label: 'Lĩnh vực', value: profile?.industry || 'Chưa cập nhật' },
  ];

  if (profile?.tax_code) {
    infoItems.push({ icon: Briefcase, label: 'Mã số thuế', value: profile.tax_code });
  }

  const visibilityItems = [
    {
      title: 'Admin kiểm duyệt thấy gì',
      description:
        'Trạng thái xác minh, ghi chú kiểm duyệt, thông tin liên hệ và hồ sơ chính thức của doanh nghiệp.',
      tone: 'amber',
      icon: ShieldAlert,
    },
    {
      title: 'Ứng viên thấy gì',
      description:
        'Tên công ty, website, địa điểm, quy mô, lĩnh vực và mô tả doanh nghiệp trên chi tiết tin tuyển dụng.',
      tone: 'emerald',
      icon: Users,
    },
    {
      title: 'Nhà tuyển dụng cần lưu ý',
      description:
        'Dữ liệu trong trang này phải khớp với thông tin sử dụng trong tin tuyển dụng và bảng điều khiển.',
      tone: 'sky',
      icon: Workflow,
    },
  ];

  const nextActions = [];

  if (!profile?.is_verified) {
    nextActions.push({
      title: 'Công ty chưa được xác minh',
      description:
        'Bổ sung thông tin rõ ràng để Admin có thể phê duyệt và giúp tin tuyển dụng hiển thị ổn định.',
      to: '/employer/company-profile/edit',
      cta: 'Cập nhật hồ sơ ngay',
    });
  }

  if (missingFields.length > 0) {
    nextActions.push({
      title: `Còn thiếu ${missingFields.length} trường thông tin`,
      description: `Nên bổ sung: ${missingFields.slice(0, 3).join(', ')}.`,
      to: '/employer/company-profile/edit',
      cta: 'Hoàn thiện hồ sơ công ty',
    });
  }

  if ((profile?.company_name || '').trim()) {
    nextActions.push({
      title: 'Đồng bộ hồ sơ với tin tuyển dụng',
      description:
        'Sau khi cập nhật hồ sơ, hãy kiểm tra lại các tin tuyển dụng đang mở để đảm bảo thông tin đồng nhất.',
      to: '/employer/jobs',
      cta: 'Mở quản lý tin tuyển dụng',
    });
  }

  const checklistItems = requiredFields.map(([key, label]) => ({
    label,
    done: Boolean(String(profile?.[key] ?? '').trim()),
  }));

  return (
    <div className="min-h-screen bg-transparent pb-14 animate-fade-in">
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
                  <div className="group relative mx-auto shrink-0 rounded-2xl md:mx-0">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white bg-emerald-50 text-4xl font-bold text-emerald-700 shadow-lg shadow-emerald-900/10 ring-1 ring-slate-200/80">
                      {logoImage ? (
                        <img
                          src={logoImage}
                          alt={companyName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{companyInitial}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-slate-950 text-white shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                      <Badge
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${moderationStatus.badgeClass}`}
                      >
                        <ModerationIcon className="mr-1.5 h-3.5 w-3.5" />
                        {moderationStatus.label}
                      </Badge>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <Building2 className="h-3.5 w-3.5" />
                        Hồ sơ công ty
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        Cập nhật {lastUpdatedStr}
                      </span>
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {companyName}
                    </h1>
                    <p className="mt-2 text-base font-semibold text-emerald-700">
                      {companySubtitle}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 md:max-w-3xl">
                      Hồ sơ doanh nghiệp được trình bày theo cấu trúc rõ ràng như hồ sơ cá nhân ứng
                      viên, giúp Admin kiểm duyệt nhanh và ứng viên nắm bắt thương hiệu tuyển dụng
                      nhất quán.
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                      <FactChip icon={MapPin}>
                        {profile?.location || 'Chưa cập nhật địa điểm'}
                      </FactChip>
                      <FactChip icon={Users}>
                        {profile?.company_size || 'Chưa cập nhật quy mô'}
                      </FactChip>
                      <FactChip icon={Target}>
                        {profile?.industry || 'Chưa cập nhật lĩnh vực'}
                      </FactChip>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center md:justify-start">
                      <Button
                        asChild
                        className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        <Link to="/employer/company-profile/edit">
                          <Edit3 className="h-4 w-4" />
                          Chỉnh sửa hồ sơ
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-lg bg-white px-4 text-sm font-bold text-slate-700"
                      >
                        <Link to="/employer/jobs">
                          <Briefcase className="h-4 w-4 text-emerald-600" />
                          Quản lý tin tuyển dụng
                        </Link>
                      </Button>
                      {websiteHref ? (
                        <Button
                          asChild
                          variant="outline"
                          className="h-10 rounded-lg bg-white px-4 text-sm font-bold text-slate-700"
                        >
                          <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 text-emerald-600" />
                            Website
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <EmployerStatCard
                    label="Trạng thái hồ sơ"
                    value={missingFields.length > 0 ? 'Cần bổ sung' : 'Sẵn sàng'}
                    helper="Hiển thị doanh nghiệp"
                    icon={Building2}
                    tone={missingFields.length > 0 ? 'amber' : 'emerald'}
                  />
                  <EmployerStatCard
                    label="Trường đã đủ"
                    value={completedFields}
                    helper={`${requiredFields.length} trường quan trọng`}
                    icon={CheckCircle2}
                    tone="sky"
                  />
                  <EmployerStatCard
                    label="Cần bổ sung"
                    value={missingFields.length}
                    helper="Thông tin còn thiếu"
                    icon={Clock3}
                    tone={missingFields.length > 0 ? 'amber' : 'emerald'}
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
                  title="Giới thiệu doanh nghiệp"
                  subtitle="Tóm tắt câu chuyện, thế mạnh tuyển dụng và giá trị công ty mang lại cho ứng viên."
                  tone="emerald"
                />

                {descriptionText ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {descriptionText}
                  </p>
                ) : (
                  <EmptyPanel
                    message="Chưa có mô tả doanh nghiệp. Hãy bổ sung để ứng viên hiểu rõ văn hóa, sản phẩm và môi trường làm việc."
                    action={
                      <Button
                        asChild
                        size="sm"
                        className="rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                      >
                        <Link to="/employer/company-profile/edit">Bổ sung mô tả</Link>
                      </Button>
                    }
                  />
                )}

                {profile?.moderation_note ? (
                  <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
                      <ShieldAlert className="h-4 w-4" />
                      Ghi chú kiểm duyệt
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {profile.moderation_note}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className={PROFILE_SECTION_CLASS}>
              <CardContent className="p-5 sm:p-6">
                <SectionHeader
                  icon={Briefcase}
                  title="Dữ liệu hiển thị trong tuyển dụng"
                  subtitle="Cùng một bộ hồ sơ nhưng được dùng theo từng ngữ cảnh trong hệ thống."
                  meta={`${visibilityItems.length} nhóm`}
                  tone="emerald"
                  action={
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg bg-white text-xs font-bold"
                    >
                      <Link to="/employer/company-profile/edit">Cập nhật</Link>
                    </Button>
                  }
                />

                <div className="space-y-4">
                  {visibilityItems.map((item) => {
                    const ItemIcon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="relative rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-emerald-200 hover:bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                              toneStyles[item.tone] || toneStyles.emerald
                            )}
                          >
                            <ItemIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card className={PROFILE_SECTION_CLASS}>
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={Globe}
                    title="Nhận diện thương hiệu"
                    subtitle="Ảnh bìa, logo và website đại diện cho trải nghiệm ứng viên."
                    tone="sky"
                  />

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <div className="relative h-48">
                      <img
                        src={coverImage}
                        alt="Ảnh bìa công ty"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white text-lg font-bold text-emerald-700 shadow-sm">
                          {logoImage ? (
                            <img
                              src={logoImage}
                              alt={companyName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            companyInitial
                          )}
                        </div>
                        <div className="min-w-0 text-white">
                          <p className="truncate text-sm font-bold">{companyName}</p>
                          <p className="truncate text-xs font-medium text-white/80">
                            {companySubtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {websiteHref ? (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Mở website công ty
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="mt-4 text-sm font-medium text-slate-400">
                      Website công ty chưa được cập nhật.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className={PROFILE_SECTION_CLASS}>
                <CardContent className="p-5 sm:p-6">
                  <SectionHeader
                    icon={ModerationIcon}
                    title="Kiểm duyệt & xác minh"
                    subtitle="Trạng thái hồ sơ công ty trước khi hiển thị rộng rãi với ứng viên."
                    meta={moderationStatus.label}
                    tone={moderationStatus.tone}
                  />

                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                          toneStyles[moderationStatus.tone] || toneStyles.emerald
                        )}
                      >
                        <ModerationIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          {moderationStatus.label}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {moderationStatus.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-50 p-4 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">Đã đủ</p>
                      <p className="mt-2 text-2xl font-bold">{completedFields}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4 text-amber-700 ring-1 ring-inset ring-amber-100">
                      <p className="text-xs font-bold uppercase tracking-[0.12em]">Còn thiếu</p>
                      <p className="mt-2 text-2xl font-bold">{missingFields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={Building2} title="Thông tin liên hệ" tone="emerald" />
                <div className="grid gap-2.5">
                  {infoItems.map((item) => (
                    <InfoRow
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      link={item.link}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={Target} title="Trạng thái hồ sơ" tone="sky" />
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Trường thông tin
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">
                        {completedFields}/{requiredFields.length}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                        missingFields.length > 0 ? toneStyles.amber : toneStyles.emerald
                      )}
                    >
                      {missingFields.length > 0 ? 'Cần bổ sung' : 'Đã đủ'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
                    {moderationStatus.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader icon={Workflow} title="Hành động tiếp theo" tone="emerald" />
                <div className="space-y-3">
                  {nextActions.length > 0 ? (
                    nextActions.map((action) => (
                      <Link
                        key={action.title}
                        to={action.to}
                        className="block rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-emerald-200 hover:bg-white"
                      >
                        <p className="text-sm font-bold text-slate-900">{action.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {action.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                          {action.cta}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <EmptyPanel message="Hồ sơ công ty đã tương đối đầy đủ. Hãy duy trì thông tin đồng nhất với các tin tuyển dụng đang mở." />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={SURFACE_CARD_CLASS}>
              <CardContent className="p-5">
                <SectionHeader
                  icon={CheckCircle2}
                  title="Checklist hiển thị"
                  meta={`${completedFields}/${requiredFields.length}`}
                  tone="emerald"
                />
                <div className="space-y-2.5">
                  {checklistItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 transition-colors hover:border-emerald-100 hover:bg-white"
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                          item.done ? toneStyles.emerald : toneStyles.amber
                        )}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
                        {item.label}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ring-1 ring-inset',
                          item.done ? toneStyles.emerald : toneStyles.amber
                        )}
                      >
                        {item.done ? 'Đã có' : 'Thiếu'}
                      </span>
                    </div>
                  ))}
                </div>

                {missingFields.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 p-4">
                    <p className="text-sm font-bold text-amber-800">Thông tin còn thiếu</p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      {missingFields.join(', ')}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfilePage;
