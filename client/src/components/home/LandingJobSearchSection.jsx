import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  ArrowRight,
  DollarSign,

  Building2,
  Check,
  ChevronDown,
  Sparkles,
  Bookmark,
  Calendar,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  cn,
  filterJobLocationOptions,
  getJobLocationDisplayLabel,
  resolveJobLocationValue,
} from '@/utils';
import { useRef } from 'react';
import { jobService, categoryService } from '@/services';
import { Skeleton } from '@/components/ui/skeleton';
import { renderCategoryIcon, unwrapCategoryListResponse } from '@/utils';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { candidateService } from '../../services';
import {
  isJobApplicationDeadlinePassed,
} from '@/utils/jobDeadline';
import { getJobSalaryCardLabel } from '@/utils/jobSalary';

/* ─── Mock data để đảm bảo luôn đủ 8 cards (2 hàng 4 cột) ─── */
const MOCK_JOBS = [
  {
    id: 101,
    title: 'Lập trình viên full-stack cấp cao (React + Node.js)',
    company_name: 'TechCorp Việt Nam',
    location: 'Quận 1, TP. HCM',
    salary_range: '25 triệu - 45 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['React', 'Node.js', 'MongoDB'],
    deadline: '2026-05-15',
  },
  {
    id: 102,
    title: 'Kỹ sư AI/ML',
    company_name: 'TechCorp Việt Nam',
    location: 'Quận 3, TP. HCM',
    salary_range: '30 triệu - 55 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Python', 'PyTorch', 'LLM'],
    deadline: '2026-05-20',
  },
  {
    id: 103,
    title: 'Lập trình viên Java cấp cao (Nhật Bản)',
    company_name: 'Nextech Solutions',
    location: 'Tokyo, Nhật Bản (Từ xa)',
    salary_range: '30 triệu - 50 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Java', 'Spring Boot', 'AWS'],
    deadline: '2026-06-10',
  },
  {
    id: 104,
    title: 'Quản lý marketing hiệu suất',
    company_name: 'GreenLeaf Digital Agency',
    location: 'Quận 7, TP. HCM',
    salary_range: '20 triệu - 35 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Quảng cáo Facebook', 'Quảng cáo Google', 'SEO'],
    deadline: '2026-05-12',
  },
  {
    id: 105,
    title: 'Chuyên viên thiết kế học liệu',
    company_name: 'EduFirst Việt Nam',
    location: 'Quận 10, TP. HCM',
    salary_range: '15 triệu - 22 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Học trực tuyến', 'Articulate Storyline'],
    deadline: '2026-05-30',
  },
  {
    id: 106,
    title: 'Nhà thiết kế UI/UX cấp cao',
    company_name: 'GreenLeaf Digital Agency',
    location: 'Quận 1, TP. HCM',
    salary_range: '18 triệu - 28 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Figma', 'Nghiên cứu người dùng', 'Tạo mẫu'],
    deadline: '2026-05-25',
  },
  {
    id: 107,
    title: 'Kỹ sư DevOps (AWS / Kubernetes)',
    company_name: 'TechCorp Việt Nam',
    location: 'Quận 1, TP. HCM',
    salary_range: '22 triệu - 38 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['AWS', 'Docker', 'Kubernetes'],
    deadline: '2026-05-18',
  },
  {
    id: 108,
    title: 'Lập trình viên giao diện (Vue.js)',
    company_name: 'TechCorp Việt Nam',
    location: 'Tân Bình, TP. HCM',
    salary_range: '15 triệu - 25 triệu / tháng',
    type: 'Toàn thời gian',
    skills: ['Vue.js', 'Vuex', 'Tailwind'],
    deadline: '2026-04-30',
  },
];

function avatarBg(name) {
  const palette = ['0d9488', '059669', '0f766e', '047857', '0e7490', '155e75', '0891b2', '10b981'];
  const s = String(name || 'C');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

/* ─── Vertical Job Card chuyên nghiệp cho Landing Page ─── */
const LandingJobCard = ({ job, index }) => {
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const [saving, setSaving] = useState(false);

  const logoSrc = useMemo(() => {
    if (job.company_logo) return job.company_logo;
    const name = encodeURIComponent(job.company_name || 'C');
    const bg = avatarBg(job.company_name);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=128&bold=true`;
  }, [job.company_logo, job.company_name]);

  const salary = useMemo(() => getJobSalaryCardLabel(job), [job]);
  const vacancies = Number.parseInt(job.vacancies, 10);
  const vacanciesLabel = Number.isFinite(vacancies) && vacancies > 0 ? `${vacancies} người` : null;

  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 2) : [];
  const deadlinePassed = Boolean(job.deadline && isJobApplicationDeadlinePassed(job.deadline));
  const formattedDeadline = useMemo(() => {
    if (!job.deadline) return null;
    try {
      const d = new Date(job.deadline);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return null;
    }
  }, [job.deadline]);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || user?.role !== 'candidate') {
      showNotification('Vui lòng đăng nhập với tài khoản ứng viên để lưu việc làm', 'warning');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await candidateService.unsaveJob(job.id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu việc làm', 'info');
      } else {
        await candidateService.saveJob(job.id);
        setIsSaved(true);
        showNotification('Đã lưu việc làm thành công', 'success');
      }
    } catch (error) {
      console.warn('LandingJobSearch toggle save error:', error?.message);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <div className="card-premium-hover group flex flex-col items-center text-center h-full rounded-xl border border-border/60 bg-white p-6 relative overflow-hidden">

        {/* Logo Section */}
        <Link
          to={`/jobs/${job.id}`}
          className="mb-4 relative no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="size-16 rounded-xl bg-muted/30 flex items-center justify-center border border-border/50 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors overflow-hidden">
            <img
              src={logoSrc}
              alt=""
              className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </Link>

        {/* Content Section */}
        <div className="flex-1 w-full space-y-2">
          <Link
            to={`/jobs/${job.id}`}
            className="no-underline block"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
              {job.title}
            </h4>
          </Link>
          <p className="text-base font-medium text-muted-foreground truncate w-full flex items-center justify-center gap-1.5">
            <Building2 size={12} className="opacity-60" />
            {job.company_name}
          </p>

          <div className="flex flex-col items-center gap-1.5 pt-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin size={12} className="text-primary/70" />
              <span className="truncate max-w-[180px]">
                {job.address || (job.location && job.location !== '—' ? job.location : 'Liên hệ để biết địa chỉ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-foreground/80">
              <DollarSign size={12} className="text-primary" />
              <span>{salary}</span>
            </div>
            {vacanciesLabel && (
              <div className="flex items-center gap-1.5 text-sm font-bold text-sky-700">
                <Users size={12} className="text-sky-500" />
                <span>Tuyển {vacanciesLabel}</span>
              </div>
            )}
            {formattedDeadline && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs font-bold pt-1',
                  deadlinePassed ? 'text-destructive' : 'text-muted-foreground/80'
                )}
              >
                <Calendar size={12} className={deadlinePassed ? 'text-destructive' : 'text-primary/60'} />
                <span>
                  {deadlinePassed ? 'Đã hết hạn' : `Hạn ứng tuyển: ${formattedDeadline}`}
                </span>
              </div>
            )}
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
        <div className="w-full pt-4 border-t border-border/40 mt-auto flex items-center justify-between gap-2">
          {/* Bookmark button */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving}
            className={`p-2 rounded-lg border transition-all ${
              isSaved
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-primary hover:border-primary/30'
            } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
          >
            <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
          </button>
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all flex-1 justify-center no-underline"
          >
            Xem chi tiết
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
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

const getLocationOption = (value = '') =>
  LOCATION_OPTIONS.find((option) => option.value.toLowerCase() === String(value).trim().toLowerCase());

const getLocationDisplayLabel = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';
  return getLocationOption(normalizedValue)?.label || normalizedValue;
};

const resolveLocationValue = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  const normalizedQuery = normalizedValue.toLowerCase();
  const matchedOption = LOCATION_OPTIONS.find(
    (option) =>
      option.label.toLowerCase() === normalizedQuery || option.value.toLowerCase() === normalizedQuery
  );

  return matchedOption ? (matchedOption.value === 'all' ? '' : matchedOption.value) : normalizedValue;
};

const PREVIEW_LIMIT = 8;

const normalizeSuggestionText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const jobMatchesKeyword = (job, keyword = '') => {
  const normalizedKeyword = normalizeSuggestionText(keyword);
  if (!normalizedKeyword) return true;

  const searchableFields = [
    job.title,
    job.company_name,
    job.location,
    job.address,
    ...(Array.isArray(job.skills) ? job.skills : []),
  ];

  return searchableFields.some((field) => normalizeSuggestionText(field).includes(normalizedKeyword));
};

const jobMatchesLocation = (job, location = '') => {
  const normalizedLocation = normalizeSuggestionText(location);
  if (!normalizedLocation) return true;

  return [job.location, job.address].some((field) =>
    normalizeSuggestionText(field).includes(normalizedLocation)
  );
};

const LandingJobSearchSection = () => {
  const { isAuthenticated, user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationRef = useRef(null);
  const [previewJobs, setPreviewJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const visibleFeaturedCategories = useMemo(() => {
    return [...featuredCategories]
      .sort((a, b) => b.jobCount - a.jobCount || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'))
      .slice(0, 6);
  }, [featuredCategories]);

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

  const fetchPreview = useCallback(async ({ search, loc } = {}) => {
    setLoading(true);
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
        return;
      }
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setPreviewJobs(list);
    } catch (err) {
      console.warn('Landing job preview error:', err?.message);
      setPreviewJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview({});
  }, [fetchPreview]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryService.getAllCategories();
        if (!cancelled) {
          setFeaturedCategories(unwrapCategoryListResponse(response));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Landing categories error:', error?.message);
          setFeaturedCategories([]);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const nextLocation = resolveJobLocationValue(locationQuery || location);
    setLocation(nextLocation);
    setLocationQuery(getJobLocationDisplayLabel(nextLocation) || String(locationQuery || '').trim());
    setIsLocationOpen(false);
    setSearchMode(true);
    fetchPreview({ search: keyword, loc: nextLocation });
  };

  const jobsListUrl = (() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('search', keyword.trim());
    if (location.trim()) params.set('location', location.trim());
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  })();

  const contextualMockJobs = useMemo(() => {
    return MOCK_JOBS.filter((job) => jobMatchesKeyword(job, keyword) && jobMatchesLocation(job, location));
  }, [keyword, location]);

  const suggestedJobs = useMemo(() => {
    if (searchMode) return previewJobs;
    if (previewJobs.length >= 8) return previewJobs.slice(0, 8);

    const remainingCount = 8 - previewJobs.length;
    const existingIds = new Set(previewJobs.map((job) => String(job.id)));
    const fallbackJobs = contextualMockJobs.filter((job) => !existingIds.has(String(job.id)));
    return [...previewJobs, ...fallbackJobs.slice(0, remainingCount)];
  }, [contextualMockJobs, previewJobs, searchMode]);

  const searchSummary = useMemo(() => {
    const parts = [];
    if (keyword.trim()) parts.push(`từ khóa "${keyword.trim()}"`);
    if (location.trim()) parts.push(`khu vực ${getJobLocationDisplayLabel(location)}`);
    return parts.length > 0 ? parts.join(' và ') : 'bộ lọc hiện tại';
  }, [keyword, location]);

  const suggestionContent = useMemo(() => {
    if (searchMode) {
      if (suggestedJobs.length > 0) {
        return {
          title: 'Kết quả phù hợp với tìm kiếm',
          description: `Đang hiển thị ${suggestedJobs.length} vị trí khớp với ${searchSummary}.`,
        };
      }

      return {
        title: 'Chưa có vị trí thật sự khớp',
        description: `Hãy nới rộng ${searchSummary} hoặc xem toàn bộ việc làm đang mở để có thêm lựa chọn.`,
      };
    }

    if (isAuthenticated && user?.role === 'candidate') {
      return {
        title: 'Cơ hội đáng chú ý cho bạn',
        description: 'Ưu tiên tin mới, mức lương rõ ràng và địa điểm đang có nhu cầu tuyển dụng cao.',
      };
    }

    return {
      title: 'Việc làm được quan tâm gần đây',
      description: 'Chọn nhanh các vị trí đang mở, có thông tin rõ ràng và phù hợp để bắt đầu khám phá.',
    };
  }, [isAuthenticated, searchMode, searchSummary, suggestedJobs.length, user?.role]);

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
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-normal mb-4">
            Cơ hội việc làm mới nhất
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-normal leading-[1.1] mb-4"
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
          className="relative z-20 max-w-4xl mx-auto mb-20"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white/95 p-2 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] backdrop-blur sm:flex-row">
            <label className="relative flex flex-1 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm">
              <Search className="absolute left-4 size-5 shrink-0 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Chức danh, kỹ năng, công ty..."
                className="h-14 w-full border-none bg-transparent pl-12 pr-4 text-base font-semibold text-slate-700 placeholder:text-slate-400/90 focus:outline-none"
              />
            </label>
            <div
              className="relative flex shrink-0 items-center rounded-xl border border-transparent bg-muted/35 transition-[border-color,background-color,box-shadow] duration-200 hover:bg-muted/45 focus-within:border-primary/15 focus-within:bg-white focus-within:shadow-sm sm:min-w-[240px]"
              ref={locationRef}
            >
              <MapPin className="ml-4 size-5 shrink-0 text-slate-400" />
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Toàn quốc"
                  value={isLocationOpen ? locationQuery : getJobLocationDisplayLabel(location)}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    if (!isLocationOpen) setIsLocationOpen(true);
                  }}
                  onFocus={() => {
                    setIsLocationOpen(true);
                    setLocationQuery(getJobLocationDisplayLabel(location));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                  className="h-14 w-full border-none bg-transparent px-3 text-base font-semibold text-slate-700 placeholder:text-slate-400/90 focus:outline-none"
                />

                {/* Custom Combobox Dropdown */}
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 right-0 top-[calc(100%+0.625rem)] z-50 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-2xl border border-border/70 bg-white/95 p-2 shadow-[0_20px_48px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl"
                  >
                    {filteredLocations.length > 0 ? (
                      <div className="space-y-1">
                        {filteredLocations.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value === 'all' ? '' : opt.value;
                              setLocation(val);
                              setLocationQuery(opt.label);
                              setIsLocationOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-base font-semibold leading-6 transition-[color,background-color,box-shadow] duration-150',
                              location === (opt.value === 'all' ? '' : opt.value)
                                ? 'bg-primary/6 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            )}
                          >
                            <span className="truncate">{opt.label}</span>
                            {(location === (opt.value === 'all' ? '' : opt.value) ||
                              (opt.value === 'all' && !location)) && (
                              <Check size={16} className="text-primary" />
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
                            setLocation(resolveJobLocationValue(locationQuery));
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
              <ChevronDown
                className={cn(
                  'mr-3 size-4 text-slate-400 transition-transform duration-200',
                  isLocationOpen && 'rotate-180'
                )}
              />
            </div>
            <Button
              type="submit"
              className="h-14 shrink-0 rounded-xl border border-transparent bg-emerald-50 px-10 text-base font-bold text-emerald-950 hover:bg-emerald-100"
            >
              Khám phá ngay
            </Button>
          </div>
        </motion.form>

        <div className="mb-20">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xl font-bold tracking-normal md:text-2xl">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles size={18} className="text-primary" />
                </div>
                {suggestionContent.title}
              </div>
              <h3 className="sr-only">{searchMode ? 'Kết quả tìm được' : 'Gợi ý dành riêng cho bạn'}</h3>
              <p className="text-sm font-medium leading-6 text-muted-foreground md:text-base">
                {suggestionContent.description}
              </p>
            </div>
            <Link
              to={jobsListUrl}
              className="group flex items-center gap-2 text-sm font-semibold text-primary hover:underline md:text-base"
            >
              Xem tất cả
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-white p-6 space-y-6">
                  <div className="flex justify-center">
                    <Skeleton className="size-16 rounded-xl" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : suggestedJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedJobs.map((job, i) => (
                <LandingJobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-white px-6 py-12 text-center">
              <p className="text-lg font-bold text-foreground">Chưa có gợi ý phù hợp để hiển thị</p>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground md:text-base">
                Thử đổi từ khóa, mở rộng khu vực hoặc chuyển sang trang tất cả việc làm để xem thêm cơ hội.
              </p>
            </div>
          )}
        </div>

        <div className="hidden">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-normal mb-10">
            Các nhóm ngành <span className="text-primary">nổi bật</span>
          </h3>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 rounded-xl border border-border/60 bg-white p-8"
                >
                  <Skeleton className="mx-auto h-14 w-14 rounded-xl" />
                  <Skeleton className="mx-auto mt-5 h-5 w-24" />
                  <Skeleton className="mx-auto mt-3 h-4 w-20" />
                </div>
              ))}
            </div>
          ) : visibleFeaturedCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {visibleFeaturedCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/jobs?category_id=${category.id}`}
                    className="card-premium-hover flex flex-col items-center rounded-xl border border-border/60 bg-white p-8 text-center"
                  >
                    <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {renderCategoryIcon(category, { size: 28, strokeWidth: 1.5 })}
                    </div>
                    <p className="mb-2 flex h-10 items-center text-base font-bold leading-tight">
                      {category.name}
                    </p>
                    <p className="text-base font-semibold text-muted-foreground">
                      {category.jobCount.toLocaleString('vi-VN')} vị trí
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-white px-6 py-12 text-center text-muted-foreground">
              Chưa có dữ liệu phân loại để hiển thị trên trang chủ.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingJobSearchSection;
