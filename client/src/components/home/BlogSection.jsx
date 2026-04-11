import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogService, unwrapBlogListResponse } from '@/services';

const FALLBACK_POSTS = [
  {
    id: 1,
    slug: 'top-5-ky-nang-ai-cho-developer-nam-2026',
    title: 'Top kỹ năng AI được săn đón nhất năm 2026',
    excerpt:
      'Những công cụ và framework đang được nhà tuyển dụng ưu tiên khi tuyển kỹ sư và chuyên viên dữ liệu.',
    date: '15/03/2026',
    category: 'Thị trường',
    readTime: '6 phút đọc',
    image: null,
  },
  {
    id: 2,
    slug: 'viet-cv-chuan-ats-bi-quyet-vuot-qua-vong-loc-ho-so-tu-dong',
    title: 'Cách viết CV vượt qua bộ lọc AI',
    excerpt:
      'Cấu trúc CV, từ khóa và định dạng giúp hồ sơ được chấm điểm cao trước khi đến tay nhà tuyển dụng.',
    date: '12/03/2026',
    category: 'Kỹ năng',
    readTime: '4 phút đọc',
    image: null,
  },
  {
    id: 3,
    slug: 'phong-van-hanh-vi-star-method',
    title: 'Review quy trình phỏng vấn tại tập đoàn lớn',
    excerpt:
      'Trải nghiệm thực tế từ ứng viên đã vượt qua nhiều vòng: bài test, case study và phỏng vấn hành vi.',
    date: '08/03/2026',
    category: 'Phỏng vấn',
    readTime: '5 phút đọc',
    image: null,
  },
];

const PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/blog1/400/240',
  'https://picsum.photos/seed/blog2/400/240',
  'https://picsum.photos/seed/blog3/400/240',
];

function estimateReadLabel(excerpt, title) {
  const n = `${title || ''} ${excerpt || ''}`.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(n / 220))} phút đọc`;
}

const BlogCard = ({ post, index }) => (
  <Link
    to={`/blog/${post.slug}`}
    className="group block h-full w-[min(85vw,320px)] shrink-0 snap-center sm:w-[360px] lg:w-full lg:min-w-0 lg:shrink"
  >
    <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col border border-border/45 card-premium-hover">
      <div className="aspect-[5/3] bg-muted/40 relative overflow-hidden shrink-0">
        <img
          src={post.image || PLACEHOLDER_IMAGES[index] || PLACEHOLDER_IMAGES[0]}
          alt=""
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur-sm text-foreground rounded-md text-sm font-semibold border border-border/40">
          {post.category}
        </span>
      </div>
      <div className="p-5 flex-1 flex flex-col min-h-0">
        <h3 className="text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2 transition-colors">
          {post.title}
        </h3>
        <p className="text-base text-muted-foreground font-medium leading-relaxed line-clamp-2 mb-4 flex-1 min-h-0">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} strokeWidth={1.5} /> {post.date}
            </span>
            <span>{post.readTime}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <ArrowUpRight size={14} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  </Link>
);

const AUTO_SCROLL_INTERVAL = 5000;

const BlogSection = () => {
  const scrollRef = useRef(null);
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await blogService.listPublic({ sort: 'newest' });
        const rows = unwrapBlogListResponse(res);
        const top = Array.isArray(rows) ? rows.slice(0, 3) : [];
        if (!cancelled && top.length > 0) {
          setPosts(
            top.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt || '',
              date: p.date,
              category: p.category,
              readTime: estimateReadLabel(p.excerpt, p.title),
              image: p.image || null,
            }))
          );
        }
      } catch {
        /* giữ FALLBACK_POSTS */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);
    return () => {
      el.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [posts]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollWidth <= el.clientWidth + 2) return;
      const scrollAmount = 384;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused]);

  const scrollTo = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: (dir === 'next' ? 1 : -1) * 384, behavior: 'smooth' });
  };

  return (
    <section className="landing-section-alt border-t border-border/40 py-16 overflow-x-hidden">
      <div className="container relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-base font-bold text-primary uppercase tracking-widest mb-3">
              Bản tin
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-[1.1]">
              Bản tin nghề nghiệp <span className="text-primary">HireAI</span>
            </h2>
          </motion.div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/blog"
              className="hidden sm:flex items-center gap-2 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Xem tất cả <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <div className="flex gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={() => scrollTo('prev')}
                disabled={!canScrollLeft}
                aria-label="Trước"
                className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollTo('next')}
                disabled={!canScrollRight}
                aria-label="Tiếp"
                className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 xl:gap-8"
        >
          {posts.map((post, i) => (
            <BlogCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
