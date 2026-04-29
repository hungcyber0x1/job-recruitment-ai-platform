import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Globe,
  Image,
  Key,
  LockKeyhole,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  Save,
  ServerCog,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { fallbackFeatureCatalog } from '../../data/featureCatalog';
import { cn } from '../../utils';

const DEFAULT_SETTINGS = {
  site_name: '',
  site_description: '',
  contact_email: '',
  support_email: '',
  maintenance_mode: false,
  allow_registration: true,
  default_language: 'vi',
  feature_catalog_enabled: true,
  feature_catalog_payload: '',
  primary_color: '#10b981',
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: '',
  smtp_password: '',
  two_factor_enabled: true,
  password_policy: 'strong',
  api_key: '',
  webhook_url: '',
  site_logo_light: '',
  site_logo_dark: '',
  smtp_connected: false,
};

const AI_FEATURES = [
  {
    key: 'ai_chatbot',
    label: 'Chatbot AI tư vấn nghề nghiệp',
    desc: 'Trợ lý AI hỗ trợ ứng viên 24/7 về nghề nghiệp và phỏng vấn.',
    color: 'bg-emerald-500',
  },
  {
    key: 'ai_resume_analysis',
    label: 'Phân tích hồ sơ tự động',
    desc: 'AI phân tích và đề xuất cải thiện CV cho ứng viên.',
    color: 'bg-blue-500',
  },
  {
    key: 'ai_moderation',
    label: 'Kiểm duyệt nội dung bằng AI',
    desc: 'Tự động phát hiện tin tuyển dụng lừa đảo hoặc nội dung không phù hợp.',
    color: 'bg-amber-500',
  },
];

const SETTINGS_TABS = [
  {
    id: 'branding',
    label: 'Thương hiệu',
    desc: 'Logo, màu sắc và mô tả thương hiệu.',
    icon: Palette,
    tone: 'emerald',
  },
  {
    id: 'email',
    label: 'Email SMTP',
    desc: 'Kênh gửi email và cấu hình vận hành.',
    icon: Mail,
    tone: 'blue',
  },
  {
    id: 'access',
    label: 'Truy cập',
    desc: '2FA, mật khẩu, bảo trì và đăng ký.',
    icon: Shield,
    tone: 'amber',
  },
  {
    id: 'api',
    label: 'API & webhook',
    desc: 'API key và endpoint tích hợp.',
    icon: Globe,
    tone: 'violet',
  },
  {
    id: 'ai',
    label: 'Tính năng AI',
    desc: 'Bật tắt các mô-đun AI trong hệ thống.',
    icon: Activity,
    tone: 'emerald',
  },
  {
    id: 'chatbot',
    label: 'Chatbot AI',
    desc: 'Mẫu lệnh, hạn mức và cấu hình chatbot.',
    icon: Bot,
    tone: 'indigo',
  },
  {
    id: 'catalog',
    label: 'Danh mục tính năng',
    desc: 'Quản lý năng lực công khai và trang giới thiệu.',
    icon: Boxes,
    tone: 'indigo',
  },
  {
    id: 'backup',
    label: 'Sao lưu',
    desc: 'Sao lưu và khôi phục dữ liệu.',
    icon: Database,
    tone: 'slate',
  },
];

const TONE_CLASSES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    active: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    active: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    active: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    active: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    active: 'bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200',
  },
};

const isEnabled = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
};

const cloneCatalog = (catalog) => JSON.parse(JSON.stringify(catalog));

const normalizeRoleGroup = (group, index) => ({
  id: group?.id || `group-${index + 1}`,
  eyebrow: group?.eyebrow || '',
  title: group?.title || '',
  summary: group?.summary || '',
  items: Array.isArray(group?.items) ? group.items : [],
});

const normalizePublicTool = (tool, index) => ({
  id: tool?.id || `tool-${index + 1}`,
  title: tool?.title || '',
  description: tool?.description || '',
  path: tool?.path || '',
  enabled: tool?.enabled !== false,
});

const isSupportedPublicTool = (tool) =>
  tool?.id !== 'career-roadmap' && tool?.path !== '/candidate/career-roadmap';

const normalizeCatalog = (catalog) => ({
  roleGroups: Array.isArray(catalog?.roleGroups)
    ? catalog.roleGroups.map(normalizeRoleGroup)
    : cloneCatalog(fallbackFeatureCatalog.roleGroups).map(normalizeRoleGroup),
  publicTools: Array.isArray(catalog?.publicTools)
    ? catalog.publicTools.filter(isSupportedPublicTool).map(normalizePublicTool)
    : cloneCatalog(fallbackFeatureCatalog.publicTools)
      .filter(isSupportedPublicTool)
      .map(normalizePublicTool),
  governanceSignals: Array.isArray(catalog?.governanceSignals)
    ? catalog.governanceSignals.filter(Boolean)
    : [...fallbackFeatureCatalog.governanceSignals],
});

const serializeCatalog = (catalog) => JSON.stringify(catalog, null, 2);

const parseCatalogPayload = (payload) => {
  if (!payload || !String(payload).trim()) {
    return {
      catalog: normalizeCatalog(fallbackFeatureCatalog),
      error: '',
    };
  }

  try {
    return {
      catalog: normalizeCatalog(JSON.parse(payload)),
      error: '',
    };
  } catch {
    return {
      catalog: normalizeCatalog(fallbackFeatureCatalog),
      error: 'JSON danh mục không hợp lệ. Hệ thống đang dùng cấu hình mặc định để chỉnh sửa.',
    };
  }
};

const AdminSettingsPage = () => {
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const savedSettingsRef = useRef({});

  const [settingsTab, setSettingsTab] = useState('branding');
  const [featureCatalog, setFeatureCatalog] = useState(() =>
    normalizeCatalog(fallbackFeatureCatalog)
  );
  const [catalogError, setCatalogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [logoLightPreview, setLogoLightPreview] = useState('');
  const [logoDarkPreview, setLogoDarkPreview] = useState('');
  const [colorPickerType, setColorPickerType] = useState('text');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettings();

      if (response.data?.success) {
        const data = response.data.data || {};
        const parsedCatalog = parseCatalogPayload(data.feature_catalog_payload);
        const nextSettings = {
          ...DEFAULT_SETTINGS,
          ...data,
          feature_catalog_payload: serializeCatalog(parsedCatalog.catalog),
        };

        setFeatureCatalog(parsedCatalog.catalog);
        setCatalogError(parsedCatalog.error);
        setSettings(nextSettings);
        savedSettingsRef.current = { ...nextSettings };

        setLogoLightPreview(nextSettings.site_logo_light || '');
        setLogoDarkPreview(nextSettings.site_logo_dark || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification('Không thể tải cấu hình hệ thống.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      savedSettingsRef.current = { ...settings };
      showNotification('Đã lưu cài đặt thành công.', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Có lỗi xảy ra khi lưu cài đặt.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const saved = savedSettingsRef.current;
    const parsedCatalog = parseCatalogPayload(saved.feature_catalog_payload);

    setFeatureCatalog(parsedCatalog.catalog);
    setCatalogError(parsedCatalog.error);
    setSettings({ ...saved });
    setLogoLightPreview(saved.site_logo_light || '');
    setLogoDarkPreview(saved.site_logo_dark || '');
    showNotification('Đã hoàn tác các thay đổi chưa lưu.', 'info');
  };

  const handleBackup = async () => {
    try {
      const response = await adminService.backup();
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', `backup-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('Đã tạo bản sao lưu thành công.', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification('Có lỗi xảy ra khi tạo bản sao lưu.', 'error');
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !window.confirm(
        'Bạn có chắc chắn muốn khôi phục dữ liệu? Hành động này sẽ ghi đè dữ liệu hiện tại.'
      )
    ) {
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('backup', file);
      await adminService.restore(formData);
      showNotification('Khôi phục dữ liệu thành công.', 'success');
      fetchSettings();
    } catch (error) {
      console.error('Error restoring data:', error);
      showNotification('Có lỗi xảy ra khi khôi phục dữ liệu.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const handleLogoUpload = async (event, logoType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Chỉ chấp nhận file ảnh PNG, SVG, JPG hoặc WEBP.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Kích thước logo không được vượt quá 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (logoType === 'light') setLogoLightPreview(loadEvent.target.result);
      else setLogoDarkPreview(loadEvent.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('site_logo', file);
      formData.append('logo_type', logoType);

      const response = await adminService.uploadSiteLogo(formData);
      if (response.data?.success) {
        const logoUrl = response.data.data?.url || response.data.url || '';
        updateSetting(`site_logo_${logoType}`, logoUrl);
        if (logoType === 'light') setLogoLightPreview(logoUrl);
        else setLogoDarkPreview(logoUrl);
        showNotification('Logo đã được tải lên thành công.', 'success');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      showNotification('Có lỗi xảy ra khi tải logo lên.', 'error');
      if (logoType === 'light') setLogoLightPreview(settings.site_logo_light || '');
      else setLogoDarkPreview(settings.site_logo_dark || '');
    }
  };

  const handleTestSmtp = async () => {
    try {
      setSmtpTesting(true);
      const response = await adminService.testSmtp({
        host: settings.smtp_host,
        port: settings.smtp_port,
        user: settings.smtp_user || settings.contact_email,
        password: settings.smtp_password,
      });

      if (response.data?.success) {
        showNotification('Kết nối SMTP thành công. Hệ thống có thể gửi email.', 'success');
        setSettings((prev) => ({ ...prev, smtp_connected: true }));
      } else {
        showNotification(response.data?.message || 'Kết nối SMTP thất bại.', 'error');
        setSettings((prev) => ({ ...prev, smtp_connected: false }));
      }
    } catch (error) {
      console.error('SMTP test error:', error);
      showNotification('Kết nối SMTP thất bại. Vui lòng kiểm tra lại thông tin.', 'error');
      setSettings((prev) => ({ ...prev, smtp_connected: false }));
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setGeneratingKey(true);
      const response = await adminService.generateApiKey();

      if (response.data?.success && response.data.data?.api_key) {
        updateSetting('api_key', response.data.data.api_key);
        showNotification('API key mới đã được tạo.', 'success');
        navigator.clipboard.writeText(response.data.data.api_key).catch(() => { });
      } else {
        showNotification('Không thể tạo API key. Vui lòng thử lại.', 'error');
      }
    } catch (error) {
      console.error('Generate API key error:', error);
      showNotification('Có lỗi xảy ra khi tạo API key.', 'error');
    } finally {
      setGeneratingKey(false);
    }
  };

  const updateFeatureCatalog = (updater) => {
    setFeatureCatalog((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setCatalogError('');
      setSettings((existing) => ({
        ...existing,
        feature_catalog_payload: serializeCatalog(next),
      }));
      return next;
    });
  };

  const updateRoleGroup = (index, key, value) => {
    updateFeatureCatalog((current) => ({
      ...current,
      roleGroups: current.roleGroups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, [key]: value } : group
      ),
    }));
  };

  const updateRoleItems = (index, value) => {
    updateRoleGroup(
      index,
      'items',
      value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  };

  const addRoleGroup = () => {
    updateFeatureCatalog((current) => ({
      ...current,
      roleGroups: [...current.roleGroups, normalizeRoleGroup(null, current.roleGroups.length)],
    }));
  };

  const removeRoleGroup = (index) => {
    updateFeatureCatalog((current) => ({
      ...current,
      roleGroups: current.roleGroups.filter((_, groupIndex) => groupIndex !== index),
    }));
  };

  const updatePublicTool = (index, key, value) => {
    updateFeatureCatalog((current) => ({
      ...current,
      publicTools: current.publicTools.map((tool, toolIndex) =>
        toolIndex === index ? { ...tool, [key]: value } : tool
      ),
    }));
  };

  const addPublicTool = () => {
    updateFeatureCatalog((current) => ({
      ...current,
      publicTools: [...current.publicTools, normalizePublicTool(null, current.publicTools.length)],
    }));
  };

  const removePublicTool = (index) => {
    updateFeatureCatalog((current) => ({
      ...current,
      publicTools: current.publicTools.filter((_, toolIndex) => toolIndex !== index),
    }));
  };

  const updateGovernanceSignal = (index, value) => {
    updateFeatureCatalog((current) => ({
      ...current,
      governanceSignals: current.governanceSignals.map((signal, signalIndex) =>
        signalIndex === index ? value : signal
      ),
    }));
  };

  const addGovernanceSignal = () => {
    updateFeatureCatalog((current) => ({
      ...current,
      governanceSignals: [...current.governanceSignals, ''],
    }));
  };

  const removeGovernanceSignal = (index) => {
    updateFeatureCatalog((current) => ({
      ...current,
      governanceSignals: current.governanceSignals.filter(
        (_, signalIndex) => signalIndex !== index
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10';
  const labelClass =
    'mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500';
  const secondaryButtonClass =
    'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60';
  const primaryButtonClass =
    'inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60';

  const activeTabMeta = SETTINGS_TABS.find((tab) => tab.id === settingsTab) || SETTINGS_TABS[0];
  const ActiveTabIcon = activeTabMeta.icon;

  const configuredLogos = [settings.site_logo_light, settings.site_logo_dark].filter(Boolean).length;
  const enabledAiCount = AI_FEATURES.filter((feature) => isEnabled(settings[feature.key], true)).length;
  const governanceSignalsCount = featureCatalog.governanceSignals.filter((signal) =>
    String(signal || '').trim()
  ).length;
  const hasPendingChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettingsRef.current || {});
  const readinessChecks = [
    Boolean(settings.site_name?.trim()),
    Boolean(settings.site_description?.trim()),
    configuredLogos > 0,
    Boolean(settings.smtp_host?.trim() && settings.smtp_port?.trim()),
    isEnabled(settings.two_factor_enabled),
    settings.password_policy === 'strong',
    Boolean(settings.api_key),
    isEnabled(settings.feature_catalog_enabled, true),
  ];
  const readinessScore = Math.round(
    (readinessChecks.filter(Boolean).length / readinessChecks.length) * 100
  );

  const handleReload = async () => {
    if (
      hasPendingChanges &&
      !window.confirm('Tải lại sẽ bỏ các thay đổi chưa lưu. Bạn có muốn tiếp tục?')
    ) {
      return;
    }

    await fetchSettings();
    showNotification('Đã tải lại cấu hình mới nhất.', 'info');
  };

  const SectionShell = ({ title, description, action, children }) => (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );

  const ToggleRow = ({ label, description, checked, onChange, badge }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          {badge ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-emerald-500' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );

  const LogoUploadBox = ({ label, preview, onChange }) => (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <label className="group block cursor-pointer overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 transition hover:border-emerald-300 hover:bg-emerald-50/60">
        <input
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp,image/svg"
          onChange={onChange}
          className="hidden"
        />
        {preview ? (
          <div className="space-y-3 p-5 text-center">
            <div className="flex min-h-[132px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
              <img src={preview} alt={label} className="max-h-24 max-w-full object-contain" />
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">
                {preview.startsWith('data:') ? 'Đang xem trước' : 'Đã lưu'}
              </span>
              <span> • Nhấn để thay đổi tệp</span>
            </div>

          </div>
        ) : (
          <div className="flex min-h-[210px] flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-inset ring-slate-200 transition group-hover:text-emerald-600">
              <Image size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Thả hoặc nhấn để tải logo</p>
              <p className="mt-1 text-xs text-slate-500">PNG, SVG, JPG, tối đa 2MB</p>
            </div>
          </div>
        )}
      </label>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-8">
          <div className="flex flex-wrap items-center justify-start gap-2 lg:col-span-2 lg:justify-end">
            <button type="button" onClick={handleReload} className={secondaryButtonClass}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
            <button type="button" onClick={handleCancel} className={secondaryButtonClass}>
              Hoàn tác
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className={primaryButtonClass}>
              <Save className="h-4 w-4" />
              {saving ? 'Đang lưu...' : 'Lưu tất cả'}
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                <span className="inline-flex items-center gap-1.5">
                  <ServerCog className="h-3.5 w-3.5" />
                  Không gian quản trị
                </span>
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Cài đặt hệ thống
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold shadow-sm',
                  hasPendingChanges
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600'
                )}
              >
                {hasPendingChanges ? 'Có thay đổi chưa lưu' : 'Đồng bộ với bản lưu gần nhất'}
              </span>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Trung tâm kiểm soát hệ thống</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                Cấu hình hệ thống
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Tổ chức lại toàn bộ cài đặt theo đúng luồng vận hành của dự án: nhận diện thương hiệu,
                kênh gửi email, bảo mật truy cập, API, mô-đun AI và dữ liệu công khai dùng chung.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {configuredLogos}/2 logo đã cấu hình
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                SMTP {settings.smtp_connected ? 'đã xác minh' : 'chưa kiểm tra'}
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {enabledAiCount}/{AI_FEATURES.length} mô-đun AI đang bật
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {featureCatalog.roleGroups.length} nhóm vai trò • {featureCatalog.publicTools.length} công cụ công khai
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Mức sẵn sàng
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{readinessScore}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Truy cập
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {isEnabled(settings.maintenance_mode)
                    ? 'Chế độ bảo trì'
                    : isEnabled(settings.allow_registration, true)
                      ? 'Đang mở đăng ký'
                      : 'Đã khóa đăng ký'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Bảo mật
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {isEnabled(settings.two_factor_enabled) ? '2FA đang bật' : '2FA đang tắt'} •{' '}
                  {settings.password_policy === 'strong' ? 'Mật khẩu mạnh' : 'Cần rà soát chính sách'}
                </p>
              </div>
            </div>
          </div>

          <div className="self-start rounded-[28px] border border-white/90 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Mục đang chỉnh
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{activeTabMeta.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{activeTabMeta.desc}</p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
                  TONE_CLASSES[activeTabMeta.tone]?.icon || TONE_CLASSES.emerald.icon
                )}
              >
                <ActiveTabIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Ảnh chụp vận hành
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readinessScore >= 75 ? 'Ổn định, sẵn sàng vận hành' : 'Cần rà soát thêm trước khi mở rộng'}
                  </p>
                </div>
                {readinessScore >= 75 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Mức sẵn sàng</p>
                  <p className="text-sm font-semibold text-slate-950">{readinessScore}%</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Truy cập</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {isEnabled(settings.maintenance_mode)
                        ? 'Bảo trì'
                        : isEnabled(settings.allow_registration, true)
                          ? 'Mở đăng ký'
                          : 'Khóa đăng ký'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Bảo mật</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {isEnabled(settings.two_factor_enabled) ? '2FA bật' : '2FA tắt'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-bg">
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Điều hướng cấu hình
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Gom các nhóm cài đặt theo đúng phạm vi nghiệp vụ để thao tác nhanh hơn và dễ kiểm soát thay đổi.
                  </p>
                </div>

                <div className="p-2">
                  {SETTINGS_TABS.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = settingsTab === tab.id;
                    const tone = TONE_CLASSES[tab.tone] || TONE_CLASSES.emerald;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSettingsTab(tab.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors',
                          isActive ? tone.active : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
                            isActive ? 'bg-white text-slate-950 ring-slate-200' : tone.icon
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{tab.label}</span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          <p className={cn('mt-1 text-xs leading-5', isActive ? 'text-slate-600' : 'text-slate-400')}>
                            {tab.desc}
                          </p>
                        </div>
                        <ArrowRight className={cn('mt-1 h-4 w-4 shrink-0', isActive ? 'text-slate-700' : 'text-slate-300')} />
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Trạng thái chỉnh sửa
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {hasPendingChanges ? 'Có thay đổi chờ lưu' : 'Không có thay đổi tạm'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Dùng nút lưu ở phần đầu trang để đồng bộ toàn bộ cấu hình hiện tại.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              {settingsTab === 'branding' && (
                <SectionShell
                  title="Thương hiệu & nhận diện"
                  description="Thiết lập lớp nhận diện chung cho admin, trang công khai và các email gửi ra từ hệ thống."
                  action={
                    <>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {configuredLogos}/2 logo
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Màu chủ đạo {settings.primary_color || '#10b981'}
                      </span>
                    </>
                  }
                >
                  <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div
                        className="overflow-hidden rounded-[24px] border border-white/80 p-5 text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${settings.primary_color || '#10b981'} 0%, #0f172a 100%)`,
                        }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                          Brand preview
                        </p>
                        <h3 className="mt-3 text-2xl font-bold">
                          {settings.site_name?.trim() || 'Tên hệ thống'}
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                          {settings.site_description?.trim() ||
                            'Mô tả ngắn của nền tảng sẽ xuất hiện trên trang công khai, email và khu vực quản trị.'}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                            {configuredLogos > 0 ? 'Đã có logo' : 'Chưa có logo'}
                          </span>
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                            {settings.primary_color || '#10b981'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <LogoUploadBox
                          label="Logo nền sáng"
                          preview={logoLightPreview}
                          onChange={(event) => handleLogoUpload(event, 'light')}
                        />
                        <LogoUploadBox
                          label="Logo nền tối"
                          preview={logoDarkPreview}
                          onChange={(event) => handleLogoUpload(event, 'dark')}
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="grid gap-5">
                        <div>
                          <label className={labelClass}>Màu chủ đạo</label>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="min-w-[220px] flex-1">
                              {colorPickerType === 'picker' ? (
                                <input
                                  type="color"
                                  value={settings.primary_color || '#10b981'}
                                  onChange={(event) => updateSetting('primary_color', event.target.value)}
                                  className="h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-2"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={settings.primary_color || '#10b981'}
                                  onChange={(event) => updateSetting('primary_color', event.target.value)}
                                  className={inputClass}
                                  placeholder="#10b981"
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setColorPickerType((type) => (type === 'text' ? 'picker' : 'text'))}
                              className="inline-flex h-12 min-w-[124px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                            >
                              {colorPickerType === 'text' ? 'Chọn màu' : 'Nhập mã hex'}
                            </button>
                            <span
                              className="h-12 w-12 rounded-2xl border border-slate-200"
                              style={{ backgroundColor: settings.primary_color || '#10b981' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>Tên hiển thị</label>
                          <input
                            type="text"
                            value={settings.site_name}
                            onChange={(event) => updateSetting('site_name', event.target.value)}
                            className={inputClass}
                            placeholder="HireBOT"
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Mô tả trang</label>
                          <textarea
                            rows={5}
                            value={settings.site_description}
                            onChange={(event) => updateSetting('site_description', event.target.value)}
                            className={`${inputClass} resize-none`}
                            placeholder="Nền tảng tuyển dụng thông minh sử dụng AI..."
                          />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                          <p className="text-sm font-semibold text-slate-950">Gợi ý dùng trong dự án</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Màu thương hiệu, logo và mô tả này nên đồng bộ với landing page, email thông báo và các trang hồ sơ để giữ trải nghiệm nhất quán.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'email' && (
                <SectionShell
                  title="Email SMTP"
                  description="Cấu hình đường gửi mail cho xác thực, thông báo hệ thống và các luồng tuyển dụng."
                  action={
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold',
                        settings.smtp_connected
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                    >
                      {settings.smtp_connected ? 'SMTP đã xác minh' : 'SMTP chưa xác minh'}
                    </span>
                  }
                >
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>SMTP host</label>
                          <input
                            type="text"
                            value={settings.smtp_host}
                            onChange={(event) => updateSetting('smtp_host', event.target.value)}
                            className={inputClass}
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Cổng</label>
                          <input
                            type="text"
                            value={settings.smtp_port}
                            onChange={(event) => updateSetting('smtp_port', event.target.value)}
                            className={inputClass}
                            placeholder="587"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className={labelClass}>Email gửi</label>
                        <input
                          type="email"
                          value={settings.contact_email}
                          onChange={(event) => updateSetting('contact_email', event.target.value)}
                          className={inputClass}
                          placeholder="noreply@yourdomain.com"
                        />
                      </div>

                      <div className="mt-5">
                        <label className={labelClass}>Email đăng nhập nếu khác email gửi</label>
                        <input
                          type="email"
                          value={settings.smtp_user}
                          onChange={(event) => updateSetting('smtp_user', event.target.value)}
                          className={inputClass}
                          placeholder="Để trống nếu dùng cùng tài khoản"
                        />
                      </div>

                      <div className="mt-5">
                        <label className={labelClass}>Mật khẩu ứng dụng</label>
                        <input
                          type="password"
                          value={settings.smtp_password}
                          onChange={(event) => updateSetting('smtp_password', event.target.value)}
                          className={inputClass}
                          placeholder="••••••••••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Trạng thái kết nối
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {settings.smtp_connected ? 'Đã xác nhận gửi mail' : 'Cần kiểm tra kết nối'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Hệ thống dùng cấu hình này để gửi mail xác thực tài khoản, thông báo tuyển dụng và sự kiện nền tảng.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Tài khoản đang dùng
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {settings.smtp_user?.trim() || settings.contact_email?.trim() || 'Chưa khai báo tài khoản gửi'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Nếu dùng Gmail hoặc dịch vụ bên thứ ba, nên dùng app password thay cho mật khẩu đăng nhập chính.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleTestSmtp}
                          disabled={smtpTesting || !settings.smtp_host || !settings.smtp_password}
                          className={secondaryButtonClass}
                        >
                          {smtpTesting ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Đang kiểm tra
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4" />
                              Kiểm tra kết nối
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'access' && (
                <SectionShell
                  title="Bảo mật & truy cập"
                  description="Quản trị chính sách bảo vệ tài khoản admin và mức độ mở của hệ thống với người dùng mới."
                  action={
                    <>
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-semibold',
                          isEnabled(settings.two_factor_enabled)
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        )}
                      >
                        {isEnabled(settings.two_factor_enabled) ? '2FA bật' : '2FA tắt'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Chính sách {settings.password_policy}
                      </span>
                    </>
                  }
                >
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Bảo vệ tài khoản quản trị</p>
                          <p className="text-sm text-slate-500">Giảm rủi ro truy cập trái phép vào khu vực admin.</p>
                        </div>
                      </div>

                      <ToggleRow
                        label="Xác thực hai lớp (2FA)"
                        description="Yêu cầu thêm mã xác thực khi đăng nhập vào hệ thống."
                        checked={isEnabled(settings.two_factor_enabled)}
                        onChange={() =>
                          updateSetting('two_factor_enabled', !isEnabled(settings.two_factor_enabled))
                        }
                      />

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className={labelClass}>Chính sách mật khẩu</label>
                        <select
                          value={settings.password_policy}
                          onChange={(event) => updateSetting('password_policy', event.target.value)}
                          className={inputClass}
                        >
                          <option value="weak">Yếu - tối thiểu 6 ký tự</option>
                          <option value="medium">Trung bình - 8 ký tự</option>
                          <option value="strong">Mạnh - 8 ký tự, số và ký tự đặc biệt</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
                          <LockKeyhole className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Quyền truy cập nền tảng</p>
                          <p className="text-sm text-slate-500">Điều chỉnh trạng thái mở của website theo nhu cầu vận hành.</p>
                        </div>
                      </div>

                      <ToggleRow
                        label="Chế độ bảo trì"
                        description="Khóa truy cập của người dùng thường trong thời gian bảo trì hoặc kiểm tra hệ thống."
                        checked={isEnabled(settings.maintenance_mode)}
                        onChange={() =>
                          updateSetting('maintenance_mode', !isEnabled(settings.maintenance_mode))
                        }
                        badge={isEnabled(settings.maintenance_mode) ? 'Đang bật' : 'Đang tắt'}
                      />

                      <ToggleRow
                        label="Cho phép đăng ký"
                        description="Cho phép người dùng mới tự tạo tài khoản trên nền tảng."
                        checked={isEnabled(settings.allow_registration, true)}
                        onChange={() =>
                          updateSetting(
                            'allow_registration',
                            !isEnabled(settings.allow_registration, true)
                          )
                        }
                        badge={isEnabled(settings.allow_registration, true) ? 'Mở đăng ký' : 'Đã khóa'}
                      />
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'api' && (
                <SectionShell
                  title="API key & webhook"
                  description="Quản lý khóa truy cập hệ thống và endpoint dùng để đồng bộ sự kiện với các dịch vụ bên ngoài."
                  action={
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold',
                        settings.api_key
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                    >
                      {settings.api_key ? 'Đã có API key' : 'Chưa tạo API key'}
                    </span>
                  }
                >
                  <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div>
                        <label className={labelClass}>API key hiện tại</label>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="password"
                            value={settings.api_key}
                            readOnly
                            placeholder="Chưa có API key"
                            className={`${inputClass} min-w-[240px] flex-1`}
                          />
                          {settings.api_key ? (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(settings.api_key).catch(() => { });
                                showNotification('Đã sao chép API key.', 'success');
                              }}
                              className={secondaryButtonClass}
                            >
                              <Copy className="h-4 w-4" />
                              Sao chép
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleGenerateApiKey}
                          disabled={generatingKey}
                          className={primaryButtonClass}
                        >
                          {generatingKey ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Đang tạo khóa
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4" />
                              Tạo API key mới
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-5">
                        <label className={labelClass}>Webhook URL</label>
                        <input
                          type="url"
                          value={settings.webhook_url}
                          onChange={(event) => updateSetting('webhook_url', event.target.value)}
                          placeholder="https://your-app.com/webhook"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Khóa hiện hành
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {settings.api_key
                            ? `${settings.api_key.slice(0, 8)}••••${settings.api_key.slice(-4)}`
                            : 'Chưa có khóa khả dụng'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Khi tạo khóa mới, các tích hợp cũ nên được cập nhật đồng thời để tránh gián đoạn dịch vụ.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Webhook dùng cho
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Đồng bộ sự kiện như tạo tài khoản, thay đổi trạng thái tuyển dụng hoặc phát sinh cảnh báo từ nền tảng.
                        </p>
                        {settings.webhook_url ? (
                          <a
                            href={settings.webhook_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            Kiểm tra endpoint
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'ai' && (
                <SectionShell
                  title="Tính năng AI"
                  description="Quản lý các mô-đun AI đang tham gia trực tiếp vào trải nghiệm tuyển dụng và kiểm duyệt."
                  action={
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                      {enabledAiCount}/{AI_FEATURES.length} đang bật
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950">Điều phối AI theo nghiệp vụ</p>
                            <p className="text-sm leading-6 text-slate-500">
                              Các thay đổi sẽ có hiệu lực sau khi lưu toàn bộ cài đặt. Một số dịch vụ có thể cần khởi động lại.
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {enabledAiCount === AI_FEATURES.length ? 'Tất cả mô-đun đang hoạt động' : 'Có thể bật/tắt linh hoạt'}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                      <div className="divide-y divide-slate-200">
                        {AI_FEATURES.map((feature) => (
                          <div key={feature.key} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${feature.color}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-950">{feature.label}</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{feature.desc}</p>
                              </div>
                            </div>

                            <label className="relative ml-auto inline-flex shrink-0 cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={isEnabled(settings[feature.key], true)}
                                onChange={(event) => updateSetting(feature.key, event.target.checked)}
                                className="peer sr-only"
                              />
                              <div className="relative h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500">
                                <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'chatbot' && (
                <SectionShell
                  title="Cấu hình Chatbot AI"
                  description="Quản lý mẫu lệnh, hạn mức người dùng và các thông số vận hành chatbot."
                >
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Mẫu lệnh & hạn mức</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Quản lý mẫu lệnh tại tab <strong>Chatbot AI</strong> trong thanh điều hướng. Mỗi mẫu có thể bật/tắt và chỉnh sửa trực tiếp.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Hạn mức mặc định
                        </p>
                        <p className="mt-3 text-3xl font-bold text-slate-950">50</p>
                        <p className="mt-1 text-sm text-slate-500">tin nhắn / ngày / người dùng</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Phản hồi luồng
                        </p>
                        <p className="mt-3 text-3xl font-bold text-emerald-600">Bật</p>
                        <p className="mt-1 text-sm text-slate-500">Phản hồi theo từng phần</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Tóm tắt tự động
                        </p>
                        <p className="mt-3 text-3xl font-bold text-slate-950">12+</p>
                        <p className="mt-1 text-sm text-slate-500">tin nhắn sẽ kích hoạt tóm tắt tự động</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                      <p className="text-sm font-semibold text-indigo-800">Điều hướng nhanh</p>
                      <ul className="mt-2 space-y-1 text-sm text-indigo-700">
                        <li>• <strong>Quản lý mẫu lệnh:</strong> Đi tới <strong>Chatbot AI</strong> trong thanh điều hướng → tab quản lý mẫu lệnh</li>
                        <li>• <strong>Hội thoại:</strong> Giám sát hội thoại tại tab hội thoại</li>
                        <li>• <strong>Phân tích:</strong> Xem phân tích tại tab phân tích</li>
                        <li>• <strong>Cấu hình:</strong> Cấu hình mô hình và nhiệt độ phản hồi tại tab cấu hình</li>
                      </ul>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'catalog' && (
                <SectionShell
                  title="Danh mục tính năng"
                  description="Biên tập phần giới thiệu năng lực dùng cho trang công khai và các khu vực giới thiệu tính năng trong hệ sinh thái dự án."
                  action={
                    <>
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-semibold',
                          isEnabled(settings.feature_catalog_enabled, true)
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        )}
                      >
                        {isEnabled(settings.feature_catalog_enabled, true) ? 'Danh mục công khai đang bật' : 'Danh mục công khai đang tắt'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {governanceSignalsCount} tín hiệu quản trị
                      </span>
                    </>
                  }
                >
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                      <ToggleRow
                        label="Bật danh mục tính năng công khai"
                        description="Tắt mục này để giao diện quay về dữ liệu mặc định trong mã nguồn mà không xóa cấu hình hiện tại."
                        checked={isEnabled(settings.feature_catalog_enabled, true)}
                        onChange={() =>
                          updateSetting(
                            'feature_catalog_enabled',
                            !isEnabled(settings.feature_catalog_enabled, true)
                          )
                        }
                        badge={isEnabled(settings.feature_catalog_enabled, true) ? 'Đang dùng cài đặt' : 'Dùng mã dự phòng'}
                      />
                    </div>

                    {catalogError ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {catalogError}
                      </div>
                    ) : null}

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">Nhóm vai trò</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Nhóm chức năng chính cho quản trị viên, nhà tuyển dụng và ứng viên trên trang giới thiệu.
                          </p>
                        </div>
                        <button type="button" onClick={addRoleGroup} className={secondaryButtonClass}>
                          <Plus className="h-4 w-4" />
                          Thêm nhóm
                        </button>
                      </div>

                      <div className="space-y-4">
                        {featureCatalog.roleGroups.map((group, index) => (
                          <div
                            key={`${group.id}-${index}`}
                            className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-4"
                          >
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Nhóm vai trò {index + 1}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                  {group.title || 'Nhóm chưa đặt tên'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRoleGroup(index)}
                                className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>ID</label>
                                <input
                                  type="text"
                                  value={group.id}
                                  onChange={(event) => updateRoleGroup(index, 'id', event.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Nhãn phụ</label>
                                <input
                                  type="text"
                                  value={group.eyebrow}
                                  onChange={(event) => updateRoleGroup(index, 'eyebrow', event.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className={labelClass}>Tiêu đề</label>
                              <input
                                type="text"
                                value={group.title}
                                onChange={(event) => updateRoleGroup(index, 'title', event.target.value)}
                                className={inputClass}
                              />
                            </div>

                            <div className="mt-4">
                              <label className={labelClass}>Mô tả ngắn</label>
                              <textarea
                                rows={2}
                                value={group.summary}
                                onChange={(event) => updateRoleGroup(index, 'summary', event.target.value)}
                                className={`${inputClass} resize-none`}
                              />
                            </div>

                            <div className="mt-4">
                              <label className={labelClass}>Các ý chính, mỗi dòng một mục</label>
                              <textarea
                                rows={4}
                                value={group.items.join('\n')}
                                onChange={(event) => updateRoleItems(index, event.target.value)}
                                className={`${inputClass} resize-y`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">Công cụ công khai</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Những công cụ AI hoặc trang giới thiệu chia sẻ cho người dùng công khai.
                          </p>
                        </div>
                        <button type="button" onClick={addPublicTool} className={secondaryButtonClass}>
                          <Plus className="h-4 w-4" />
                          Thêm công cụ
                        </button>
                      </div>

                      <div className="space-y-4">
                        {featureCatalog.publicTools.map((tool, index) => (
                          <div
                            key={`${tool.id}-${index}`}
                            className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-4"
                          >
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Công cụ công khai {index + 1}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950">
                                  {tool.title || 'Công cụ chưa đặt tên'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePublicTool(index)}
                                className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>ID</label>
                                <input
                                  type="text"
                                  value={tool.id}
                                  onChange={(event) => updatePublicTool(index, 'id', event.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Đường dẫn</label>
                                <input
                                  type="text"
                                  value={tool.path}
                                  onChange={(event) => updatePublicTool(index, 'path', event.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className={labelClass}>Tiêu đề</label>
                              <input
                                type="text"
                                value={tool.title}
                                onChange={(event) => updatePublicTool(index, 'title', event.target.value)}
                                className={inputClass}
                              />
                            </div>

                            <div className="mt-4">
                              <label className={labelClass}>Mô tả</label>
                              <textarea
                                rows={2}
                                value={tool.description}
                                onChange={(event) =>
                                  updatePublicTool(index, 'description', event.target.value)
                                }
                                className={`${inputClass} resize-none`}
                              />
                            </div>

                            <div className="mt-4">
                              <ToggleRow
                                label="Hiển thị công cụ này"
                                description="Ẩn khỏi trang công khai nhưng vẫn giữ cấu hình bên trong danh mục."
                                checked={tool.enabled !== false}
                                onChange={() =>
                                  updatePublicTool(index, 'enabled', tool.enabled === false)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">Tín hiệu quản trị</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Các điểm nhấn quản trị và vận hành xuất hiện trong phần giới thiệu năng lực.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addGovernanceSignal}
                          className={secondaryButtonClass}
                        >
                          <Plus className="h-4 w-4" />
                          Thêm tín hiệu
                        </button>
                      </div>

                      <div className="space-y-3">
                        {featureCatalog.governanceSignals.map((signal, index) => (
                          <div
                            key={`signal-${index}`}
                            className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-2"
                          >
                            <input
                              type="text"
                              value={signal}
                              onChange={(event) => updateGovernanceSignal(index, event.target.value)}
                              className={`${inputClass} min-w-[240px] flex-1`}
                            />
                            <button
                              type="button"
                              onClick={() => removeGovernanceSignal(index)}
                              className="inline-flex items-center gap-1 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-500">
                        Dữ liệu từ biểu mẫu này sẽ được lưu dưới dạng JSON trong cài đặt hệ thống để giao diện và cổng dịch vụ dùng chung.
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {settingsTab === 'backup' && (
                <SectionShell
                  title="Sao lưu & khôi phục"
                  description="Tạo tệp sao lưu hệ thống hoặc khôi phục từ một bản JSON hiện có khi cần quay lui hoặc chuyển môi trường."
                  action={
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      Dùng cùng bộ cài đặt hiện tại
                    </span>
                  }
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleBackup}
                      className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                        <Download className="h-5 w-5 transition group-hover:-translate-y-0.5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-950">Tạo bản sao lưu</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Tải xuống toàn bộ dữ liệu cấu hình hệ thống ở định dạng JSON để lưu trữ hoặc chuyển môi trường.
                      </p>
                    </button>

                    <label className="group cursor-pointer rounded-[24px] border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100">
                        <Upload className="h-5 w-5 transition group-hover:-translate-y-0.5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-950">Khôi phục dữ liệu</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Nạp lại dữ liệu từ tệp sao lưu JSON. Hành động này sẽ ghi đè dữ liệu hệ thống hiện tại sau bước xác nhận.
                      </p>
                      <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
                    <p className="text-sm font-semibold text-amber-800">Lưu ý vận hành</p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Nên tạo bản sao lưu trước mọi thay đổi lớn đối với quyền truy cập, danh mục tính năng hoặc tích hợp bên ngoài để có thể quay lui nhanh nếu cần.
                    </p>
                  </div>
                </SectionShell>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
