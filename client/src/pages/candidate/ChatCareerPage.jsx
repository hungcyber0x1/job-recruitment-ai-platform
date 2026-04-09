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
  Paperclip,
  Mic,
  Plus,
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
    icon: FileText,
    title: 'Tư vấn sửa CV',
    subtitle: 'Phân tích và gợi ý cải thiện CV chuyên nghiệp hơn.',
    text: 'Tôi muốn được tư vấn sửa CV để chuyên nghiệp hơn. Bạn có thể phân tích và gợi ý cải thiện các phần kinh nghiệm, kỹ năng không?',
  },
  {
    icon: Briefcase,
    title: 'Gợi ý việc làm',
    subtitle: 'Tìm kiếm công việc phù hợp với kỹ năng và kinh nghiệm.',
    text: 'Dựa trên kỹ năng và kinh nghiệm của tôi, hãy gợi ý các vị trí việc làm phù hợp và cách ứng tuyển hiệu quả.',
  },
  {
    icon: UserCircle,
    title: 'Luyện tập phỏng vấn',
    subtitle: 'Giả lập phỏng vấn và phản hồi kỹ năng trả lời.',
    text: 'Hãy đóng vai nhà tuyển dụng và đặt cho tôi các câu hỏi phỏng vấn phổ biến. Sau mỗi câu trả lời hãy cho tôi nhận xét.',
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
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title || 'Cuộc hội thoại mới';

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const selectConversation = useCallback(async (convId) => {
    setActiveConversationId(convId);
    setMessages([]);
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
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Chào ${user?.first_name || 'bạn'}! Tôi đã sẵn sàng hỗ trợ bạn. Bạn muốn bắt đầu với chủ đề nào?`,
          time: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Create conversation failed:', err);
    }
  };

  const handleSend = async (text = input) => {
    if (!chatbotEnabled) return;
    const trimmed = (text || '').trim();
    if (!trimmed || isTyping) return;

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
            <h1 className="text-xl font-bold text-foreground">AI Career Advisor đang tạm dừng</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Admin đã tắt chatbot. Bạn có thể quay lại khi tính năng được mở lại.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to="/candidate/career-roadmap">Xem lộ trình</Link>
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
          <p className="truncate text-sm font-medium text-foreground">
            Cuộc hội thoại: {activeTitle}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Lịch sử được lưu theo tài khoản để bạn xem lại.
        </p>
      </div>

      {/* Messages + Welcome */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!hasMessages && !loadingHistory && (
          <div className="flex flex-col items-center text-center">
            <EmptyState
              variant="robotChat"
              title="Chào bạn, hôm nay tôi có thể giúp gì cho sự nghiệp của bạn?"
              description="Hãy bắt đầu bằng việc chọn một tác vụ hoặc đặt câu hỏi trực tiếp cho tôi."
              className="py-6"
            />
            <div className="mt-4 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
              {SUGGESTED_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.title}
                    className="cursor-pointer rounded-xl border bg-muted/30 transition-colors hover:border-primary/30 hover:bg-muted/50"
                    onClick={() => handleSend(card.text)}
                  >
                    <CardContent className="p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                    </CardContent>
                  </Card>
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
                <Bot className="h-4 w-4 text-primary" />
              )}
            </div>
            <div
              className={`flex flex-col ${msg.sender === 'user' ? 'max-w-[85%] items-end' : 'max-w-[min(100%,42rem)] items-start'}`}
            >
              <div
                className={`rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary/15 text-foreground px-4 py-3'
                    : 'border border-border/80 bg-card px-5 py-4 shadow-sm'
                }`}
              >
                {msg.sender === 'ai' ? <AiMessageMarkdown text={msg.text} /> : msg.text}
              </div>
              {msg.sender === 'ai' && (
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <button type="button" className="flex items-center gap-1 hover:text-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" /> Hữu ích
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-foreground">
                    <ThumbsDown className="h-3.5 w-3.5" /> Không hữu ích
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleCopy(msg.text)}
                  >
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
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary animate-bounce"
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
        <div className="flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2 focus-within:border-primary/50">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi bất cứ điều gì về sự nghiệp của bạn..."
            rows={1}
            className="min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Career AI có thể đưa ra câu trả lời chưa chính xác. Hãy kiểm tra các thông tin quan trọng.
        </p>
        <p className="mt-1 text-center text-[11px] text-muted-foreground/90">
          Lịch sử được lưu theo tài khoản để bạn xem lại.
        </p>
      </div>
    </div>
  );
};

export default ChatCareerPage;
