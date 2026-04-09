import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code,
  Megaphone,
  Landmark,
  Palette,
  Users,
  Truck,
  Search,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils';
import { jobService } from '@/services';
import JobCard from '@/components/candidate/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';

/** Giá trị khớp API / trang Jobs (param `location`) */
const LOCATION_OPTIONS = [
  { value: '', label: 'Tất cả địa điểm' },
  { value: 'Ha Noi', label: 'Hà Nội' },
  { value: 'Ho Chi Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Da Nang', label: 'Đà Nẵng' },
  { value: 'Can Tho', label: 'Cần Thơ' },
];

const PREVIEW_LIMIT = 6;

const FEATURED_GROUPS = [
  { name: 'Công nghệ thông tin', count: 81, icon: Code, path: '/jobs?category=it' },
  { name: 'Marketing & Bán hàng', count: 24, icon: Megaphone, path: '/jobs?category=marketing' },
  { name: 'Tài chính & Kế toán', count: 18, icon: Landmark, path: '/jobs?category=finance' },
  { name: 'Thiết kế & Sáng tạo', count: 21, icon: Palette, path: '/jobs?category=design' },
  { name: 'Nhân sự', count: 125, icon: Users, path: '/jobs?category=hr' },
  { name: 'Vận hành & Chuỗi cung ứng', count: 12, icon: Truck, path: '/jobs?category=operations' },
];

const LandingJobSearchSection = () => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [previewJobs, setPreviewJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  /** Lỗi mạng / API — khác với danh sách rỗng do không có tin published */
  const [loadError, setLoadError] = useState(null);

  const fetchPreview = useCallback(async ({ search, loc } = {}) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = {
        limit: PREVIEW_LIMIT,
        offset: 0,
        search: search?.trim() || undefined,
        location: loc?.trim() || undefined,
      };
      const res = await jobService.getJobs(params);
      const payload = res.data;
      if (payload && payload.success === false) {
        setPreviewJobs([]);
        setLoadError(payload.message || 'Không tải được danh sách việc làm.');
        return;
      }
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setPreviewJobs(list);
    } catch (err) {
      console.error('Landing job preview:', err);
      setPreviewJobs([]);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Không kết nối được API việc làm (kiểm tra gateway + job-service đang chạy).'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview({});
  }, [fetchPreview]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchMode(true);
    fetchPreview({ search: keyword, loc: location });
  };

  const jobsListUrl = (() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (location.trim()) params.set('location', location.trim());
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  })();

  return (
    <section className="py-16 md:py-20 bg-white border-t border-border/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <h2
            className="text-3xl md:text-4xl font-black tracking-tight leading-[1.12] mb-3"
            style={{ color: 'hsl(var(--landing-ink))' }}
          >
            Việc làm mới <span className="text-primary">dành cho bạn</span>
          </h2>
          <p className="text-base font-medium" style={{ color: 'hsl(var(--landing-body))' }}>
            Tìm theo từ khóa và khu vực — kết quả được cá nhân hóa bởi AI.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white border border-border/60 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] focus-within:border-primary/30 focus-within:shadow-[0_12px_40px_-12px_rgba(16,185,129,0.14)] transition-all duration-300">
            <label className="flex-1 flex items-center gap-3 px-4 py-3 min-h-[52px] rounded-xl bg-muted/30">
              <Search className="size-5 text-muted-foreground shrink-0" aria-hidden />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Chức danh, từ khóa…"
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base text-foreground font-medium placeholder:text-muted-foreground/70"
              />
            </label>
            <label className="flex-1 flex items-center gap-3 px-4 py-3 min-h-[52px] rounded-xl bg-muted/30 sm:border-l border-border/50">
              <MapPin className="size-5 shrink-0 text-primary/70" strokeWidth={1.5} aria-hidden />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-base text-foreground font-medium cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.15rem_center] bg-no-repeat pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                }}
                aria-label="Địa điểm"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="landing-btn-primary px-8 py-3.5 rounded-xl font-bold text-base shrink-0"
            >
              Tìm kiếm
            </button>
          </div>
        </motion.form>

        {/* Card việc làm — cùng biên ngang với lưới nhóm ngành (full container max-w-7xl) */}
        <div className="mb-16 w-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h3
                className="text-xl md:text-2xl font-bold"
                style={{ color: 'hsl(var(--landing-ink))' }}
              >
                {searchMode ? 'Kết quả gợi ý' : 'Việc làm nổi bật'}
              </h3>
              <p
                className="text-base font-medium mt-1"
                style={{ color: 'hsl(var(--landing-faint))' }}
              >
                {searchMode
                  ? 'Hiển thị tối đa 6 vị trí. Xem đầy đủ bộ lọc trên trang việc làm.'
                  : 'Cập nhật mới — bấm tìm kiếm để lọc theo từ khóa và khu vực.'}
              </p>
            </div>
            <Link
              to={jobsListUrl}
              className="inline-flex items-center gap-2 text-base font-bold text-primary hover:underline shrink-0"
            >
              Xem tất cả kết quả
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-white p-6 space-y-4">
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : previewJobs.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center text-base"
              style={{ color: 'hsl(var(--landing-body))' }}
            >
              {loadError ? (
                <>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">{loadError}</p>
                  <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    Trang chủ gọi <code className="rounded bg-muted px-1">GET /api/jobs</code> qua
                    gateway Express. Đảm bảo API đang chạy (mặc định cổng 5000) và Vite proxy{' '}
                    <code className="rounded bg-muted px-1">/api</code> trỏ đúng.
                  </p>
                </>
              ) : searchMode ? (
                <p className="font-medium">
                  Không tìm thấy việc làm phù hợp. Thử từ khóa khác hoặc mở trang việc làm để lọc
                  chi tiết.
                </p>
              ) : (
                <>
                  <p className="font-medium">Chưa có tin tuyển dụng để hiển thị.</p>
                  <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Có bảng <strong>jobs</strong> trong MySQL vẫn có thể trống, hoặc toàn bộ tin
                    đang ở trạng thái <strong>draft / pending</strong>. Trang này chỉ lấy tin{' '}
                    <strong>published</strong>. Thêm tin và xuất bản từ tài khoản nhà tuyển dụng,
                    hoặc chạy seed: <code className="rounded bg-muted px-1">npm run db:seed</code>{' '}
                    trong thư mục <code className="rounded bg-muted px-1">server</code> (file{' '}
                    <code className="rounded bg-muted px-1">05_sample_jobs.sql</code>).
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {previewJobs.map((job) => (
                <JobCard key={job.id} job={job} basePath="/jobs" />
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 text-center md:text-left">
          <h3
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ color: 'hsl(var(--landing-ink))' }}
          >
            Các nhóm ngành nổi bật
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURED_GROUPS.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={g.path}
                  className={cn(
                    'landing-card flex flex-col items-center text-center p-6 rounded-2xl h-full',
                    'hover:border-primary/25 hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.08)] transition-all duration-300'
                  )}
                >
                  <div className="landing-icon-circle size-[3.75rem] mb-4">
                    <Icon className="size-7" strokeWidth={1.5} aria-hidden />
                  </div>
                  <p
                    className="text-base font-bold leading-snug mb-2"
                    style={{ color: 'hsl(var(--landing-ink))' }}
                  >
                    {g.name}
                  </p>
                  <p
                    className="text-sm font-medium tabular-nums"
                    style={{ color: 'hsl(var(--landing-faint))' }}
                  >
                    {g.count} việc làm
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingJobSearchSection;
