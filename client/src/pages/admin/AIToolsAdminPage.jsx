import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  FileText,
  Gauge,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';

import StatCard from '@/components/common/StatCard';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNotification } from '../../context/NotificationContext';
import adminService from '../../services/adminService';
import { cn } from '../../utils';

const TOOL_BLUEPRINTS = [
  {
    id: 1,
    key: 'ai_chatbot',
    name: 'AI Career Assistant',
    category: 'Chatbot',
    audience: 'Ứng viên',
    description:
      'Trợ lý AI hỗ trợ hỏi đáp nghề nghiệp, giải thích quy trình ứng tuyển và điều hướng sang các bước tiếp theo.',
    usageCount: 15420,
    icon: MessageSquare,
    tone: 'emerald',
    defaultEnabled: true,
  },
  {
    id: 2,
    key: 'ai_resume_analysis',
    name: 'AI Resume Analysis',
    category: 'CV',
    audience: 'Ứng viên',
    description: 'Phân tích CV tự động, tổng hợp điểm mạnh và gợi ý điều chỉnh hồ sơ rõ ràng hơn.',
    usageCount: 8932,
    icon: FileText,
    tone: 'blue',
    defaultEnabled: true,
  },
  {
    id: 4,
    key: 'ai_interview_prep',
    name: 'AI Interview Prep',
    category: 'Interview',
    audience: 'Ứng viên',
    description:
      'Hỗ trợ ôn tập và chuẩn bị phỏng vấn với bộ câu hỏi, điểm cần cải thiện và nhắc lịch luyện tập.',
    usageCount: 3210,
    icon: Brain,
    tone: 'rose',
    defaultEnabled: true,
  },
];

const TONE_STYLES = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'border-emerald-200/80',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-700 ring-blue-100',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    accent: 'border-blue-200/80',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    badge: 'border-violet-200 bg-violet-50 text-violet-700',
    accent: 'border-violet-200/80',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'border-amber-200/80',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    accent: 'border-rose-200/80',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    accent: 'border-slate-200',
  },
};

const FILTER_LABELS = {
  all: 'Tất cả công cụ',
  active: 'Đang bật',
  inactive: 'Tạm dừng',
};

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatProvider(value) {
  const normalized = String(value || 'gemini')
    .trim()
    .toLowerCase();
  if (normalized === 'openai') return 'OpenAI';
  if (normalized === 'poe') return 'Poe';
  return 'Gemini';
}

function formatModel(value) {
  const raw = String(value || 'gemini-2.5-flash').trim();
  if (!raw) return 'gemini-2.5-flash';

  return raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTemperature(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0.70';
  return numeric.toFixed(2);
}

function getSettingValue(settingsMap, keys, fallback = '') {
  for (const key of keys) {
    const value = settingsMap?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
}

function HeroStatCard({ icon: Icon, label, value, helper, tone = 'emerald' }) {
  return <StatCard title={label} value={value} subtitle={helper} icon={Icon} type={tone} />;
}

function SectionShell({ icon: Icon, title, description, action, children }) {
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

function FilterPill({ active, label, count, onClick, tone = 'emerald' }) {
  const activeStyles =
    tone === 'violet'
      ? 'border-violet-500 bg-violet-500 text-white shadow-sm'
      : 'border-emerald-500 bg-emerald-500 text-white shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
        active
          ? activeStyles
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-bold',
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function RuntimeMetric({ label, value, helper }) {
  return <StatCard title={label} value={value} subtitle={helper} icon={Settings} type="neutral" />;
}

function ToolCard({ tool, onToggle, busy }) {
  const toneStyle = TONE_STYLES[tool.tone] || TONE_STYLES.emerald;
  const Icon = tool.icon;

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-[28px] border bg-white p-5 shadow-sm transition-all',
        tool.isActive ? toneStyle.accent : 'border-slate-200'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
              toneStyle.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {tool.category}
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{tool.name}</h3>
          </div>
        </div>
        <Badge
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            tool.isActive
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-100 text-slate-600'
          )}
        >
          {tool.isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn('rounded-full border px-3 py-1 text-xs font-semibold', toneStyle.badge)}
        >
          {tool.audience}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {formatNumber(tool.usageCount)} lượt dùng
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{tool.description}</p>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <Settings className="h-4 w-4 text-slate-400" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Khóa điều phối
          </p>
          <p className="truncate text-sm font-semibold text-slate-950">{tool.key}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="text-xs leading-5 text-slate-500">
          {tool.isActive
            ? 'Module đang sẵn sàng cho luồng nghiệp vụ liên quan.'
            : 'Module đang được admin tạm dừng tại lớp điều phối.'}
        </p>
        <Button
          type="button"
          variant={tool.isActive ? 'outline' : 'default'}
          onClick={() => onToggle(tool)}
          disabled={busy}
          className={cn(
            'h-10 shrink-0 rounded-2xl px-4 text-sm font-semibold',
            tool.isActive
              ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          )}
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : tool.isActive ? (
            <XCircle className="mr-2 h-4 w-4" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {tool.isActive ? 'Tạm dừng' : 'Kích hoạt'}
        </Button>
      </div>
    </article>
  );
}

const AIToolsAdminPage = () => {
  const { showNotification } = useNotification();
  const [settingsMap, setSettingsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkspace = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        const response = await adminService.getSettings();
        if (response.data?.success) {
          setSettingsMap(response.data.data || {});
        }
      } catch (error) {
        console.error('Error loading AI tools settings:', error);
        showNotification('Không thể tải không gian quản lý công cụ AI.', 'error');
      } finally {
        if (showLoader) setLoading(false);
        else setRefreshing(false);
      }
    },
    [showNotification]
  );

  useEffect(() => {
    fetchWorkspace(true);
  }, [fetchWorkspace]);

  const tools = useMemo(
    () =>
      TOOL_BLUEPRINTS.map((tool) => ({
        ...tool,
        isActive: toBoolean(settingsMap[tool.key], tool.defaultEnabled),
      })),
    [settingsMap]
  );

  const runtimeProfile = useMemo(
    () => ({
      provider: formatProvider(getSettingValue(settingsMap, ['ai_provider', 'provider'], 'gemini')),
      model: formatModel(
        getSettingValue(settingsMap, ['ai_model', 'chatbot_model'], 'gemini-2.5-flash')
      ),
      temperature: formatTemperature(
        getSettingValue(settingsMap, ['chatbot_temperature', 'temperature'], '0.7')
      ),
      maxTokens: getSettingValue(settingsMap, ['max_tokens'], '500'),
    }),
    [settingsMap]
  );

  const runtimeConfigured = useMemo(
    () =>
      [
        'ai_provider',
        'provider',
        'ai_model',
        'chatbot_model',
        'chatbot_temperature',
        'temperature',
        'max_tokens',
      ].some(
        (key) =>
          settingsMap[key] !== undefined && settingsMap[key] !== null && settingsMap[key] !== ''
      ),
    [settingsMap]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    tools.forEach((tool) => {
      counts.set(tool.category, (counts.get(tool.category) || 0) + 1);
    });
    return counts;
  }, [tools]);

  const filteredTools = useMemo(
    () =>
      tools.filter((tool) => {
        const matchesFilter =
          filter === 'all'
            ? true
            : filter === 'active'
              ? tool.isActive
              : filter === 'inactive'
                ? !tool.isActive
                : tool.category.toLowerCase() === filter.toLowerCase();

        const matchesQuery =
          !normalizedQuery ||
          [tool.name, tool.category, tool.description, tool.key, tool.audience]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        return matchesFilter && matchesQuery;
      }),
    [filter, normalizedQuery, tools]
  );

  const stats = useMemo(() => {
    const totalTools = tools.length;
    const activeTools = tools.filter((tool) => tool.isActive).length;
    const inactiveTools = totalTools - activeTools;
    const readiness = totalTools ? Math.round((activeTools / totalTools) * 100) : 0;

    return {
      totalTools,
      activeTools,
      inactiveTools,
      readiness,
      categories: categoryCounts.size,
    };
  }, [categoryCounts.size, tools]);

  const currentViewLabel = FILTER_LABELS[filter] || filter;

  const handleToggle = useCallback(
    async (tool) => {
      const nextValue = (!tool.isActive).toString();

      try {
        setSavingKey(tool.key);
        await adminService.updateSettings({ [tool.key]: nextValue });
        setSettingsMap((current) => ({ ...current, [tool.key]: nextValue }));
        showNotification(`${tool.name} đã ${tool.isActive ? 'tạm dừng' : 'kích hoạt'}.`, 'success');
      } catch (error) {
        console.error('Error updating AI tool:', error);
        showNotification(`Lỗi khi cập nhật ${tool.name}.`, 'error');
      } finally {
        setSavingKey('');
      }
    },
    [showNotification]
  );

  const clearFilters = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
  }, []);

  return (
    <>
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.8]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    Không gian vận hành AI
                  </span>
                  <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    Công cụ vận hành AI
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                    {filteredTools.length}/{stats.totalTools} công cụ đang hiển thị
                  </span>
                </div>

                <div className="max-w-4xl">
                  <p className="text-sm font-semibold text-emerald-600">
                    Điều phối công cụ AI trong hệ thống
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                    Công cụ AI
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                    Gom toàn bộ module AI đang phục vụ ứng viên, recruiter và lớp điều phối thành
                    một workspace ngắn gọn hơn. Trang này đọc cùng nguồn system settings với khu
                    chatbot và settings admin để giữ đồng nhất giao diện và logic vận hành.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <HeroStatCard
                    icon={CheckCircle2}
                    label="Công cụ đang bật"
                    value={loading ? '...' : `${stats.activeTools}/${stats.totalTools}`}
                    helper="Số module sẵn sàng phục vụ người dùng ngay lúc này."
                    tone="emerald"
                  />
                  <HeroStatCard
                    icon={XCircle}
                    label="Tạm dừng"
                    value={loading ? '...' : stats.inactiveTools}
                    helper="Những công cụ đang được giữ lại để rà soát hoặc khóa truy cập."
                    tone="amber"
                  />
                  <HeroStatCard
                    icon={Cpu}
                    label="Nhóm nghiệp vụ"
                    value={loading ? '...' : stats.categories}
                    helper="Số lượng danh mục công cụ đang được điều phối trên trang."
                    tone="blue"
                  />
                  <HeroStatCard
                    icon={Gauge}
                    label="Phủ vận hành"
                    value={loading ? '...' : `${stats.readiness}%`}
                    helper="Tỷ lệ công cụ đang sẵn sàng trên tổng danh mục hiện có."
                    tone="violet"
                  />
                </div>
              </div>

              <div className="self-start rounded-[28px] border border-white/90 bg-white/90 p-4 shadow-sm backdrop-blur xl:w-full xl:max-w-[340px]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Bảng điều phối AI
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">Điều phối AI</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Tìm module theo tên, đổi nhanh view và theo dõi runtime mặc định đang được áp
                      dụng.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Hiển thị hiện tại
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{currentViewLabel}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="ai-tools-search" className="sr-only">
                    Tìm công cụ AI
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="ai-tools-search"
                      type="text"
                      placeholder="Tìm công cụ, nhóm hoặc key..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Kết quả hiển thị
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {filteredTools.length} công cụ phù hợp
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Runtime đang dùng
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {runtimeProfile.provider}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Snapshot vận hành
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Model mặc định</span>
                      <span className="text-right font-semibold text-slate-950">
                        {runtimeProfile.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Nhiệt độ</span>
                      <span className="font-semibold text-slate-950">
                        {runtimeProfile.temperature}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Max tokens</span>
                      <span className="font-semibold text-slate-950">
                        {runtimeProfile.maxTokens}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchWorkspace(false)}
                    disabled={refreshing}
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
                    variant="outline"
                    onClick={clearFilters}
                    className="h-10 rounded-2xl border-slate-200 px-4"
                  >
                    Xóa lọc
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content-bg">
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <SectionShell
              icon={Bot}
              title="Danh mục công cụ AI"
              description="Sắp xếp module theo nhóm nghiệp vụ rõ ràng hơn, giữ thao tác bật tắt nhanh và không làm rối bố cục."
              action={
                <>
                  <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {stats.activeTools} đang bật
                  </Badge>
                  <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {filteredTools.length} kết quả
                  </Badge>
                </>
              }
            >
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <FilterPill
                      active={filter === 'all'}
                      label="Tất cả"
                      count={tools.length}
                      onClick={() => setFilter('all')}
                    />
                    <FilterPill
                      active={filter === 'active'}
                      label="Đang bật"
                      count={stats.activeTools}
                      onClick={() => setFilter('active')}
                    />
                    <FilterPill
                      active={filter === 'inactive'}
                      label="Tạm dừng"
                      count={stats.inactiveTools}
                      onClick={() => setFilter('inactive')}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {Array.from(categoryCounts.entries()).map(([category, count]) => (
                      <FilterPill
                        key={category}
                        active={filter === category.toLowerCase()}
                        label={category}
                        count={count}
                        tone="violet"
                        onClick={() => setFilter(category.toLowerCase())}
                      />
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                      <p className="mt-3 text-sm font-medium text-slate-500">
                        Đang đồng bộ cấu hình công cụ AI...
                      </p>
                    </div>
                  </div>
                ) : filteredTools.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
                    <Search className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-base font-semibold text-slate-900">
                      Không tìm thấy công cụ phù hợp với bộ lọc hiện tại
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Hãy thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem lại toàn bộ danh mục.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
                    {filteredTools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        busy={savingKey === tool.key}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            </SectionShell>

            <SectionShell
              icon={Settings}
              title="Runtime và quy chuẩn điều phối"
              description="Đọc thông số AI từ cùng nguồn admin settings để giữ đồng nhất giữa chatbot, công cụ AI và các trang vận hành khác."
              action={
                <Badge className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {runtimeConfigured ? 'Đồng bộ từ admin settings' : 'Đang dùng fallback hệ thống'}
                </Badge>
              }
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Hồ sơ runtime hiện tại
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">
                    Thông số AI đang được áp dụng trên trang
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Giá trị bên dưới được lấy từ system settings, cùng logic với khu chatbot admin
                    và các flow AI đang chạy trong dự án.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <RuntimeMetric
                      label="Nhà cung cấp"
                      value={runtimeProfile.provider}
                      helper="Nguồn model mặc định đang được hệ thống tham chiếu."
                    />
                    <RuntimeMetric
                      label="Model mặc định"
                      value={runtimeProfile.model}
                      helper="Model ưu tiên được dùng cho các luồng AI chính."
                    />
                    <RuntimeMetric
                      label="Nhiệt độ"
                      value={runtimeProfile.temperature}
                      helper="Độ linh hoạt câu trả lời đang được đặt cho runtime."
                    />
                    <RuntimeMetric
                      label="Giới hạn token"
                      value={runtimeProfile.maxTokens}
                      helper="Ngưỡng token tối đa đang được admin lưu trong settings."
                    />
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                    Mục đích của trang này là điều phối module. Việc bật tắt từng công cụ sẽ được
                    lưu cùng cơ chế với{' '}
                    <span className="font-semibold text-slate-950">/admin/settings</span> để tránh
                    lệch cấu hình giữa các màn quản trị.
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Nguyên tắc vận hành
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Bật tắt theo từng module
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Mỗi toggle cập nhật trực tiếp một setting key, giúp chatbot, screening và
                        các flow public thừa hưởng trạng thái ngay sau khi admin điều chỉnh.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-950">
                        Ưu tiên sự đồng nhất hệ thống
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Runtime provider, model, nhiệt độ và max tokens được đọc cùng nguồn với
                        trang chatbot admin thay vì hardcode trên riêng trang này.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-950">Bảo toàn flow hiện có</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Công cụ interview prep ưu tiên đọc key{' '}
                        <span className="font-semibold text-slate-950">ai_interview_prep</span>. Nếu
                        dự án chưa khai báo key này trong settings, trang sẽ giữ fallback bật để
                        không vô tình chặn luồng nghiệp vụ hiện tại.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionShell>
          </div>
        </main>
      </div>
    </>
  );
};

export default AIToolsAdminPage;
