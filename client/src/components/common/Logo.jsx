import PropTypes from 'prop-types';
import React from 'react';

const Logo = ({ className = 'w-16 h-16', showText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Modern Stylized 'H' with AI/Neural connection feel */}
        <path
          d="M30 20V80M70 20V80M30 50H70"
          stroke="url(#logo-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neural Nodes/Circles for AI aesthetic */}
        <circle cx="30" cy="20" r="5" fill="#3B82F6" />
        <circle cx="30" cy="80" r="5" fill="#2563EB" />
        <circle cx="70" cy="20" r="5" fill="#3B82F6" />
        <circle cx="70" cy="80" r="5" fill="#2563EB" />

        {/* Scientific/Tech cross-lines inside H */}
        <path d="M40 40L60 60M60 40L40 60" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.4" />
      </svg>
      {showText && (
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          HireAI<span className="text-primary-600">.</span>
        </span>
      )}
    </div>
  );
};

Logo.propTypes = {
  className: PropTypes.string,
  showText: PropTypes.bool,
};

export default Logo;
