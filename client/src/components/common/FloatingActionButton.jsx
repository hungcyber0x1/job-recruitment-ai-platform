import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

const FloatingActionButton = () => {
  const [isOpen] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <>
      {/* Main FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {/* Tooltip */}
          {showTooltip && !isOpen && (
            <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl whitespace-nowrap shadow-xl animate-fade-in">
              Chat với AI miễn phí
              <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"></div>
            </div>
          )}

          {/* FAB Button */}
          <Link to="/chat">
            <button
              className="group relative w-16 h-16 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 rounded-full shadow-2xl shadow-primary/50 flex items-center justify-center text-white hover:scale-110 transition-all duration-300"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></span>

              {/* Icon */}
              <Bot size={28} className="relative z-10 group-hover:animate-bounce" />

              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                AI
              </span>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default FloatingActionButton;
