import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Cpu,
  LayoutDashboard,
  Loader2,
  Monitor,
  Moon,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const CORE_FEATURES = [
  {
    key: 'ai_chatbot',
    label: 'Chatbot AI công khai',
    desc: 'Cho phép trợ lý AI hoạt động ở các khu vực hỗ trợ ứng viên và người dùng public.',
    badge: 'AI support',
  },
  {
    key: 'ai_moderation',
    label: 'Kiểm duyệt AI',
    desc: 'Bật lớp phát hiện nội dung không phù hợp và cảnh báo rủi ro cho tin tuyển dụng.',
    badge: 'Moderation',
  },
  {
    key: 'company_moderation_required',
    label: 'Duyệt doanh nghiệp bắt buộc',
    desc: 'Chặn doanh nghiệp chưa kiểm duyệt khỏi các luồng đăng tin và hiển thị công khai.',
    badge: 'Governance',
  },
  {
    key: 'experimental_analytics_cards',
    label: 'Analytics cards thử nghiệm',
    desc: 'Kích hoạt các block analytics đang trong giai đoạn thử nghiệm nội bộ.',
    badge: 'Internal',
  },
];

const BETA_FEATURES = [
  {
    key: 'ai_resume_analysis',
    label: 'Trình đánh giá CV bằng AI',
    desc: 'Tự động phân tích và xếp hạng hồ sơ ứng viên dựa trên JD.',
    tier: 'Tier request',
    isNew: true,
  },
  {
    key: 'realtime_collab',
    label: 'Phối hợp thời gian thực',
    desc: 'Cho phép nhiều thành viên cùng đánh giá ứng viên đồng thời.',
    tier: 'Active for all',
    isNew: false,
  },
];

const UI_FEATURES = [
  {
    key: 'default_dark_mode',
    label: 'Mặc định chế độ tối',
    icon: Moon,
    desc: 'Tự động áp dụng theme Dark khi người dùng mới đăng ký.',
  },
  {
    key: 'compact_dashboard',
    label: 'Bảng điều khiển rút gọn',
    icon: LayoutDashboard,
    desc: 'Sử dụng giao diện tập trung cho các màn hình nhỏ.',
  },
];

const TIER_FEATURES = [
  {
    key: 'auto_email',
    label: 'Gửi email tự động',
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    key: 'video_analysis',
    label: 'Phân tích video phỏng vấn',
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
  { key: 'ai_moderation', defaultValue: true },
  { key: 'company_moderation_required', defaultValue: true },
  { key: 'experimental_analytics_cards', defaultValue: false },
  { key: 'default_dark_mode', defaultValue: true },
  { key: 'compact_dashboard', defaultValue: false },
  { key: 'realtime_collab', defaultValue: false },
  { key: 'auto_email', defaultValue: true },
  { key: 'video_analysis', defaultValue: false },
  { key: 'api_extended', defaultValue: false },
];

const ALL_FLAG_KEYS = Array.from(
  new Set([
    ...DEFAULT_FLAGS.map((item) => item.key),
    ...CORE_FEATURES.map((item) => item.key),
    ...BETA_FEATURES.map((item) => item.key),
    ...UI_FEATURES.map((item) => item.key),
    ...TIER_FEATURES.map((item) => item.key),
  ])
);

const getDefaultValue = (key) =>
  DEFAULT_FLAGS.find((item) => item.key === key)?.defaultValue ?? false;

const FLAG_LABELS = new Map(
  [...CORE_FEATURES, ...BETA_FEATURES, ...UI_FEATURES, ...TIER_FEATURES].map((item) => [
    item.key,
    item.label,
  ])
);

const isAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

function SummaryCard({ icon: Icon, label, value, helper, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            tones[tone] || tones.emerald
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function InlineSwitch({ enabled, saving, onClick, tone = 'emerald' }) {
  const activeClass =
    tone === 'blue'
      ? 'bg-blue-600'
      : tone === 'violet'
        ? 'bg-violet-600'
        : tone === 'amber'
          ? 'bg-amber-500'
          : 'bg-emerald-500';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        enabled ? activeClass : 'bg-slate-200',
        saving && 'cursor-not-allowed opacity-70'
      )}
    >
      {saving ? (
        <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
      ) : (
        <span
          className={cn(
            'absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      )}
    </button>
  );
}

const AdminFeatureFlagsPage = () => {
  const { showNotification } = useNotification();
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSettings = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        const response = await adminService.getSettings();
        if (response.data?.success) {
          setSettingsMap(response.data.data || {});
        }
      } catch (error) {
        if (isAuthError(error)) {
          setSettingsMap({});
          return;
        }
        console.error('Error loading feature flags:', error);
        showNotification('Không thể tải cấu hình tính năng.', 'error');
      } finally {
        if (showLoader) setLoading(false);
        else setRefreshing(false);
      }
    },
    [showNotification]
  );

  useEffect(() => {
    fetchSettings(true);
  }, [fetchSettings]);

  const getEnabled = useCallback(
    (key) => toBoolean(settingsMap[key], getDefaultValue(key)),
    [settingsMap]
  );

  const toggleFlag = useCallback(
    async (key) => {
      const currentEnabled = getEnabled(key);
      const nextValue = (!currentEnabled).toString();
      const label = FLAG_LABELS.get(key) || key;

      try {
        setSavingKey(key);
        await adminService.updateSettings({ [key]: nextValue });
        setSettingsMap((current) => ({ ...current, [key]: nextValue }));
        showNotification(`${label} đã ${!currentEnabled ? 'bật' : 'tắt'}.`, 'success');
      } catch (error) {
        console.error('Error updating feature flag:', error);
        showNotification(`Lỗi khi cập nhật ${label}.`, 'error');
      } finally {
        setSavingKey('');
      }
    },
    [getEnabled, showNotification]
  );

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(settingsMap);
      showNotification('Đã lưu toàn bộ cấu hình tính năng.', 'success');
    } catch (error) {
      console.error('Error saving feature flags:', error);
      showNotification('Lỗi khi lưu cấu hình tổng quát.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();

  const matchesSearch = useCallback(
    (label, desc, key) => {
      if (!q) return true;
      return (
        String(label).toLowerCase().includes(q) ||
        String(desc).toLowerCase().includes(q) ||
        String(key).toLowerCase().includes(q)
      );
    },
    [q]
  );

  const filteredCore = useMemo(
    () => CORE_FEATURES.filter((item) => matchesSearch(item.label, item.desc, item.key)),
    [matchesSearch]
  );
  const filteredBeta = useMemo(
    () => BETA_FEATURES.filter((item) => matchesSearch(item.label, item.desc, item.key)),
    [matchesSearch]
  );
  const filteredUI = useMemo(
    () => UI_FEATURES.filter((item) => matchesSearch(item.label, item.desc, item.key)),
    [matchesSearch]
  );
  const filteredTier = useMemo(
    () => TIER_FEATURES.filter((item) => matchesSearch(item.label, '', item.key)),
    [matchesSearch]
  );

  const totalMatches =
    filteredCore.length + filteredBeta.length + filteredUI.length + filteredTier.length;
  const hasNoResults = q && totalMatches === 0;

  const enabledFlagsCount = ALL_FLAG_KEYS.filter((key) => getEnabled(key)).length;
  const betaEnabledCount = BETA_FEATURES.filter((item) => getEnabled(item.key)).length;
  const uiEnabledCount = UI_FEATURES.filter((item) => getEnabled(item.key)).length;
  const governanceEnabledCount = CORE_FEATURES.filter((item) => getEnabled(item.key)).length;
  const rolloutCoverage = Math.round((enabledFlagsCount / ALL_FLAG_KEYS.length) * 100);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

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

        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Admin workspace
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Feature rollout
              </span>
              {q ? (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                  {totalMatches} kết quả cho "{searchQuery}"
                </span>
              ) : null}
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Feature governance</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                Cấu hình tính năng
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Quản lý toàn bộ feature flag theo đúng logic vận hành của dự án: năng lực AI cốt lõi,
                rollout thử nghiệm, hành vi giao diện và quyền truy cập theo cấp độ tài khoản.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={Cpu}
                label="Flag đang bật"
                value={`${enabledFlagsCount}/${ALL_FLAG_KEYS.length}`}
                helper="Tổng số cờ đang hoạt động trong hệ thống"
                tone="emerald"
              />
              <SummaryCard
                icon={ShieldCheck}
                label="Cốt lõi vận hành"
                value={`${governanceEnabledCount}/${CORE_FEATURES.length}`}
                helper="Các flag kiểm soát moderation, public AI và governance"
                tone="blue"
              />
              <SummaryCard
                icon={Sparkles}
                label="Thử nghiệm"
                value={`${betaEnabledCount}/${BETA_FEATURES.length}`}
                helper="Module rollout sớm đang được kích hoạt"
                tone="violet"
              />
              <SummaryCard
                icon={Monitor}
                label="Giao diện"
                value={`${uiEnabledCount}/${UI_FEATURES.length}`}
                helper="Biến thể UI đang áp dụng cho người dùng"
                tone="amber"
              />
            </div>
          </div>

          <div className="self-start rounded-[28px] border border-white/90 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Bảng điều khiển
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">Rollout health</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Các thay đổi qua toggle có hiệu lực ngay. Nút lưu giúp đồng bộ lại toàn bộ snapshot hiện tại.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Coverage
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{rolloutCoverage}%</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="sr-only" htmlFor="feature-flag-search">
                Tìm kiếm tính năng
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="feature-flag-search"
                  type="text"
                  placeholder="Tìm theo tên, mô tả hoặc key..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Trạng thái hiện tại
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {enabledFlagsCount} flag đang bật, {ALL_FLAG_KEYS.length - enabledFlagsCount} flag đang tắt
                  </p>
                </div>
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchSettings(false)}
                disabled={refreshing || saving}
                className="h-10 rounded-2xl border-slate-200 px-4"
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Làm mới
              </Button>
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || refreshing}
                className="h-10 rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-bg">
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {hasNoResults ? (
            <SectionCard
              icon={Search}
              title="Không tìm thấy kết quả"
              description="Không có feature flag nào khớp với bộ lọc hiện tại."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="rounded-2xl border-slate-200"
                >
                  Xóa tìm kiếm
                </Button>
              }
            >
              <div className="py-10 text-center">
                <p className="text-base font-semibold text-slate-900">
                  Không tìm thấy tính năng nào phù hợp với "{searchQuery}"
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hãy thử tìm theo key ngắn hơn hoặc xóa bộ lọc để xem toàn bộ feature flag.
                </p>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-6">
              {(filteredCore.length > 0 || filteredBeta.length > 0 || filteredUI.length > 0 || !q) && (
                <SectionCard
                  icon={Sparkles}
                  title="Bản đồ rollout"
                  description="Gom feature flag theo 3 nhóm vận hành rõ ràng: cốt lõi hệ thống, module thử nghiệm và hành vi giao diện."
                  action={
                    <>
                      <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Instant apply
                      </Badge>
                      <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {totalMatches} nhóm hiển thị
                      </Badge>
                    </>
                  }
                >
                  <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                      {(filteredCore.length > 0 || !q) && (
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                          <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Cốt lõi vận hành
                              </p>
                              <h3 className="mt-1 text-base font-bold text-slate-950">
                                AI, moderation và kiểm soát hệ thống
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                Đây là nhóm ảnh hưởng trực tiếp đến trải nghiệm chính và lớp quản trị rủi ro của nền tảng.
                              </p>
                            </div>
                            <Badge className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {CORE_FEATURES.filter((item) => getEnabled(item.key)).length}/{CORE_FEATURES.length} bật
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {(q ? filteredCore : CORE_FEATURES).map((item) => {
                              const enabled = getEnabled(item.key);
                              const isSaving = savingKey === item.key;

                              return (
                                <div
                                  key={item.key}
                                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      {item.key}
                                    </p>
                                  </div>
                                  <InlineSwitch
                                    enabled={enabled}
                                    saving={isSaving}
                                    onClick={() => toggleFlag(item.key)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="rounded-[24px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-inset ring-white/10">
                            <Cpu className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Nguyên tắc áp dụng</p>
                            <p className="mt-1 text-sm leading-6 text-white/60">
                              Thay đổi qua toggle được áp dụng ngay cho phiên hiện tại. Người dùng đang hoạt động sẽ thấy khác biệt khi tải lại trang hoặc khởi tạo phiên mới.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {(filteredBeta.length > 0 || !q) && (
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                          <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Thử nghiệm beta
                              </p>
                              <h3 className="mt-1 text-base font-bold text-slate-950">
                                Module rollout sớm
                              </h3>
                            </div>
                            <Badge className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                              {betaEnabledCount}/{BETA_FEATURES.length} bật
                            </Badge>
                          </div>

                          <div className="grid gap-4">
                            {(q ? filteredBeta : BETA_FEATURES).map((item) => {
                              const enabled = getEnabled(item.key);
                              const isSaving = savingKey === item.key;

                              return (
                                <div
                                  key={item.key}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                                        {item.isNew ? (
                                          <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                            Mới
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        {item.tier}
                                      </p>
                                    </div>
                                    <InlineSwitch
                                      enabled={enabled}
                                      saving={isSaving}
                                      onClick={() => toggleFlag(item.key)}
                                      tone="violet"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(filteredUI.length > 0 || !q) && (
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                          <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Giao diện & hành vi
                              </p>
                              <h3 className="mt-1 text-base font-bold text-slate-950">
                                Variants cho UI
                              </h3>
                            </div>
                            <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              {uiEnabledCount}/{UI_FEATURES.length} bật
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {(q ? filteredUI : UI_FEATURES).map((item) => {
                              const Icon = item.icon;
                              const enabled = getEnabled(item.key);
                              const isSaving = savingKey === item.key;

                              return (
                                <div
                                  key={item.key}
                                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                                >
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100">
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                                    </div>
                                  </div>
                                  <InlineSwitch
                                    enabled={enabled}
                                    saving={isSaving}
                                    onClick={() => toggleFlag(item.key)}
                                    tone="amber"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}

              {(filteredTier.length > 0 || !q) && (
                <SectionCard
                  icon={ShieldCheck}
                  title="Phân quyền theo tier"
                  description="Theo dõi nhanh những tính năng nào được bật theo từng cấp độ tài khoản và dùng toggle để điều chỉnh rollout."
                  action={
                    <>
                      <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Basic / Professional / Enterprise
                      </Badge>
                    </>
                  }
                >
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70">
                            <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Tính năng nội bộ
                            </th>
                            <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Basic
                            </th>
                            <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Professional
                            </th>
                            <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Enterprise
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(q ? filteredTier : TIER_FEATURES).map((row) => {
                            const enabled = getEnabled(row.key);
                            const isSaving = savingKey === row.key;

                            return (
                              <tr key={row.key} className="transition-colors hover:bg-slate-50/40">
                                <td className="px-6 py-5">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      {row.key}
                                    </p>
                                  </div>
                                </td>
                                {[row.basic, row.professional, row.enterprise].map((hasAccess, index) => {
                                  const toneClass =
                                    index === 0
                                      ? 'text-slate-500'
                                      : index === 1
                                        ? 'text-blue-600'
                                        : 'text-emerald-600';

                                  if (!hasAccess) {
                                    return (
                                      <td key={`${row.key}-${index}`} className="px-6 py-5 text-center">
                                        <div className="flex justify-center">
                                          <X className="h-4 w-4 text-slate-200" strokeWidth={3} />
                                        </div>
                                      </td>
                                    );
                                  }

                                  const cellActive = enabled;

                                  return (
                                    <td
                                      key={`${row.key}-${index}`}
                                      className={cn(
                                        'px-6 py-5 text-center',
                                        cellActive && 'bg-emerald-50/40'
                                      )}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleFlag(row.key)}
                                        disabled={loading || isSaving}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        title={enabled ? `Tắt ${row.label}` : `Bật ${row.label}`}
                                      >
                                        {isSaving ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                        ) : cellActive ? (
                                          <Check className={cn('h-4 w-4', toneClass)} strokeWidth={3} />
                                        ) : (
                                          <span className={cn('text-xs font-bold', toneClass)}>
                                            {index === 0 ? 'B' : index === 1 ? 'P' : 'E'}
                                          </span>
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 ring-1 ring-inset ring-amber-100">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Nguyên tắc rollout theo tier</p>
                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          Dùng feature flag để thử nghiệm có kiểm soát các mô-đun AI mới trước khi mở rộng rộng rãi cho toàn bộ khách hàng Enterprise hoặc toàn hệ thống.
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminFeatureFlagsPage;
