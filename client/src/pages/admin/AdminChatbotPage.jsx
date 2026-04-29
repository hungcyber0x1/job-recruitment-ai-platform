import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  BrainCircuit,
  Cpu,
  FileText,
  Gauge,
  Handshake,
  History,
  Languages,
  Loader2,
  MessageSquare,
  Save,
  Settings2,
  Shield,
  StickyNote,
  Users,
  Zap,
} from 'lucide-react';

import adminChatbotService from '../../services/adminChatbotService';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../utils';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';
import ChatbotConversations from '../../components/admin/chatbot/ChatbotConversations';
import ChatbotAnalyticsEnhanced from '../../components/admin/chatbot/ChatbotAnalyticsEnhanced';
import ChatbotPromptManager from '../../components/admin/chatbot/ChatbotPromptManager';
import ChatbotConfigurations from '../../components/admin/chatbot/ChatbotConfigurations';

const PERSONALITY_OPTIONS = [
  { id: 'professional', label: 'Chuyên nghiệp' },
  { id: 'friendly', label: 'Thân thiện' },
  { id: 'direct', label: 'Trực tiếp' },
  { id: 'encouraging', label: 'Khích lệ' },
];

const CONFIG_KEYS = {
  aiEnabled: ['ai_chatbot'],
  personality: ['chatbot_personality', 'response_personality'],
  temperature: ['chatbot_temperature', 'temperature'],
  humanHandoff: ['chatbot_human_handoff', 'human_handoff'],
  multilingual: ['chatbot_multilingual', 'multilingual'],
  model: ['ai_model', 'chatbot_model'],
};

const CHATBOT_TABS = [
  { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
  { id: 'analytics', label: 'Phân tích', icon: BarChart3 },
  { id: 'prompts', label: 'Prompt Manager', icon: StickyNote },
  { id: 'config', label: 'Cấu hình', icon: Settings2 },
];

const DEFAULT_ANALYTICS = {
  totalConversations: 0,
  totalMessages: 0,
  userMessages: 0,
  aiMessages: 0,
  activeUsers: 0,
  events: [],
  dailyActivity: [],
  averageMessagesPerConversation: 0,
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function calculatePercent(value, total) {
  const safeValue = Number(value) || 0;
  const safeTotal = Number(total) || 0;
  if (!safeTotal) return 0;
  return Math.round((safeValue / safeTotal) * 100);
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function getConfigValue(configMap, keys, fallback = '') {
  for (const key of keys) {
    const value = configMap?.[key]?.value;
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
}

function formatEventLabel(eventType) {
  if (!eventType) return 'Sự kiện khác';

  const labels = {
    file_uploaded: 'Tải tệp lên',
    suggestion_clicked: 'Dùng gợi ý nhanh',
    conversation_started: 'Bắt đầu hội thoại',
    prompt_fallback: 'Rơi vào prompt dự phòng',
  };

  if (labels[eventType]) return labels[eventType];

  return String(eventType)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTemperature(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0.20';
  return numeric.toFixed(2);
}

function SectionCard({ icon: Icon, title, description, action, children, className = '' }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
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

function HeroMetricCard({ icon: Icon, label, value, helper, tone = 'emerald' }) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            toneClasses[tone] || toneClasses.emerald
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ConfigToggle({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 ring-1 ring-inset ring-slate-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'left-6' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

const AdminChatbotPage = () => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [configMap, setConfigMap] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [personality, setPersonality] = useState('professional');
  const [temperature, setTemperature] = useState(0.2);
  const [humanHandoff, setHumanHandoff] = useState(true);
  const [multilingual, setMultilingual] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  const applyConfigurations = useCallback((nextConfigMap) => {
    setPersonality(getConfigValue(nextConfigMap, CONFIG_KEYS.personality, 'professional'));
    setTemperature(Number(getConfigValue(nextConfigMap, CONFIG_KEYS.temperature, '0.2')) || 0.2);
    setHumanHandoff(parseBoolean(getConfigValue(nextConfigMap, CONFIG_KEYS.humanHandoff, 'true'), true));
    setMultilingual(parseBoolean(getConfigValue(nextConfigMap, CONFIG_KEYS.multilingual, 'true'), true));
    setAiEnabled(parseBoolean(getConfigValue(nextConfigMap, CONFIG_KEYS.aiEnabled, 'true'), true));
  }, []);

  const fetchSummaryData = useCallback(
    async () => {
      try {
        setSummaryLoading(true);

        const [analyticsRes, configurationsRes] = await Promise.all([
          adminChatbotService.getAnalytics(),
          adminChatbotService.getConfigurations(),
        ]);

        const nextAnalytics = analyticsRes?.data?.data || DEFAULT_ANALYTICS;
        const nextConfigMap = configurationsRes?.data?.data || {};

        setAnalytics({
          ...DEFAULT_ANALYTICS,
          ...nextAnalytics,
          events: Array.isArray(nextAnalytics?.events) ? nextAnalytics.events : [],
          dailyActivity: Array.isArray(nextAnalytics?.dailyActivity) ? nextAnalytics.dailyActivity : [],
        });
        setConfigMap(nextConfigMap);
        applyConfigurations(nextConfigMap);
      } catch (error) {
        console.error('AdminChatbotPage summary error:', error);
        showNotification('Không thể tải dữ liệu điều hành chatbot.', 'error');
      } finally {
        setSummaryLoading(false);
      }
    },
    [applyConfigurations, showNotification]
  );

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminChatbotService.updateConfigurations({
        ai_chatbot: aiEnabled ? 'true' : 'false',
        response_personality: personality,
        chatbot_personality: personality,
        temperature: String(temperature),
        chatbot_temperature: String(temperature),
        human_handoff: humanHandoff ? 'true' : 'false',
        chatbot_human_handoff: humanHandoff ? 'true' : 'false',
        multilingual: multilingual ? 'true' : 'false',
        chatbot_multilingual: multilingual ? 'true' : 'false',
      });
      showNotification('Đã cập nhật cấu hình AI chatbot.', 'success');
      await fetchSummaryData();
    } catch (error) {
      console.error('AdminChatbotPage save error:', error);
      showNotification('Lỗi khi lưu cấu hình chatbot.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const aiResponseRate = useMemo(
    () => calculatePercent(analytics.aiMessages, analytics.totalMessages),
    [analytics.aiMessages, analytics.totalMessages]
  );

  const modelLabel = getConfigValue(configMap, CONFIG_KEYS.model, 'Emerald v4 / Hyperion-Pro');

  const heroMetrics = useMemo(
    () => [
      {
        label: 'Trạng thái AI',
        value: summaryLoading ? '—' : aiEnabled ? 'Đang bật' : 'Tạm tắt',
        helper: aiEnabled ? 'Chatbot có thể phản hồi ở các điểm chạm public.' : 'Trợ lý đang tạm tắt ở public layer.',
        icon: Bot,
        tone: aiEnabled ? 'emerald' : 'rose',
      },
      {
        label: 'Hội thoại',
        value: summaryLoading ? '—' : formatNumber(analytics.totalConversations),
        helper: `${formatNumber(analytics.activeUsers)} người dùng hoạt động.`,
        icon: MessageSquare,
        tone: 'blue',
      },
      {
        label: 'Người dùng hoạt động',
        value: summaryLoading ? '—' : formatNumber(analytics.activeUsers),
        helper: `${formatNumber(analytics.averageMessagesPerConversation)} tin nhắn trung bình mỗi phiên.`,
        icon: Users,
        tone: 'violet',
      },
      {
        label: 'Tỉ lệ phản hồi AI',
        value: summaryLoading ? '—' : `${aiResponseRate}%`,
        helper: `${formatNumber(analytics.aiMessages)} / ${formatNumber(analytics.totalMessages)} tin nhắn là phản hồi AI.`,
        icon: Zap,
        tone: 'amber',
      },
    ],
    [
      aiEnabled,
      aiResponseRate,
      analytics.activeUsers,
      analytics.aiMessages,
      analytics.averageMessagesPerConversation,
      analytics.totalConversations,
      analytics.totalMessages,
      summaryLoading,
    ]
  );

  const eventHighlights = useMemo(() => {
    return [...analytics.events]
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
      .slice(0, 4);
  }, [analytics.events]);

  const activityBars = useMemo(() => {
    const items = [...analytics.dailyActivity].slice(0, 7).reverse();
    const maxValue = Math.max(...items.map((item) => Number(item?.conversations || 0)), 1);
    return { items, maxValue };
  }, [analytics.dailyActivity]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'conversations':
        return <ChatbotConversations />;
      case 'analytics':
        return <ChatbotAnalyticsEnhanced />;
      case 'prompts':
        return <ChatbotPromptManager />;
      case 'config':
        return <ChatbotConfigurations />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f8fafc_100%)] pb-12 text-slate-900">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_84%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  Admin workspace
                </span>
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/85 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Điều phối chatbot
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold shadow-sm',
                  aiEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                )}
              >
                {aiEnabled ? 'Live monitoring' : 'AI tạm dừng'}
              </span>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">AI operation console</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.8rem]">
                Quản trị Chatbot AI
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Theo dõi hiệu quả hội thoại, giám sát phản hồi AI và tinh chỉnh hành vi chatbot theo
                đúng luồng vận hành của dự án.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {summaryLoading ? '—' : formatNumber(analytics.totalConversations)} hội thoại
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {summaryLoading ? '—' : formatNumber(analytics.activeUsers)} người dùng hoạt động
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                Model: {modelLabel}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-100/60 pt-4">
            {CHATBOT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                      : 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === 'overview' ? (
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {heroMetrics.map((metric) => (
                  <HeroMetricCard
                    key={metric.label}
                    icon={metric.icon}
                    label={metric.label}
                    value={metric.value}
                    helper={metric.helper}
                    tone={metric.tone}
                  />
                ))}
              </div>

              <SectionCard
                icon={Cpu}
                title="Hoạt động 7 ngày gần nhất"
                description="Theo dõi xu hướng hội thoại chatbot theo ngày."
              >
                <div className="space-y-3">
                  {activityBars.items.length ? (
                    activityBars.items.map((item) => {
                      const value = Number(item?.conversations || 0);
                      const width = Math.max(10, Math.round((value / activityBars.maxValue) * 100));

                      return (
                        <div key={item.date} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">
                            {new Date(item.date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-600">
                            {formatNumber(value)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có dữ liệu hội thoại theo ngày.
                    </div>
                  )}
                </div>

                {eventHighlights.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Event nổi bật
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {eventHighlights.map((event) => (
                        <Badge
                          key={event.event_type}
                          variant="outline"
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {formatEventLabel(event.event_type)}: {formatNumber(event.count)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                icon={History}
                title="Điều hướng nhanh"
                description="Truy cập các chức năng chi tiết của chatbot."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {CHATBOT_TABS.filter(t => t.id !== 'overview').map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/40"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-inset ring-slate-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{tab.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {tab.id === 'conversations' && 'Xem & quản lý hội thoại'}
                            {tab.id === 'analytics' && 'Biểu đồ & thống kê chi tiết'}
                            {tab.id === 'prompts' && 'Tạo & chỉnh sửa prompt templates'}
                            {tab.id === 'config' && 'Cấu hình model & hành vi AI'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard
                icon={Settings2}
                title="Cấu hình phản hồi AI"
                description="Tinh chỉnh mô hình, giọng điệu phản hồi và các chế độ hỗ trợ để giữ chatbot đồng nhất với logic nghiệp vụ của nền tảng."
              >
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.6)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                          Mô hình hiện hành
                        </p>
                        <p className="mt-3 text-lg font-bold">{modelLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          Tỉ lệ phản hồi AI: {summaryLoading ? '—' : `${aiResponseRate}%`}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-inset ring-white/10">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Tone giọng phản hồi
                      </label>
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600">
                        4 cấu hình
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {PERSONALITY_OPTIONS.map((option) => {
                        const active = personality === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPersonality(option.id)}
                            className={cn(
                              'rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
                              active
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50'
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Creativity / Temperature
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {formatTemperature(temperature)}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 ring-1 ring-inset ring-violet-100">
                        <Gauge className="h-4 w-4" />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={temperature}
                      onChange={(event) => setTemperature(parseFloat(event.target.value))}
                      className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
                    />
                    <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
                      <span>Ổn định, chuẩn mực</span>
                      <span>Giàu sáng tạo</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ConfigToggle
                      icon={Shield}
                      label="Bật chatbot ở public layer"
                      description="Điều khiển trạng thái live của chatbot ở các điểm chạm dành cho người dùng."
                      checked={aiEnabled}
                      onChange={() => setAiEnabled((current) => !current)}
                    />
                    <ConfigToggle
                      icon={Languages}
                      label="Hỗ trợ đa ngôn ngữ"
                      description="Cho phép chatbot xử lý hội thoại đa ngôn ngữ trong cùng một phiên."
                      checked={multilingual}
                      onChange={() => setMultilingual((current) => !current)}
                    />
                    <ConfigToggle
                      icon={Handshake}
                      label="Human handoff"
                      description="Bật cơ chế bàn giao về người thật khi chatbot gặp truy vấn nhạy cảm hoặc khó."
                      checked={humanHandoff}
                      onChange={() => setHumanHandoff((current) => !current)}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving || summaryLoading}
                    className="h-12 w-full rounded-2xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình chatbot'}
                  </Button>
                </div>
              </SectionCard>

              <SectionCard
                icon={FileText}
                title="Trạng thái hệ thống"
                description="Thông tin cấu hình chatbot hiện tại."
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Model</p>
                    <p className="text-sm font-semibold text-slate-950">{modelLabel}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Giọng điệu</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {PERSONALITY_OPTIONS.find((o) => o.id === personality)?.label}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Nhiệt độ</p>
                    <p className="text-sm font-semibold text-slate-950">{formatTemperature(temperature)}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Đa ngôn ngữ</p>
                    <Badge variant={multilingual ? 'emerald' : 'outline'} className="rounded-full px-2.5 py-1 text-xs font-semibold">
                      {multilingual ? 'Bật' : 'Tắt'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Human Handoff</p>
                    <Badge variant={humanHandoff ? 'emerald' : 'outline'} className="rounded-full px-2.5 py-1 text-xs font-semibold">
                      {humanHandoff ? 'Bật' : 'Tắt'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Chatbot</p>
                    <Badge variant={aiEnabled ? 'emerald' : 'rose'} className="rounded-full px-2.5 py-1 text-xs font-semibold">
                      {aiEnabled ? 'Đang bật' : 'Tạm tắt'}
                    </Badge>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {renderTabContent()}
        </main>
      )}
    </div>
  );
};

export default AdminChatbotPage;
