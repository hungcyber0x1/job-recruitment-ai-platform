import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle2, Shield, Coins, Zap, Upload, MoreVertical, Save } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import adminChatbotService from '../../services/adminChatbotService';

const KPI_CARDS = [
  {
    label: 'Hệ thống AI',
    value: 'Sẵn sàng',
    sub: 'Uptime 100%',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    label: 'Độ chính xác phản hồi',
    value: '94.2%',
    sub: 'Chỉ số trung bình',
    icon: Shield,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    label: 'Mẫu hội thoại',
    value: '0',
    sub: 'Cần nạp dữ liệu',
    icon: Coins,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
  {
    label: 'Phản hồi trung bình',
    value: '0.8s',
    sub: 'Tốc độ xử lý AI',
    icon: Zap,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
  },
];

const PERSONALITY_OPTIONS = [
  { id: 'professional', label: 'Chuyên nghiệp' },
  { id: 'friendly', label: 'Thân thiện' },
  { id: 'direct', label: 'Trực tiếp' },
  { id: 'encouraging', label: 'Khích lệ' },
];

const TRAINING_FILES_MOCK = [];

const AdminChatbotPage = () => {
  const [searchSession, setSearchSession] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [personality, setPersonality] = useState('professional');
  const [temperature, setTemperature] = useState(0.2);
  const [humanHandoff, setHumanHandoff] = useState(true);
  const [multilingual, setMultilingual] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRecentConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await adminChatbotService.getAllConversations({
        page: 1,
        limit: 5,
        search: searchSession || undefined,
      });
      const list = res.data?.data?.conversations || [];
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [searchSession]);

  useEffect(() => {
    fetchRecentConversations();
  }, [fetchRecentConversations]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await adminChatbotService.updateConfigurations({
        response_personality: personality,
        temperature: String(temperature),
        human_handoff: humanHandoff ? 'true' : 'false',
        multilingual: multilingual ? 'true' : 'false',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const formatCandidateName = (conv) => {
    const first = conv.first_name?.[0] || 'N';
    const last = conv.last_name?.[0] || 'V';
    return {
      initials: `${first}${last}`,
      full: `${conv.first_name || ''} ${conv.last_name || ''}`.trim() || 'Ứng viên',
    };
  };

  return (
    <AdminLayout>
      <div className="space-y-6 text-slate-900">
        {/* Header: Title + LIVE MONITORING + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Quản trị Chatbot</h1>
            <span className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1 text-base font-bold uppercase tracking-wider text-white">
              Live monitoring
            </span>
          </div>
          <div className="relative max-w-md flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm phiên chat..."
              value={searchSession}
              onChange={(e) => setSearchSession(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                    <Icon size={22} className={card.iconColor} />
                  </div>
                </div>
                <p className="mt-3 text-base font-medium uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">{card.value}</p>
                <p className="mt-0.5 text-base text-slate-500">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Two columns: Left = Log + Training, Right = AI Config */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            {/* Nhật ký hội thoại gần đây */}
            <div className="data-table-shell">
              <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
                <h2 className="text-base font-bold text-slate-900">Nhật ký hội thoại gần đây</h2>
                <a
                  href="/admin/chatbot?tab=conversations"
                  className="text-base font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Xem tất cả
                </a>
              </div>
              <div className="data-table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="px-5 py-3">Ứng viên</th>
                      <th className="px-5 py-3">Nội dung cuối</th>
                      <th className="px-5 py-3">Trả lời</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingConversations ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                        </td>
                      </tr>
                    ) : conversations.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                          Chưa có hội thoại
                        </td>
                      </tr>
                    ) : (
                      conversations.map((conv) => {
                        const { initials, full } = formatCandidateName(conv);
                        return (
                          <tr key={conv.id}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-base font-bold text-emerald-400">
                                  {initials}
                                </div>
                                <span className="font-medium text-slate-900">{full}</span>
                              </div>
                            </td>
                            <td className="max-w-[200px] truncate px-5 py-3 text-base text-slate-500">
                              {conv.last_message_preview ?? conv.title ?? '—'}
                            </td>
                            <td className="px-5 py-3">
                              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-base font-semibold text-emerald-400">
                                Đã
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trạng thái dữ liệu huấn luyện */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <h2 className="text-base font-bold text-slate-900">
                  Trạng thái dữ liệu huấn luyện
                </h2>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-base font-semibold text-white hover:bg-emerald-600"
                >
                  <Upload size={18} />
                  Tải lên dữ liệu mới
                </button>
              </div>
              <div className="space-y-2 p-4">
                {TRAINING_FILES_MOCK.map((file, idx) => {
                  const Icon = file.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <Icon size={20} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-base text-slate-500">Đã cập nhật: {file.updated}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 hover:bg-muted/55 hover:text-foreground"
                        aria-label="Tùy chọn"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column - 1/3: Cấu hình hành vi AI */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-base font-bold text-slate-900">Cấu hình hành vi AI</h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Mô hình AI
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    defaultValue="recruit-ai-core"
                  >
                    <option value="recruit-ai-core">RecruitAI Core (GPT-4 based)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Tính cách phản hồi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERSONALITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPersonality(opt.id)}
                        className={`rounded-xl border px-3 py-2.5 text-base font-medium transition-all ${
                          personality === opt.id
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-base font-semibold uppercase tracking-wider text-slate-500">
                    Độ sáng tạo (Temperature)
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-slate-500">CHÍNH XÁC (0.1)</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="h-2 flex-1 appearance-none rounded-full bg-slate-100 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                    />
                    <span className="text-base font-bold text-slate-500">LINH HOẠT (0.8)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-base font-medium text-slate-900">
                    Tự động leo thang (Human Handoff)
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={humanHandoff}
                    onClick={() => setHumanHandoff(!humanHandoff)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      humanHandoff ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        humanHandoff ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-base font-medium text-slate-900">
                    Bật chế độ Đa ngôn ngữ
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={multilingual}
                    onClick={() => setMultilingual(!multilingual)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      multilingual ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        multilingual ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi cấu hình'}
                </button>
              </div>
            </div>

            {/* Thông tin hệ thống */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">Thông tin hệ thống</h2>
              <p className="mt-2 text-base text-slate-500">Phiên bản RecruitAI Chatbot 2.0</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbotPage;
