import PropTypes from 'prop-types';
import React, { useRef, useEffect } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatWindow = ({ messages, isLoading, onSendMessage, onClearHistory }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

      {/* Messages Header - Fixed */}
      <div className="px-8 py-5 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-100">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 leading-tight">HireAI Smart Assistant</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm uppercase font-bold text-slate-400 tracking-widest">
                Active Model v4.0
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClearHistory}
          className="p-2.5 rounded-xl hover:bg-destructive/10 text-slate-300 hover:text-red-500 transition-all"
          title="Làm mới cuộc hội thoại"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40 py-20">
              <Sparkles size={60} className="text-primary-600 mb-6 animate-pulse" />
              <p className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Bắt đầu trò chuyện
              </p>
              <p className="text-base font-medium text-slate-500 mt-2">
                Hỏi mình bất cứ điều gì về hồ sơ, việc làm hay kỹ năng sự nghiệp của bạn.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="bg-white p-5 rounded-[24px] rounded-tl-none border border-slate-100 flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

ChatWindow.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      isAi: PropTypes.bool,
      timestamp: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired,
};

export default ChatWindow;
