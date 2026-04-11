import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  DollarSign,
  Clock,
  Sparkles,
  Building2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils';
import { useRef } from 'react';
import { jobService } from '@/services';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── Mock data để đảm bảo luôn đủ 8 cards (2 hàng 4 cột) ─── */
const MOCK_JOBS = [
  {
    id: 'm1',
    title: 'Senior Frontend Developer (React)',
    company_name: 'TechBase Vietnam',
    location: 'TP. Hồ Chí Minh',
    salary_range: '2,500 - 4,000 USD',
    type: 'full-time',
    match_score: 98,
    skills: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: 'm2',
    title: 'Backend Engineer (Node.js/Go)',
    company_name: 'VNG Corporation',
    location: 'Hà Nội',
    salary_range: '30 - 55 triệu',
    type: 'full-time',
    match_score: 95,
    skills: ['Node.js', 'Golang', 'Kubernetes'],
  },
  {
    id: 'm3',
    title: 'AI Research Engineer',
    company_name: 'FPT Smart Cloud',
    location: 'Đà Nẵng',
    salary_range: 'Thỏa thuận',
    type: 'full-time',
    match_score: 92,
    skills: ['Python', 'PyTorch', 'LLMs'],
  },
  {
    id: 'm4',
    title: 'Product Manager (SaaS)',
    company_name: 'Tiki Engineering',
    location: 'TP. Hồ Chí Minh',
    salary_range: '40 - 70 triệu',
    type: 'full-time',
    match_score: 89,
    skills: ['Agile', 'Product Roadmap', 'SQL'],
  },
  {
    id: 'm5',
    title: 'DevOps Engineer',
    company_name: 'MoMo (M_Service)',
    location: 'TP. Hồ Chí Minh',
    salary_range: '2,000 - 3,500 USD',
    type: 'full-time',
    match_score: 87,
    skills: ['AWS', 'Docker', 'Terraform'],
  },
  {
    id: 'm6',
    title: 'UI/UX Designer',
    company_name: 'Zalo Group',
    location: 'Hà Nội',
    salary_range: '25 - 45 triệu',
    type: 'full-time',
    match_score: 85,
    skills: ['Figma', 'User Research', 'Prototyping'],
  },
  {
    id: 'm7',
    title: 'Data Scientist',
    company_name: 'Shopee Vietnam',
    location: 'TP. Hồ Chí Minh',
    salary_range: '1,800 - 3,200 USD',
    type: 'full-time',
    match_score: 82,
    skills: ['Python', 'Spark', 'Machine Learning'],
  },
  {
    id: 'm8',
    title: 'Mobile Engineer (Flutter)',
    company_name: 'OneMount Group',
    location: 'Hà Nội',
    salary_range: '30 - 50 triệu',
    type: 'full-time',
    match_score: 80,
    skills: ['Flutter', 'Dart', 'Firebase'],
  },
];

const TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  freelance: 'Freelance',
};

function avatarBg(name) {
  const palette = ['0d9488', '059669', '0f766e', '047857', '0e7490', '155e75', '0891b2', '10b981'];
  const s = String(name || 'C');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

/* ─── Vertical Job Card chuyên nghiệp cho Landing Page ─── */
const LandingJobCard = ({ job, index }) => {
  const logoSrc = useMemo(() => {
    if (job.company_logo) return job.company_logo;
    const name = encodeURIComponent(job.company_name || 'C');
    const bg = avatarBg(job.company_name);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true`;
  }, [job.company_logo, job.company_name]);

  const salary = useMemo(() => {
    const r = String(job.salary_range || '').trim();
    return r.length > 0 ? r : 'Thỏa thuận';
  }, [job.salary_range]);

  const jobType = useMemo(() => {
    if (!job.type) return null;
    const k = job.type.trim().toLowerCase().replace(/\s+/g, '-');
    return TYPE_LABELS[k] || job.type;
  }, [job.type]);

  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 2) : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <Link
        to={`/jobs/${job.id}`}
        className="card-premium-hover group flex flex-col items-center text-center h-full rounded-2xl border border-border/60 bg-white p-6 relative overflow-hidden"
      >
        {/* Match Score Badge */}
        {job.match_score > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Sparkles size={10} className="text-emerald-500" />
            {job.match_score}%
          </div>
        )}

        {/* Logo Section */}
        <div className="mb-4 relative">
          <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/50 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors overflow-hidden">
            <img
              src={logoSrc}
              alt=""
              className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 w-full space-y-2">
          <h4 className="text-base font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {job.title}
          </h4>
          <p className="text-base font-medium text-muted-foreground truncate w-full flex items-center justify-center gap-1.5">
            <Building2 size={12} className="opacity-60" />
            {job.company_name}
          </p>

          <div className="flex flex-col items-center gap-1.5 pt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={12} className="text-primary/70" />
              <span className="truncate max-w-[150px]">{job.location || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground/80">
              <DollarSign size={12} className="text-primary" />
              <span>{salary}</span>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 my-4">
            {skills.map((s) => (
              <span
                key={s}
                className="text-sm font-semibold px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/30"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Action Section */}
        <div className="w-full pt-4 border-t border-border/40 mt-auto">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
            Xem chi tiết
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

const LOCATION_OPTIONS = [
  { value: 'all', label: 'Tất cả địa điểm' },
  { value: 'Ha Noi', label: 'Hà Nội' },
  { value: 'Ho Chi Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Da Nang', label: 'Đà Nẵng' },
  { value: 'Can Tho', label: 'Cần Thơ' },
];

const PREVIEW_LIMIT = 8;

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
  const [locationQuery, setLocationQuery] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationRef = useRef(null);
  const [previewJobs, setPreviewJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [loadError, setLoadError] = useState(null);

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

  const filteredLocations = useMemo(() => {
    if (!locationQuery) return LOCATION_OPTIONS;
    return LOCATION_OPTIONS.filter((opt) =>
      opt.label.toLowerCase().includes(locationQuery.toLowerCase())
    );
  }, [locationQuery]);

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
        err?.response?.data?.message || err?.message || 'Không kết nối được API việc làm.'
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

  /* Kết hợp API data với Mock data để luôn đủ 8 cái */
  const displayedJobs = useMemo(() => {
    if (previewJobs.length >= 8) return previewJobs.slice(0, 8);
    // Nếu API trả về ít hơn 8, lấy thêm từ MOCK_JOBS để bù vào
    const remainingCount = 8 - previewJobs.length;
    return [...previewJobs, ...MOCK_JOBS.slice(0, remainingCount)];
  }, [previewJobs]);

  return (
    <section className="py-16 md:py-24 bg-[#FAFAFA] border-t border-border/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider mb-4">
            Cơ hội việc làm mới nhất
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4"
            style={{ color: 'hsl(var(--landing-ink))' }}
          >
            Việc làm <span className="text-primary">nổi bật</span>
          </h2>
          <p className="text-base font-medium text-muted-foreground italic">
            "Phù hợp nhất với năng lực và mục tiêu sự nghiệp của bạn"
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-3xl bg-white border border-border/80 shadow-2xl shadow-primary/5">
            <label className="flex-[1.5] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-muted/30">
              <Search className="size-5 text-muted-foreground shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Chức danh, kỹ năng, công ty..."
                className="w-full bg-transparent border-none focus:outline-none text-base text-foreground font-semibold placeholder:text-muted-foreground/60"
              />
            </label>
            <div
              className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-muted/30 sm:border-l border-border/50 relative"
              ref={locationRef}
            >
              <MapPin className="size-5 shrink-0 text-primary" />
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Toàn quốc"
                  value={isLocationOpen ? locationQuery : location || ''}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    if (!isLocationOpen) setIsLocationOpen(true);
                  }}
                  onFocus={() => {
                    setIsLocationOpen(true);
                    setLocationQuery(location || '');
                  }}
                  className="w-full bg-transparent border-none focus:outline-none text-base text-foreground font-semibold placeholder:text-muted-foreground/60"
                />

                {/* Custom Combobox Dropdown */}
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-[-40px] right-[-20px] mt-4 p-2 bg-white rounded-2xl shadow-2xl border border-border/60 z-50 max-h-[300px] overflow-y-auto overflow-x-hidden"
                  >
                    {filteredLocations.length > 0 ? (
                      <div className="space-y-1">
                        {filteredLocations.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value === 'all' ? '' : opt.label;
                              setLocation(val);
                              setLocationQuery(opt.label);
                              setIsLocationOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group',
                              location === opt.label || (opt.value === 'all' && !location)
                                ? 'bg-primary/5 text-primary'
                                : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span>{opt.label}</span>
                            {(location === opt.label || (opt.value === 'all' && !location)) && (
                              <Check size={16} className="text-primary/70" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <p className="text-base font-medium text-muted-foreground">
                          Không tìm thấy địa điểm "{locationQuery}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setLocation(locationQuery);
                            setIsLocationOpen(false);
                          }}
                          className="mt-2 text-sm font-bold text-primary hover:underline"
                        >
                          Sử dụng địa điểm này
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-muted-foreground/40 transition-transform duration-300',
                  isLocationOpen && 'rotate-180'
                )}
              />
            </div>
            <button
              type="submit"
              className="px-10 py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Khám phá ngay
            </button>
          </div>
        </motion.form>

        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles size={18} className="text-primary" />
              </div>
              {searchMode ? 'Kết quả tìm được' : 'Gợi ý dành riêng cho bạn'}
            </h3>
            <Link
              to={jobsListUrl}
              className="text-sm font-bold text-primary flex items-center gap-2 hover:underline group"
            >
              Xem tất cả
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-white p-6 space-y-6">
                  <div className="flex justify-center">
                    <Skeleton className="size-16 rounded-2xl" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedJobs.map((job, i) => (
                <LandingJobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="mb-10 text-center">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight mb-10">
            Các nhóm ngành <span className="text-primary">nổi bật</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
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
                    className="card-premium-hover flex flex-col items-center text-center p-8 rounded-3xl border border-border/60 bg-white"
                  >
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-bold leading-tight mb-2 h-10 flex items-center">
                      {g.name}
                    </p>
                    <p className="text-base font-semibold text-muted-foreground">
                      {g.count}+ vị trí
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingJobSearchSection;
