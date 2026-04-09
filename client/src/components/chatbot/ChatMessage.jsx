import PropTypes from 'prop-types';
import React from 'react';
import { Sparkles, User, Copy, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const { text, isAi, timestamp } = message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-4 ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      {isAi && (
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-100">
          <Sparkles size={16} />
        </div>
      )}

      <div className="group relative">
        <div
          className={`p-5 rounded-[24px] text-sm md:text-base leading-relaxed font-medium shadow-sm transition-all ${
            isAi
              ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none pr-12'
              : 'bg-primary-600 text-white rounded-tr-none px-6'
          }`}
        >
          {text}

          {isAi && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="text-slate-300 hover:text-primary-600 transition-colors"
                title="Sao chép"
              >
                <Copy size={14} />
              </button>
              <button
                className="text-slate-300 hover:text-primary-600 transition-colors"
                title="Phát âm"
              >
                <Volume2 size={14} />
              </button>
            </div>
          )}
        </div>
        <p
          className={`text-[10px] font-bold text-slate-300 mt-2 tracking-widest uppercase ${isAi ? 'text-left' : 'text-right'}`}
        >
          {isAi ? 'HireAI Assistant' : 'You'} • {timestamp || 'Bây giờ'}
        </p>
      </div>

      {!isAi && (
        <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
          <User size={16} />
        </div>
      )}
    </motion.div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string,
    isAi: PropTypes.bool,
    timestamp: PropTypes.string,
  }).isRequired,
};

export default ChatMessage;
