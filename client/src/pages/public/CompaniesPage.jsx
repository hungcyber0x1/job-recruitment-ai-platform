import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common';

import CompanyCard from '../../components/public/companies/CompanyCard';
import { MOCK_COMPANIES } from '@/data';

const INDUSTRIES = [
  { value: 'all', label: 'Tất cả ngành nghề' },
  { value: 'it', label: 'IT - Phần mềm' },
  { value: 'marketing', label: 'Marketing / Media' },
  { value: 'finance', label: 'Tài chính / Ngân hàng' },
  { value: 'sales', label: 'Kinh doanh / Sales' },
];

const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 6;

function industryMatches(selected, company) {
  if (selected === 'all') return true;
  return company.industryKey === selected;
}

const CompaniesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const [selectedIndustry, setSelectedIndustry] = useState(() => {
    const v = searchParams.get('industry');
    return INDUSTRIES.some((o) => o.value === v) ? v : 'all';
  });
  const [companies] = useState(() => [...MOCK_COMPANIES]);
  const [loading, setLoading] = useState(true);
  const filterKey = `${searchTerm}|${selectedIndustry}`;
  const [filterSnapshot, setFilterSnapshot] = useState(filterKey);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  if (filterKey !== filterSnapshot) {
    setFilterSnapshot(filterKey);
    setVisibleCount(INITIAL_VISIBLE);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return companies.filter((c) => {
      if (!industryMatches(selectedIndustry, c)) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.industry} ${c.location}`.toLowerCase();
      return hay.includes(q);
    });
  }, [companies, searchTerm, selectedIndustry]);

  const visibleList = useMemo(
    () => filteredCompanies.slice(0, visibleCount),
    [filteredCompanies, visibleCount]
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (searchTerm.trim()) p.set('q', searchTerm.trim());
    if (selectedIndustry !== 'all') p.set('industry', selectedIndustry);
    setSearchParams(p, { replace: true });
    document
      .getElementById('company-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadMore = () => {
    setVisibleCount((n) => Math.min(n + LOAD_MORE_STEP, filteredCompanies.length));
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
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Khám phá 10.000+ công ty
            </div>
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.1]">
              Tìm công ty phù hợp <span className="text-primary">văn hóa của bạn</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Khám phá đội ngũ, giá trị và cơ hội tuyển dụng từ các công ty có thương hiệu mạnh và
              lộ trình phát triển rõ ràng.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <Card className="mx-auto mt-10 max-w-4xl overflow-hidden border-border/50 bg-white/95 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.1)] backdrop-blur-sm dark:bg-slate-950/90">
              <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-2">
                <div className="relative flex flex-1 items-center rounded-xl bg-muted/60 transition-colors focus-within:bg-muted/80">
                  <Search className="absolute left-4 size-5 text-muted-foreground" aria-hidden />
                  <Input
                    type="search"
                    name="q"
                    placeholder="Tìm kiếm tên công ty…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 border-0 bg-transparent pl-12 text-base focus-visible:ring-0"
                    aria-label="Tìm kiếm công ty"
                    autoComplete="off"
                  />
                </div>

                <div className="flex w-full items-center rounded-xl bg-muted/60 sm:w-auto sm:flex-1">
                  <Briefcase className="ml-4 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <select
                    name="industry"
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="h-12 w-full cursor-pointer border-0 bg-transparent pl-3 pr-4 text-base font-medium text-foreground outline-none"
                    aria-label="Chọn ngành nghề"
                  >
                    {INDUSTRIES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full shrink-0 font-semibold sm:w-auto sm:px-8"
                >
                  Tìm kiếm
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </section>

      <div id="company-results" className="relative scroll-mt-24 pb-16 pt-10 md:pt-12">
        <div className="page-content-bg relative">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-sm font-medium text-muted-foreground" aria-live="polite">
              {loading ? (
                'Đang tải…'
              ) : (
                <>
                  Hiển thị{' '}
                  <span className="font-semibold tabular-nums text-foreground">
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
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[320px] w-full rounded-2xl" />
                ))}
              </div>
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
              filteredCompanies.length > 0 &&
              visibleCount < filteredCompanies.length && (
                <div className="mt-12 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-border/60 px-8 font-semibold"
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
