import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Printer, Clock } from 'lucide-react';
import { blogService, unwrapBlogListResponse, unwrapBlogDetailResponse } from '@/services';
import { buildOfflinePostDetail } from '@/data';
import { sanitizeHtml } from '@/utils';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BlogPostSkeleton } from '@/components/common/Skeleton';

function defaultAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || 'HireBOT').trim())}&background=0D8ABC&color=fff`;
}

const ARTICLE_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200';

const FULL_CONTENT_POST_1 = `
<p>Trí tuệ nhân tạo (AI) đang định hình lại ngành công nghiệp phần mềm với tốc độ chóng mặt. Đối với các lập trình viên, năm 2026 không chỉ là năm của mã nguồn, mà còn là năm của sự cộng tác giữa con người và máy móc.</p>

<h2>1. Kỹ thuật ra lệnh cho trí tuệ nhân tạo</h2>
<p>Không chỉ là đặt câu hỏi cho trợ lý AI. Kỹ thuật ra lệnh là nghệ thuật tối ưu hóa đầu vào để nhận được kết quả đầu ra chính xác nhất từ các mô hình ngôn ngữ lớn. Hiểu cách mô hình xử lý ngữ cảnh sẽ giúp bạn gỡ lỗi nhanh hơn rất nhiều.</p>

<h2>2. Công cụ lập trình có AI hỗ trợ</h2>
<p>Làm quen với GitHub Copilot, Cursor hay Tabnine không còn là lựa chọn mà là bắt buộc. Những công cụ này không thay thế bạn, nhưng lập trình viên sử dụng chúng sẽ có lợi thế rõ rệt so với người không sử dụng.</p>

<h2>3. Hiểu biết dữ liệu</h2>
<p>Trí tuệ nhân tạo cần dữ liệu để vận hành. Hiểu cách dữ liệu được thu thập, xử lý và biểu diễn dưới dạng vector sẽ giúp bạn xây dựng các ứng dụng hỏi đáp tăng cường truy xuất hiệu quả hơn.</p>

<div class="article-callout">
  <p><strong>Mẹo chuyên gia</strong></p>
  <p>Đừng chỉ học cách sử dụng API. Hãy học cách tinh chỉnh một mô hình nhỏ cho tác vụ cụ thể của bạn.</p>
</div>

<p>Tương lai thuộc về những ai dám nắm bắt công nghệ mới. Hãy bắt đầu lộ trình học tập của bạn ngay hôm nay.</p>
`;

const FALLBACK_BY_SLUG = {
  'top-5-ky-nang-ai-cho-developer-nam-2026': {
    title: 'Top 5 kỹ năng trí tuệ nhân tạo cần thiết cho lập trình viên năm 2026',
    excerpt: 'Trí tuệ nhân tạo đang định hình lại ngành phần mềm.',
    content: FULL_CONTENT_POST_1,
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200',
    author: 'Minh Anh',
    date: '28 tháng 12, 2026',
    category: 'Công nghệ',
    avatar: 'https://ui-avatars.com/api/?name=Minh+Anh&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
  'viet-cv-chuan-ats-bi-quyet-vuot-qua-vong-loc-ho-so-tu-dong': {
    title: 'Viết CV chuẩn ATS: Bí quyết vượt qua vòng lọc hồ sơ tự động',
    excerpt: 'Hệ thống ATS lọc hồ sơ theo từ khóa và cấu trúc.',
    content:
      '<p>Hệ thống lọc hồ sơ tự động lọc hồ sơ theo từ khóa và cấu trúc. Bài viết đầy đủ sẽ hiển thị khi bạn đăng nội dung qua trang quản trị.</p><p class="text-muted-foreground text-base font-article">Gợi ý: dùng tiêu đề rõ ràng, tránh bảng phức tạp, khớp từ khóa với mô tả công việc.</p>',
    image:
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1200',
    author: 'Sarah Nguyen',
    date: '25 tháng 12, 2026',
    category: 'Mẹo nghề nghiệp',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Nguyen&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
  'xu-huong-tuyen-dung-nganh-it-viet-nam-q1-2026': {
    title: 'Xu hướng tuyển dụng ngành IT tại Việt Nam Q1/2026',
    excerpt: 'Báo cáo ngắn về nhu cầu nhân lực.',
    content:
      '<p>Thị trường công nghệ thông tin Việt Nam tiếp tục tăng nhu cầu về điện toán đám mây, bảo mật và trí tuệ nhân tạo. Chi tiết báo cáo sẽ được cập nhật khi có bài đăng chính thức trên hệ thống.</p>',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
    author: 'Tuan Hung',
    date: '20 tháng 12, 2026',
    category: 'Góc nhìn thị trường',
    avatar: 'https://ui-avatars.com/api/?name=Tuan+Hung&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
  'phong-van-hanh-vi-star-method': {
    title: 'Phỏng vấn hành vi: Phương pháp STAR',
    excerpt: 'Khung STAR cho câu trả lời có cấu trúc.',
    content:
      '<p><strong>T</strong>ình huống — <strong>N</strong>hiệm vụ — <strong>H</strong>ành động — <strong>K</strong>ết quả: trình bày tình huống cụ thể, vai trò của bạn, hành động và kết quả đo lường được.</p><p class="text-muted-foreground text-base font-article">Nội dung mở rộng có thể thêm trong trang quản lý blog.</p>',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
    author: 'Le Huong',
    date: '15 tháng 12, 2026',
    category: 'Phỏng vấn',
    avatar: 'https://ui-avatars.com/api/?name=Le+Huong&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
  'remote-work-vs-office-gen-z': {
    title: 'Làm việc từ xa hay tại văn phòng: Lựa chọn nào cho Gen Z?',
    excerpt: 'So sánh mô hình làm việc.',
    content:
      '<p>Làm việc từ xa mang lại linh hoạt; văn phòng hỗ trợ gắn kết đội nhóm. Cân bằng phụ thuộc vai trò và văn hóa công ty.</p>',
    image:
      'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&q=80&w=1200',
    author: 'Duc Long',
    date: '10 tháng 12, 2026',
    category: 'Văn hóa làm việc',
    avatar: 'https://ui-avatars.com/api/?name=Duc+Long&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
  'lo-trinh-tro-thanh-ai-engineer-cho-nguoi-moi-bat-dau': {
    title: 'Lộ trình trở thành kỹ sư trí tuệ nhân tạo cho người mới bắt đầu',
    excerpt: 'Nền tảng và thứ tự học gợi ý.',
    content:
      '<p>Nền tảng: Python, toán (đại số, xác suất), sau đó ML cổ điển, deep learning và triển khai mô hình.</p><p class="text-muted-foreground text-base font-article">Cập nhật lộ trình chi tiết qua bài viết trên HireBOT.</p>',
    image:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200',
    author: 'Đội ngũ chuyên gia AI',
    date: '5 tháng 12, 2026',
    category: 'Giáo dục',
    avatar: 'https://ui-avatars.com/api/?name=AI+Expert&background=0D8ABC&color=fff',
    publishedAt: null,
    viewCount: 0,
  },
};

function readingMinutesFromHtml(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const BlogPostPage = () => {
  const { slug: slugParam } = useParams();
  const [status, setStatus] = useState('loading');
  const [post, setPost] = useState(null);
  const [shareHint, setShareHint] = useState('');
  const [related, setRelated] = useState([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const slug = useMemo(() => decodeURIComponent(slugParam || ''), [slugParam]);

  const readMinutes = useMemo(() => readingMinutesFromHtml(post?.content), [post?.content]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint('Đã sao chép liên kết');
      setTimeout(() => setShareHint(''), 2500);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareHint('Đã sao chép liên kết');
        setTimeout(() => setShareHint(''), 2500);
      } catch {
        setShareHint('Không thể sao chép — hãy chọn địa chỉ trên thanh trình duyệt');
        setTimeout(() => setShareHint(''), 4000);
      }
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) {
        setStatus('notfound');
        return;
      }
      setStatus('loading');
      try {
        const res = await blogService.getBySlug(slug);
        const data = unwrapBlogDetailResponse(res);
        if (!cancelled && data) {
          setPost(data);
          setStatus('ready');
          return;
        }
      } catch {
        /* API lỗi / 404 — thử fallback */
      }
      if (cancelled) return;
      const rich = FALLBACK_BY_SLUG[slug];
      if (rich) {
        setPost({
          ...rich,
          slug,
          avatar: rich.avatar || defaultAvatar(rich.author),
        });
        setStatus('ready');
        return;
      }
      const offline = buildOfflinePostDetail(slug);
      if (offline) {
        setPost(offline);
        setStatus('ready');
        return;
      }
      setPost(null);
      setStatus('notfound');
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post?.category || !slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await blogService.listPublic({ category: post.category, sort: 'newest' });
        const rows = unwrapBlogListResponse(res);
        const filtered = rows.filter((r) => (r.slug || String(r.id)) !== slug).slice(0, 4);
        if (!cancelled) setRelated(filtered);
      } catch {
        if (!cancelled) setRelated([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.category, slug]);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} · HireBOT Tạp chí`;
    }
    return () => {
      document.title = 'HireBOT';
    };
  }, [post?.title]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-28 pb-20 dark:bg-slate-950">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <BlogPostSkeleton />
        </div>
      </div>
    );
  }

  if (status === 'notfound' || !post) {
    return (
      <div className="min-h-screen bg-emerald-50/30 pt-28 pb-20 dark:bg-slate-950">
        <div className="container mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="mb-6 text-base font-medium text-muted-foreground">
            Không tìm thấy bài viết.
          </p>
          <Link
            to="/public/blog"
            className="text-base font-bold text-primary underline-offset-4 hover:underline"
          >
            ← Quay lại mục Blog
          </Link>
        </div>
      </div>
    );
  }

  const datetimeAttr = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;

  const roleLine =
    post.authorType === 'employer' && post.companyName
      ? `${post.companyName} · Nhà tuyển dụng`
      : post.authorType === 'admin'
        ? 'Ban biên tập HireBOT'
        : 'Đóng góp nội dung';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-24 print:bg-white print:pt-8 dark:bg-slate-950">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left print:hidden"
        style={{ scaleX }}
      />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <Link
          to="/blog"
          className="group mb-8 inline-flex items-center gap-2 text-base font-bold uppercase tracking-normal text-muted-foreground transition-colors hover:text-primary print:hidden"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Quay lại Tạp chí
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] border border-border/40 bg-white shadow-2xl shadow-black/[0.04] dark:border-slate-700 dark:bg-slate-900 print:border print:shadow-none"
        >
          <div className="border-b border-border/40 bg-slate-50/50 px-8 py-4 text-center sm:px-10 print:border-foreground">
            <p className="font-vietnam text-xs font-bold uppercase tracking-normal text-muted-foreground/60">
              Tri thức HireBOT · Bản tin phân tích chuyên sâu
            </p>
          </div>

          <div className="px-5 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
            <header className="border-b border-border/40 pb-12">
              <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-normal text-muted-foreground/50">
                <span className="text-primary">{post.category}</span>
                <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                {datetimeAttr ? (
                  <time dateTime={datetimeAttr}>{post.date}</time>
                ) : (
                  <span>{post.date}</span>
                )}
                <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-primary" />
                  {readMinutes} phút đọc
                </span>
              </div>

              <h1 className="text-balance font-serif text-4xl font-bold leading-[1.1] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-8 font-serif text-xl font-medium italic leading-relaxed text-muted-foreground/90 md:text-2xl">
                  &ldquo;{post.excerpt}&rdquo;
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={post.avatar || defaultAvatar(post.author)}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border"
                    onError={(e) => {
                      e.currentTarget.src = defaultAvatar(post.author);
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-sans text-base font-bold text-foreground">{post.author}</p>
                    <p className="font-sans text-base font-medium text-muted-foreground">
                      {roleLine}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  {shareHint ? (
                    <span className="text-sm font-medium text-primary" role="status">
                      {shareHint}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    aria-label="Chia sẻ hoặc sao chép liên kết"
                  >
                    <Share2 size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    aria-label="In bài viết"
                  >
                    <Printer size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </header>

            {post.image ? (
              <figure className="my-10">
                <div className="overflow-hidden rounded-sm border border-border/80 shadow-sm">
                  <img
                    src={post.image}
                    alt=""
                    className="max-h-[min(480px,70vh)] w-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset.fallbackApplied) return;
                      el.dataset.fallbackApplied = '1';
                      el.src = ARTICLE_IMAGE_FALLBACK;
                    }}
                  />
                </div>
                <figcaption className="mt-3 font-sans text-sm font-medium text-muted-foreground">
                  Minh họa: {post.title}
                </figcaption>
              </figure>
            ) : null}

            <div
              className="article-body max-w-none border-t border-border pt-8 first:border-t-0 first:pt-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || '') }}
            />

            {related.length > 0 ? (
              <section className="mt-16 border-t border-border/40 pt-12 print:hidden">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Cùng chuyên mục
                  </h2>
                  <div className="h-0.5 w-16 bg-primary/20 rounded-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug || r.id}
                      to={`/blog/${r.slug || r.id}`}
                      className="group p-6 rounded-xl border border-border/40 bg-slate-50/50 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5"
                    >
                      <span className="text-xs font-bold uppercase tracking-normal text-primary mb-2 block">
                        {r.category}
                      </span>
                      <h3 className="font-serif text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                        {r.title}
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground/50 mt-4 block uppercase tracking-normal">{r.date}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogPostPage;
