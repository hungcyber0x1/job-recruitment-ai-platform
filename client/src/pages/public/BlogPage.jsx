import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  User,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Mail,
  TrendingUp,
  Eye,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { blogService, unwrapBlogListResponse } from '@/services';
import useDebounce from '@/hooks/useDebounce';
import { OFFLINE_BLOG_LIST } from '@/data';

const BLOG_CARD_PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800';

function estimateReadMinutes(excerpt, title) {
  const text = `${title || ''} ${excerpt || ''}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const BlogFilterSidebar = ({
  selectedCategory,
  setSelectedCategory,
  categoryOptions,
  popularTags,
}) => {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Chuyên mục
        </h3>
        <ul className="space-y-1">
          {categoryOptions.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-base font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-border/60" />

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Từ khóa
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <span
              key={tag}
              className="cursor-default rounded-md border border-border/50 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 380);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState(['Tất cả']);
  const [listSource, setListSource] = useState('loading');

  const editionDate = useMemo(
    () =>
      new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPopularLoading(true);
        const res = await blogService.listPublic({ sort: 'popular' });
        const rows = unwrapBlogListResponse(res);
        if (!cancelled) setPopularPosts(Array.isArray(rows) ? rows.slice(0, 8) : []);
      } catch {
        if (!cancelled) setPopularPosts([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListSource('loading');
      try {
        const res = await blogService.listPublic({
          search: debouncedSearch.trim() || undefined,
          category: selectedCategory === 'Tất cả' ? undefined : selectedCategory,
          sort: sortBy,
        });
        const rows = unwrapBlogListResponse(res);
        if (!cancelled) {
          setPosts(Array.isArray(rows) ? rows : []);
          setListSource('api');
          setCategoryOptions((prev) => {
            const discovered = [...new Set(rows.map((r) => r.category).filter(Boolean))];
            const existing = prev.filter((c) => c !== 'Tất cả');
            const merged = new Set([...existing, ...discovered]);
            return ['Tất cả', ...[...merged].sort((a, b) => a.localeCompare(b, 'vi'))];
          });
        }
      } catch {
        if (!cancelled) {
          setPosts(
            OFFLINE_BLOG_LIST.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt,
              image: p.image,
              author: p.author,
              date: p.date,
              category: p.category,
              viewCount: p.viewCount,
            }))
          );
          setListSource('fallback');
          setCategoryOptions([
            'Tất cả',
            ...[...new Set(OFFLINE_BLOG_LIST.map((p) => p.category).filter(Boolean))].sort((a, b) =>
              a.localeCompare(b, 'vi')
            ),
          ]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedCategory, sortBy]);

  const popularTags = useMemo(() => {
    const skip = new Set(['Tất cả']);
    return categoryOptions.filter((c) => !skip.has(c)).slice(0, 8);
  }, [categoryOptions]);

  const featured = posts[0];
  /** Bốn thẻ nhỏ ngay sau tin chính — nhiều bài hiển thị hơn */
  const highlightCards = posts.slice(1, 5);
  /** Lưới dày: 3 cột desktop */
  const moreGrid = posts.slice(5);

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'popular', label: 'Đọc nhiều' },
    { value: 'oldest', label: 'Cũ nhất' },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/30">
      {/* Hero — cùng hệ màu / pattern với JobsPage, CompaniesPage */}
      <section className="page-hero-bg page-hero-grain relative overflow-hidden">
        <div className="page-hero-pattern" aria-hidden />
        <div className="page-hero-blob page-hero-blob-1" aria-hidden />
        <div className="page-hero-blob page-hero-blob-2" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative border-b border-border/50 bg-white/60 backdrop-blur-sm">
          <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:px-6 lg:px-8">
            <span>{editionDate}</span>
            <span className="hidden sm:inline">Hà Nội · TP.HCM · Đà Nẵng</span>
            <span className="font-bold text-primary">Bản tin tuyển dụng &amp; công nghệ</span>
          </div>
        </div>

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary">
              <BookOpen className="size-3.5" aria-hidden />
              Tạp chí &amp; Insights
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-4xl lg:text-5xl">
              HireAI — Tạp chí việc làm
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Ghi nhận thị trường, phỏng vấn chuyên gia và phân tích dữ liệu tuyển dụng — cập nhật
              từ cơ sở dữ liệu.
            </p>
          </div>
        </div>
      </section>

      <div className="page-content-bg">
        <div className="container relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-24 space-y-8">
                <BlogFilterSidebar
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categoryOptions={categoryOptions}
                  popularTags={
                    popularTags.length ? popularTags : ['Career', 'AI', 'ATS', 'Interview']
                  }
                />

                <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <TrendingUp className="size-4 text-primary" />
                    Đọc nhiều
                  </h3>
                  <ol className="space-y-4">
                    {popularLoading ? (
                      <li className="text-base font-medium text-muted-foreground">Đang tải…</li>
                    ) : popularPosts.length === 0 ? (
                      <li className="text-base font-medium text-muted-foreground">
                        Chưa có dữ liệu.
                      </li>
                    ) : (
                      popularPosts.map((p, i) => (
                        <li key={p.slug || p.id} className="flex gap-3 text-base">
                          <span className="font-serif text-lg font-bold leading-none text-primary/40">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/blog/${p.slug || p.id}`}
                              className="font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                            >
                              {p.title}
                            </Link>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                              {p.viewCount != null
                                ? `${p.viewCount.toLocaleString('vi-VN')} lượt xem`
                                : p.date}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ol>
                </div>
              </div>
            </aside>

            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetContent side="left" className="flex w-full max-w-sm flex-col p-0">
                <SheetHeader className="shrink-0 border-b px-6 py-4">
                  <SheetTitle className="text-lg font-bold tracking-tight">Chuyên mục</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                  <BlogFilterSidebar
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    categoryOptions={categoryOptions}
                    popularTags={popularTags.length ? popularTags : ['Career', 'AI', 'ATS']}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex flex-col gap-8 lg:col-span-9">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <p className="shrink-0 text-base font-medium text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {listSource === 'loading' ? '…' : posts.length}
                    </span>{' '}
                    bài
                    {listSource === 'api' && (
                      <span className="ml-2 text-sm font-semibold text-emerald-700">
                        · từ cơ sở dữ liệu
                      </span>
                    )}
                    {listSource === 'fallback' && (
                      <span className="ml-2 text-sm font-medium text-amber-700">
                        · ngoại tuyến (mẫu)
                      </span>
                    )}
                  </p>
                  <div className="relative min-w-0 max-w-md flex-1">
                    <Search
                      className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      placeholder="Tìm theo tiêu đề hoặc tóm tắt…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 border-border/60 bg-white pl-10 text-base"
                      aria-label="Tìm kiếm bài viết"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 bg-white text-base font-semibold lg:hidden"
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    aria-label="Mở chuyên mục"
                  >
                    <SlidersHorizontal className="mr-2 size-4" />
                    Chuyên mục
                  </Button>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-11 w-[200px] bg-white text-base font-medium">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {listSource === 'loading' ? (
                <div className="rounded-2xl border border-border/60 bg-white p-16 text-center text-base font-medium text-muted-foreground">
                  Đang tải số báo…
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-white p-12 text-center shadow-sm">
                  <p className="mb-4 text-base font-medium text-muted-foreground">
                    Chưa có bài phù hợp. Thử bỏ bớt từ khóa hoặc chọn &quot;Tất cả&quot; chuyên mục.
                  </p>
                  <Button
                    variant="outline"
                    type="button"
                    className="text-base font-bold"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('Tất cả');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : (
                <>
                  {featured ? (
                    <article className="overflow-hidden rounded-2xl border-2 border-foreground/10 bg-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.25)]">
                      <div className="grid gap-0 lg:grid-cols-12">
                        <div className="relative lg:col-span-7">
                          <div className="aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[320px]">
                            <img
                              src={featured.image || BLOG_CARD_PLACEHOLDER_IMG}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="eager"
                              decoding="async"
                              fetchPriority="high"
                            />
                          </div>
                          <div className="absolute left-4 top-4 rounded bg-foreground px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-widest text-background">
                            {featured.category}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center border-t border-border/60 p-6 sm:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
                          <p className="mb-3 font-sans text-xs font-bold uppercase tracking-widest text-primary">
                            Tin chính
                          </p>
                          <h2 className="font-serif text-2xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl">
                            <Link
                              to={`/blog/${featured.slug || featured.id}`}
                              className="hover:underline"
                            >
                              {featured.title}
                            </Link>
                          </h2>
                          <p className="mt-4 line-clamp-5 font-article text-base font-medium leading-relaxed text-foreground/85">
                            {featured.excerpt}
                          </p>
                          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/50 pt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} /> {featured.date}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User size={13} /> {featured.author}
                            </span>
                            {featured.viewCount != null ? (
                              <span className="flex items-center gap-1.5">
                                <Eye size={13} /> {featured.viewCount.toLocaleString('vi-VN')} lượt
                                xem
                              </span>
                            ) : null}
                            <span>
                              ~{estimateReadMinutes(featured.excerpt, featured.title)} phút đọc
                            </span>
                          </div>
                          <Link
                            to={`/blog/${featured.slug || featured.id}`}
                            className="mt-6 inline-flex items-center gap-2 text-base font-bold tracking-wide text-primary hover:underline"
                          >
                            Đọc toàn văn
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ) : null}

                  {highlightCards.length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Được quan tâm
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        {highlightCards.map((post) => (
                          <Link
                            key={post.slug || post.id}
                            to={`/blog/${post.slug || post.id}`}
                            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition hover:border-primary/25 hover:shadow-md"
                          >
                            <div className="relative aspect-[5/3] overflow-hidden bg-muted/40">
                              <img
                                src={post.image || BLOG_CARD_PLACEHOLDER_IMG}
                                alt=""
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                loading="lazy"
                                decoding="async"
                              />
                              <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-primary-foreground">
                                {post.category}
                              </span>
                            </div>
                            <div className="flex flex-1 flex-col p-3">
                              <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground group-hover:text-primary">
                                {post.title}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
                                {post.excerpt}
                              </p>
                              <p className="mt-auto pt-2 text-xs font-medium text-muted-foreground">
                                {post.date}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {moreGrid.length > 0 ? (
                    <div>
                      <h3 className="mb-4 flex items-center gap-2 border-b-2 border-foreground/80 pb-2 font-serif text-xl font-bold text-foreground md:text-2xl">
                        Thêm bài viết
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {moreGrid.map((post) => (
                          <Link
                            key={post.slug || post.id}
                            to={`/blog/${post.slug || post.id}`}
                            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="relative h-40 overflow-hidden border-b border-border/40 sm:h-44">
                              <img
                                src={post.image || BLOG_CARD_PLACEHOLDER_IMG}
                                alt=""
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute left-3 top-3 rounded bg-white/95 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-slate-800 shadow-sm">
                                {post.category}
                              </div>
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {post.date}
                                </span>
                                {post.viewCount != null ? (
                                  <span className="flex items-center gap-1">
                                    <Eye size={12} /> {post.viewCount.toLocaleString('vi-VN')}
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="mb-2 line-clamp-2 font-serif text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                                {post.title}
                              </h4>
                              <p className="line-clamp-3 flex-1 font-article text-base font-medium leading-relaxed text-foreground/80">
                                {post.excerpt}
                              </p>
                              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-primary">
                                Đọc tiếp
                                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm lg:hidden">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      <TrendingUp className="size-4 text-primary" />
                      Đọc nhiều
                    </h3>
                    <ol className="space-y-3 text-base">
                      {popularLoading ? (
                        <li className="font-medium text-muted-foreground">Đang tải…</li>
                      ) : popularPosts.length === 0 ? (
                        <li className="font-medium text-muted-foreground">Chưa có dữ liệu.</li>
                      ) : (
                        popularPosts.slice(0, 5).map((p, i) => (
                          <li key={p.slug || p.id} className="flex gap-2">
                            <span className="font-serif text-lg font-bold text-primary/30">
                              {i + 1}
                            </span>
                            <Link
                              to={`/blog/${p.slug || p.id}`}
                              className="font-semibold leading-snug hover:text-primary hover:underline"
                            >
                              {p.title}
                            </Link>
                          </li>
                        ))
                      )}
                    </ol>
                  </div>
                </>
              )}

              <section
                className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 bg-slate-950 shadow-xl"
                aria-labelledby="blog-newsletter-title"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_80%_100%,hsl(var(--primary)/0.14),transparent_55%)]"
                  aria-hidden
                />
                <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12">
                  <div className="mx-auto max-w-2xl text-center">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-400/95">
                      Bản tin HireAI
                    </p>
                    <h3
                      id="blog-newsletter-title"
                      className="text-balance font-serif text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
                    >
                      Nhận bản tin sáng thứ Hai
                    </h3>
                    <p className="mx-auto mt-3 max-w-lg text-base font-medium leading-relaxed text-slate-400">
                      Tóm tắt bài phân tích mới và việc làm nổi bật — không spam.
                    </p>
                  </div>
                  <form
                    className="mx-auto mt-8 max-w-lg"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:ring-1 sm:ring-white/20 sm:shadow-lg">
                      <div className="relative min-w-0 flex-1">
                        <Mail
                          className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <Input
                          type="email"
                          name="newsletter-email"
                          autoComplete="email"
                          placeholder="email@example.com"
                          aria-label="Địa chỉ email nhận bản tin"
                          className="h-12 rounded-xl border-0 bg-white pl-11 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/50 sm:rounded-none sm:rounded-l-xl"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-12 shrink-0 rounded-xl px-8 text-base font-bold shadow-none sm:rounded-none sm:rounded-r-xl"
                      >
                        Đăng ký
                      </Button>
                    </div>
                    <p className="mt-3 text-center text-sm font-medium leading-snug text-slate-500">
                      Chúng tôi không bán địa chỉ email.
                    </p>
                  </form>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
