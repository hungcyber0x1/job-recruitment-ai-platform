import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Briefcase, Loader2, Search, Sparkles, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryService } from '@/services';
import { renderCategoryIcon, unwrapCategoryListResponse } from '@/utils';

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'hiring', label: 'Đang có việc' },
  { id: 'skill-linked', label: 'Có kỹ năng' },
  { id: 'unmapped', label: 'Chưa gắn việc làm' },
];

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const response = await categoryService.getAllCategories();
        if (!cancelled) {
          setCategories(unwrapCategoryListResponse(response));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load categories:', error);
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

  const summary = useMemo(() => {
    const topCategory = [...categories].sort((a, b) => b.jobCount - a.jobCount)[0] || null;
    const topSkillCategory = [...categories].sort((a, b) => b.skillCount - a.skillCount)[0] || null;
    const totalJobs = categories.reduce((sum, category) => sum + category.jobCount, 0);
    const skillLinkedCount = categories.filter((category) => category.skillCount > 0).length;

    return {
      totalCategories: categories.length,
      totalJobs,
      skillLinkedCount,
      topCategory,
      topSkillCategory,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const next = categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword);

      if (!matchesSearch) return false;

      if (activeTab === 'hiring') return category.jobCount > 0;
      if (activeTab === 'skill-linked') return category.skillCount > 0;
      if (activeTab === 'unmapped') return category.jobCount === 0;
      return true;
    });

    if (sortBy === 'alphabetical') {
      return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    if (sortBy === 'skills') {
      return next.sort((a, b) => b.skillCount - a.skillCount || a.name.localeCompare(b.name, 'vi'));
    }

    return next.sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name, 'vi'));
  }, [activeTab, categories, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="relative overflow-hidden border-b border-slate-700 bg-slate-900 pb-24 pt-40">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
            alt="Tổng quan phân loại ngành nghề"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-bold uppercase tracking-normal text-primary-200 backdrop-blur-md">
                Phân loại trực tiếp
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-normal text-white md:text-6xl">
              Khám phá hệ sinh thái <br />
              <span className="text-primary-300">ngành nghề đang hoạt động</span>
            </h1>

            <p className="mb-10 mt-6 max-w-2xl text-xl font-medium leading-relaxed text-slate-200">
              Dữ liệu dưới đây đang lấy trực tiếp từ hệ phân loại thật của hệ thống, gồm số lượng việc làm
              đang công khai và mức độ liên kết với bộ kỹ năng.
            </p>

            <div className="flex max-w-xl items-center rounded-xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <Search className="ml-4 shrink-0 text-slate-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm ngành nghề hoặc mô tả..."
                className="h-14 w-full bg-transparent px-4 text-lg font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="relative mb-16 overflow-hidden rounded-[1.5rem] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 md:p-10">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary-600/20 blur-[100px]" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr),minmax(320px,0.8fr)]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-normal text-primary-300">
                <Sparkles size={14} />
                <span>Báo cáo phân loại</span>
              </div>

              <h2 className="text-3xl font-bold">Toàn cảnh ngành nghề đang chạy thật</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-slate-400">
                Đây là lớp dữ liệu được dùng cho việc làm công khai, bộ lọc tìm việc và các luồng quản trị.
                Không còn số tăng trưởng hay thẻ mô phỏng.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-bold uppercase tracking-normal text-slate-300">
                    Tổng danh mục
                  </p>
                  <p className="mt-2 text-3xl font-bold">{summary.totalCategories}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-bold uppercase tracking-normal text-slate-300">
                    Việc làm công khai
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {summary.totalJobs.toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-sm font-bold uppercase tracking-normal text-slate-300">
                    Có kỹ năng
                  </p>
                  <p className="mt-2 text-3xl font-bold">{summary.skillLinkedCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="mb-4 flex items-center justify-between text-sm font-bold text-slate-300">
                Danh mục nổi bật
                <BarChart3 size={16} />
              </h3>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-400">
                    Nhiều việc làm nhất
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {summary.topCategory?.name || 'Chưa có dữ liệu'}
                  </p>
                  <p className="mt-1 text-base text-slate-400">
                    {summary.topCategory
                      ? `${summary.topCategory.jobCount} việc làm đang công khai`
                      : 'Sẽ hiển thị khi hệ thống có dữ liệu.'}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-slate-400">
                    Liên kết kỹ năng mạnh nhất
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {summary.topSkillCategory?.name || 'Chưa có dữ liệu'}
                  </p>
                  <p className="mt-1 text-base text-slate-400">
                    {summary.topSkillCategory
                      ? `${summary.topSkillCategory.skillCount} kỹ năng đang gắn`
                      : 'Sẽ hiển thị khi kỹ năng trong hệ phân loại được liên kết.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-muted/35'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="shrink-0">Sắp xếp theo:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[220px] border-none bg-transparent p-0 font-bold text-slate-900 shadow-none focus:ring-0">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
                <SelectItem value="popular">Nhiều việc làm nhất</SelectItem>
                <SelectItem value="skills">Nhiều kỹ năng nhất</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-900">Không có ngành nghề nào khớp</h3>
            <p className="mt-2 text-slate-500">
              Thử từ khóa khác hoặc đổi bộ lọc để xem thêm hệ phân loại đang hoạt động.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => {
              const isTopDemand =
                summary.topCategory?.id === category.id && category.jobCount > 0;

              return (
                <div
                  key={category.id}
                  className="card-premium-hover group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700 transition-colors group-hover:border-primary-600 group-hover:bg-primary-600 group-hover:text-white">
                        {renderCategoryIcon(category, { size: 24 })}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {isTopDemand ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold uppercase tracking-normal text-emerald-700">
                            Nhu cầu cao
                          </span>
                        ) : null}

                        {category.skillCount > 0 ? (
                          <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold uppercase tracking-normal text-sky-700">
                            Có kỹ năng liên kết
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-primary-600">
                      {category.name}
                    </h3>

                    <p className="mb-5 line-clamp-3 text-base leading-relaxed text-slate-500">
                      {category.description || 'Danh mục này đang chờ bổ sung mô tả chi tiết.'}
                    </p>
                  </div>

                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                        <Briefcase size={14} />
                        {category.jobCount} việc làm
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                        <Tags size={14} />
                        {category.skillCount} kỹ năng
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="text-sm text-slate-400">
                        <span className="block font-bold text-slate-900">{category.slug || 'phan-loai'}</span>
                        <span>Mã phân loại</span>
                      </div>

                      <Link
                        to={`/jobs?category_id=${category.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-primary-600 group-hover:text-white"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-slate-200 py-24">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Lộ trình phát triển</h2>
            <p className="mb-12 text-slate-500">
              Dùng hệ phân loại ngành nghề để định hướng lộ trình phù hợp theo từng giai đoạn nghề nghiệp
            </p>

            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-5">
              {[
                'Thực tập sinh / Học việc',
                'Mới tốt nghiệp / Cấp cơ bản',
                'Cấp trung',
                'Cấp cao / Trưởng nhóm',
                'Quản lý / Giám đốc',
              ].map((level, index) => (
                <div
                  key={level}
                  className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1"
                >
                  {index < 4 ? (
                    <div className="absolute right-[-12px] top-1/2 z-10 hidden h-px w-6 bg-slate-300 md:block" />
                  ) : null}

                  <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-primary-100 bg-primary-50 text-sm font-bold text-primary transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    {index + 1}
                  </div>
                  <p className="text-base font-bold text-slate-900">{level}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link to="/chat" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
                Trò chuyện với AI về bước tiếp theo
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
