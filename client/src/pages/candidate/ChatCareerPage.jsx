import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  User,
  Bot,
  FileText,
  Briefcase,
  UserCircle,
  Share2,
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import chatbotService from '../../services/chatbotService';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import { Button } from '@/components/ui/button';
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
    subtitle: 'Hệ thống phân tích điểm mạnh và gap kỹ năng của bạn.',
    text: 'Hãy phân tích hồ sơ của tôi và chỉ ra điểm mạnh, điểm yếu và những kỹ năng còn thiếu để tôi có thể phát triển sự nghiệp tốt hơn.',
  },
  {
    icon: Briefcase,
    title: 'Gợi ý việc làm',
    subtitle: 'Tìm kiếm công việc phù hợp với kỹ năng và kinh nghiệm.',
    text: 'Dựa trên kỹ năng và kinh nghiệm của tôi, hãy gợi ý các vị trí việc làm phù hợp và cách ứng tuyển hiệu quả.',
  },
  {
    icon: DollarSign,
    title: 'Dự đoán lương',
    subtitle: 'Biết mức lương phù hợp với thị trường hiện tại.',
    text: 'Hãy phân tích mức lương phù hợp cho vị trí lập trình viên cấp cao tại Việt Nam, dựa trên thị trường và kinh nghiệm hiện tại.',
  },
  {
    icon: GraduationCap,
    title: 'Lộ trình học tập',
    subtitle: 'Xây dựng lộ trình phát triển kỹ năng cá nhân.',
    text: 'Hãy xây dựng lộ trình học tập 6 tháng để tôi có thể chuyển từ lập trình viên mới sang lập trình viên cấp cao, bao gồm các kỹ năng và tài liệu cụ thể.',
  },
  {
    icon: MessageSquare,
    title: 'Luyện phỏng vấn',
    subtitle: 'Giả lập phỏng vấn và phản hồi kỹ năng trả lời.',
    text: 'Hãy đóng vai nhà tuyển dụng và đặt cho tôi các câu hỏi phỏng vấn phổ biến cho vị trí lập trình viên giao diện người dùng. Sau mỗi câu trả lời hãy cho tôi nhận xét chi tiết.',
  },
  {
    icon: FileText,
    title: 'Tối ưu CV theo JD',
    subtitle: 'Gợi ý chỉnh sửa CV phù hợp với JD cụ thể.',
    text: 'Tôi đang ứng tuyển vị trí lập trình viên full-stack. Hãy gợi ý cách tối ưu CV của tôi để tăng tỷ lệ được duyệt, bao gồm các từ khóa cần thêm và cách mô tả kinh nghiệm hiệu quả hơn.',
  },
];

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
        <Card className="max-w-md rounded-xl p-8 text-center">
          <CardContent>
            <Bot className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h1 className="text-xl font-bold text-foreground">Career Advisor đang tạm dừng</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Admin đã tắt chatbot. Bạn có thể quay lại khi tính năng được mở lại.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to="/candidate/jobs">Xem việc làm</Link>
              </Button>
              <Button asChild className="rounded-lg bg-primary">
                <Link to="/candidate/dashboard">Về dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-card">
      {/* Top bar */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-500" />
            <p className="truncate text-base font-bold text-foreground">
              Career Assistant
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={createNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cuộc hội thoại mới
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/candidate/dashboard" className="flex items-center gap-2">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Về Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Phân tích gap kỹ năng • Gợi ý việc làm • Luyện phỏng vấn • Dự đoán lương • Lộ trình học
        </p>
      </div>

      {/* Messages + Welcome */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Welcome + Quick Actions */}
        {!hasMessages && !loadingHistory && showActions && (
          <div className="space-y-6">
            <EmptyState
              variant="robotChat"
              title={`Chào ${user?.first_name || 'bạn'}! Tôi là Career Assistant`}
              description="Tôi có thể giúp bạn phân tích hồ sơ, gợi ý việc làm, luyện phỏng vấn, dự đoán lương và xây dựng lộ trình học tập."
              className="py-4"
            />

            {/* Suggested Topics */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Chủ đề gợi ý
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SUGGESTED_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={card.title}
                      className="cursor-pointer rounded-xl border bg-muted/30 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md group"
                      onClick={() => handleSend(card.text)}
                    >
                      <CardContent className="p-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all mb-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-700 transition-colors">{card.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Feature links */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { to: '/ai-cv-scanner', icon: FileText, label: 'CV Scanner', desc: 'Phân tích CV' },
                { to: '/salary-predictor', icon: DollarSign, label: 'Dự đoán lương', desc: 'Biết mức lương phù hợp' },
              ].map(feat => {
                const Icon = feat.icon;
                return (
                  <Link key={feat.to} to={feat.to}>
                    <Card className="cursor-pointer rounded-xl border bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                          <Icon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{feat.label}</p>
                          <p className="text-xs text-slate-400">{feat.desc}</p>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {loadingHistory && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-6 flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              {msg.sender === 'user' ? (
                <User className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bot className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            <div className={`flex flex-col ${msg.sender === 'user' ? 'max-w-[85%] items-end' : 'max-w-[min(100%,46rem)] items-start'}`}>
              <div
                className={`rounded-xl text-sm leading-relaxed ${msg.sender === 'user'
                  ? 'bg-emerald-500 text-white px-4 py-3'
                  : 'border border-border/80 bg-card px-5 py-4 shadow-sm'
                  }`}
              >
                {msg.sender === 'ai' ? <AiMessageMarkdown text={msg.text} /> : msg.text}
              </div>
              {msg.sender === 'ai' && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <button type="button" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                    <ThumbsUp className="h-3.5 w-3.5" /> Hữu ích
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <ThumbsDown className="h-3.5 w-3.5" /> Không hữu ích
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleCopy(msg.text)}>
                    <Copy className="h-3.5 w-3.5" /> Sao chép
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mb-6 flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="rounded-xl border bg-card px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2 focus-within:border-emerald-400/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về sự nghiệp: phân tích kỹ năng, gợi ý việc, luyện phỏng vấn..."
            rows={1}
            className="min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full bg-emerald-500 hover:bg-emerald-600"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          <p className="text-xs text-muted-foreground">
            Career Assistant • Có thể đưa ra câu trả lời chưa chính xác
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatCareerPage;
