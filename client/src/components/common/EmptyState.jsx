import React from 'react';
import PropTypes from 'prop-types';

/**
 * Mascot illustrations - friendly 3D-style characters for empty states.
 * Use variant prop or pass custom image via imageSrc.
 */
const MASCOT_SVG = {
  robotReading: (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="robot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 96%)" />
          <stop offset="100%" stopColor="hsl(160 84% 90%)" />
        </linearGradient>
        <linearGradient id="robot-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 45%)" />
          <stop offset="100%" stopColor="hsl(160 84% 35%)" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="url(#robot-bg)" />
      {/* Robot body - rounded white */}
      <ellipse
        cx="100"
        cy="135"
        rx="35"
        ry="25"
        fill="white"
        stroke="hsl(160 20% 90%)"
        strokeWidth="1"
      />
      {/* Head */}
      <circle cx="100" cy="75" r="40" fill="white" stroke="hsl(160 20% 90%)" strokeWidth="1" />
      {/* Screen/face */}
      <circle cx="100" cy="75" r="22" fill="hsl(220 50% 25%)" />
      {/* Eyes */}
      <circle cx="88" cy="72" r="4" fill="hsl(160 84% 55%)" />
      <circle cx="112" cy="72" r="4" fill="hsl(160 84% 55%)" />
      {/* Antenna */}
      <rect x="97" y="35" width="6" height="12" rx="2" fill="url(#robot-green)" />
      <circle cx="100" cy="28" r="5" fill="url(#robot-green)" />
      {/* Ears */}
      <circle cx="55" cy="75" r="12" fill="url(#robot-green)" />
      <circle cx="145" cy="75" r="12" fill="url(#robot-green)" />
      {/* Book */}
      <rect x="70" y="145" width="60" height="35" rx="4" fill="url(#robot-green)" />
      <line x1="75" y1="158" x2="135" y2="158" stroke="white" strokeWidth="2" opacity="0.8" />
      <line x1="75" y1="168" x2="120" y2="168" stroke="white" strokeWidth="1.5" opacity="0.6" />
    </svg>
  ),
  robotSearch: (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="search-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 96%)" />
          <stop offset="100%" stopColor="hsl(160 84% 90%)" />
        </linearGradient>
        <linearGradient id="search-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 45%)" />
          <stop offset="100%" stopColor="hsl(160 84% 35%)" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#search-bg)" />
      <ellipse
        cx="100"
        cy="135"
        rx="35"
        ry="25"
        fill="white"
        stroke="hsl(160 20% 90%)"
        strokeWidth="1"
      />
      <circle cx="100" cy="75" r="40" fill="white" stroke="hsl(160 20% 90%)" strokeWidth="1" />
      <circle cx="100" cy="75" r="22" fill="hsl(220 50% 25%)" />
      <circle cx="88" cy="72" r="4" fill="hsl(160 84% 55%)" />
      <circle cx="112" cy="72" r="4" fill="hsl(160 84% 55%)" />
      <rect x="97" y="35" width="6" height="12" rx="2" fill="url(#search-green)" />
      <circle cx="100" cy="28" r="5" fill="url(#search-green)" />
      <circle cx="55" cy="75" r="12" fill="url(#search-green)" />
      <circle cx="145" cy="75" r="12" fill="url(#search-green)" />
      {/* Magnifying glass */}
      <circle cx="100" cy="155" r="18" fill="none" stroke="url(#search-green)" strokeWidth="6" />
      <line
        x1="112"
        y1="167"
        x2="128"
        y2="183"
        stroke="url(#search-green)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  ),
  robotChat: (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="chat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 96%)" />
          <stop offset="100%" stopColor="hsl(160 84% 90%)" />
        </linearGradient>
        <linearGradient id="chat-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(160 84% 45%)" />
          <stop offset="100%" stopColor="hsl(160 84% 35%)" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#chat-bg)" />
      <ellipse
        cx="100"
        cy="135"
        rx="35"
        ry="25"
        fill="white"
        stroke="hsl(160 20% 90%)"
        strokeWidth="1"
      />
      <circle cx="100" cy="75" r="40" fill="white" stroke="hsl(160 20% 90%)" strokeWidth="1" />
      <circle cx="100" cy="75" r="22" fill="hsl(220 50% 25%)" />
      <circle cx="88" cy="72" r="4" fill="hsl(160 84% 55%)" />
      <circle cx="112" cy="72" r="4" fill="hsl(160 84% 55%)" />
      <rect x="97" y="35" width="6" height="12" rx="2" fill="url(#chat-green)" />
      <circle cx="100" cy="28" r="5" fill="url(#chat-green)" />
      <circle cx="55" cy="75" r="12" fill="url(#chat-green)" />
      <circle cx="145" cy="75" r="12" fill="url(#chat-green)" />
      {/* Chat bubble */}
      <path
        d="M75 140 Q75 155 100 155 L125 155 Q150 155 150 140 L150 125 Q150 110 125 110 L75 110 Q50 110 50 125 Z"
        fill="url(#chat-green)"
        opacity="0.9"
      />
      <ellipse cx="100" cy="132" rx="8" ry="3" fill="white" opacity="0.6" />
    </svg>
  ),
};

/**
 * EmptyState - Hiển thị khi không có dữ liệu, kèm mascot thân thiện.
 * @param {string} title - Tiêu đề chính
 * @param {string} description - Mô tả ngắn
 * @param {React.ReactNode} action - Nút/CTA (optional)
 * @param {'robotReading'|'robotSearch'|'robotChat'} variant - Loại mascot
 * @param {string} imageSrc - URL ảnh tùy chỉnh (override variant)
 * @param {string} imageAlt - Alt text cho ảnh
 * @param {string} className - Class cho container
 */
const EmptyState = ({
  title,
  description,
  action,
  variant = 'robotReading',
  imageSrc,
  imageAlt = 'Mascot',
  className = '',
}) => {
  const mascotContent = imageSrc ? (
    <img src={imageSrc} alt={imageAlt} className="w-full h-full object-contain" />
  ) : (
    MASCOT_SVG[variant] || MASCOT_SVG.robotReading
  );

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
        {mascotContent}
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  variant: PropTypes.oneOf(['robotReading', 'robotSearch', 'robotChat']),
  imageSrc: PropTypes.string,
  imageAlt: PropTypes.string,
  className: PropTypes.string,
};

export default EmptyState;
