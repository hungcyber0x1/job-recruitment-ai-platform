import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, X, SlidersHorizontal, Briefcase, Check, ChevronDown } from 'lucide-react';
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
import {
  cn,
  filterJobLocationOptions,
  getJobLocationDisplayLabel,
  resolveJobLocationValue,
} from '@/utils';
import JobCard from '../../components/candidate/jobs/JobCard';
import JobFilterSidebar from '../../components/candidate/jobs/JobFilterSidebar';
import useDebounce from '../../hooks/useDebounce';
import api from '../../services/api';

const QUICK_FILTERS = [
  { label: 'Toàn thời gian', value: 'fulltime', typeValue: 'full_time' },
  { label: 'Từ xa', value: 'remote', typeValue: 'remote' },
  { label: 'Hà Nội', value: 'Ha Noi' },
  { label: 'Hồ Chí Minh', value: 'Ho Chi Minh' },
];

const JOB_TYPE_QUERY_VALUES = {
  'Toàn thời gian': 'full_time',
  'Bán thời gian': 'part_time',
  'Hợp đồng': 'contract',
  'Thực tập': 'internship',
  'Từ xa': 'remote',
  fulltime: 'full_time',
  full_time: 'full_time',
  part_time: 'part_time',
  remote: 'remote',
  contract: 'contract',
  internship: 'internship',
};

const getJobTypeQueryValue = (value = '') => JOB_TYPE_QUERY_VALUES[String(value).trim()] || value;

const locationOptions = [
  { value: 'all', label: 'Toàn quốc' },
  { value: 'Ha Noi', label: 'Hà Nội' },
  { value: 'Ho Chi Minh', label: 'Hồ Chí Minh' },
  { value: 'Da Nang', label: 'Đà Nẵng' },
  { value: 'Remote', label: 'Làm việc từ xa' },
];

const getLocationOption = (value = '') =>
  locationOptions.find(
    (option) => option.value.toLowerCase() === String(value).trim().toLowerCase()
  );

const getLocationDisplayLabel = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';
  return getLocationOption(normalizedValue)?.label || normalizedValue;
};

const resolveLocationValue = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  const normalizedQuery = normalizedValue.toLowerCase();
  const matchedOption = locationOptions.find(
    (option) =>
      option.label.toLowerCase() === normalizedQuery ||
      option.value.toLowerCase() === normalizedQuery
  );

  return matchedOption
    ? matchedOption.value === 'all'
      ? ''
      : matchedOption.value
    : normalizedValue;
};

const sortOptions = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary', label: 'Lương cao nhất' },
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
  const [filters, setFilters] = useState({
    type: [],
    category_id: searchParams.get('category_id') || null,
  });
  const limit = 10;
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const locationRef = useRef(null);

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
    const nextSearch = searchParams.get('search') || '';
    const nextLocation = searchParams.get('location') || '';
    const nextCategoryId = searchParams.get('category_id') || null;

    if (nextSearch !== searchTerm) {
      setSearchTerm(nextSearch);
    }

    if (nextLocation !== selectedLocation) {
      setSelectedLocation(nextLocation);
      setLocationQuery(getJobLocationDisplayLabel(nextLocation));
    }

    setFilters((prev) =>
      prev.category_id === nextCategoryId ? prev : { ...prev, category_id: nextCategoryId }
    );
  }, [searchParams, searchTerm, selectedLocation]);

  // Handle outside click for location dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = useMemo(() => filterJobLocationOptions(locationQuery), [locationQuery]);

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
          type: filters.type.length > 0 ? getJobTypeQueryValue(filters.type[0]) : undefined,
          limit,
          offset: (currentPage - 1) * limit,
        };
        const response = await api.get('jobs', { params });
        if (cancelled) return;
        if (response.data.success) {
          setJobs(response.data.data || []);
          setTotalJobs(response.data.meta?.pagination?.total || 0);
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
    if (filters.category_id) nextParams.set('category_id', filters.category_id);
    else nextParams.delete('category_id');
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters.category_id, searchParams, searchTerm, selectedLocation, setSearchParams]);

  const applyQuickFilter = (item) => {
    if (item.value === 'fulltime' || item.value === 'remote') {
      setFilters((prev) => ({
        ...prev,
        type: prev.type.includes(item.label)
          ? prev.type.filter((t) => t !== item.label)
          : [item.label],
      }));
    } else {
      const nextLocation = item.value === 'all' ? '' : item.value;
      setSelectedLocation(nextLocation);
      setLocationQuery(item.label === 'Toàn quốc' ? '' : item.label);
    }
  };

  const handleSearch = () => {
    const nextLocation = resolveJobLocationValue(locationQuery);
    setSelectedLocation(nextLocation);
    setLocationQuery(
      getJobLocationDisplayLabel(nextLocation) || String(locationQuery || '').trim()
    );
    setIsLocationOpen(false);
  };

  return (
    <div className="min-h-screen bg-emerald-50/30">
      {/* Hero - professional background: mesh gradient, dot pattern, grain, ambient blobs */}
      <section className="page-hero-bg page-hero-grain relative overflow-visible">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="page-hero-pattern" />
          <div className="page-hero-blob page-hero-blob-1" />
          <div className="page-hero-blob page-hero-blob-2" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold uppercase tracking-normal text-primary"
            >
              <Briefcase className="size-3.5" />
              Hơn 8.000+ việc làm mới mỗi tháng
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl md:text-4xl lg:text-5xl"
            >
              Tìm việc làm phù hợp với bạn
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 text-base font-medium leading-relaxed text-muted-foreground md:text-lg"
            >
              Khám phá cơ hội từ các công ty hàng đầu với trải nghiệm tìm việc rõ ràng và nhanh gọn
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative z-20 mx-auto mt-8 max-w-4xl"
          >
            <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-white/95 p-2 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row dark:border-slate-800 dark:bg-slate-900/95">
              <div className="relative flex flex-1 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus-within:border-emerald-500/20 dark:focus-within:bg-slate-900">
                <Search className="absolute left-4 size-5 text-slate-400" aria-hidden />
                <Input
                  type="search"
                  placeholder="Vị trí, kỹ năng, công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-14 border-0 bg-transparent pl-12 pr-10 text-base font-semibold text-slate-700 placeholder:text-slate-400/90 focus-visible:ring-0 shadow-none dark:text-slate-200"
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

              <div
                className="relative flex shrink-0 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm sm:min-w-[240px] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus-within:border-emerald-500/20 dark:focus-within:bg-slate-900"
                ref={locationRef}
              >
                <MapPin className="ml-4 size-5 shrink-0 text-slate-400" aria-hidden />
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Toàn quốc"
                    value={
                      isLocationOpen ? locationQuery : getJobLocationDisplayLabel(selectedLocation)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocationQuery(val);
                      if (!isLocationOpen) setIsLocationOpen(true);
                    }}
                    onFocus={() => {
                      setIsLocationOpen(true);
                      setLocationQuery(getJobLocationDisplayLabel(selectedLocation));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="h-14 w-full border-0 bg-transparent px-3 text-base font-semibold text-slate-700 placeholder:text-slate-400/90 outline-none focus:ring-0 shadow-none dark:text-slate-200"
                    aria-label="Địa điểm"
                  />
                </div>
                <ChevronDown
                  className={`mr-3 size-4 text-slate-400 transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`}
                />

                {/* Combobox Dropdown */}
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute left-0 right-0 top-[calc(100%+0.625rem)] z-50 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-2xl border border-border/70 bg-white/95 p-2 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
                  >
                    {filteredLocations.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const val = opt.value === 'all' ? '' : opt.value;
                          setSelectedLocation(val);
                          setLocationQuery(opt.label);
                          setIsLocationOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-base font-semibold leading-6 transition-[color,background-color,box-shadow] duration-150',
                          selectedLocation === (opt.value === 'all' ? '' : opt.value)
                            ? 'bg-primary/6 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] dark:bg-primary/12'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {(selectedLocation === (opt.value === 'all' ? '' : opt.value) ||
                          (opt.value === 'all' && !selectedLocation)) && (
                          <Check size={14} className="text-primary" />
                        )}
                      </button>
                    ))}

                    {filteredLocations.length === 0 && (
                      <div className="px-3 py-4 text-center">
                        <p className="text-base font-medium text-slate-500">
                          Không tìm thấy "{locationQuery}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocation(resolveJobLocationValue(locationQuery));
                            setIsLocationOpen(false);
                          }}
                          className="mt-3 inline-flex items-center rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                        >
                          Sử dụng địa điểm này
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <Button
                onClick={handleSearch}
                className="h-14 shrink-0 rounded-xl border border-transparent bg-emerald-50 px-10 text-base font-bold tracking-normal text-emerald-950 transition-all hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
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
                <SheetTitle className="text-lg font-bold tracking-normal">Bộ lọc</SheetTitle>
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
                  className="lg:hidden text-base font-bold uppercase tracking-normal"
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
                  <Skeleton key={i} className="h-44 w-full rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card className="overflow-hidden rounded-xl border-border/60">
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
