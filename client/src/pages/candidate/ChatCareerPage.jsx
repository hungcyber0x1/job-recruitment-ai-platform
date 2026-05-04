import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  User,
  Bot,
  FileText,
  Briefcase,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Plus,
  Sparkles,
  Target,
  DollarSign,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Clock3,
  History,
  Lightbulb,
  PanelRightOpen,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import chatbotService from '../../services/chatbotService';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AiMessageMarkdown from '../../components/chatbot/AiMessageMarkdown';

const SUGGESTED_CARDS = [
  {
    icon: Target,
    title: 'Phân tích hồ sơ',
    subtitle: 'Xác định điểm mạnh, điểm yếu và kỹ năng cần nâng cấp.',
    text: 'Hãy phân tích hồ sơ của tôi và chỉ ra điểm mạnh, điểm yếu và những kỹ năng còn thiếu để tôi có thể phát triển sự nghiệp tốt hơn.',
    tone: 'emerald',
  },
  {
    icon: Briefcase,
    title: 'Gợi ý việc làm',
    subtitle: 'Đề xuất vị trí phù hợp với kỹ năng và kinh nghiệm.',
    text: 'Dựa trên kỹ năng và kinh nghiệm của tôi, hãy gợi ý các vị trí việc làm phù hợp và cách ứng tuyển hiệu quả.',
    tone: 'sky',
  },
  {
    icon: DollarSign,
    title: 'Dự đoán lương',
    subtitle: 'Ước lượng mức lương hợp lý theo thị trường hiện tại.',
    text: 'Hãy phân tích mức lương phù hợp cho vị trí lập trình viên cấp cao tại Việt Nam, dựa trên thị trường và kinh nghiệm hiện tại.',
    tone: 'amber',
  },
  {
    icon: GraduationCap,
    title: 'Lộ trình học tập',
    subtitle: 'Xây dựng kế hoạch phát triển kỹ năng theo từng mốc.',
    text: 'Hãy xây dựng lộ trình học tập 6 tháng để tôi có thể chuyển từ lập trình viên mới sang lập trình viên cấp cao, bao gồm các kỹ năng và tài liệu cụ thể.',
    tone: 'violet',
  },
  {
    icon: MessageSquare,
    title: 'Luyện phỏng vấn',
    subtitle: 'Giả lập phỏng vấn và nhận phản hồi có cấu trúc.',
    text: 'Hãy đóng vai nhà tuyển dụng và đặt cho tôi các câu hỏi phỏng vấn phổ biến cho vị trí lập trình viên giao diện người dùng. Sau mỗi câu trả lời hãy cho tôi nhận xét chi tiết.',
    tone: 'rose',
  },
  {
    icon: FileText,
    title: 'Tối ưu CV theo JD',
    subtitle: 'Gợi ý từ khóa, cấu trúc và điểm nhấn theo tin tuyển dụng.',
    text: 'Tôi đang ứng tuyển vị trí lập trình viên full-stack. Hãy gợi ý cách tối ưu CV của tôi để tăng tỷ lệ được duyệt, bao gồm các từ khóa cần thêm và cách mô tả kinh nghiệm hiệu quả hơn.',
    tone: 'indigo',
  },
];

const FEATURE_LINKS = [
  {
    to: '/ai-cv-scanner',
    icon: FileText,
    label: 'CV Scanner',
    desc: 'Chấm điểm CV và tối ưu keyword ATS',
  },
  {
    to: '/salary-predictor',
    icon: DollarSign,
    label: 'Dự đoán lương',
    desc: 'Ước tính thu nhập theo vai trò và thị trường',
  },
];

const TRUST_SIGNALS = [
  {
    icon: ShieldCheck,
    label: 'Dữ liệu nghề nghiệp',
    value: 'Định hướng theo hồ sơ',
  },
  {
    icon: Clock3,
    label: 'Phản hồi nhanh',
    value: 'Gợi ý theo ngữ cảnh',
  },
  {
    icon: Lightbulb,
    label: 'Kế hoạch hành động',
    value: 'Có bước tiếp theo rõ ràng',
  },
];

const toneClasses = {
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-500 group-hover:text-white',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100 group-hover:bg-sky-500 group-hover:text-white',
  amber:
    'bg-amber-50 text-amber-600 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white',
  violet:
    'bg-violet-50 text-violet-600 ring-violet-100 group-hover:bg-violet-500 group-hover:text-white',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100 group-hover:bg-rose-500 group-hover:text-white',
  indigo:
    'bg-indigo-50 text-indigo-600 ring-indigo-100 group-hover:bg-indigo-500 group-hover:text-white',
};

const formatConversationTime = (value) => {
  if (!value) return 'Vừa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa cập nhật';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
};

const ChatCareerPage = () => {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const chatbotEnabled = isEnabled('ai_chatbot');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [showActions, setShowActions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title || 'Cuộc hội thoại mới';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const selectConversation = useCallback(async (convId) => {
    setActiveConversationId(convId);
    setMessages([]);
    setShowActions(false);
    setLoadingHistory(true);
    try {
      const res = await chatbotService.getHistory(convId);
      const rawHist = res.data?.data || res.data || [];
      const hist = Array.isArray(rawHist) ? rawHist : [];
      setMessages(
        hist.map((m) => ({
          id: m.id || m.created_at,
          sender: m.is_ai ? 'ai' : 'user',
          text: m.message || m.content || '',
          time: m.created_at,
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!chatbotEnabled) return;
    const load = async () => {
      try {
        const res = await chatbotService.getConversations();
        const list = res.data?.data || res.data || [];
        setConversations(list);
        if (list.length > 0 && !activeConversationId) selectConversation(list[0].id);
      } catch (err) {
        console.error('Could not load conversations:', err);
      }
    };
    load();
  }, [activeConversationId, chatbotEnabled, selectConversation]);

  const createNewConversation = async () => {
    if (!chatbotEnabled) return;
    try {
      const title = `Hội thoại ${new Date().toLocaleDateString('vi-VN')}`;
      const res = await chatbotService.createConversation(title);
      const newConv = res.data?.data || res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      setShowActions(true);
    } catch (err) {
      console.error('Create conversation failed:', err);
    }
  };

  const handleDeleteConversation = async (conversationId = activeConversationId) => {
    if (!chatbotEnabled || !conversationId || deletingConversationId) return;

    const conversation = conversations.find((c) => c.id === conversationId);
    const title = conversation?.title || 'Cuộc hội thoại';
    const confirmed = window.confirm(
      `Xóa lịch sử hội thoại "${title}"?\n\nToàn bộ tin nhắn trong hội thoại này sẽ bị xóa và không thể hoàn tác.`
    );

    if (!confirmed) return;

    setDeletingConversationId(conversationId);
    try {
      await chatbotService.deleteConversation(conversationId);
      const nextConversations = conversations.filter((c) => c.id !== conversationId);
      setConversations(nextConversations);

      if (conversationId === activeConversationId) {
        const nextActiveConversationId = nextConversations[0]?.id || null;

        if (nextActiveConversationId) {
          await selectConversation(nextActiveConversationId);
        } else {
          setActiveConversationId(null);
          setMessages([]);
          setShowActions(true);
        }
      }
    } catch (err) {
      console.error('Delete conversation failed:', err);
      window.alert('Không thể xóa lịch sử hội thoại. Vui lòng thử lại.');
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleSend = async (text = input) => {
    if (!chatbotEnabled) return;
    const trimmed = (text || '').trim();
    if (!trimmed || isTyping) return;

    setShowActions(false);

    let convId = activeConversationId;
    if (!convId) {
      try {
        const title = trimmed.substring(0, 40) + (trimmed.length > 40 ? '...' : '');
        const res = await chatbotService.createConversation(title);
        const newConv = res.data?.data || res.data;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        convId = newConv.id;
      } catch {
        /* ignore */
      }
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await chatbotService.sendMessage(trimmed, convId);
      const aiText =
        res.data?.data?.message ||
        res.data?.reply ||
        res.data?.message ||
        'Xin lỗi, tôi không thể trả lời ngay bây giờ.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: aiText, time: new Date().toISOString() },
      ]);
      const cRes = await chatbotService.getConversations();
      setConversations(cRes.data?.data || cRes.data || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const hasMessages = messages.length > 0;

  if (!chatbotEnabled) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Card className="max-w-md rounded-2xl border-slate-200 p-8 text-center shadow-sm">
          <CardContent className="p-0">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
              <Bot className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Career Advisor đang tạm dừng</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admin đã tắt chatbot. Bạn có thể quay lại khi tính năng được mở lại.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/candidate/jobs">Xem việc làm</Link>
              </Button>
              <Button asChild className="rounded-xl bg-primary">
                <Link to="/candidate/dashboard">Về tổng quan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-50 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative flex h-[calc(100vh-7rem)] min-h-[720px] flex-col lg:flex-row">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200/80 bg-white/82 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="border-b border-slate-200/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge
                  variant="emerald"
                  className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <Sparkles className="h-3.5 w-3.5" /> AI Career Copilot
                </Badge>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                  Career Assistant
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Tư vấn nghề nghiệp, CV, phỏng vấn và lộ trình phát triển cá nhân.
                </p>
              </div>
            </div>
            <Button
              className="mt-5 w-full rounded-2xl bg-slate-950 text-white shadow-sm hover:bg-slate-800"
              onClick={createNewConversation}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cuộc hội thoại mới
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                <History className="h-3.5 w-3.5" /> Lịch sử
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {conversations.length}
              </span>
            </div>

            {conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.slice(0, 12).map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  return (
                    <div
                      key={conversation.id}
                      className={`group flex w-full items-stretch rounded-2xl border transition-all ${
                        active
                          ? 'border-emerald-200 bg-emerald-50/90 shadow-sm'
                          : 'border-transparent bg-slate-50/80 hover:border-slate-200 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectConversation(conversation.id)}
                        className="min-w-0 flex-1 p-3 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-slate-500 ring-1 ring-slate-200'
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {conversation.title || 'Cuộc hội thoại'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatConversationTime(
                                conversation.updated_at || conversation.created_at
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(conversation.id)}
                        disabled={deletingConversationId === conversation.id}
                        className={`m-2 flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-xl text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-50 group-hover:opacity-100 ${active ? 'opacity-100' : ''}`}
                        aria-label={`Xóa lịch sử hội thoại ${conversation.title || 'Cuộc hội thoại'}`}
                        title="Xóa lịch sử hội thoại"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">Chưa có lịch sử</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Bắt đầu cuộc trò chuyện để lưu lại các tư vấn quan trọng.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200/80 p-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <ShieldCheck className="h-4 w-4" /> Gợi ý sử dụng
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-700/80">
                Cung cấp vai trò, kinh nghiệm, kỹ năng và mục tiêu nghề nghiệp để nhận tư vấn sát
                thực tế hơn.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200/80 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 lg:hidden">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-950 sm:text-xl">
                        {activeTitle}
                      </h2>
                      <Badge
                        variant="emerald"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        Đang hoạt động
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Phân tích gap kỹ năng • Gợi ý việc làm • Luyện phỏng vấn • Dự đoán lương • Lộ
                      trình học
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  Sẵn sàng tư vấn
                </div>
                <Button
                  variant="outline"
                  className="hidden rounded-xl border-slate-200 bg-white lg:inline-flex"
                  onClick={createNewConversation}
                >
                  <Plus className="mr-2 h-4 w-4" /> Tạo mới
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl border-slate-200 bg-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={createNewConversation}>
                      <Plus className="mr-2 h-4 w-4" />
                      Cuộc hội thoại mới
                    </DropdownMenuItem>
                    {activeConversationId && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteConversation(activeConversationId)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa lịch sử hội thoại
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/candidate/dashboard" className="flex items-center gap-2">
                        <ChevronRight className="mr-2 h-4 w-4" />
                        Về tổng quan
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              {!hasMessages && !loadingHistory && showActions && (
                <div className="mx-auto max-w-6xl space-y-6">
                  <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)]">
                    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="p-6 sm:p-8">
                        <Badge
                          variant="primary"
                          className="border-primary/20 bg-primary/10 text-primary"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Trợ lý nghề nghiệp cá nhân
                        </Badge>
                        <EmptyState
                          variant="robotChat"
                          title={`Chào ${user?.first_name || 'bạn'}! Tôi là Career Assistant`}
                          description="Tôi giúp bạn biến mục tiêu nghề nghiệp thành kế hoạch hành động: phân tích hồ sơ, tối ưu CV, luyện phỏng vấn, dự đoán lương và đề xuất lộ trình học tập."
                          className="items-start py-5 text-left [&>div]:mx-0"
                        />
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          {TRUST_SIGNALS.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.label}
                                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                              >
                                <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {item.value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                              Workflow đề xuất
                            </p>
                            <h3 className="mt-2 text-2xl font-bold text-white">
                              Từ mục tiêu đến hành động
                            </h3>
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                            <PanelRightOpen className="h-5 w-5 text-emerald-300" />
                          </div>
                        </div>
                        <div className="mt-7 space-y-4">
                          {[
                            'Đánh giá hồ sơ và kinh nghiệm hiện tại',
                            'Chọn vai trò mục tiêu và khoảng lương mong muốn',
                            'Nhận lộ trình kỹ năng, CV và phỏng vấn theo từng bước',
                          ].map((step, index) => (
                            <div key={step} className="flex gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-slate-950">
                                {index + 1}
                              </div>
                              <p className="text-sm leading-6 text-slate-200">{step}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm font-semibold text-white">Mẫu câu hỏi tốt</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            “Tôi có 2 năm React, muốn lên Middle Frontend trong 6 tháng. Hãy phân
                            tích gap kỹ năng và lập kế hoạch học.”
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Chủ đề gợi ý
                      </p>
                      <p className="text-xs text-slate-500">Chọn một kịch bản để bắt đầu nhanh</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {SUGGESTED_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.title}
                            type="button"
                            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
                            onClick={() => handleSend(card.text)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all ${toneClasses[card.tone]}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                                  {card.title}
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {card.subtitle}
                                </p>
                              </div>
                              <ChevronRight className="mt-1 h-4 w-4 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {FEATURE_LINKS.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <Link key={feat.to} to={feat.to} className="group">
                          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/5">
                            <CardContent className="flex items-center gap-4 p-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200 transition-all group-hover:bg-slate-950 group-hover:text-white">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900">{feat.label}</p>
                                <p className="mt-1 text-sm text-slate-500">{feat.desc}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-700" />
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {loadingHistory && (
                <div className="flex justify-center py-16">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                </div>
              )}

              {hasMessages && (
                <div className="mx-auto max-w-5xl space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-emerald-600 ring-1 ring-emerald-100'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex flex-col ${msg.sender === 'user' ? 'max-w-[85%] items-end' : 'max-w-[min(100%,48rem)] items-start'}`}
                      >
                        <div className="mb-1 flex items-center gap-2 px-1">
                          <span className="text-xs font-semibold text-slate-500">
                            {msg.sender === 'user' ? 'Bạn' : 'Career Assistant'}
                          </span>
                          {msg.time && (
                            <span className="text-[11px] text-slate-400">
                              {formatConversationTime(msg.time)}
                            </span>
                          )}
                        </div>
                        <div
                          className={`rounded-3xl text-sm leading-7 shadow-sm ${
                            msg.sender === 'user'
                              ? 'rounded-tr-lg bg-slate-950 px-5 py-3 text-white'
                              : 'rounded-tl-lg border border-slate-200 bg-white px-5 py-4 text-slate-700'
                          }`}
                        >
                          {msg.sender === 'ai' ? <AiMessageMarkdown text={msg.text} /> : msg.text}
                        </div>
                        {msg.sender === 'ai' && (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" /> Hữu ích
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" /> Không hữu ích
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-900"
                              onClick={() => handleCopy(msg.text)}
                            >
                              <Copy className="h-3.5 w-3.5" /> Sao chép
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="mx-auto mt-6 flex max-w-5xl gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-3xl rounded-tl-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-slate-200/80 bg-white/88 p-4 backdrop-blur-xl sm:px-6">
              <div className="mx-auto max-w-5xl">
                <div className="flex items-end gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.65)] transition-all focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100/70">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi về sự nghiệp: phân tích kỹ năng, gợi ý việc, luyện phỏng vấn..."
                    rows={1}
                    className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <Button
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:shadow-none"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    aria-label="Gửi tin nhắn"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Career Assistant có thể đưa ra câu trả lời chưa chính xác.</span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
                  <span>Luôn kiểm chứng thông tin trước khi ra quyết định nghề nghiệp.</span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </section>
  );
};

export default ChatCareerPage;
