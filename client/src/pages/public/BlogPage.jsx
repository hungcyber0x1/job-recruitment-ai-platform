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
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlogCardSkeleton } from '@/components/common/Skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { blogService, unwrapBlogListResponse, unwrapBlogTaxonomyResponse } from '@/services';
import useDebounce from '@/hooks/useDebounce';
import useNewsletterSubscription from '@/hooks/useNewsletterSubscription';

const ALL_CATEGORY = 'Tất cả';

function getPostKey(post) {
  return post?.slug || (post?.id != null ? String(post.id) : '');
}

function uniqueSortedValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'vi')
  );
}

const BlogImageFrame = ({ src, className, imageClassName, eager = false, children }) => (
  <div className={className}>
    {src ? (
      <img
        src={src}
        alt=""
        className={imageClassName}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        onError={(event) => {
          event.currentTarget.remove();
        }}
      />
    ) : null}
    {children}
  </div>
);

const BlogFilterSidebar = ({
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  categoryOptions,
  popularTags,
}) => {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border/60 bg-white p-6 shadow-sm">
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-normal text-muted-foreground">
          Chuyên mục
        </h3>
        <ul className="space-y-1.5">
          {categoryOptions.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`group relative w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {cat}
                {selectedCategory !== cat && (
                  <ArrowRight className="absolute right-4 top-1/2 size-3.5 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-px bg-border/60" />

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-normal text-muted-foreground">
          Từ khóa
        </h3>
        {popularTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`rounded-md border px-2 py-1 text-sm font-semibold transition-colors ${
                  selectedTag === tag
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/50 bg-slate-50 text-slate-600 hover:border-primary/30 hover:text-primary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">Chưa có tag công khai.</p>
        )}
      </div>
    </div>
  );
};

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 380);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [selectedTag, setSelectedTag] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState([ALL_CATEGORY]);
  const [tagOptions, setTagOptions] = useState([]);
  const [listSource, setListSource] = useState('loading');
  const [listError, setListError] = useState('');

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
  const newsletterMetadata = useMemo(
    () => ({ page: 'blog', placement: 'blog_listing_after_content' }),
    []
  );
  const newsletter = useNewsletterSubscription({
    source: 'blog_page',
    topic: 'weekly_hiring_insights',
    metadata: newsletterMetadata,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await blogService.getPublicTaxonomy();
        const taxonomy = unwrapBlogTaxonomyResponse(res);
        if (!cancelled) {
          setCategoryOptions([
            ALL_CATEGORY,
            ...uniqueSortedValues(taxonomy.categories.map((category) => category.name)),
          ]);
          setTagOptions(uniqueSortedValues(taxonomy.tags.map((tag) => tag.name)).slice(0, 24));
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([ALL_CATEGORY]);
          setTagOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPopularLoading(true);
        const res = await blogService.listPublic({ sort: 'popular' });
        const rows = unwrapBlogListResponse(res);
        if (!cancelled) setPopularPosts(rows.slice(0, 8));
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
      setListError('');
      try {
        const params = {
          search: debouncedSearch.trim() || undefined,
          category: selectedCategory === ALL_CATEGORY ? undefined : selectedCategory,
          tag: selectedTag || undefined,
          sort: sortBy,
        };
        const [listRes, featuredRes] = await Promise.all([
          blogService.listPublic(params),
          blogService.listPublic({ ...params, sort: 'featured', featured: true }),
        ]);
        const rows = unwrapBlogListResponse(listRes);
        const featuredRows = unwrapBlogListResponse(featuredRes);
        if (!cancelled) {
          setPosts(rows);
          setFeaturedPosts(featuredRows.slice(0, 1));
          setListSource('api');
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
          setFeaturedPosts([]);
          setListSource('error');
          setListError('Không thể tải dữ liệu blog từ cơ sở dữ liệu qua API backend.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedCategory, selectedTag, sortBy]);

  const popularTags = useMemo(() => tagOptions.slice(0, 8), [tagOptions]);

  const featured = featuredPosts[0] || null;
  const listedPosts = useMemo(() => {
    const featuredKey = getPostKey(featured);
    if (!featuredKey) return posts;
    return posts.filter((post) => getPostKey(post) !== featuredKey);
  }, [featured, posts]);
  /** Bốn thẻ nhỏ ngay sau tin chính — nhiều bài hiển thị hơn */
  const highlightCards = listedPosts.slice(0, 4);
  /** Lưới dày: 3 cột desktop */
  const moreGrid = listedPosts.slice(4);

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'popular', label: 'Đọc nhiều' },
    { value: 'oldest', label: 'Cũ nhất' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-emerald-50/30"
    >
      {/* Hero — nền xanh gradient */}
      <section className="page-hero-bg page-hero-grain relative overflow-hidden">
        <div className="page-hero-pattern" aria-hidden />
        <div className="page-hero-blob page-hero-blob-1" aria-hidden />
        <div className="page-hero-blob page-hero-blob-2" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative border-b border-border/40 bg-white/60 backdrop-blur-md">
          <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs font-bold uppercase tracking-normal text-muted-foreground/60 sm:px-6 lg:px-8">
            <span className="flex items-center gap-2">
              <Calendar size={12} className="text-primary" />
              {editionDate}
            </span>
            <span className="hidden sm:inline">BẢN TIN · GÓC NHÌN · XU HƯỚNG</span>
            <span className="font-bold text-primary">Tri thức HireBOT</span>
          </div>
        </div>

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-normal text-primary">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              Tạp chí & Góc nhìn
            </div>
            <h1 className="text-4xl font-bold tracking-normal text-foreground sm:text-5xl lg:text-7xl mb-6">
              Góc nhìn <span className="text-primary">Tuyển dụng</span>
            </h1>
            <p className="mx-auto max-w-xl text-base font-bold leading-relaxed text-muted-foreground/80 md:text-xl">
              Ghi nhận thị trường, phỏng vấn chuyên gia và phân tích dữ liệu tuyển dụng — cập nhật
              mới nhất.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="page-content-bg container relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-8">
              <BlogFilterSidebar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                categoryOptions={categoryOptions}
                popularTags={popularTags}
              />

              <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-normal text-muted-foreground">
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
                          <p className="mt-1 text-base font-medium text-muted-foreground">
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
                <SheetTitle className="text-lg font-bold tracking-normal">Chuyên mục</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                <BlogFilterSidebar
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedTag={selectedTag}
                  setSelectedTag={setSelectedTag}
                  categoryOptions={categoryOptions}
                  popularTags={popularTags}
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
                  {listSource === 'error' && (
                    <span className="ml-2 text-sm font-semibold text-red-700">· lỗi API</span>
                  )}
                  {selectedTag ? (
                    <span className="ml-2 text-sm font-semibold text-primary">
                      · #{selectedTag}
                    </span>
                  ) : null}
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

            <AnimatePresence mode="wait">
              {listSource === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <BlogCardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : posts.length === 0 && !featured ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[2rem] border border-border/60 bg-white p-16 text-center shadow-xl shadow-black/5"
                >
                  {listSource === 'error' ? (
                    <div className="mx-auto mb-4 flex max-w-md items-start justify-center gap-2 text-base font-medium text-red-700">
                      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                      <span>{listError}</span>
                    </div>
                  ) : (
                    <p className="mb-4 text-base font-medium text-muted-foreground">
                      Chưa có bài phù hợp. Thử bỏ bớt từ khóa hoặc chọn "Tất cả" chuyên mục.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    type="button"
                    className="text-base font-bold"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(ALL_CATEGORY);
                      setSelectedTag('');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </motion.div>
              ) : (
                <>
                  {featured ? (
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-premium-hover group relative overflow-hidden rounded-[2rem] border border-border/40 bg-white shadow-2xl shadow-black/[0.04]"
                    >
                      <div className="grid gap-0 lg:grid-cols-12">
                        <div className="relative lg:col-span-7">
                          <BlogImageFrame
                            src={featured.image}
                            className="aspect-[16/9] overflow-hidden bg-muted lg:aspect-auto lg:h-full lg:min-h-[480px]"
                            imageClassName="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            eager
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </BlogImageFrame>
                          <div className="absolute left-8 top-8 rounded-xl bg-primary px-5 py-2 text-xs font-bold uppercase tracking-normal text-white shadow-2xl shadow-primary/40 backdrop-blur-md">
                            {featured.category}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-5">
                          <div className="mb-6 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-normal text-primary">
                            <span className="h-[2px] w-10 rounded-full bg-primary" />
                            BÀI NỔI BẬT
                          </div>
                          <h2 className="text-3xl font-bold leading-[1.1] tracking-normal text-foreground sm:text-4xl xl:text-5xl">
                            <Link
                              to={`/blog/${featured.slug || featured.id}`}
                              className="hover:text-primary transition-colors duration-300"
                            >
                              {featured.title}
                            </Link>
                          </h2>
                          <p className="mt-8 line-clamp-4 text-base font-bold leading-relaxed text-muted-foreground/80">
                            {featured.excerpt}
                          </p>

                          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/40 pt-8 text-sm font-bold uppercase tracking-normal text-muted-foreground/50">
                            <span className="flex items-center gap-2">
                              <Calendar size={14} className="text-primary" /> {featured.date}
                            </span>
                            <span className="flex items-center gap-2">
                              <User size={14} className="text-primary" /> {featured.author}
                            </span>
                          </div>

                          <div className="mt-10">
                            <Link
                              to={`/blog/${featured.slug || featured.id}`}
                              className="group/btn inline-flex items-center gap-3 rounded-[1.25rem] bg-slate-950 px-8 py-4 text-sm font-bold uppercase tracking-normal text-white shadow-xl transition-all hover:bg-primary hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Đọc chi tiết
                              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ) : null}

                  {highlightCards.length > 0 ? (
                    <div className="mt-12">
                      <h3 className="mb-6 flex items-center gap-3 text-sm font-bold uppercase tracking-normal text-muted-foreground/60">
                        <TrendingUp size={16} className="text-primary" />
                        XU HƯỚNG MỚI NHẤT
                      </h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {highlightCards.map((post) => (
                          <Link
                            key={post.slug || post.id}
                            to={`/blog/${post.slug || post.id}`}
                            className="card-premium-hover group flex flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm transition-all"
                          >
                            <BlogImageFrame
                              src={post.image}
                              className="relative aspect-[16/10] overflow-hidden bg-muted/40"
                              imageClassName="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-sm font-bold uppercase tracking-normal text-primary shadow-sm">
                                {post.category}
                              </span>
                            </BlogImageFrame>
                            <div className="flex flex-1 flex-col p-5">
                              <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                                {post.title}
                              </h3>
                              <p className="text-base font-semibold text-muted-foreground/80 leading-relaxed">
                                {post.excerpt}
                              </p>
                              <div className="mt-auto pt-4 flex items-center justify-between text-sm font-bold text-muted-foreground/50">
                                <span>{post.date}</span>
                                <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                                  Đọc thêm <ArrowRight size={12} />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {moreGrid.length > 0 ? (
                    <div className="mt-16">
                      <h3 className="mb-8 flex items-center justify-between border-b-2 border-foreground pb-4">
                        <span className="text-2xl font-bold tracking-normal text-foreground">
                          Bản tin công nghệ
                        </span>
                        <div className="h-1 w-24 bg-primary rounded-full" />
                      </h3>
                      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {moreGrid.map((post) => (
                          <Link
                            key={post.slug || post.id}
                            to={`/blog/${post.slug || post.id}`}
                            className="card-premium-hover group flex flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm"
                          >
                            <BlogImageFrame
                              src={post.image}
                              className="relative aspect-[16/9] overflow-hidden bg-muted"
                              imageClassName="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                            >
                              <div className="absolute left-4 top-4 rounded-md bg-emerald-600 px-3 py-1 text-sm font-bold uppercase tracking-normal text-white shadow-lg">
                                {post.category}
                              </div>
                            </BlogImageFrame>
                            <div className="flex flex-1 flex-col p-6">
                              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground/40">
                                <span className="flex items-center gap-1.5 uppercase tracking-normal">
                                  <Calendar size={13} /> {post.date}
                                </span>
                                {post.viewCount != null ? (
                                  <span className="flex items-center gap-1.5 uppercase tracking-normal">
                                    <Eye size={13} /> {post.viewCount.toLocaleString('vi-VN')}
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="mb-4 line-clamp-2 text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                                {post.title}
                              </h4>
                              <p className="line-clamp-3 flex-1 text-base font-semibold leading-relaxed text-muted-foreground/80">
                                {post.excerpt}
                              </p>
                              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all duration-300">
                                <span className="relative">
                                  Đọc trọn vẹn bài viết
                                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                                </span>
                                <ArrowRight className="size-4" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm lg:hidden">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-normal text-muted-foreground">
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
            </AnimatePresence>

            <section
              className="relative mt-4 overflow-hidden rounded-xl border border-border/60 bg-slate-950 shadow-xl"
              aria-labelledby="blog-newsletter-title"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_80%_100%,hsl(var(--primary)/0.14),transparent_55%)]"
                aria-hidden
              />
              <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-12">
                <div className="mx-auto max-w-2xl text-center">
                  <p className="mb-2 text-base font-bold uppercase tracking-normal text-emerald-400/95">
                    Bản tin chọn lọc HireBOT
                  </p>
                  <h3
                    id="blog-newsletter-title"
                    className="text-balance font-serif text-2xl font-bold leading-tight tracking-normal text-white sm:text-3xl"
                  >
                    Nhận bản tin tuyển dụng dành cho người ra quyết định
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-400">
                    Mỗi tuần, HireBOT gửi tóm tắt xu hướng nhân sự, mức lương thị trường, bài phân
                    tích mới và cơ hội việc làm đáng chú ý — chỉ khi nội dung đủ giá trị.
                  </p>
                </div>

                <form className="mx-auto mt-8 max-w-2xl" onSubmit={newsletter.submit} noValidate>
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:ring-1 sm:ring-white/20 sm:shadow-lg">
                    <div className="relative min-w-0 flex-1">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-slate-400"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <Input
                        id="blog-newsletter-email"
                        type="email"
                        name="newsletter-email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="ten@congty.com"
                        aria-label="Địa chỉ email nhận bản tin"
                        value={newsletter.email}
                        onChange={(e) => newsletter.setEmail(e.target.value)}
                        disabled={newsletter.isSubmitting}
                        required
                        className="h-12 rounded-xl border-0 bg-white pl-11 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-none sm:rounded-l-xl"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={newsletter.isSubmitting}
                      className="h-12 shrink-0 rounded-xl px-8 text-base font-bold shadow-none disabled:cursor-not-allowed disabled:opacity-80 sm:rounded-none sm:rounded-r-xl"
                    >
                      {newsletter.isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Đang đăng ký
                        </>
                      ) : (
                        'Đăng ký nhận bản tin'
                      )}
                    </Button>
                  </div>

                  {newsletter.message ? (
                    <p
                      className={`mx-auto mt-4 flex max-w-xl items-start justify-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold leading-relaxed ${
                        newsletter.status === 'error'
                          ? 'bg-red-500/10 text-red-200 ring-1 ring-red-400/20'
                          : 'bg-emerald-500/10 text-emerald-100 ring-1 ring-emerald-400/20'
                      }`}
                      role={newsletter.status === 'error' ? 'alert' : 'status'}
                      aria-live="polite"
                    >
                      {newsletter.status === 'error' ? (
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>{newsletter.message}</span>
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-2 text-left sm:grid-cols-3">
                    {[
                      'Chọn lọc mỗi tuần',
                      'Không chia sẻ dữ liệu',
                      'Huỷ đăng ký bất cứ lúc nào',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 ring-1 ring-white/10"
                      >
                        <ShieldCheck
                          className="size-4 shrink-0 text-emerald-300"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-sm font-medium leading-relaxed text-slate-500">
                    Bằng cách đăng ký, bạn đồng ý để HireBOT sử dụng email này cho bản tin tuyển
                    dụng. Chúng tôi không bán hoặc chia sẻ email cho bên thứ ba.
                  </p>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogPage;
