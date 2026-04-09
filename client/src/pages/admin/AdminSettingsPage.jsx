import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Download,
  Upload,
  Mail,
  Globe,
  Shield,
  Plus,
  Trash2,
  Search,
  Copy,
  ExternalLink,
  Palette,
  Image,
  Activity,
} from 'lucide-react';
import adminService from '../../services/adminService';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { fallbackFeatureCatalog } from '../../data/featureCatalog';

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
    desc: 'AI chấm điểm và đề xuất cải thiện CV cho ứng viên.',
    color: 'bg-secondary',
  },
  {
    key: 'ai_job_matching',
    label: 'Ghép việc làm thông minh',
    desc: 'AI xếp hạng và gợi ý việc làm phù hợp dựa trên kỹ năng.',
    color: 'bg-emerald-500',
  },
  {
    key: 'ai_moderation',
    label: 'Kiểm duyệt tin tuyển dụng bằng AI',
    desc: 'Tự động phát hiện nội dung lừa đảo hoặc không phù hợp.',
    color: 'bg-amber-500',
  },
  {
    key: 'ai_career_roadmap',
    label: 'Lộ trình nghề nghiệp AI',
    desc: 'Tạo kế hoạch phát triển sự nghiệp cá nhân hóa cho ứng viên.',
    color: 'bg-accent',
  },
];

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

const normalizeCatalog = (catalog) => ({
  roleGroups: Array.isArray(catalog?.roleGroups)
    ? catalog.roleGroups.map(normalizeRoleGroup)
    : cloneCatalog(fallbackFeatureCatalog.roleGroups).map(normalizeRoleGroup),
  publicTools: Array.isArray(catalog?.publicTools)
    ? catalog.publicTools.map(normalizePublicTool)
    : cloneCatalog(fallbackFeatureCatalog.publicTools).map(normalizePublicTool),
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
      error: 'JSON catalog không hợp lệ. Hệ thống đang dùng cấu hình mặc định để chỉnh sửa.',
    };
  }
};

const AdminSettingsPage = () => {
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    contact_email: '',
    support_email: '',
    maintenance_mode: false,
    allow_registration: true,
    default_language: 'vi',
    feature_catalog_enabled: true,
    feature_catalog_payload: '',
    primary_color: '#10B981',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_password: '',
    two_factor_enabled: true,
    password_policy: 'strong',
    api_key: '',
    webhook_url: '',
  });
  const [settingsTab, setSettingsTab] = useState('branding');
  const [searchSettings, setSearchSettings] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [featureCatalog, setFeatureCatalog] = useState(() =>
    normalizeCatalog(fallbackFeatureCatalog)
  );
  const [catalogError, setCatalogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const _governanceModules = [
    {
      title: 'Cấu hình nền tảng',
      description:
        'Quản lý tên hệ thống, ngôn ngữ và thông tin mô tả để các module frontend vận hành đồng nhất.',
    },
    {
      title: 'Bảo mật và backup',
      description:
        'Kiểm soát maintenance mode, đăng ký mới và quy trình sao lưu phục hồi khi có sự cố.',
    },
    {
      title: 'Feature flag AI',
      description:
        'Bật tắt chatbot, roadmap, matching và moderation theo mức độ sẵn sàng của hệ thống.',
    },
    {
      title: 'Feature catalog',
      description:
        'Điều khiển nội dung feature catalog trên landing (capability showcase) từ khu vực quản trị.',
    },
  ];

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettings();
      if (response.data.success) {
        const parsedCatalog = parseCatalogPayload(response.data.data?.feature_catalog_payload);
        setFeatureCatalog(parsedCatalog.catalog);
        setCatalogError(parsedCatalog.error);
        setSettings((current) => ({
          ...current,
          ...response.data.data,
          feature_catalog_payload: serializeCatalog(parsedCatalog.catalog),
        }));
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      showNotification('Đã lưu cài đặt thành công!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Có lỗi xảy ra khi lưu cài đặt.', 'error');
    } finally {
      setSaving(false);
    }
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
      return;
    }

    try {
      const formData = new FormData();
      formData.append('backup', file);
      await adminService.restore(formData);
      showNotification('Khôi phục dữ liệu thành công!', 'success');
    } catch (error) {
      console.error('Error restoring data:', error);
      showNotification('Có lỗi xảy ra khi khôi phục dữ liệu.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
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
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Cấu hình hệ thống</h1>
          <div className="relative max-w-xs flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm cài đặt..."
              value={searchSettings}
              onChange={(e) => setSearchSettings(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">Cài đặt chung</h2>
            <p className="text-base text-slate-500 mt-1">
              Quản lý các thông số cốt lõi, bảo mật và kết nối API cho nền tảng của bạn.
            </p>
          </div>
          <div className="flex border-b border-slate-200 bg-white">
            {[
              { id: 'branding', label: 'Thương hiệu', icon: Palette },
              { id: 'email', label: 'Email SMTP', icon: Mail },
              { id: 'security', label: 'Bảo mật', icon: Shield },
              { id: 'api', label: 'Tích hợp API', icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSettingsTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-base font-semibold border-b-2 transition-all ${
                    settingsTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-foreground'
                  }`}
                >
                  {settingsTab === tab.id && <span className="text-emerald-400">✓</span>}
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-5">
            <div className="lg:col-span-2 space-y-5">
              {settingsTab === 'branding' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-3">
                      Nhận diện thương hiệu
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                        <Image className="mx-auto text-slate-500 mb-2" size={28} />
                        <p className="text-base text-slate-500">Logo nền sáng (SVG, PNG)</p>
                      </div>
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                        <Image className="mx-auto text-slate-500 mb-2" size={28} />
                        <p className="text-base text-slate-500">Logo nền tối (SVG, PNG)</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-base font-medium text-slate-600">Màu chủ đạo</label>
                      <input
                        type="text"
                        value={settings.primary_color || '#10B981'}
                        onChange={(e) => updateSetting('primary_color', e.target.value)}
                        className={`${inputClass} w-32`}
                      />
                      <div
                        className="h-9 w-9 rounded-lg border border-slate-200"
                        style={{ backgroundColor: settings.primary_color || '#10B981' }}
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-base font-medium text-slate-600 mb-2">
                        Tên hiển thị
                      </label>
                      <input
                        type="text"
                        value={settings.site_name}
                        onChange={(e) => updateSetting('site_name', e.target.value)}
                        className={inputClass}
                        placeholder="Tuyển dụng AI Pro"
                      />
                    </div>
                  </div>
                </>
              )}
              {settingsTab === 'email' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900">Cấu hình Email SMTP</h3>
                    <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-base font-bold text-emerald-400">
                      ĐÃ KẾT NỐI
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={settings.smtp_host}
                        onChange={(e) => updateSetting('smtp_host', e.target.value)}
                        className={inputClass}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                        Cổng (Port)
                      </label>
                      <input
                        type="text"
                        value={settings.smtp_port}
                        onChange={(e) => updateSetting('smtp_port', e.target.value)}
                        className={inputClass}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                        Email gửi
                      </label>
                      <input
                        type="email"
                        value={settings.contact_email}
                        onChange={(e) => updateSetting('contact_email', e.target.value)}
                        className={inputClass}
                        placeholder="noreply@domain.com"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                        Mật khẩu ứng dụng
                      </label>
                      <input
                        type="password"
                        value={settings.smtp_password}
                        onChange={(e) => updateSetting('smtp_password', e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setSmtpTesting(true);
                          try {
                            await adminService.testSmtp({
                              host: settings.smtp_host,
                              port: settings.smtp_port,
                              email: settings.contact_email,
                              password: settings.smtp_password,
                            });
                            showNotification('Kết nối SMTP thành công!', 'success');
                          } catch {
                            showNotification(
                              'Kết nối SMTP thất bại. Vui lòng kiểm tra lại.',
                              'error'
                            );
                          } finally {
                            setSmtpTesting(false);
                          }
                        }}
                        disabled={smtpTesting}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55 disabled:opacity-50"
                      >
                        {smtpTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        Lưu cấu hình
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-medium text-slate-900">Xác thực 2 lớp (2FA)</p>
                      <p className="text-base text-slate-500">Yêu cầu mã khi đăng nhập</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled(settings.two_factor_enabled)}
                      onClick={() =>
                        updateSetting('two_factor_enabled', !isEnabled(settings.two_factor_enabled))
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${isEnabled(settings.two_factor_enabled) ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled(settings.two_factor_enabled) ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="block text-base font-semibold uppercase text-slate-500 mb-2">
                      Chính sách mật khẩu
                    </label>
                    <select
                      value={settings.password_policy}
                      onChange={(e) => updateSetting('password_policy', e.target.value)}
                      className={inputClass}
                    >
                      <option value="weak">Yếu (6+ ký tự)</option>
                      <option value="medium">Trung bình (8+ ký tự)</option>
                      <option value="strong">Mạnh (8+ ký tự, 1 số, 1 đặc biệt)</option>
                    </select>
                  </div>
                </div>
              )}
              {settingsTab === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                      API Key hiện tại
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.api_key}
                        onChange={(e) => updateSetting('api_key', e.target.value)}
                        placeholder="••••••••••••••••"
                        className={inputClass}
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (settings.api_key) {
                            navigator.clipboard.writeText(settings.api_key);
                            showNotification('Đã sao chép API Key!', 'success');
                          }
                        }}
                        disabled={!settings.api_key}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-foreground disabled:opacity-50"
                        title="Sao chép"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold uppercase text-slate-500 mb-1">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.webhook_url}
                      onChange={(e) => updateSetting('webhook_url', e.target.value)}
                      placeholder="https://your-app.com/webhook"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await adminService.generateApiKey();
                        const newKey = response.data?.data?.api_key;
                        if (newKey) {
                          updateSetting('api_key', newKey);
                          showNotification('Đã tạo API Key mới!', 'success');
                        }
                      } catch {
                        showNotification('Không thể tạo API Key mới.', 'error');
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55"
                  >
                    Tạo API Key mới
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-bold text-slate-900 mb-3">Bảo mật tài khoản</h3>
                <div className="flex items-center justify-between py-2">
                  <span className="text-base text-slate-600">Xác thực 2 lớp (2FA)</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled(settings.two_factor_enabled)}
                    onClick={() =>
                      updateSetting('two_factor_enabled', !isEnabled(settings.two_factor_enabled))
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${isEnabled(settings.two_factor_enabled) ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled(settings.two_factor_enabled) ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                <div className="pt-2">
                  <label className="block text-base text-slate-500 mb-1">Chính sách mật khẩu</label>
                  <select
                    value={settings.password_policy}
                    onChange={(e) => updateSetting('password_policy', e.target.value)}
                    className={`${inputClass} text-base`}
                  >
                    <option value="weak">Yếu (6+ ký tự)</option>
                    <option value="medium">Trung bình (8+ ký tự)</option>
                    <option value="strong">Mạnh (8+ ký tự, 1 số, 1 đặc biệt)</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-bold text-slate-900 mb-3">Tích hợp API</h3>
                <p className="text-base text-slate-500 mb-2">API Key & Webhook</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await adminService.generateApiKey();
                      const newKey = response.data?.data?.api_key;
                      if (newKey) {
                        updateSetting('api_key', newKey);
                        showNotification('Đã tạo API Key mới!', 'success');
                      }
                    } catch {
                      showNotification('Không thể tạo API Key mới.', 'error');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 text-base font-semibold text-slate-900 hover:bg-muted/55"
                >
                  Tạo API Key mới
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">Cần hỗ trợ?</h3>
                <p className="text-base text-slate-500 mb-3">
                  Xem tài liệu hướng dẫn chi tiết về cấu hình hệ thống AI cho doanh nghiệp của bạn.
                </p>
                <a
                  href="#docs"
                  className="inline-flex items-center gap-2 text-base font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <ExternalLink size={16} /> Tài liệu API
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-base font-semibold text-slate-900 hover:bg-muted/55"
          >
            Hủy thay đổi
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Save size={18} /> Lưu tất cả cài đặt
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Shield className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bảo mật và truy cập</h2>
              <p className="text-base text-slate-500">
                Kiểm soát chế độ bảo trì và quyền đăng ký tài khoản.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h3 className="font-semibold text-slate-900">Chế độ bảo trì</h3>
                <p className="mt-1 text-base text-slate-500">
                  Tạm khóa truy cập website cho người dùng.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled(settings.maintenance_mode)}
                onClick={() =>
                  updateSetting('maintenance_mode', !isEnabled(settings.maintenance_mode))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${isEnabled(settings.maintenance_mode) ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span
                  className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled(settings.maintenance_mode) ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <h3 className="font-semibold text-slate-900">Cho phép đăng ký</h3>
                <p className="mt-1 text-base text-slate-500">
                  Người dùng có thể tự đăng ký tài khoản mới.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled(settings.allow_registration, true)}
                onClick={() =>
                  updateSetting('allow_registration', !isEnabled(settings.allow_registration, true))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${isEnabled(settings.allow_registration, true) ? 'bg-emerald-500' : 'bg-slate-600'}`}
              >
                <span
                  className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled(settings.allow_registration, true) ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">Sao lưu và khôi phục</h2>
            <p className="mt-1 text-base font-medium text-slate-500">
              Tạo bản sao lưu và khôi phục dữ liệu hệ thống khi cần.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                onClick={handleBackup}
                className="group rounded-xl border-2 border-slate-200 p-6 text-left transition-colors duration-200 ease-out hover:border-emerald-500 hover:bg-primary/10"
              >
                <Download
                  className="mb-3 text-emerald-500 transition-transform group-hover:scale-110"
                  size={32}
                />
                <h3 className="mb-2 font-bold text-slate-900">Tạo bản sao lưu</h3>
                <p className="text-base font-medium text-slate-500">
                  Tải xuống bản sao lưu dữ liệu hệ thống.
                </p>
              </button>

              <label className="group cursor-pointer rounded-xl border-2 border-slate-200 p-6 transition-colors duration-200 ease-out hover:border-emerald-500 hover:bg-primary/10">
                <Upload
                  className="mb-3 text-emerald-500 transition-transform group-hover:scale-110"
                  size={32}
                />
                <h3 className="mb-2 font-bold text-slate-900">Khôi phục dữ liệu</h3>
                <p className="text-base font-medium text-slate-500">
                  Khôi phục dữ liệu từ tệp sao lưu đang có.
                </p>
                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="text-emerald-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cấu hình tính năng AI</h2>
              <p className="text-base font-medium text-slate-500">
                Bật tắt các tính năng trí tuệ nhân tạo được điều khiển tại trang này.
              </p>
            </div>
          </div>
          <div className="space-y-3 p-6">
            {AI_FEATURES.map((feature) => (
              <div
                key={feature.key}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-emerald-500/30"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${feature.color}`} />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{feature.label}</h3>
                    <p className="mt-0.5 max-w-md text-base font-medium text-slate-500">
                      {feature.desc}
                    </p>
                  </div>
                </div>
                <label className="relative ml-4 inline-flex shrink-0 cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isEnabled(settings[feature.key], true)}
                    onChange={(event) => updateSetting(feature.key, event.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 transition-colors">
                    <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
            ))}
            <p className="pt-2 text-base font-medium text-slate-500">
              Thay đổi sẽ có hiệu lực sau khi nhấn "Lưu thay đổi". Một số tính năng có thể cần khởi
              động lại dịch vụ.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Globe className="text-emerald-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Feature catalog</h2>
              <p className="text-base font-medium text-slate-500">
                Quản lý nội dung động cho trang tính năng và phần giới thiệu capability ở trang chủ.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="bg-slate-50 border border-slate-200 flex items-center justify-between rounded-xl p-4">
              <div>
                <h3 className="font-bold text-slate-900">Bật public feature catalog</h3>
                <p className="mt-1 text-base font-medium text-slate-500">
                  Tắt mục này để frontend quay về dữ liệu mặc định trong mã nguồn.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isEnabled(settings.feature_catalog_enabled, true)}
                  onChange={(event) =>
                    updateSetting('feature_catalog_enabled', event.target.checked)
                  }
                  className="peer sr-only"
                />
                <div className="relative h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 transition-colors">
                  <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>

            {catalogError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-base font-medium text-slate-900">
                {catalogError}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Role groups</h3>
                  <p className="text-base font-medium text-slate-500">
                    Nhóm chức năng chính cho admin, employer và candidate trên trang giới thiệu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRoleGroup}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-base font-bold text-slate-900 transition-colors hover:border-emerald-500 hover:bg-primary/10"
                >
                  <Plus size={16} />
                  Thêm nhóm
                </button>
              </div>

              {featureCatalog.roleGroups.map((group, index) => (
                <div
                  key={`${group.id}-${index}`}
                  className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold uppercase tracking-[0.2em] text-slate-500">
                        Role group {index + 1}
                      </p>
                      <h4 className="mt-1 text-base font-black text-foreground">
                        {group.title || 'Nhóm chưa đặt tên'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRoleGroup(index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 px-3 py-2 text-base font-bold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-base font-bold text-foreground">ID</label>
                      <input
                        type="text"
                        value={group.id}
                        onChange={(event) => updateRoleGroup(index, 'id', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-base font-bold text-foreground">
                        Eyebrow
                      </label>
                      <input
                        type="text"
                        value={group.eyebrow}
                        onChange={(event) => updateRoleGroup(index, 'eyebrow', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-bold text-foreground">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={group.title}
                      onChange={(event) => updateRoleGroup(index, 'title', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-bold text-foreground">
                      Mô tả ngắn
                    </label>
                    <textarea
                      rows={3}
                      value={group.summary}
                      onChange={(event) => updateRoleGroup(index, 'summary', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-bold text-foreground">
                      Danh sách ý chính, mỗi dòng một mục
                    </label>
                    <textarea
                      rows={4}
                      value={group.items.join('\n')}
                      onChange={(event) => updateRoleItems(index, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Public tools</h3>
                  <p className="text-base font-medium text-slate-500">
                    Công cụ AI hoặc landing page chia sẻ cho người dùng public.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPublicTool}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-base font-bold text-slate-900 transition-colors hover:border-emerald-500 hover:bg-primary/10"
                >
                  <Plus size={16} />
                  Thêm tool
                </button>
              </div>

              {featureCatalog.publicTools.map((tool, index) => (
                <div
                  key={`${tool.id}-${index}`}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold uppercase tracking-[0.2em] text-slate-500">
                        Public tool {index + 1}
                      </p>
                      <h4 className="mt-1 text-base font-bold text-slate-900">
                        {tool.title || 'Công cụ chưa đặt tên'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePublicTool(index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-base font-bold text-red-500 transition-colors hover:bg-destructive/100/10"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-base font-bold text-slate-900">ID</label>
                      <input
                        type="text"
                        value={tool.id}
                        onChange={(event) => updatePublicTool(index, 'id', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-base font-bold text-slate-900">Path</label>
                      <input
                        type="text"
                        value={tool.path}
                        onChange={(event) => updatePublicTool(index, 'path', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-bold text-slate-900">Tiêu đề</label>
                    <input
                      type="text"
                      value={tool.title}
                      onChange={(event) => updatePublicTool(index, 'title', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-bold text-slate-900">Mô tả</label>
                    <textarea
                      rows={3}
                      value={tool.description}
                      onChange={(event) =>
                        updatePublicTool(index, 'description', event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 flex items-center justify-between rounded-xl p-4">
                    <div>
                      <h5 className="font-bold text-slate-900">Hiển thị công cụ này</h5>
                      <p className="mt-1 text-base font-medium text-slate-500">
                        Ẩn khỏi trang public nhưng vẫn giữ cấu hình trong catalog.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={tool.enabled !== false}
                        onChange={(event) =>
                          updatePublicTool(index, 'enabled', event.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="relative h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 transition-colors">
                        <span className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Governance signals</h3>
                  <p className="text-base font-medium text-slate-500">
                    Các điểm nhấn quản trị và vận hành xuất hiện trong capability showcase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addGovernanceSignal}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-base font-bold text-slate-900 transition-colors hover:border-emerald-500 hover:bg-primary/10"
                >
                  <Plus size={16} />
                  Thêm signal
                </button>
              </div>

              <div className="space-y-3">
                {featureCatalog.governanceSignals.map((signal, index) => (
                  <div
                    key={`signal-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <input
                      type="text"
                      value={signal}
                      onChange={(event) => updateGovernanceSignal(index, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeGovernanceSignal(index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-base font-bold text-red-500 transition-colors hover:bg-destructive/100/10"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-base font-medium text-slate-500">
                Dữ liệu từ form này sẽ được lưu lại dưới dạng JSON trong system settings để frontend
                và gateway dùng chung.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
