import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AppIcon } from '@/components/common';
import chatbotImg from '@/assets/chatbot_hero_emerald.png';

const HERO_BRAND = '#00a685';
const HERO_TEXT = '#1a1a1a';
/** Ảnh nền từ `public/hero.jpg` */
const HERO_BG_IMAGE = '/hero.jpg';

/** Mạng node AI — phủ lên nền (network overlay) */
const NETWORK_NODES = [
  [8, 88],
  [22, 76],
  [38, 82],
  [52, 68],
  [68, 74],
  [15, 60],
  [32, 48],
  [50, 55],
  [70, 50],
  [88, 58],
  [25, 42],
  [45, 35],
  [62, 40],
  [78, 46],
  [40, 22],
  [58, 18],
  [75, 24],
];

const NETWORK_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [2, 6],
  [4, 8],
  [5, 10],
  [10, 11],
  [11, 12],
  [12, 13],
  [6, 11],
  [7, 12],
  [10, 14],
  [14, 15],
  [15, 16],
  [12, 16],
  [3, 7],
  [13, 9],
];

const NODE_R = [
  1.1, 0.9, 1.2, 0.85, 1.0, 0.95, 1.15, 0.8, 1.0, 0.9, 1.05, 0.85, 0.95, 0.75, 1.0, 0.9, 0.85,
];

/** mode=full: nền toàn section | mode=columnBack: sau thẻ trong cột | mode=columnFront: chỉ nét, trước thẻ */
function HeroNetworkMesh({ mode = 'full' }) {
  const rid = useId().replace(/:/g, '');
  const line = mode === 'columnFront' ? 'rgba(0,166,133,0.42)' : 'rgba(0,166,133,0.62)';
  const lineSoft = 'rgba(0,166,133,0.26)';
  const node = 'rgba(255,255,255,0.98)';
  const nodeStroke = 'rgba(0,166,133,0.55)';
  const nodeGlowId = `hn-glow-${mode}-${rid}`;
  const meshGlowId = `hn-mesh-${mode}-${rid}`;
  const linesOnly = mode === 'columnFront';

  const wrapClass =
    mode === 'full'
      ? 'hero-network-3d-wrap absolute inset-0 flex items-center justify-end overflow-visible pointer-events-none select-none pr-[4%] md:pr-[8%]'
      : mode === 'columnBack'
        ? 'hero-network-column-back pointer-events-none absolute inset-0 z-[10] flex items-center justify-center overflow-visible select-none'
        : 'hero-network-column-front pointer-events-none absolute inset-0 z-[25] flex items-center justify-center overflow-visible select-none';

  const innerClass =
    mode === 'full'
      ? 'hero-network-3d-inner h-[min(100%,520px)] w-[min(155%,580px)] max-w-[min(92vw,560px)]'
      : 'hero-network-3d-inner hero-network-3d-inner--column h-[min(100%,480px)] w-[min(130%,520px)] max-w-full';

  const opacity = mode === 'columnBack' ? 0.5 : mode === 'columnFront' ? 0.72 : 0.9;

  return (
    <div className={wrapClass} aria-hidden>
      <div className={innerClass} style={{ opacity }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id={nodeGlowId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.45" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={meshGlowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {!linesOnly && (
            <g opacity={0.75} filter={`url(#${meshGlowId})`}>
              {NETWORK_EDGES.map(([a, b], i) => {
                const [x1, y1] = NETWORK_NODES[a];
                const [x2, y2] = NETWORK_NODES[b];
                return (
                  <line
                    key={`e2-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={lineSoft}
                    strokeWidth={0.55}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          )}
          <g opacity={linesOnly ? 0.75 : 0.92}>
            {NETWORK_EDGES.map(([a, b], i) => {
              const [x1, y1] = NETWORK_NODES[a];
              const [x2, y2] = NETWORK_NODES[b];
              return (
                <line
                  key={`e-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={line}
                  strokeWidth={linesOnly ? 0.38 : 0.32}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          {!linesOnly &&
            NETWORK_NODES.map(([x, y], i) => (
              <circle
                key={`n-${i}`}
                cx={x}
                cy={y}
                r={NODE_R[i] ?? 0.9}
                fill={node}
                stroke={nodeStroke}
                strokeWidth={0.14}
                filter={`url(#${nodeGlowId})`}
                opacity={0.72 + (i % 5) * 0.05}
              />
            ))}
          {linesOnly &&
            NETWORK_NODES.map(([x, y], i) => (
              <circle
                key={`nf-${i}`}
                cx={x}
                cy={y}
                r={0.55}
                fill="rgba(0,230,180,0.9)"
                stroke="rgba(0,166,133,0.6)"
                strokeWidth={0.08}
                style={{ filter: 'drop-shadow(0 0 3px rgba(0,200,160,0.85))' }}
              />
            ))}
        </svg>
      </div>
    </div>
  );
}

const ModernHero = () => {
  return (
    <section className="hero-forest relative flex min-h-[92vh] items-center overflow-hidden bg-white pb-24 pt-8 md:pt-10">
      {/*
              Dưới → trên: ảnh nét → lưới AI → gradient trắng (che lưới trái, chữ đọc rõ).
            */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-white">
        <div className="hero-bg-photo">
          <div className="hero-bg-blur">
            <img
              src={HERO_BG_IMAGE}
              alt=""
              fetchPriority="high"
              decoding="sync"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>

      <div className="hero-network-layer absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        <HeroNetworkMesh mode="full" />
      </div>

      <div className="hero-gradient-overlay absolute inset-0 z-[2]" aria-hidden />

      {/* Tan biên dưới: hòa vào section #f9fafb */}
      <div
        className="hero-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-[4]"
        aria-hidden
      />

      <div className="container relative z-[5] mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)] lg:items-center lg:gap-10 xl:gap-14 2xl:gap-16">
          <div className="mx-auto w-full max-w-[42rem] text-center antialiased lg:mx-0 lg:max-w-[44rem] lg:justify-self-start lg:pr-2 lg:text-left xl:max-w-[46rem] 2xl:max-w-[48rem]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center rounded-full border border-neutral-200/90 bg-white px-5 py-3.5 shadow-sm sm:px-7 sm:py-4 lg:mx-0 mx-auto"
            >
              <span
                className="text-base font-bold uppercase tracking-normal"
                style={{ color: HERO_BRAND }}
              >
                • Tuyển dụng thông minh với AI
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mb-9 text-balance text-4xl font-bold leading-[1.08] tracking-normal sm:text-5xl md:text-5xl lg:text-6xl xl:text-[4.2rem]"
            >
              <span className="block" style={{ color: HERO_TEXT }}>
                Để AI tìm kiếm công việc mơ ước cho bạn
              </span>
              <span className="mt-2 block" style={{ color: HERO_BRAND }}>
                dựa trên kỹ năng thực tế.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-neutral-600 md:text-xl lg:mx-0 xl:max-w-[36rem]"
            >
              Hệ thống phân tích kỹ năng trong CV của bạn và đối chiếu với yêu cầu thực tế từ nhà tuyển
              dụng — gợi ý đúng vị trí, đúng thời điểm.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="flex flex-col items-stretch justify-center gap-3.5 sm:flex-row sm:items-center sm:gap-4 lg:justify-start"
            >
              <Link
                to="/jobs"
                className="hero-btn-forest min-h-[58px] w-full px-10 py-4 text-base font-bold sm:w-auto sm:min-h-[60px] sm:px-11 sm:py-[1.05rem]"
              >
                Khám phá việc làm ngay
                <AppIcon icon={ArrowRight} size="md" className="text-white" />
              </Link>
              <Link
                to="/about"
                className="hero-btn-secondary-mockup min-h-[58px] w-full px-10 py-4 text-base font-bold sm:w-auto sm:min-h-[60px] sm:px-11 sm:py-[1.05rem] hover:bg-[#e2e2e2]"
              >
                Tìm hiểu thêm
              </Link>
            </motion.div>
          </div>

          <div className="hero-3d-scene relative isolate mx-auto w-full max-w-[420px] justify-self-center lg:mx-0 lg:max-w-none lg:justify-self-end xl:max-w-[480px] h-[450px] flex items-center justify-center mt-10 lg:mt-0">
            {/* Lưới AI phía sau thẻ — chiều sâu 3D */}
            <HeroNetworkMesh mode="columnBack" />

            <div className="hero-3d-floor-glow pointer-events-none" aria-hidden />

            {/* 3D/2D Chatbot Illustration with Premium Frame/Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: [0, -15, 0], scale: 1 }}
              transition={{
                opacity: { duration: 0.8 },
                scale: { duration: 0.8 },
                y: { repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.8 },
              }}
              className="relative z-30 flex flex-col items-center justify-center w-full max-w-[340px]"
            >
              {/* Glowing aura behind the bot - now pulsing */}
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[120%] h-[120%] bg-emerald-500/20 rounded-full blur-[70px] pointer-events-none"
                aria-hidden
              />

              {/* Chatbot Image with true transparency expected */}
              <img
                src={chatbotImg}
                alt="Recruitment Assistant"
                className="w-[90%] md:w-[100%] h-auto object-contain drop-shadow-[0_20px_40px_rgba(16,185,129,0.4)] relative z-10 transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  // Fallback high-quality 3D robot
                  e.target.src =
                    'https://cdn3d.iconscout.com/3d/premium/thumb/robot-4993689-4161115.png';
                }}
              />
            </motion.div>

            {/* Lưới + điểm sáng: z-25, dưới thẻ job z-30 */}
            <HeroNetworkMesh mode="columnFront" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernHero;
