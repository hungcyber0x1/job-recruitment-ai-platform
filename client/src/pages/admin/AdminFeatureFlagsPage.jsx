import React, { useCallback, useEffect, useState } from 'react';
import { Search, Save, LoaderCircle, Sparkles, Globe, LayoutDashboard, Moon } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const toBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const BETA_FEATURES = [
  {
    key: 'ai_resume_analysis',
    label: 'Trình đánh giá CV bằng AI',
    desc: 'Tự động phân tích và xếp hạng hồ sơ ứng viên dựa trên JD.',
    tier: 'EP',
    isNew: true,
  },
  {
    key: 'realtime_collab',
    label: 'Phối hợp thời gian thực',
    desc: 'Cho phép nhiều thành viên cùng đánh giá ứng viên đồng thời.',
    tier: null,
    isNew: false,
  },
];

const UI_FEATURES = [
  { key: 'default_dark_mode', label: 'Mặc định Chế độ tối', icon: Moon },
  { key: 'compact_dashboard', label: 'Bảng điều khiển rút gọn', icon: LayoutDashboard },
];

const TIER_FEATURES = [
  {
    key: 'ai_screening_enabled',
    label: 'Lọc ứng viên AI',
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    key: 'auto_email',
    label: 'Gửi email tự động',
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    key: 'video_analysis',
    label: 'Phân tích Video phỏng vấn',
    basic: false,
    professional: false,
    enterprise: true,
  },
  {
    key: 'api_extended',
    label: 'Tích hợp API mở rộng',
    basic: false,
    professional: false,
    enterprise: true,
  },
];

const DEFAULT_FLAGS = [
  { key: 'ai_chatbot', defaultValue: true },
  { key: 'ai_resume_analysis', defaultValue: true },
  { key: 'ai_job_matching', defaultValue: true },
  { key: 'ai_moderation', defaultValue: true },
  { key: 'ai_career_roadmap', defaultValue: true },
  { key: 'ai_screening_enabled', defaultValue: true },
  { key: 'company_moderation_required', defaultValue: true },
  { key: 'experimental_analytics_cards', defaultValue: false },
  { key: 'default_dark_mode', defaultValue: true },
  { key: 'compact_dashboard', defaultValue: false },
  { key: 'realtime_collab', defaultValue: false },
];

const AdminFeatureFlagsPage = () => {
  const { showNotification } = useNotification();
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [searchFeature, setSearchFeature] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettings();
      if (response.data?.success) {
        setSettingsMap(response.data.data || {});
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
      showNotification('Không thể tải cấu hình tính năng.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getEnabled = (key, fallback = false) => {
    const def = DEFAULT_FLAGS.find((f) => f.key === key)?.defaultValue ?? fallback;
    return toBoolean(settingsMap[key], def);
  };

  const toggleFlag = async (key, enabled) => {
    const nextValue = (!enabled).toString();
    try {
      setSavingKey(key);
      await adminService.updateSettings({ [key]: nextValue });
      setSettingsMap((current) => ({ ...current, [key]: nextValue }));
      showNotification('Đã cập nhật tính năng.', 'success');
    } catch (error) {
      console.error('Error updating feature flag:', error);
      showNotification('Không thể cập nhật tính năng.', 'error');
    } finally {
      setSavingKey('');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await adminService.updateSettings(settingsMap);
      showNotification('Đã lưu thay đổi.', 'success');
    } catch {
      showNotification('Không thể lưu cấu hình.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-500">Feature Flags (Cờ tính năng)</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Cấu hình Tính năng</h1>
            <p className="text-base text-slate-500 mt-1">
              Bật/tắt các module hệ thống và phân quyền truy cập theo cấp độ tài khoản người dùng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kiếm tính năng..."
                value={searchFeature}
                onChange={(e) => setSearchFeature(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={loading || saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-base font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Beta features */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
            <Sparkles size={20} className="text-emerald-400" />
            Tính năng thử nghiệm (Beta)
          </h2>
          <div className="space-y-4">
            {BETA_FEATURES.map((f) => {
              const enabled = getEnabled(f.key, f.key === 'realtime_collab' ? false : true);
              const isSaving = savingKey === f.key;
              return (
                <div
                  key={f.key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{f.label}</h3>
                      {f.isNew && (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-base font-bold text-emerald-400">
                          MỚI
                        </span>
                      )}
                      {f.tier && (
                        <span className="text-base font-semibold uppercase text-slate-500">
                          PHÂN QUYỀN · {f.tier}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-base text-slate-500">{f.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={loading || isSaving}
                    onClick={() => toggleFlag(f.key, enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                      enabled ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* UI & Experience */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
            <Globe size={20} className="text-primary" />
            Giao diện & Trải nghiệm
          </h2>
          <div className="space-y-3">
            {UI_FEATURES.map((f) => {
              const Icon = f.icon;
              const enabled = getEnabled(f.key, f.key === 'default_dark_mode');
              const isSaving = savingKey === f.key;
              return (
                <div
                  key={f.key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-slate-500" />
                    <span className="font-medium text-slate-900">{f.label}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={loading || isSaving}
                    onClick={() => toggleFlag(f.key, enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier table */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân quyền theo Tier</h2>
              <p className="text-base text-slate-500 mt-0.5">
                Cấu hình các tính năng khả dụng dựa trên cấp độ gói dịch vụ.
              </p>
            </div>
            <a
              href="#plans"
              className="text-base font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Quản lý Gói
            </a>
          </div>
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">Tính năng</th>
                  <th className="px-4 py-3 text-center">Basic</th>
                  <th className="px-4 py-3 text-center">Professional</th>
                  <th className="px-4 py-3 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((row) => (
                  <tr key={row.key}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {row.basic ? '✔' : '✕'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {row.professional ? '✔' : '✕'}
                    </td>
                    <td className="px-4 py-3 text-center text-emerald-400">
                      {row.enterprise ? '✔' : '✕'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeatureFlagsPage;
