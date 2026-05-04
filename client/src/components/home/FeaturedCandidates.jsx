import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { employerCandidateService } from '../../services';

const FEATURED_LIMIT = 6;
const AUTO_SCROLL_INTERVAL = 4500;

const STATUS_LABELS = {
  actively_looking: 'Đang tìm việc',
  open_to_work: 'Sẵn sàng trao đổi',
  employed: 'Đang đi làm',
  not_looking: 'Chưa tìm việc',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #047857 0%, #0f766e 50%, #0f172a 100%)',
  'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #164e63 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1e1b4b 100%)',
  'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #4c0519 100%)',
  'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #451a03 100%)',
  'linear-gradient(135deg, #0f766e 0%, #10b981 50%, #064e3b 100%)',
];

const toSalaryNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

const formatSalaryLabel = (candidate = {}) => {
  const min = toSalaryNumber(candidate.expected_salary_min);
  const max = toSalaryNumber(candidate.expected_salary_max);
  const currency = candidate.salary_currency || 'VND';

  if (min === null && max === null) return 'Chưa cập nhật';

  if (currency === 'VND') {
    const compact = (value) => {
      if (value === null) return null;
      if (value >= 1_000_000) return `${formatNumber(Math.round(value / 1_000_000))} triệu`;
      return formatNumber(value);
    };

    if (min !== null && max !== null) return `${compact(min)} - ${compact(max)}`;
    if (min !== null) return `Từ ${compact(min)}`;
    return `Đến ${compact(max)}`;
  }

  const compact = (value) => (value === null ? null : `${formatNumber(value)} ${currency}`);
  if (min !== null && max !== null) return `${compact(min)} - ${compact(max)}`;
  if (min !== null) return `Từ ${compact(min)}`;
  return `Đến ${compact(max)}`;
};

const hashText = (value = '') =>
  String(value || 'candidate')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getAvatarGradient = (name = '') =>
  AVATAR_GRADIENTS[Math.abs(hashText(name)) % AVATAR_GRADIENTS.length];

const normalizeCandidate = (candidate = {}) => {
  const skills = Array.isArray(candidate.skills) ? candidate.skills.filter(Boolean) : [];
  const skillCount = Number(candidate.skill_count || skills.length || 0);
  const profileSignal = Math.min(100, Math.max(skillCount > 0 ? skillCount * 20 : 12, 12));
  const headline =
    candidate.role ||
    candidate.current_job_title ||
    candidate.bio ||
    'Hồ sơ ứng viên đang cập nhật';

  return {
    id: candidate.id,
    name: candidate.name || 'Ứng viên đang cập nhật',
    headline,
    status: STATUS_LABELS[candidate.job_search_status] || 'Hồ sơ công khai',
    salary: formatSalaryLabel(candidate),
    skills: skills.slice(0, 3),
    skillCount,
    profileSignal,
    avatarUrl: candidate.avatar_url || '',
  };
};

const CandidateCard = ({ candidate }) => (
  <Link
    to="/employer/search-candidates"
    className="group flex-shrink-0 w-[320px] sm:w-[360px] snap-center block"
  >
    <div className="relative h-[480px] rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] card-premium-hover transition-all duration-500">
      {candidate.avatarUrl ? (
        <img
          src={candidate.avatarUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-700"
          style={{ background: getAvatarGradient(candidate.name) }}
          aria-hidden="true"
        >
          <span className="text-7xl font-extrabold text-white/35 tracking-tight">
            {getInitials(candidate.name)}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute top-4 left-4 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <ShieldCheck size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-medium text-muted-foreground uppercase tracking-normal">
            Trạng thái
          </p>
          <p className="text-base font-bold text-foreground">{candidate.status}</p>
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-base font-medium text-muted-foreground uppercase tracking-normal">
            Lương kỳ vọng
          </p>
          <p className="text-base font-bold text-foreground">{candidate.salary}</p>
        </div>
      </div>

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
            <span className="text-sm font-medium text-muted-foreground">Tín hiệu hồ sơ</span>
            <span className="text-sm font-bold text-emerald-600">
              {candidate.skillCount} kỹ năng
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${candidate.profileSignal}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.length > 0 ? (
              candidate.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="text-sm font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                Đang cập nhật kỹ năng
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const FeaturedCandidates = () => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const featuredCandidates = useMemo(() => candidates.map(normalizeCandidate), [candidates]);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    const cardWidth = 360;
    const gap = 24;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setCurrentIndex(Math.min(Math.max(0, index), Math.max(featuredCandidates.length - 1, 0)));
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCandidates = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await employerCandidateService.searchCandidates({
          page: 1,
          limit: FEATURED_LIMIT,
          sort: 'recent',
        });
        if (cancelled) return;

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCandidates(rows);
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load featured candidates:', fetchError);
        setCandidates([]);
        setError('Không tải được ứng viên nổi bật từ API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [featuredCandidates.length]);

  useEffect(() => {
    updateScrollState();
  }, [featuredCandidates.length, loading, error]);

  useEffect(() => {
    if (isPaused || featuredCandidates.length <= 1 || loading || error) return undefined;
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
  }, [isPaused, featuredCandidates.length, loading, error]);

  const scrollTo = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 360;
    const gap = 24;
    el.scrollBy({ left: (cardWidth + gap) * (direction === 'next' ? 1 : -1), behavior: 'smooth' });
  };

  const renderCandidateTrack = () => {
    if (loading) {
      return (
        <div className="flex min-h-[260px] w-full items-center justify-center rounded-2xl border border-border/60 bg-card/70 text-muted-foreground">
          <Loader2 className="mr-3 size-5 animate-spin text-primary" />
          Đang tải ứng viên nổi bật từ API...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/80 px-6 text-center text-rose-700">
          <AlertCircle className="mb-3 size-6" />
          <p className="text-base font-semibold">{error}</p>
        </div>
      );
    }

    if (featuredCandidates.length === 0) {
      return (
        <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/70 px-6 text-center text-muted-foreground">
          <ShieldCheck className="mb-3 size-6 text-primary" />
          <p className="text-base font-semibold text-foreground">
            Chưa có ứng viên công khai từ API.
          </p>
          <p className="mt-1 text-sm">Dữ liệu sẽ hiển thị khi MySQL có hồ sơ ứng viên phù hợp.</p>
        </div>
      );
    }

    return featuredCandidates.map((candidate) => (
      <CandidateCard key={candidate.id} candidate={candidate} />
    ));
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
              Khám phá ứng viên đã được đồng bộ từ hồ sơ công khai, phù hợp với nhu cầu tuyển dụng
              của doanh nghiệp.
            </p>
          </motion.div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollTo('prev')}
              disabled={!canScrollLeft || loading || Boolean(error)}
              aria-label="Xem ứng viên trước"
              className="size-11 rounded-xl border border-border/60 bg-background flex items-center justify-center text-foreground hover:border-primary/30 hover:bg-primary/5 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('next')}
              disabled={!canScrollRight || loading || Boolean(error)}
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
          {renderCandidateTrack()}
        </div>

        {featuredCandidates.length > 0 && !loading && !error && (
          <div className="flex justify-center gap-2 mt-8">
            {featuredCandidates.map((candidate, i) => (
              <button
                key={candidate.id || i}
                type="button"
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  const cardWidth = 360;
                  const gap = 24;
                  el.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
                }}
                aria-label={`Đi tới ứng viên ${i + 1}`}
                className={`size-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-primary w-6' : 'bg-border hover:bg-primary/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCandidates;
