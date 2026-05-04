import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { blogService, unwrapBlogListResponse } from '@/services';

function estimateReadLabel(excerpt, title) {
  const n = `${title || ''} ${excerpt || ''}`.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(n / 220))} phút đọc`;
}

const BlogHub = () => {
  const [articles, setArticles] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadState('loading');
      try {
        const response = await blogService.listPublic({ sort: 'newest' });
        const rows = unwrapBlogListResponse(response);
        if (!cancelled) {
          setArticles(rows.slice(0, 3));
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) {
          setArticles([]);
          setLoadState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div className="space-y-4">
            <span className="landing-badge">
              <BookOpen size={14} aria-hidden />
              Trung tâm kiến thức
            </span>
            <h2 className="landing-heading">
              Kiến thức <span className="landing-heading-muted">sự nghiệp</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed font-medium">
              Bài viết chuyên sâu từ chuyên gia về xu hướng nghề nghiệp, kỹ năng và phát triển bản
              thân
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 transition-colors group whitespace-nowrap landing-focus rounded-lg py-1"
          >
            Xem tất cả bài viết
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {loadState === 'loading' ? (
          <div className="rounded-xl border border-border/50 bg-white p-8 text-base font-semibold text-muted-foreground">
            Đang tải bài viết từ cơ sở dữ liệu…
          </div>
        ) : loadState === 'error' ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-white p-8 text-base font-semibold text-red-700">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>Không thể tải bài viết từ API backend.</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-white p-8 text-base font-semibold text-muted-foreground">
            Chưa có bài viết công khai.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {articles.map((article, index) => (
              <motion.article
                key={article.slug || article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group landing-card overflow-hidden"
              >
                <Link to={`/blog/${article.slug || article.id}`} className="block h-full">
                  <div className="h-48 bg-gradient-to-br from-primary/[0.06] to-muted/30 relative overflow-hidden">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        onError={(event) => {
                          event.currentTarget.remove();
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen size={48} className="text-primary/15" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 border border-primary/12 text-primary rounded-lg text-sm font-bold backdrop-blur-sm">
                        <BookOpen size={12} />
                        {article.category || 'Chưa phân loại'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-foreground font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-muted-foreground/60 text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {article.date}
                      </span>
                      <span>·</span>
                      <span>{estimateReadLabel(article.excerpt, article.title)}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogHub;
