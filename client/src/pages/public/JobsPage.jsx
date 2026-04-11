import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, X, SlidersHorizontal, ChevronDown, Briefcase } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

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
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/common';
import JobCard from '../../components/candidate/jobs/JobCard';
import JobFilterSidebar from '../../components/candidate/jobs/JobFilterSidebar';
import useDebounce from '../../hooks/useDebounce';
import api from '../../services/api';

const QUICK_FILTERS = [
  { label: 'Full-time', value: 'fulltime' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hà Nội', value: 'Ha Noi' },
  { label: 'Hồ Chí Minh', value: 'Ho Chi Minh' },
];

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({ type: [], category_id: null });
  const limit = 10;
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        s: debouncedSearch,
        loc: selectedLocation,
        cat: filters.category_id,
        types: filters.type,
      }),
    [debouncedSearch, selectedLocation, filters.category_id, filters.type]
  );
  const prevFilterSigRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const filtersChanged = prevFilterSigRef.current !== filterSignature;
    if (filtersChanged) {
      prevFilterSigRef.current = filterSignature;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    (async () => {
      setLoading(true);
      try {
        const params = {
          search: debouncedSearch || undefined,
          location: selectedLocation || undefined,
          category_id: filters.category_id || undefined,
          type: filters.type.length > 0 ? filters.type[0] : undefined,
          limit,
          offset: (currentPage - 1) * limit,
        };
        const response = await api.get('jobs', { params });
        if (cancelled) return;
        if (response.data.success) {
          setJobs(response.data.data || []);
          setTotalJobs(response.data.total || 0);
        }
      } catch (error) {
        if (!cancelled) console.error('Error fetching jobs:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // filterSignature đã gom debouncedSearch / location / category / type — không thêm deps để tránh fetch trùng.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
  }, [filterSignature, currentPage]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) nextParams.set('search', searchTerm.trim());
    else nextParams.delete('search');
    if (selectedLocation) nextParams.set('location', selectedLocation);
    else nextParams.delete('location');
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, searchTerm, selectedLocation, setSearchParams]);

  const locationOptions = [
    { value: 'all', label: 'Toàn quốc' },
    { value: 'Ha Noi', label: 'Hà Nội' },
    { value: 'Ho Chi Minh', label: 'Hồ Chí Minh' },
    { value: 'Da Nang', label: 'Đà Nẵng' },
    { value: 'Remote', label: 'Làm việc từ xa' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Phù hợp nhất (AI)' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'salary', label: 'Lương cao nhất' },
  ];

  const applyQuickFilter = (item) => {
    if (item.value === 'fulltime' || item.value === 'remote') {
      setFilters((prev) => ({
        ...prev,
        type: prev.type.includes(item.label)
          ? prev.type.filter((t) => t !== item.label)
          : [item.label],
      }));
    } else {
      setSelectedLocation(selectedLocation === item.value ? '' : item.value);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/30">
      {/* Hero - professional background: mesh gradient, dot pattern, grain, ambient blobs */}
      <section className="page-hero-bg page-hero-grain relative overflow-hidden">
        <div className="page-hero-pattern" aria-hidden />
        <div className="page-hero-blob page-hero-blob-1" aria-hidden />
        <div className="page-hero-blob page-hero-blob-2" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary"
            >
              <Briefcase className="size-3.5" />
              Hơn 8.000+ việc làm mới mỗi tháng
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-4xl lg:text-5xl"
            >
              Tìm việc làm phù hợp với bạn
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-base font-medium leading-relaxed text-muted-foreground md:text-lg"
            >
              Khám phá cơ hội từ các công ty hàng đầu với AI matching thông minh
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mx-auto mt-8 max-w-4xl"
          >
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row gap-2 dark:bg-slate-900 dark:border-slate-800">
              <div className="relative flex flex-1 items-center rounded-xl bg-slate-50/80 transition-colors focus-within:bg-slate-100/80 dark:bg-slate-800 dark:focus-within:bg-slate-700">
                <Search className="absolute left-4 size-5 text-slate-400" aria-hidden />
                <Input
                  type="search"
                  placeholder="Vị trí, kỹ năng, công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 border-0 bg-transparent pl-12 pr-10 text-base font-medium text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 shadow-none dark:text-slate-200"
                  aria-label="Tìm kiếm việc làm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center rounded-xl bg-slate-50/80 transition-colors focus-within:bg-slate-100/80 sm:min-w-[200px] dark:bg-slate-800 dark:focus-within:bg-slate-700">
                <MapPin className="ml-4 size-5 shrink-0 text-slate-400" aria-hidden />
                <Select
                  value={selectedLocation || 'all'}
                  onValueChange={(v) => setSelectedLocation(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-14 w-full border-0 bg-transparent px-3 text-base font-medium text-slate-700 focus:ring-0 focus:ring-offset-0 shadow-none dark:text-slate-200">
                    <SelectValue placeholder="Toàn quốc" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <SelectItem value="all" className="text-base font-medium py-3 cursor-pointer">
                      Toàn quốc
                    </SelectItem>
                    {locationOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-base font-medium py-3 cursor-pointer"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="h-14 shrink-0 px-10 text-sm font-black uppercase tracking-[0.1em] bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-transparent rounded-xl transition-all dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
                TÌM KIẾM
              </Button>
            </div>

            {/* Quick filters */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK_FILTERS.map((item) => {
                const isActive =
                  item.value === 'fulltime' || item.value === 'remote'
                    ? filters.type.includes(item.label)
                    : selectedLocation === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => applyQuickFilter(item)}
                    className={`rounded-full border px-4 py-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                      isActive
                        ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border-border bg-transparent hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main - subtle depth background */}
      <div className="page-content-bg container relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <JobFilterSidebar filters={filters} setFilters={setFilters} />
            </div>
          </aside>

          {/* Mobile Filter */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetContent side="left" className="flex w-full max-w-sm flex-col p-0">
              <SheetHeader className="shrink-0 border-b px-6 py-4">
                <SheetTitle className="text-lg font-bold tracking-tight">Bộ lọc</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">
                <JobFilterSidebar filters={filters} setFilters={setFilters} embedded />
              </div>
            </SheetContent>
          </Sheet>

          {/* Results */}
          <div className="flex flex-col gap-6 lg:col-span-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-medium text-muted-foreground">
                <span className="font-bold text-foreground">{jobs.length}</span> việc làm phù hợp
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden text-base font-black uppercase tracking-widest"
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="Mở bộ lọc"
                >
                  <SlidersHorizontal className="mr-2 size-4" />
                  BỘ LỌC
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 w-[220px] text-base font-medium">
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

            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card className="overflow-hidden rounded-2xl border-border/60">
                <CardContent className="p-0">
                  <EmptyState
                    variant="robotSearch"
                    title="Chưa tìm thấy việc làm phù hợp"
                    description="Thử điều chỉnh từ khóa hoặc bộ lọc để mở rộng kết quả."
                    action={
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedLocation('');
                          setFilters({ type: [], category_id: null });
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} basePath="/jobs" />
                ))}
              </div>
            )}

            {totalJobs > limit && !loading && (
              <div className="flex justify-center pt-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: Math.ceil(totalJobs / limit) }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="size-9 rounded-lg"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
