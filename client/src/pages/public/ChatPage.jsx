import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  MessageCircle,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useChat } from '../../context/ChatContext';
import AiMessageMarkdown from '../../components/chatbot/AiMessageMarkdown';

const ClockIcon = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

ClockIcon.propTypes = {
  size: PropTypes.number,
};

ClockIcon.defaultProps = {
  size: 16,
};

const defaultSuggestions = [
  { icon: <Briefcase size={16} />, text: 'Gợi ý việc làm React tại Hà Nội', key: 's1' },
  { icon: <FileText size={16} />, text: 'Cách viết CV cho lập trình viên giao diện cấp cao', key: 's2' },
  { icon: <Zap size={16} />, text: 'Dự báo lương ngành IT năm 2026', key: 's3' },
];

const ChatPage = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const {
    activeConversation,
    chatbotEnabled,
    conversations,
    fetchConversations,
    fetchHistory,
    isLoading,
    messages,
    sendMessage,
    suggestedQuestions,
    switchConversation,
  } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const suggestionItems =
    suggestedQuestions?.length > 0
      ? suggestedQuestions.slice(0, 3).map((q, index) => {
        const text = typeof q === 'string' ? q : (q?.content ?? q?.title ?? String(q));
        return {
          icon: defaultSuggestions[index]?.icon || <Sparkles size={16} />,
          text,
          key: typeof q === 'object' && q?.title ? q.title : text || index,
        };
      })
      : defaultSuggestions;

  if (!chatbotEnabled) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-xl border border-primary-200 bg-primary-50 p-10 text-center shadow-sm">
          <Sparkles className="mx-auto mb-4 text-primary-500" size={36} />
          <h1 className="text-3xl font-bold text-slate-900">AI chatbot tạm thời đang tắt</h1>
          <p className="mt-3 text-base font-medium text-slate-600">
            Admin đã tạm tắt chatbot. Bạn vẫn có thể dùng các tính năng khác và quay lại sau.
          </p>
          <div className="mt-6">
            <Link
              to="/jobs"
              className="inline-flex items-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              Khám phá việc làm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] items-stretch bg-white">
        <aside className="hidden w-80 flex-col border-r border-slate-200 bg-slate-50 lg:flex">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900">Hội thoại AI</h2>
            <p className="mb-6 mt-2 text-base font-medium leading-relaxed text-slate-500">
              Lịch sử được lưu theo tài khoản để bạn xem lại.
            </p>
            <div className="relative mb-6">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm hội thoại..."
                className="w-full rounded-xl bg-slate-100 py-3 pl-10 pr-4 text-sm font-medium outline-none text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-primary-500/20"
                readOnly
              />
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 p-4 text-sm font-bold text-primary">
              <div className="flex items-center gap-3">
                <MessageCircle size={18} />
                Hội thoại hiện tại
              </div>
              <Badge variant="primary" className="text-sm">
                ĐANG MỞ
              </Badge>
            </div>

            <div className="space-y-1">
              {conversations.length > 0 ? (
                conversations.slice(0, 6).map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => switchConversation(conversation.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-4 text-left text-sm font-medium transition-colors ${activeConversation === conversation.id
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-muted/35'
                      }`}
                  >
                    <ClockIcon size={16} />
                    <span className="line-clamp-1">{conversation.title || 'Hội thoại mới'}</span>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                  Chưa có lịch sử hội thoại.
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto border-t border-slate-50 p-6">
            <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white">
              <Sparkles size={60} className="absolute -bottom-4 -right-4 opacity-10" />
              <p className="mb-4 text-base font-bold">Trợ lý HireBOT</p>
              <p className="mb-6 text-base text-white/80">
                Trò chuyện qua cổng kết nối để đồng bộ xác thực, lịch sử và cờ tính năng.
              </p>
              <Button
                variant="secondary"
                className="w-full border-none bg-white py-2 text-sm font-bold text-primary"
              >
                Đang kết nối cổng hệ thống
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <Link to="/" className="rounded-xl p-2 hover:bg-muted/35 lg:hidden">
                <ArrowLeft size={20} />
              </Link>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="leading-tight text-slate-900 font-bold">Trợ lý thông minh HireBOT</h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  <span className="text-sm font-bold uppercase tracking-normal text-slate-400">
                    Trò chuyện đã đồng bộ
                  </span>
                </div>
                <p className="mt-1.5 max-w-md text-base text-slate-500 lg:hidden">
                  Lịch sử được lưu theo tài khoản để bạn xem lại.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl p-3 text-slate-400 transition-colors hover:bg-muted/35">
                <Trash2 size={20} />
              </button>
              <button className="rounded-xl p-3 text-slate-400 transition-colors hover:bg-muted/35">
                <Settings size={20} />
              </button>
            </div>
          </header>

          <div className="custom-scrollbar flex-1 overflow-y-auto space-y-8 p-8">
            {messages.length === 0 && (
              <div className="mx-auto max-w-2xl py-20 text-center">
                <div className="mx-auto mb-8 flex h-20 w-20 animate-bounce items-center justify-center rounded-[32px] bg-white text-primary shadow-2xl shadow-primary/10">
                  <Sparkles size={40} />
                </div>
                <h1 className="mb-4 text-3xl font-bold text-slate-900">
                  Xin chào, mình có thể giúp gì cho bạn?
                </h1>
                <p className="mb-12 font-medium text-slate-500">
                  Hỏi về sự nghiệp, CV, phỏng vấn hoặc tìm kiếm công việc phù hợp.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {suggestionItems.map((suggestion, idx) => (
                    <button
                      key={suggestion.key ?? `suggestion-${idx}`}
                      onClick={() => setInput(suggestion.text)}
                      className="group rounded-[28px] border border-slate-100 bg-white p-6 text-left transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/5"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        {suggestion.icon}
                      </div>
                      <p className="text-base font-bold leading-relaxed text-slate-700">
                        {suggestion.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.isAi ? 'justify-start' : 'justify-end'}`}
              >
                {message.isAi && (
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <Sparkles size={18} />
                  </div>
                )}
                <div
                  className={`max-w-[min(100%,42rem)] rounded-[28px] shadow-sm md:text-base ${message.isAi
                      ? 'rounded-tl-none border border-slate-100 bg-white p-6 text-slate-700'
                      : 'rounded-tr-none bg-primary p-6 text-sm font-medium leading-relaxed text-white'
                    }`}
                >
                  {message.isAi ? <AiMessageMarkdown text={message.text} /> : message.text}
                </div>
                {!message.isAi && (
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Sparkles size={18} />
                </div>
                <div className="flex items-center gap-1 rounded-[28px] rounded-tl-none border border-slate-100 bg-white p-6">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary delay-75" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleSend} className="group relative mx-auto max-w-4xl">
              <textarea
                rows="2"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                placeholder="Hỏi bất cứ điều gì về sự nghiệp của bạn..."
                className="custom-scrollbar max-h-40 w-full resize-none rounded-[32px] border border-slate-200 bg-white py-5 pl-6 pr-24 font-medium text-slate-700 shadow-2xl shadow-primary/5 outline-none transition-all focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
              />
              <div className="absolute bottom-1.5 right-3 flex gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            <p className="mt-4 text-center text-base font-bold uppercase tracking-normal text-slate-400">
              AI có thể đưa ra câu trả lời không chính xác. Hãy kiểm tra lại thông tin quan trọng.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
