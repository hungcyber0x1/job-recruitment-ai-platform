import { useState } from 'react';
import PropTypes from 'prop-types';
import { Send, Paperclip, Smile } from 'lucide-react';

/**
 * Chat input component for sending messages
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Callback when message is sent
 * @param {boolean} props.isLoading - Whether a message is being sent
 */
const ChatInput = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="p-8 pt-4">
      <form onSubmit={handleSubmit} className="relative group max-w-4xl mx-auto">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            type="button"
            className="p-2 text-slate-300 hover:text-emerald-600 transition-all"
          >
            <Paperclip size={18} />
          </button>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi bất cứ điều gì..."
          className="w-full pl-14 pr-24 py-4.5 rounded-full bg-white border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium text-slate-700 shadow-2xl shadow-indigo-100/30 transition-all"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-slate-300 hover:text-emerald-600 transition-all"
          >
            <Smile size={18} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-emerald-600 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-95 shadow-lg shadow-indigo-100"
          >
            <Send size={18} className={isLoading ? 'animate-pulse' : ''} />
          </button>
        </div>
      </form>
      <p className="text-center text-xs font-bold text-slate-300 mt-4 uppercase tracking-[0.2em]">
        HireAI có thể đưa ra câu trả lời không chính xác.
      </p>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ChatInput;
