import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Printer, Clock } from 'lucide-react';
import { blogService, unwrapBlogListResponse, unwrapBlogDetailResponse } from '@/services';
import { sanitizeHtml } from '@/utils';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BlogPostSkeleton } from '@/components/common/Skeleton';

const EDITORIAL_AUTHOR_NAME = 'Ban biên tập HireBOT';
const EDITORIAL_AUTHOR_ROLE = 'Đội ngũ nội dung & phân tích tuyển dụng HireBOT';

function defaultAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || 'HireBOT').trim())}&background=0D8ABC&color=fff`;
}

function resolvePostAuthor(post) {
  const rawName = String(post?.author || '').trim();
  const isAdminSystemName = /^(system admin|admin hirebot)$/i.test(rawName);
  const name =
    post?.authorType === 'admin' && (!rawName || isAdminSystemName)
      ? EDITORIAL_AUTHOR_NAME
      : rawName || (post?.authorType === 'admin' ? EDITORIAL_AUTHOR_NAME : 'HireBOT');
  const role =
    post?.authorRole ||
    (post?.authorType === 'recruiter' && post?.companyName
      ? `${post.companyName} · Nhà tuyển dụng`
      : post?.authorType === 'admin'
        ? EDITORIAL_AUTHOR_ROLE
        : 'Đóng góp nội dung');

  return {
    name,
    role,
    avatar: post?.avatar || defaultAvatar(name),
  };
}

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
    restDelta: 0.001,
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
      setPost(null);
      try {
        const res = await blogService.getBySlug(slug);
        const data = unwrapBlogDetailResponse(res);
        if (!cancelled) {
          setPost(data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setPost(null);
          setStatus('notfound');
        }
      }
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
            Không tìm thấy bài viết từ cơ sở dữ liệu hoặc API blog hiện không trả dữ liệu hợp lệ.
          </p>
          <Link
            to="/blog"
            className="text-base font-bold text-primary underline-offset-4 hover:underline"
          >
            ← Quay lại mục Blog
          </Link>
        </div>
      </div>
    );
  }

  const datetimeAttr = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;

  const authorMeta = resolvePostAuthor(post);

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

              {Array.isArray(post.tags) && post.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-bold text-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={authorMeta.avatar}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-border"
                    onError={(e) => {
                      e.currentTarget.src = defaultAvatar(authorMeta.name);
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-sans text-base font-bold text-foreground">
                      {authorMeta.name}
                    </p>
                    <p className="font-sans text-base font-medium text-muted-foreground">
                      {authorMeta.role}
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
                      e.currentTarget.remove();
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
                  <h2 className="font-serif text-2xl font-bold text-foreground">Cùng chuyên mục</h2>
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
                      <span className="text-xs font-bold text-muted-foreground/50 mt-4 block uppercase tracking-normal">
                        {r.date}
                      </span>
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
