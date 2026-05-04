import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';
import { companyService } from '@/services';
import { normalizeCompanyEntity } from '@/utils/domain';

import CompanyCard from '../../components/public/companies/CompanyCard';

const INDUSTRIES = [
  { value: 'all', label: 'Tất cả ngành nghề' },
  { value: 'it', label: 'IT - Phần mềm' },
  { value: 'marketing', label: 'Marketing / Media' },
  { value: 'finance', label: 'Tài chính / Ngân hàng' },
  { value: 'sales', label: 'Kinh doanh / Sales' },
];

const INDUSTRY_KEYWORDS = {
  it: ['it', 'software', 'technology', 'information technology', 'công nghệ', 'phan mem'],
  marketing: ['marketing', 'media', 'truyền thông', 'truyen thong', 'content', 'brand'],
  finance: [
    'finance',
    'bank',
    'banking',
    'fintech',
    'tài chính',
    'tai chinh',
    'ngân hàng',
    'ngan hang',
  ],
  sales: ['sales', 'business', 'kinh doanh', 'ban hang', 'bán hàng', 'bd'],
};

const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 6;

function industryMatches(selected, company) {
  if (selected === 'all') return true;

  const haystack = `${company.industry ?? ''}`.toLowerCase();
  const keywords = INDUSTRY_KEYWORDS[selected] ?? [];
  return keywords.some((keyword) => haystack.includes(keyword));
}

const CompaniesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [selectedIndustry, setSelectedIndustry] = useState(() => {
    const value = searchParams.get('industry');
    return INDUSTRIES.some((option) => option.value === value) ? value : 'all';
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filterKey = `${searchTerm}|${selectedIndustry}`;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filterKey]);

  useEffect(() => {
    let active = true;

    const loadCompanies = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await companyService.getCompanies();
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        if (!active) return;
        setCompanies(rows.map((company) => normalizeCompanyEntity(company)));
      } catch (fetchError) {
        console.error('Failed to load public companies:', fetchError);
        if (!active) return;
        setCompanies([]);
        setError('Không thể tải danh sách công ty từ hệ thống hiện tại.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    window.scrollTo(0, 0);
    loadCompanies();

    return () => {
      active = false;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return companies.filter((company) => {
      if (!industryMatches(selectedIndustry, company)) return false;
      if (!query) return true;

      const haystack = `${company.name} ${company.industry} ${company.location}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [companies, searchTerm, selectedIndustry]);

  const visibleList = useMemo(
    () => filteredCompanies.slice(0, visibleCount),
    [filteredCompanies, visibleCount]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams();

    if (searchTerm.trim()) nextParams.set('q', searchTerm.trim());
    if (selectedIndustry !== 'all') nextParams.set('industry', selectedIndustry);

    setSearchParams(nextParams, { replace: true });
    document
      .getElementById('company-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadMore = () => {
    setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, filteredCompanies.length));
  };

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <section className="page-hero-bg page-hero-grain relative overflow-hidden border-b border-border/40">
        <div className="page-hero-pattern" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_80%,hsl(var(--primary)/0.04),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold uppercase tracking-normal text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Khám phá doanh nghiệp đang tuyển dụng
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-normal text-foreground sm:text-4xl md:text-4xl lg:text-5xl">
              Tìm công ty phù hợp <span className="text-primary">văn hóa của bạn</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Danh sách này đang đọc trực tiếp từ hồ sơ công ty và các tin tuyển dụng đã xuất bản
              trong hệ thống hiện tại.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-2 rounded-2xl border border-border/60 bg-white/95 p-2 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row">
              <div className="relative flex flex-1 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus-within:border-emerald-500/20 dark:focus-within:bg-slate-900">
                <Search className="absolute left-4 size-5 text-slate-400" aria-hidden />
                <Input
                  type="search"
                  name="q"
                  placeholder="Tìm kiếm tên công ty..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-14 border-0 bg-transparent pl-12 text-base font-semibold text-slate-700 placeholder:text-slate-400/90 shadow-none focus-visible:ring-0 dark:text-slate-200"
                  aria-label="Tìm kiếm công ty"
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-1 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus-within:border-emerald-500/20 dark:focus-within:bg-slate-900">
                <Briefcase className="ml-4 size-5 shrink-0 text-slate-400" aria-hidden />
                <Select
                  name="industry"
                  value={selectedIndustry}
                  onValueChange={setSelectedIndustry}
                >
                  <SelectTrigger className="h-14 w-full border-0 bg-transparent pl-3 pr-4 text-base font-semibold text-slate-700 shadow-none outline-none focus:ring-0 data-[placeholder]:text-slate-400/90 dark:text-slate-200">
                    <SelectValue placeholder="Tất cả ngành nghề" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-base">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="h-14 shrink-0 rounded-xl border border-transparent bg-emerald-50 px-10 text-sm font-bold uppercase tracking-normal text-emerald-950 transition-all hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
                Tìm kiếm
              </Button>
            </div>
          </form>
        </div>
      </section>

      <div id="company-results" className="relative scroll-mt-24 pb-16 pt-10 md:pt-12">
        <div className="page-content-bg relative">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-base font-medium text-muted-foreground" aria-live="polite">
              {loading ? (
                'Đang tải...'
              ) : (
                <>
                  Hiển thị{' '}
                  <span className="font-bold tabular-nums text-foreground">
                    {visibleList.length}
                  </span>{' '}
                  / <span className="tabular-nums">{filteredCompanies.length}</span> công ty
                  {filteredCompanies.length !== companies.length && (
                    <span className="text-muted-foreground/80">
                      {' '}
                      (đã lọc từ {companies.length})
                    </span>
                  )}
                </>
              )}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Skeleton key={item} className="h-[320px] w-full rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                title="Không thể tải danh sách công ty"
                description={error}
                variant="robotSearch"
              />
            ) : filteredCompanies.length === 0 ? (
              <EmptyState
                title="Không tìm thấy công ty"
                description="Thử bỏ bớt từ khóa hoặc chọn “Tất cả ngành nghề” để xem thêm kết quả."
                variant="robotSearch"
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleList.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}

            {!loading &&
              !error &&
              filteredCompanies.length > 0 &&
              visibleCount < filteredCompanies.length && (
                <div className="mt-12 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-border/60 px-8 text-base font-bold"
                    onClick={loadMore}
                  >
                    Xem thêm công ty
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
