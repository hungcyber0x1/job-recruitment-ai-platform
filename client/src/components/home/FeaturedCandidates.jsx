import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const candidates = [
  {
    id: 1,
    name: 'Nguyễn Minh Tuấn',
    headline: 'Sẵn sàng cho cơ hội mới',
    status: 'Đang tìm việc',
    salary: '$2,800',
    match: 96,
    skills: ['React', 'TypeScript', 'Node.js'],
    verified: true,
    image: 'https://picsum.photos/seed/forest1/400/520',
  },
  {
    id: 2,
    name: 'Trần Thị Hương',
    headline: 'Lập trình viên giao diện với 5 năm kinh nghiệm',
    status: 'Đang tìm việc',
    salary: '$3,200',
    match: 91,
    skills: ['Vue.js', 'Python', 'AWS'],
    verified: true,
    image: 'https://picsum.photos/seed/ocean2/400/520',
  },
  {
    id: 3,
    name: 'Lê Văn Đức',
    headline: 'Kỹ sư full-stack tìm dự án mới',
    status: 'Đang tìm việc',
    salary: '$2,500',
    match: 88,
    skills: ['Next.js', 'PostgreSQL', 'Docker'],
    verified: true,
    image: 'https://picsum.photos/seed/mountain3/400/520',
  },
];

const CandidateCard = ({ candidate }) => (
  <Link
    to="/employer/search-candidates"
    className="group flex-shrink-0 w-[320px] sm:w-[360px] snap-center block"
  >
    <div className="relative h-[480px] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] card-premium-hover transition-all duration-500">
      {/* Background image */}
      <img
        src={candidate.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top left - Verification badge */}
      <div className="absolute top-4 left-4 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <ShieldCheck size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-medium text-muted-foreground uppercase tracking-normal">
            Trạng thái
          </p>
          <p className="text-base font-bold text-foreground">Đã xác minh AI</p>
        </div>
      </div>

      {/* Middle right - Salary badge */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-base font-medium text-muted-foreground uppercase tracking-normal">
            Lương TB
          </p>
          <p className="text-base font-bold text-foreground">{candidate.salary}</p>
        </div>
      </div>

      {/* Bottom area - Status, headline & match card */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-emerald-400">{candidate.status}</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm">
            {candidate.headline}
          </h3>
        </div>
        <div className="sm:w-[200px] shrink-0 rounded-xl bg-white/95 backdrop-blur-sm p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">Độ phù hợp</span>
            <span className="text-sm font-bold text-emerald-600">{candidate.match}% phù hợp</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${candidate.match}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((skill) => (
              <span
                key={skill}
                className="text-sm font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const AUTO_SCROLL_INTERVAL = 4500;

const FeaturedCandidates = () => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const cardWidth = 360;
    const gap = 24;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setCurrentIndex(Math.min(Math.max(0, index), candidates.length - 1));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const cardWidth = 360;
      const gap = 24;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
      }
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused]);

  const scrollTo = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 360;
    const gap = 24;
    el.scrollBy({ left: (cardWidth + gap) * (direction === 'next' ? 1 : -1), behavior: 'smooth' });
  };

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="text-base font-semibold text-primary uppercase tracking-normal mb-5">
              Ứng viên nổi bật
            </p>
            <h2 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-normal leading-[0.95]">
              Đội ngũ tài năng <span className="text-primary">sẵn sàng cho bạn</span>
            </h2>
            <p className="text-muted-foreground font-medium mt-4 max-w-lg">
              Khám phá ứng viên đã được AI xác minh, phù hợp với nhu cầu tuyển dụng của doanh
              nghiệp.
            </p>
          </motion.div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollTo('prev')}
              disabled={!canScrollLeft}
              aria-label="Xem ứng viên trước"
              className="size-11 rounded-xl border border-border/60 bg-background flex items-center justify-center text-foreground hover:border-primary/30 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('next')}
              disabled={!canScrollRight}
              aria-label="Xem ứng viên tiếp theo"
              className="size-11 rounded-xl border border-border/60 bg-background flex items-center justify-center text-foreground hover:border-primary/30 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 -mx-6 px-6 snap-x snap-mandatory"
        >
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {candidates.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const cardWidth = 360;
                const gap = 24;
                el.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
              }}
              aria-label={`Đi tới ứng viên ${i + 1}`}
              className={`size-2 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-6' : 'bg-border hover:bg-primary/40'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCandidates;
