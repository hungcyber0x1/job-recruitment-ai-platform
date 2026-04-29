import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import { useAuth } from '../../context/AuthContext';
import AiMessageMarkdown from './AiMessageMarkdown';
import CVAnalysisModal from './CVAnalysisModal';
import chatbotService from '../../services/chatbotService';
import {
  X,
  Send,
  Sparkles,
  Bot,
  MessageCircle,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Role-aware default prompts for quick actions */
const ROLE_DEFAULT_PROMPTS = {
  candidate: [
    'Gợi ý cải thiện CV cho vị trí IT',
    'Kỹ năng nào đang được săn đón?',
    'Chuẩn bị phỏng vấn hiệu quả',
  ],
  employer: [
    'Viết tin tuyển dụng hấp dẫn cho vị trí IT',
    'Cách sàng lọc ứng viên hiệu quả',
    'Benchmark lương cho lập trình viên 2025',
  ],
  admin: [
    'Dashboard platform stats',
    'Review flagged jobs',
    'Chatbot analytics',
    'Active users today',
    'Pending job approvals',
    'Support tickets overview',
  ],
};

/** Role-aware descriptions */
const ROLE_DESCRIPTIONS = {
  candidate: 'Tư vấn nghề nghiệp, gợi ý CV & phỏng vấn — hỗ trợ tham khảo, không thay thế recruiter.',
  employer: 'Trợ lý tuyển dụng thông minh: viết JD, sàng lọc ứng viên, benchmark lương — tham khảo, không thay quyết định.',
  admin: 'Trợ lý vận hành nền tảng: xem dashboard, quản lý users/jobs/applications, analytics, cấu hình chatbot — dữ liệu thực từ hệ thống.',
};

/** Role-aware what-I-can-do lists */
const ROLE_CAN_DO = {
  candidate: [
    '✓ Gợi ý lộ trình phát triển sự nghiệp',
    '✓ Hướng dẫn tối ưu CV & phỏng vấn',
    '✓ Giải thích kỹ năng & xu hướng nghề',
    '✓ Gợi ý cách điều chỉnh hồ sơ theo mục tiêu nghề nghiệp',
  ],
  employer: [
    '✓ Viết & tối ưu tin tuyển dụng (JD)',
    '✓ Gợi ý câu hỏi sàng lọc ứng viên',
    '✓ Benchmark lương theo thị trường',
    '✓ Tư vấn quy trình tuyển dụng hiệu quả',
  ],
  admin: [
    '✓ Dashboard & platform analytics',
    '✓ Manage users (lock/unlock/status)',
    '✓ Review flagged jobs & companies',
    '✓ Monitor chatbot conversations',
    '✓ System settings & feature flags',
  ],
};

const DEFAULT_PROMPTS = ROLE_DEFAULT_PROMPTS['candidate'];

// Map prompt keys to friendly display titles
const PROMPT_TITLE_MAP = {
  chatbot_greeting: 'Tìm việc làm phù hợp',
  resume_screening: 'Gợi ý cải thiện CV',
  interview_prep: 'Chuẩn bị phỏng vấn',
  salary_negotiation: 'Đàm phán lương hiệu quả',
  career_advice: 'Tư vấn lộ trình nghề',
  skill_gap: 'Phân tích kỹ năng',
};

// Get friendly title from prompt
const getPromptTitle = (prompt) => {
  if (!prompt) return '';
  // If prompt has a title property, use it
  if (prompt.title && prompt.title.length < 50) {
    return prompt.title;
  }
  // If prompt has content/proMPTlate, use first 50 chars
  if (prompt.content || prompt.prompt_template) {
    const text = prompt.content || prompt.prompt_template;
    return text.length > 50 ? text.slice(0, 50) + '...' : text;
  }
  // Fallback to PROMPT_TITLE_MAP
  if (prompt.id && PROMPT_TITLE_MAP[prompt.id]) {
    return PROMPT_TITLE_MAP[prompt.id];
  }
  // Last resort: stringified prompt
  return String(prompt).slice(0, 50);
};

const MAX_MESSAGE_LENGTH = 5000; // Prevent infinite text loops

const ChatWidget = () => {
  const { isEnabled } = useFeatureFlags();
  const hireAiEnabled = isEnabled('ai_chatbot');

  const { messages, sendMessage, isLoading, suggestedQuestions } = useChat();
  const { user } = useAuth();
  const userRole = (user?.role || 'candidate').toLowerCase().trim();

  const roleDefaultPrompts = ROLE_DEFAULT_PROMPTS[userRole] || ROLE_DEFAULT_PROMPTS['candidate'];
  const roleDesc = ROLE_DESCRIPTIONS[userRole] || ROLE_DESCRIPTIONS['candidate'];
  const roleCanDo = ROLE_CAN_DO[userRole] || ROLE_CAN_DO['candidate'];
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({}); // { [messageId]: 'up' | 'down' }
  const messagesEndRef = useRef(null);
  const quickPrompts = suggestedQuestions?.length > 0 ? suggestedQuestions : roleDefaultPrompts;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Safe text truncation to prevent infinite loops
  const safeText = (text, maxLen = MAX_MESSAGE_LENGTH) => {
    if (!text) return '';
    const str = String(text);
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  };

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
            aria-label="Mở trợ lý HireBOT"
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
            aria-label="Trợ lý tuyển dụng HireBOT"
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
                      <h3 className="text-base font-semibold tracking-normal text-white">
                        HireBOT Assistant
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 pl-2 pr-2.5 py-0.5 ring-1 ring-emerald-400/25">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-45" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-sm font-semibold uppercase tracking-normal text-emerald-200/95">
                          Đang hoạt động
                        </span>
                      </span>
                    </div>
                    <p className="text-base sm:text-base text-slate-400 mt-1 leading-snug max-w-[18rem]">
                      {roleDesc}
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
                        <div className="absolute inset-0 rounded-xl bg-emerald-500/18 blur-xl scale-110" />
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-200/70 shadow-lg shadow-emerald-900/5 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-base tracking-normal">
                        Xin chào, {user?.firstName || user?.first_name || 'bạn'}!
                      </h4>
                      <p className="text-base text-slate-600 mt-1.5 max-w-[17rem] leading-relaxed">
                        Tôi là HireBOT — trợ lý {userRole === 'admin' ? 'vận hành' : userRole === 'employer' ? 'tuyển dụng' : 'tư vấn nghề nghiệp'}. Tôi có thể giúp bạn:
                      </p>
                      <ul className="text-left text-sm text-slate-600 mt-2 space-y-1 max-w-[17rem]">
                        {roleCanDo.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-left text-xs text-amber-600 mt-3 max-w-[17rem] bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                        ⚠️ Lưu ý: Tôi chỉ tư vấn tham khảo, không quyết định tuyển dụng.
                      </p>
                      <div className="w-full mt-5 space-y-2">
                        <p className="text-base font-semibold uppercase tracking-normal text-slate-400 text-left w-full">
                          Gợi ý nhanh
                        </p>
                        <div className="flex flex-col gap-2">
                          {quickPrompts.slice(0, 4).map((q, idx) => {
                            const promptText = getPromptTitle(q);
                            const displayText =
                              promptText.length > 100
                                ? promptText.slice(0, 100) + '...'
                                : promptText;
                            return (
                              <button
                                key={`prompt-${q.id || q.title || ''}-${idx}`}
                                type="button"
                                onClick={() => handleQuickPrompt(promptText)}
                                disabled={isLoading}
                                className="text-left text-sm sm:text-base leading-snug px-3.5 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 text-slate-700 hover:border-emerald-300/80 hover:bg-primary/10 hover:text-emerald-950 transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                              >
                                {displayText}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* CV Analysis Action Card */}
                      <button
                        type="button"
                        onClick={() => {
                          setCvModalOpen(true);
                        }}
                        className="w-full mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 hover:border-emerald-400/60 hover:from-emerald-100 hover:to-teal-100 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200/50 group-hover:shadow-emerald-300/60 transition-shadow">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-emerald-900">Phân tích CV</p>
                          <p className="text-xs text-emerald-700/80">
                            Upload CV để nhận gợi ý phù hợp
                          </p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex w-full ${msg.isAi ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`w-fit min-w-0 break-words ${msg.isAi
                              ? 'max-w-[min(100%,36rem)] rounded-xl rounded-tl-md bg-white border border-slate-200/90 px-5 py-4 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]'
                              : 'max-w-[88%] rounded-xl rounded-tr-md bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-2.5 text-base leading-relaxed text-white shadow-md shadow-emerald-900/18 ring-1 ring-white/15 text-left'
                            }`}
                        >
                          {msg.isAi ? (
                            <>
                              <AiMessageMarkdown text={safeText(msg.text)} />
                              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text).then(() => {
                                      setCopiedId(msg.id);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    });
                                  }}
                                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                                  aria-label="Copy message"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check size={12} className="text-emerald-500" /> Đã copy
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Copy
                                    </>
                                  )}
                                </button>
                                <span className="mx-1 text-slate-200">|</span>
                                <button
                                  onClick={() => {
                                    // Send feedback to analytics - thumbs up
                                    chatbotService.sendFeedback(msg.id, true).catch(() => { });
                                    // Visual feedback
                                    setFeedback(msg.id, 'up');
                                  }}
                                  className={`flex items-center gap-1 text-xs transition-colors ${feedback[msg.id] === 'up'
                                      ? 'text-emerald-600'
                                      : 'text-slate-400 hover:text-emerald-500'
                                    }`}
                                  aria-label="Tin nhắn hữu ích"
                                  title="Hữu ích"
                                >
                                  <ThumbsUp size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    // Send feedback to analytics - thumbs down
                                    chatbotService.sendFeedback(msg.id, false).catch(() => { });
                                    setFeedback(msg.id, 'down');
                                  }}
                                  className={`flex items-center gap-1 text-xs transition-colors ${feedback[msg.id] === 'down'
                                      ? 'text-red-500'
                                      : 'text-slate-400 hover:text-red-500'
                                    }`}
                                  aria-label="Tin nhắn không hữu ích"
                                  title="Không hữu ích"
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              </div>
                              {msg.isStreaming && (
                                <span className="inline-block w-2 h-4 ml-1 align-middle bg-emerald-500 animate-pulse rounded-sm" />
                              )}
                            </>
                          ) : (
                            <span className="text-base leading-relaxed">{safeText(msg.text)}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading &&
                    messages.length > 0 &&
                    !messages[messages.length - 1]?.isStreaming && (
                      <div className="flex justify-start">
                        <div className="bg-white px-5 py-4 rounded-xl rounded-tl-md border border-slate-200/90 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.1)] flex gap-1.5 items-center">
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
                  className="flex min-h-[3.25rem] items-center gap-2 rounded-xl border border-slate-200/95 bg-slate-50/80 px-2 py-2 shadow-inner shadow-slate-900/[0.02] transition-all duration-200 focus-within:border-emerald-400/70 focus-within:bg-white focus-within:shadow-md focus-within:shadow-emerald-900/[0.06] focus-within:ring-2 focus-within:ring-emerald-500/20"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !isLoading) {
                          const text = input;
                          setInput('');
                          sendMessage(text);
                        }
                      }
                    }}
                    placeholder="Nhập câu hỏi của bạn…"
                    className="min-h-[2.75rem] flex-1 min-w-0 rounded-xl border-0 bg-transparent px-3 py-2.5 text-base leading-snug text-slate-900 shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:min-h-0 sm:px-3.5 sm:py-2 sm:text-sm"
                    autoComplete="off"
                  />
                  {/* CV Analysis Button - only for candidates */}
                  {userRole === 'candidate' && (
                    <button
                      type="button"
                      onClick={() => setCvModalOpen(true)}
                      disabled={isLoading}
                      className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Phân tích CV"
                      title="Phân tích CV"
                    >
                      <FileText size={18} />
                    </button>
                  )}
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
              <p className="mt-2.5 flex items-start justify-center gap-2 text-xs text-slate-500 leading-relaxed text-center px-1">
                <ShieldCheck size={14} className="text-emerald-600/60 shrink-0 mt-0.5" />
                <span>
                  Tôi chỉ tư vấn tham khảo. Mọi quyết định quan trọng nên được xác minh thêm.
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CV Analysis Modal */}
      <CVAnalysisModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
      />
    </div>
  );
};

export default ChatWidget;
