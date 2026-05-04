import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import StatCard from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import userService from '../../services/userService';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import {
  buildUserProfilePayload,
  getUserFullName,
  normalizeUserRegion,
  USER_REGION_LABELS,
  USER_REGION_VALUES,
} from '@/utils';

function SectionCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="min-w-0 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

function FieldBlock({ icon: Icon, label, hint, className = '', children }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <Label className="text-sm font-bold text-slate-800">{label}</Label>
          {hint ? <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryStat({ label, value, helper }) {
  return (
    <StatCard
      title={label}
      value={value}
      subtitle={helper}
      icon={ShieldCheck}
      type="neutral"
      className="min-w-0 max-w-full overflow-hidden"
      titleClassName="break-words"
      valueClassName="break-words text-xl leading-tight sm:text-2xl"
      subtitleClassName="break-words"
    />
  );
}

const AdminProfilePage = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    gender: '',
    region: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        gender: user.gender || '',
        region: normalizeUserRegion(user.region || ''),
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfile(buildUserProfilePayload(formData));
      await refreshUser();
      showNotification('Cập nhật hồ sơ thành công!', 'success');
    } catch (error) {
      console.error('Failed to update profile', error);
      showNotification('Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn tệp hình ảnh.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Kích thước ảnh không được vượt quá 2MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const response = await userService.uploadAvatar(file);
      const nextAvatarUrl = response.data?.data?.avatar_url || response.data?.avatar_url;
      if (nextAvatarUrl) updateUser({ avatar_url: nextAvatarUrl });
      await refreshUser();
      showNotification('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (error) {
      console.error('Failed to upload avatar', error);
      showNotification('Không thể tải ảnh lên. Vui lòng thử lại.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const displayName = useMemo(() => getUserFullName(user) || 'Quản trị viên', [user]);

  const roleLabel = useMemo(() => {
    const normalizedRole = String(user?.role || '')
      .trim()
      .toLowerCase();

    if (normalizedRole === 'recruiter') return 'Nhà tuyển dụng';
    if (normalizedRole === 'candidate') return 'Ứng viên';
    return 'Admin';
  }, [user?.role]);

  const regionLabel = formData.region
    ? USER_REGION_LABELS[normalizeUserRegion(formData.region)] || formData.region
    : 'Chưa chọn';
  const avatarSrc = resolveMediaUrl(user?.avatar_url) || undefined;

  const profileChecklist = useMemo(
    () => [
      {
        label: 'Họ và tên',
        done: Boolean(
          String(formData.first_name || '').trim() && String(formData.last_name || '').trim()
        ),
        helper: 'Tên hiển thị cho tài khoản quản trị.',
      },
      {
        label: 'Liên hệ chính',
        done: Boolean(String(formData.phone || '').trim() && String(user?.email || '').trim()),
        helper: 'Số điện thoại và email hệ thống.',
      },
      {
        label: 'Nhận diện khu vực',
        done: Boolean(String(formData.gender || '').trim() && String(formData.region || '').trim()),
        helper: 'Giới tính và vùng miền đang quản lý.',
      },
      {
        label: 'Địa chỉ',
        done: Boolean(String(formData.address || '').trim()),
        helper: 'Địa chỉ liên hệ phục vụ hồ sơ nội bộ.',
      },
    ],
    [
      formData.address,
      formData.first_name,
      formData.gender,
      formData.last_name,
      formData.phone,
      formData.region,
      user?.email,
    ]
  );

  const completedCount = profileChecklist.filter((item) => item.done).length;
  const completionPercent = Math.round((completedCount / profileChecklist.length) * 100);
  const remainingProfileFields = Math.max(profileChecklist.length - completedCount, 0);

  const heroCards = [
    {
      label: 'Vai trò',
      value: roleLabel,
      helper: 'Quyền truy cập hệ thống',
      icon: Shield,
      type: 'primary',
    },
    {
      label: 'Vùng miền',
      value: regionLabel,
      helper: 'Khu vực đang thiết lập',
      icon: Globe2,
      type: 'neutral',
    },
    {
      label: 'Trạng thái',
      value: user?.email ? 'Sẵn sàng vận hành' : 'Cần kiểm tra',
      helper: 'Thông tin cơ bản của tài khoản',
      icon: ShieldCheck,
      type: 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Hồ sơ cá nhân
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-11 rounded-lg border-white/80 bg-white/85 px-5 font-bold text-slate-600 shadow-sm hover:border-emerald-200 hover:text-emerald-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px] xl:items-start">
            <div className="space-y-6">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-emerald-600">Admin account profile</p>
                <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                  Hồ sơ cá nhân
                </h1>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Quản lý thông tin tài khoản quản trị trong một bố cục sáng, gọn và đồng nhất với
                  các trang doanh nghiệp, để việc cập nhật hồ sơ và kiểm soát nhận diện hệ thống rõ
                  ràng hơn.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {heroCards.map((card) => (
                  <StatCard
                    key={card.label}
                    title={card.label}
                    value={card.value}
                    subtitle={card.helper}
                    icon={card.icon}
                    type={card.type}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-600">
                Góc nhìn hiện tại
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{displayName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Thông tin trong hồ sơ này được dùng để nhận diện tài khoản quản trị trên khu vực
                admin.
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-lg bg-slate-50/90 p-3 ring-1 ring-inset ring-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {user?.email || 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50/90 p-3 ring-1 ring-inset ring-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      ID
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">#{user?.id ?? 'N/A'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50/90 p-3 ring-1 ring-inset ring-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Vai trò
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{roleLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <SectionCard
              icon={UserRound}
              title="Thông tin cá nhân"
              description="Cập nhật các trường nhận diện chính của tài khoản quản trị mà không thay đổi logic lưu hồ sơ hiện tại."
              action={
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {completedCount}/{profileChecklist.length} mục hoàn thiện
                </div>
              }
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FieldBlock
                    icon={UserRound}
                    label="Họ"
                    hint="Phần tên đầu tiên trong hồ sơ quản trị."
                  >
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="h-12 rounded-lg border-slate-200 px-4 font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Nhập họ..."
                    />
                  </FieldBlock>

                  <FieldBlock
                    icon={UserRound}
                    label="Tên"
                    hint="Phần tên hiển thị cùng họ trên giao diện."
                  >
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="h-12 rounded-lg border-slate-200 px-4 font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Nhập tên..."
                    />
                  </FieldBlock>

                  <FieldBlock
                    icon={Phone}
                    label="Số điện thoại"
                    hint="Kênh liên hệ chính phục vụ quản trị nội bộ."
                  >
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-12 rounded-lg border-slate-200 px-4 font-semibold focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                      placeholder="0xxx xxx xxx"
                    />
                  </FieldBlock>

                  <FieldBlock
                    icon={Mail}
                    label="Email hệ thống"
                    hint="Email đăng nhập hiện tại, được giữ ở chế độ chỉ đọc."
                  >
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="h-12 rounded-lg border-slate-200 bg-slate-50 px-4 font-semibold text-slate-500"
                    />
                  </FieldBlock>

                  <FieldBlock
                    icon={UserRound}
                    label="Giới tính"
                    hint="Thông tin nhận diện cơ bản cho hồ sơ."
                  >
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => handleSelectChange('gender', value)}
                    >
                      <SelectTrigger className="h-12 rounded-lg border-slate-200 px-4 font-semibold">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200">
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldBlock>

                  <FieldBlock
                    icon={Globe2}
                    label="Vùng miền"
                    hint="Khu vực địa lý đang gắn với tài khoản quản trị."
                  >
                    <Select
                      value={normalizeUserRegion(formData.region || '')}
                      onValueChange={(value) => handleSelectChange('region', value)}
                    >
                      <SelectTrigger className="h-12 rounded-lg border-slate-200 px-4 font-semibold">
                        <SelectValue placeholder="Chọn vùng miền" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200">
                        {USER_REGION_VALUES.map((region) => (
                          <SelectItem key={region} value={region}>
                            {USER_REGION_LABELS[region]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldBlock>
                </div>

                <FieldBlock
                  icon={MapPin}
                  label="Địa chỉ"
                  hint="Địa chỉ liên hệ hoặc khu vực làm việc hiện tại của tài khoản."
                >
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={4}
                    className="min-h-[140px] resize-y rounded-lg border-slate-200 p-4 font-medium leading-7 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Nhập địa chỉ của bạn..."
                  />
                </FieldBlock>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-sm leading-6 text-slate-500">
                    Các thay đổi tại đây sẽ được cập nhật trực tiếp vào hồ sơ tài khoản admin sau
                    khi lưu.
                  </p>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 rounded-lg bg-emerald-600 px-8 font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </Button>
                </div>
              </form>
            </SectionCard>
          </div>

          <aside className="min-w-0 space-y-6 xl:sticky xl:top-24 xl:self-start">
            <SectionCard
              icon={UserRound}
              title="Nhận diện tài khoản"
              description="Khu vực tóm tắt avatar, định danh và tín hiệu hồ sơ hiện tại."
            >
              <div className="min-w-0 space-y-5">
                <div className="min-w-0 rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="relative">
                      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white bg-emerald-50 shadow-lg ring-1 ring-inset ring-slate-100">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-black text-emerald-700">
                            {(user?.first_name?.[0] || user?.name?.[0] || 'A').toUpperCase()}
                          </span>
                        )}

                        {uploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                        className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Thay đổi ảnh đại diện"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-5 max-w-full break-words text-2xl font-bold text-slate-950">
                      {displayName}
                    </p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-normal text-emerald-600">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                <div className="grid min-w-0 gap-3">
                  <SummaryStat
                    label="Email"
                    value={user?.email || 'Chưa cập nhật'}
                    helper="Tài khoản đăng nhập hiện tại"
                  />
                  <SummaryStat
                    label="ID quản trị"
                    value={`#${user?.id ?? 'N/A'}`}
                    helper="Định danh nội bộ của người dùng"
                  />
                  <SummaryStat
                    label="Vùng miền"
                    value={regionLabel}
                    helper="Khu vực đang hiển thị trên hồ sơ"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Tiến độ hồ sơ"
              description="Theo dõi các nhóm thông tin đã đủ để vận hành tài khoản quản trị."
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Trạng thái hồ sơ
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-950">
                        {remainingProfileFields > 0
                          ? `${remainingProfileFields} mục cần bổ sung`
                          : 'Đã đầy đủ'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {remainingProfileFields > 0
                          ? `Hoàn thiện thêm ${remainingProfileFields} nhóm thông tin để hồ sơ quản trị rõ ràng hơn.`
                          : 'Hồ sơ đã đủ các nhóm thông tin chính để vận hành tài khoản quản trị.'}
                      </p>
                    </div>
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        completionPercent >= 75
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {completionPercent >= 75 ? 'Ổn định' : 'Cần bổ sung'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {profileChecklist.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-lg bg-slate-50/80 p-4 ring-1 ring-inset ring-slate-100"
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          item.done ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.helper}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Shield}
              title="Bảo mật tài khoản"
              description="Quản lý các thao tác nhạy cảm như đổi mật khẩu và thiết lập bảo vệ bổ sung."
            >
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-bold text-emerald-800">Giữ tài khoản admin an toàn</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Nên dùng mật khẩu riêng cho tài khoản quản trị và rà soát định kỳ phần cài đặt bảo
                  mật để giảm rủi ro truy cập trái phép.
                </p>
                <Button
                  type="button"
                  onClick={() => navigate('/admin/settings')}
                  className="mt-4 h-11 w-full rounded-lg bg-slate-950 font-bold text-white hover:bg-slate-800"
                >
                  Mở cài đặt bảo mật
                </Button>
              </div>
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminProfilePage;
