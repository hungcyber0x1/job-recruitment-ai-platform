import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import AiMessageMarkdown from './AiMessageMarkdown';
import { X, Send, Sparkles, Bot, MessageCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_PROMPTS = [
  'Gợi ý cải thiện CV cho vị trí IT',
  'Kỹ năng nào đang được săn đón?',
  'Chuẩn bị phỏng vấn hiệu quả',
];

const ChatWidget = () => {
  const { isEnabled } = useFeatureFlags();
  const hireAiEnabled = isEnabled('ai_chatbot');

  const { messages, sendMessage, isLoading } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleQuickPrompt = async (text) => {
    if (isLoading) return;
    setInput('');
    await sendMessage(text);
  };

  if (!hireAiEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Mở trợ lý HireAI"
            className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-[0_12px_40px_-8px_rgba(5,150,105,0.55)] flex items-center justify-center hover:shadow-[0_16px_48px_-8px_rgba(5,150,105,0.65)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ring-2 ring-white/20"
          >
            <MessageCircle size={28} className="relative z-10" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 ring-2 ring-white" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Trợ lý tuyển dụng HireAI"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-[min(100vw-1.25rem,30rem)] sm:w-[30rem] lg:w-[32rem] h-[min(100vh-4.5rem,40rem)] sm:h-[min(92vh,44rem)] sm:min-h-[520px] max-h-[calc(100vh-4.5rem)] rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.22)] flex flex-col overflow-hidden backdrop-blur-md ring-1 ring-slate-900/5"
          >
            <div className="relative shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white border-b border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_100%_0%,rgba(16,185,129,0.14),transparent_55%)] pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-white/5 ring-1 ring-white/20 flex items-center justify-center shadow-lg shadow-black/20">
                    <Bot size={22} className="text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold tracking-tight text-white">
                        HireAI Assistant
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 pl-2 pr-2.5 py-0.5 ring-1 ring-emerald-400/25">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-45" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/95">
                          Đang hoạt động
                        </span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-xs text-slate-400 mt-1 leading-snug max-w-[18rem]">
                      Tư vấn tìm việc, CV và phỏng vấn — phản hồi theo ngữ cảnh của bạn.
                      <span className="mt-1 block text-slate-400/95">
                        Lịch sử được lưu theo tài khoản để bạn xem lại.
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/12 transition-colors ring-1 ring-transparent hover:ring-white/10"
                  aria-label="Đóng cửa sổ chat"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden">
              <div className="page-hero-bg page-hero-grain relative h-full min-h-0 overflow-y-auto">
                <div className="page-hero-pattern" aria-hidden />
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]"
                  aria-hidden
                />
                <div className="relative z-[2] space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center text-center pt-5 pb-2 px-1">
                      <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-2xl bg-emerald-500/18 blur-xl scale-110" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-200/70 shadow-lg shadow-emerald-900/5 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-base tracking-tight">
                        Xin chào
                      </h4>
                      <p className="text-sm text-slate-600 mt-1.5 max-w-[17rem] leading-relaxed">
                        Tôi là trợ lý tuyển dụng HireAI. Bạn cần gợi ý CV, việc làm hay phỏng vấn —
                        cứ nhắn hoặc chọn gợi ý nhanh bên dưới.
                      </p>
                      <div className="w-full mt-5 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 text-left w-full">
                          Gợi ý nhanh
                        </p>
                        <div className="flex flex-col gap-2">
                          {QUICK_PROMPTS.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => handleQuickPrompt(q)}
                              disabled={isLoading}
                              className="text-left text-xs sm:text-base leading-snug px-3.5 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 text-slate-700 hover:border-emerald-300/80 hover:bg-primary/10 hover:text-emerald-950 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex w-full ${msg.isAi ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`w-fit min-w-0 break-words ${
                            msg.isAi
                              ? 'max-w-[min(100%,36rem)] rounded-2xl rounded-tl-md bg-white border border-slate-200/90 px-5 py-4 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]'
                              : 'max-w-[88%] rounded-2xl rounded-tr-md bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2.5 text-base leading-relaxed text-white shadow-md shadow-emerald-900/18 ring-1 ring-white/15 text-left'
                          }`}
                        >
                          {msg.isAi ? (
                            <AiMessageMarkdown text={msg.text} />
                          ) : (
                            <span className="text-base leading-relaxed">{msg.text}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-md border border-slate-200/90 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.1)] flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/90 bg-white px-3 pb-4 pt-3 shadow-[0_-10px_40px_-12px_rgba(15,23,42,0.08)] sm:px-4 sm:pb-4 sm:pt-3.5">
              <form onSubmit={handleSend}>
                <div
                  role="presentation"
                  className="flex min-h-[3.25rem] items-center gap-2 rounded-2xl border border-slate-200/95 bg-slate-50/80 px-2 py-2 shadow-inner shadow-slate-900/[0.02] transition-all duration-200 focus-within:border-emerald-400/70 focus-within:bg-white focus-within:shadow-md focus-within:shadow-emerald-900/[0.06] focus-within:ring-2 focus-within:ring-emerald-500/20"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn…"
                    className="min-h-[2.75rem] flex-1 min-w-0 rounded-xl border-0 bg-transparent px-3 py-2.5 text-base leading-snug text-slate-900 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:min-h-0 sm:px-3.5 sm:py-2 sm:text-sm"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/25 ring-1 ring-white/20 transition-all hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send size={18} className={isLoading ? 'opacity-60' : ''} />
                  </button>
                </div>
              </form>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400 leading-snug text-center">
                <ShieldCheck size={12} className="text-emerald-600/50 shrink-0" />
                <span>Trợ lý có thể nhầm lẫn — hãy kiểm tra thông tin quan trọng.</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
