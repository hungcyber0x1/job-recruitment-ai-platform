import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryService } from '@/services';
import { renderCategoryIcon, unwrapCategoryListResponse } from '@/utils';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const getSortPriority = (category) =>
  Number.isFinite(category.sortOrder) && category.sortOrder > 0
    ? category.sortOrder
    : Number.MAX_SAFE_INTEGER;

const formatNumber = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);

const JobCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await categoryService.getAllCategories();
        if (!cancelled) {
          setCategories(unwrapCategoryListResponse(response));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('JobCategories:', error);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCategories = useMemo(() => {
    return [...categories]
      .filter((category) => category.isActive && category.jobCount > 0)
      .sort(
        (a, b) =>
          getSortPriority(a) - getSortPriority(b) ||
          b.jobCount - a.jobCount ||
          a.name.localeCompare(b.name, 'vi')
      )
      .slice(0, 8);
  }, [categories]);

  const topCategory = useMemo(() => {
    return (
      [...categories]
        .filter((category) => category.isActive && category.jobCount > 0)
        .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name, 'vi'))[0] || null
    );
  }, [categories]);

  if (loading) {
    return (
      <section className="relative overflow-hidden border-t border-border/40 bg-background py-16">
        <div className="container relative z-10 mx-auto max-w-7xl px-6 md:px-8">
          <div className="space-y-5">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-12 w-full max-w-2xl rounded-xl" />
            <Skeleton className="h-5 w-full max-w-xl rounded-full" />
            <Skeleton className="h-5 w-full max-w-lg rounded-full" />
          </div>

          <div className="mt-10 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col items-center rounded-xl border border-border/60 bg-white p-6 text-center shadow-sm"
              >
                <Skeleton className="size-16 rounded-xl" />
                <Skeleton className="mt-5 h-6 w-3/4 rounded-full" />
                <Skeleton className="mt-3 h-4 w-full rounded-full" />
                <Skeleton className="mt-2 h-4 w-5/6 rounded-full" />
                <Skeleton className="mt-8 h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-background py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute right-0 top-10 h-48 w-48 rounded-full bg-primary/[0.05] blur-3xl" />

      <div className="container relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="section-accent-line" />
              <p className="text-base font-bold uppercase tracking-normal text-primary">
                Ngành nghề nổi bật
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold leading-[1.08] tracking-normal text-foreground md:text-4xl">
                Khám phá cơ hội <span className="text-primary">theo từng ngành</span>
              </h2>

              <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
                Dữ liệu ngành nghề được đồng bộ từ khu vực quản trị và hiển thị nhất quán trên trang
                chủ, danh sách việc làm và trang ngành nghề.
              </p>
            </div>
          </div>

          <Link
            to="/categories"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-5 py-3 text-sm font-bold text-primary shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98] md:text-base"
          >
            Xem tất cả ngành nghề
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>

        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {visibleCategories.map((category, index) => {
            const isTopDemand = topCategory?.id === category.id;

            return (
              <motion.article
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, type: 'spring', stiffness: 100, damping: 20 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <Link
                  to={`/jobs?category_id=${category.id}`}
                  className="card-premium-hover group relative flex h-full flex-col items-center overflow-hidden rounded-xl border border-border/60 bg-white p-6 text-center"
                >
                  <div className="mb-4 flex size-16 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-primary transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-primary/5">
                    {renderCategoryIcon(category, { size: 28, strokeWidth: 1.7 })}
                  </div>

                  {isTopDemand ? (
                    <span className="mb-3 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-bold text-primary">
                      Nhu cầu cao
                    </span>
                  ) : null}

                  <div className="flex-1 space-y-3">
                    <h3 className="line-clamp-2 min-h-[3.25rem] text-xl font-bold leading-tight tracking-normal text-foreground transition-colors duration-300 group-hover:text-primary">
                      {category.name}
                    </h3>

                    <p className="line-clamp-3 min-h-[4.75rem] text-base leading-relaxed text-muted-foreground">
                      {category.description ||
                        'Tổng hợp các vị trí đang tuyển và kỹ năng được tìm kiếm nhiều trong lĩnh vực này.'}
                    </p>

                    <div className="flex flex-col items-center gap-1.5 pt-2">
                      <p className="text-sm font-semibold text-muted-foreground">Cơ hội hiện có</p>
                      <p className="text-3xl font-bold leading-none tracking-normal text-foreground tabular-nums">
                        {formatNumber(category.jobCount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex w-full items-center justify-center gap-2 border-t border-border/40 pt-4 text-sm font-bold text-primary transition-all duration-300 group-hover:gap-3">
                    Xem việc làm
                    <ArrowRight size={14} aria-hidden="true" />
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
