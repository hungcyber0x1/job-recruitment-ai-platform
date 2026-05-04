import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Image,
  Loader2,
  Mail,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';

import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { cn } from '../../utils';

const DEFAULT_SETTINGS = {
  site_name: '',
  site_description: '',
  site_logo_light: '',
  primary_color: '#10b981',
  contact_email: '',
  email_sender_name: '',
  email_notifications_enabled: true,
  two_factor_enabled: false,
  session_timeout_minutes: 120,
};

const SETTINGS_PAYLOAD_KEYS = [
  'site_name',
  'site_description',
  'site_logo_light',
  'primary_color',
  'contact_email',
  'email_sender_name',
  'email_notifications_enabled',
  'two_factor_enabled',
  'session_timeout_minutes',
];

const CONFIG_SECTIONS = [
  {
    id: 'branding',
    label: 'Thương hiệu',
    description: 'Thông tin nhận diện của website.',
    icon: Palette,
  },
  {
    id: 'email',
    label: 'Email hệ thống',
    description: 'Kênh gửi thông báo tự động.',
    icon: Mail,
  },
  {
    id: 'security',
    label: 'Bảo mật đăng nhập',
    description: 'Thiết lập bảo vệ phiên đăng nhập.',
    icon: ShieldCheck,
  },
];

const SESSION_TIMEOUT_OPTIONS = [30, 60, 120, 240, 480];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeSettings = (data = {}) => ({
  ...DEFAULT_SETTINGS,
  ...data,
  site_logo_light: data.site_logo_light || data.site_logo || DEFAULT_SETTINGS.site_logo_light,
  email_sender_name:
    data.email_sender_name || data.sender_name || DEFAULT_SETTINGS.email_sender_name,
  email_notifications_enabled: toBoolean(
    data.email_notifications_enabled,
    DEFAULT_SETTINGS.email_notifications_enabled
  ),
  two_factor_enabled: toBoolean(data.two_factor_enabled, DEFAULT_SETTINGS.two_factor_enabled),
  session_timeout_minutes: Number(
    data.session_timeout_minutes || DEFAULT_SETTINGS.session_timeout_minutes
  ),
});

const buildSettingsPayload = (settings) =>
  SETTINGS_PAYLOAD_KEYS.reduce((payload, key) => {
    if (key === 'session_timeout_minutes') {
      payload[key] = Number(settings[key] || DEFAULT_SETTINGS.session_timeout_minutes);
      return payload;
    }

    if (['email_notifications_enabled', 'two_factor_enabled'].includes(key)) {
      payload[key] = toBoolean(settings[key], DEFAULT_SETTINGS[key]);
      return payload;
    }

    payload[key] = String(settings[key] ?? '').trim();
    return payload;
  }, {});

const getChangedState = (current, saved) =>
  JSON.stringify(buildSettingsPayload(current)) !==
  JSON.stringify(buildSettingsPayload(saved || {}));

const validateSettings = (settings) => {
  const errors = {};
  const siteName = String(settings.site_name || '').trim();
  const description = String(settings.site_description || '').trim();
  const primaryColor = String(settings.primary_color || '').trim();
  const contactEmail = String(settings.contact_email || '').trim();
  const senderName = String(settings.email_sender_name || '').trim();
  const sessionTimeout = Number(settings.session_timeout_minutes);
  const emailEnabled = toBoolean(settings.email_notifications_enabled, true);

  if (!siteName) errors.site_name = 'Vui lòng nhập tên hệ thống.';
  else if (siteName.length > 120) errors.site_name = 'Tên hệ thống không vượt quá 120 ký tự.';

  if (!description) errors.site_description = 'Vui lòng nhập mô tả ngắn.';
  else if (description.length > 250)
    errors.site_description = 'Mô tả ngắn không vượt quá 250 ký tự.';

  if (!HEX_COLOR_REGEX.test(primaryColor))
    errors.primary_color = 'Màu chủ đạo phải là mã hex hợp lệ.';

  if (emailEnabled) {
    if (!contactEmail) errors.contact_email = 'Vui lòng nhập email gửi thông báo.';
    else if (!EMAIL_REGEX.test(contactEmail))
      errors.contact_email = 'Email gửi thông báo không hợp lệ.';

    if (!senderName) errors.email_sender_name = 'Vui lòng nhập tên người gửi.';
    else if (senderName.length > 100)
      errors.email_sender_name = 'Tên người gửi không vượt quá 100 ký tự.';
  } else if (contactEmail && !EMAIL_REGEX.test(contactEmail)) {
    errors.contact_email = 'Email gửi thông báo không hợp lệ.';
  }

  if (!Number.isInteger(sessionTimeout) || sessionTimeout < 15 || sessionTimeout > 1440) {
    errors.session_timeout_minutes = 'Thời gian hết hạn phiên phải từ 15 đến 1440 phút.';
  }

  return errors;
};

const getFirstErrorMessage = (errors) => Object.values(errors).find(Boolean);

const fieldBaseClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

const Field = ({ label, error, helper, children }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
    {children}
    {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    {!error && helper ? <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p> : null}
  </div>
);

const ToggleRow = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  </div>
);

const BusinessReason = ({ children }) => (
  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm leading-6 text-emerald-900">
    <p className="font-semibold text-emerald-950">Ý nghĩa nghiệp vụ</p>
    <p className="mt-1">{children}</p>
  </div>
);

const SectionShell = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
    <div className="mt-6 space-y-6">{children}</div>
  </section>
);

const AdminSettingsPage = () => {
  const { showNotification } = useNotification();
  const [activeSection, setActiveSection] = useState('branding');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const savedSettingsRef = useRef(DEFAULT_SETTINGS);

  const hasPendingChanges = useMemo(
    () => getChangedState(settings, savedSettingsRef.current),
    [settings]
  );

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await adminService.getSettings();

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Không thể tải cấu hình hệ thống.');
      }

      const normalized = normalizeSettings(response.data.data || {});
      setSettings(normalized);
      setLogoPreview(normalized.site_logo_light || '');
      savedSettingsRef.current = normalized;
      setValidationErrors({});
    } catch (error) {
      console.error('Error fetching settings:', error);
      const message = error.response?.data?.message || 'Không thể tải cấu hình hệ thống.';
      setLoadError(message);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setValidationErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Chỉ chấp nhận file ảnh PNG, SVG, JPG hoặc WEBP.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Kích thước logo không được vượt quá 2MB.', 'error');
      event.target.value = '';
      return;
    }

    const previousLogo = settings.site_logo_light || '';
    const reader = new FileReader();
    reader.onload = (loadEvent) => setLogoPreview(loadEvent.target.result);
    reader.readAsDataURL(file);

    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('site_logo', file);
      formData.append('logo_type', 'light');

      const response = await adminService.uploadSiteLogo(formData);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Không thể tải logo lên.');
      }

      const logoUrl = response.data.data?.url || response.data.url || '';
      setLogoPreview(logoUrl);
      setSettings((current) => ({ ...current, site_logo_light: logoUrl }));
      savedSettingsRef.current = { ...savedSettingsRef.current, site_logo_light: logoUrl };
      showNotification('Logo đã được cập nhật.', 'success');
    } catch (error) {
      console.error('Logo upload error:', error);
      setLogoPreview(previousLogo);
      showNotification(error.response?.data?.message || 'Có lỗi xảy ra khi tải logo lên.', 'error');
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    const errors = validateSettings(settings);
    setValidationErrors(errors);

    const firstError = getFirstErrorMessage(errors);
    if (firstError) {
      showNotification(firstError, 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = buildSettingsPayload(settings);
      await adminService.updateSettings(payload);
      const normalized = normalizeSettings(payload);
      setSettings((current) => ({ ...current, ...normalized }));
      savedSettingsRef.current = { ...savedSettingsRef.current, ...normalized };
      showNotification('Đã lưu thay đổi cấu hình.', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (!hasPendingChanges) {
      showNotification('Không có thay đổi nào cần đặt lại.', 'info');
      return;
    }

    const confirmed = window.confirm(
      'Đặt lại các thay đổi chưa lưu và khôi phục dữ liệu cấu hình gần nhất từ hệ thống?'
    );

    if (!confirmed) return;

    const saved = normalizeSettings(savedSettingsRef.current || DEFAULT_SETTINGS);
    setSettings(saved);
    setLogoPreview(saved.site_logo_light || '');
    setValidationErrors({});
    showNotification('Đã đặt lại các thay đổi chưa lưu.', 'info');
  };

  const renderBrandingSection = () => (
    <SectionShell
      icon={Palette}
      title="Thương hiệu"
      description="Quản lý các thông tin nhận diện xuất hiện trên website và email hệ thống."
    >
      <BusinessReason>
        Giúp Admin quản lý thông tin nhận diện của website tuyển dụng như tên hệ thống, mô tả, logo
        và màu chủ đạo.
      </BusinessReason>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-950">Logo</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tải logo chính dùng cho khu vực nhận diện hệ thống.
          </p>

          <label className="mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-emerald-300 hover:bg-emerald-50/40">
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp,image/svg"
              onChange={handleLogoUpload}
              disabled={logoUploading}
              className="hidden"
            />
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo hệ thống"
                className="max-h-28 max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Image className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Chọn file logo</p>
                  <p className="mt-1 text-xs text-slate-500">PNG, SVG, JPG hoặc WEBP, tối đa 2MB</p>
                </div>
              </div>
            )}
          </label>

          {logoUploading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải logo lên hệ thống...
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <Field label="Tên hệ thống" error={validationErrors.site_name}>
            <input
              type="text"
              value={settings.site_name}
              onChange={(event) => updateSetting('site_name', event.target.value)}
              className={fieldBaseClass}
              placeholder="Nhập tên hệ thống tuyển dụng"
            />
          </Field>

          <Field label="Mô tả ngắn" error={validationErrors.site_description}>
            <textarea
              rows={4}
              value={settings.site_description}
              onChange={(event) => updateSetting('site_description', event.target.value)}
              className={`${fieldBaseClass} resize-none`}
              placeholder="Mô tả ngắn về hệ thống tuyển dụng"
            />
          </Field>

          <Field
            label="Màu chủ đạo"
            error={validationErrors.primary_color}
            helper="Dùng mã màu hex để đồng bộ giao diện chính của website."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={settings.primary_color}
                onChange={(event) => updateSetting('primary_color', event.target.value)}
                className={fieldBaseClass}
                placeholder="#10b981"
              />
              <input
                type="color"
                value={
                  HEX_COLOR_REGEX.test(settings.primary_color || '')
                    ? settings.primary_color
                    : '#10b981'
                }
                onChange={(event) => updateSetting('primary_color', event.target.value)}
                className="h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-2 sm:w-24"
                aria-label="Chọn màu chủ đạo"
              />
            </div>
          </Field>
        </div>
      </div>
    </SectionShell>
  );

  const renderEmailSection = () => (
    <SectionShell
      icon={Mail}
      title="Email hệ thống"
      description="Thiết lập thông tin gửi email thông báo cho các nghiệp vụ tuyển dụng quan trọng."
    >
      <BusinessReason>
        Dùng để gửi thông báo đăng ký, ứng tuyển, duyệt hoặc từ chối tin tuyển dụng đến đúng người
        dùng trong hệ thống.
      </BusinessReason>

      <div className="space-y-5">
        <ToggleRow
          label="Bật gửi email thông báo"
          description="Khi bật, hệ thống sử dụng email này cho các thông báo tự động liên quan đến tài khoản và tuyển dụng."
          checked={toBoolean(settings.email_notifications_enabled, true)}
          onChange={() =>
            updateSetting(
              'email_notifications_enabled',
              !toBoolean(settings.email_notifications_enabled, true)
            )
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Email gửi thông báo" error={validationErrors.contact_email}>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(event) => updateSetting('contact_email', event.target.value)}
              className={fieldBaseClass}
              placeholder="noreply@domain.vn"
            />
          </Field>

          <Field label="Tên người gửi" error={validationErrors.email_sender_name}>
            <input
              type="text"
              value={settings.email_sender_name}
              onChange={(event) => updateSetting('email_sender_name', event.target.value)}
              className={fieldBaseClass}
              placeholder="Tên hiển thị trong email"
            />
          </Field>
        </div>
      </div>
    </SectionShell>
  );

  const renderSecuritySection = () => (
    <SectionShell
      icon={ShieldCheck}
      title="Bảo mật đăng nhập"
      description="Quản lý các thiết lập cơ bản giúp bảo vệ tài khoản Admin và người dùng."
    >
      <BusinessReason>
        Bảo vệ tài khoản Admin và người dùng bằng lớp xác thực bổ sung và giới hạn thời gian tồn tại
        của phiên đăng nhập.
      </BusinessReason>

      <div className="space-y-5">
        <ToggleRow
          label="Bật xác thực 2 lớp"
          description="Áp dụng khi hệ thống có hỗ trợ 2FA để tăng an toàn cho tài khoản quản trị."
          checked={toBoolean(settings.two_factor_enabled, false)}
          onChange={() =>
            updateSetting('two_factor_enabled', !toBoolean(settings.two_factor_enabled, false))
          }
        />

        <Field
          label="Thời gian hết hạn phiên đăng nhập"
          error={validationErrors.session_timeout_minutes}
          helper="Admin có thể chọn thời lượng phù hợp để giảm rủi ro khi tài khoản bị bỏ quên trên thiết bị dùng chung."
        >
          <select
            value={settings.session_timeout_minutes}
            onChange={(event) =>
              updateSetting('session_timeout_minutes', Number(event.target.value))
            }
            className={fieldBaseClass}
          >
            {SESSION_TIMEOUT_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </SectionShell>
  );

  const renderActiveSection = () => {
    if (activeSection === 'email') return renderEmailSection();
    if (activeSection === 'security') return renderSecuritySection();
    return renderBrandingSection();
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Đang tải cấu hình hệ thống...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6 pb-10 text-slate-900">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Cấu hình hệ thống</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Quản lý các thiết lập cơ bản của hệ thống tuyển dụng
          </p>
        </header>

        <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Không thể tải cấu hình</p>
              <p className="mt-1 text-sm leading-6">{loadError}</p>
              <button
                type="button"
                onClick={fetchSettings}
                className="mt-4 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 text-slate-900">
      <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Cấu hình hệ thống</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Quản lý các thiết lập cơ bản của hệ thống tuyển dụng
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || logoUploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="px-3 pb-3 pt-2">
              <p className="text-sm font-semibold text-slate-950">Menu cấu hình</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Chỉ hiển thị một nhóm cấu hình tại một thời điểm.
              </p>
            </div>

            <nav className="space-y-2" aria-label="Menu cấu hình hệ thống">
              {CONFIG_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeSection;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition',
                      isActive
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    )}
                  >
                    <Icon
                      className={cn(
                        'mt-0.5 h-5 w-5 shrink-0',
                        isActive ? 'text-white' : 'text-slate-400'
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{section.label}</span>
                      <span
                        className={cn(
                          'mt-1 block text-xs leading-5',
                          isActive ? 'text-white/70' : 'text-slate-500'
                        )}
                      >
                        {section.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="space-y-4">
          {renderActiveSection()}

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-sm leading-6 text-slate-500">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                Các thay đổi được kiểm tra trước khi lưu và được cập nhật vào cơ sở dữ liệu thông
                qua API quản trị.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetChanges}
              disabled={!hasPendingChanges || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại thay đổi
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
