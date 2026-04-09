import React, { useState, useEffect } from 'react';
import {
  Search,
  Code2,
  Calculator,
  Megaphone,
  TrendingUp,
  Users,
  Palette,
  HardHat,
  Languages,
  Stethoscope,
  GraduationCap,
  Truck,
  ArrowRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Moved MOCK_CATEGORIES outside
const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Công nghệ thông tin',
    desc: 'Phát triển phần mềm, AI & Big Data.',
    count: 3240,
    growth: '+24%',
    icon: <Code2 />,
    tags: ['HOT', 'High Salary'],
  },
  {
    id: 2,
    name: 'Kế toán / Kiểm toán',
    desc: 'Tài chính doanh nghiệp & Kiểm soát.',
    count: 1500,
    growth: '+5%',
    icon: <Calculator />,
    tags: ['Stable'],
  },
  {
    id: 3,
    name: 'Marketing & Media',
    desc: 'Thương hiệu, Digital & Content.',
    count: 1800,
    growth: '+12%',
    icon: <Megaphone />,
    tags: ['Creative', 'Remote'],
  },
  {
    id: 4,
    name: 'Kinh doanh / Sales',
    desc: 'Phát triển thị trường & Bán lẻ.',
    count: 2100,
    growth: '+18%',
    icon: <TrendingUp />,
    tags: ['High Bonus'],
  },
  {
    id: 5,
    name: 'Nhân sự (HR)',
    desc: 'Tuyển dụng & C&B.',
    count: 980,
    growth: '+8%',
    icon: <Users />,
    tags: [],
  },
  {
    id: 6,
    name: 'Thiết kế / Sáng tạo',
    desc: 'UI/UX, Đồ họa & Nội thất.',
    count: 1200,
    growth: '+15%',
    icon: <Palette />,
    tags: ['Remote', 'Freelance'],
  },
  {
    id: 7,
    name: 'Xây dựng',
    desc: 'Kiến trúc & Giám sát thi công.',
    count: 650,
    growth: '+6%',
    icon: <HardHat />,
    tags: [],
  },
  {
    id: 8,
    name: 'Ngôn ngữ',
    desc: 'Biên phiên dịch đa ngôn ngữ.',
    count: 420,
    growth: '+10%',
    icon: <Languages />,
    tags: ['Remote'],
  },
  {
    id: 9,
    name: 'Y tế / Sức khỏe',
    desc: 'Dược phẩm & Chăm sóc sức khỏe.',
    count: 720,
    growth: '+7%',
    icon: <Stethoscope />,
    tags: ['Meaningful'],
  },
  {
    id: 10,
    name: 'Giáo dục',
    desc: 'EdTech & Đào tạo trực tuyến.',
    count: 650,
    growth: '+11%',
    icon: <GraduationCap />,
    tags: [],
  },
  {
    id: 11,
    name: 'Logistics',
    desc: 'Chuỗi cung ứng & Vận tải.',
    count: 890,
    growth: '+14%',
    icon: <Truck />,
    tags: ['Growing'],
  },
];

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Simulate API
    setTimeout(() => {
      setCategories(MOCK_CATEGORIES);
      setLoading(false);
    }, 800);
  }, []);

  const filteredCategories = (Array.isArray(categories) ? categories : []).filter((cat) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'hot') return cat.tags.includes('HOT') || parseInt(cat.growth) > 15;
    if (activeTab === 'student')
      return ['Marketing & Media', 'Kinh doanh / Sales', 'Thiết kế / Sáng tạo'].includes(cat.name);
    if (activeTab === 'remote') return cat.tags.includes('Remote');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. Professional Header */}
      <div className="relative border-b border-slate-700 pt-48 pb-32 overflow-hidden bg-slate-900">
        {/* Background Image - Corporate Lobby (Categories/Structure) */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=100"
            alt="Corporate Lobby"
            className="w-full h-full object-cover"
          />
          {/* Dark tint for contrast */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-6 animate-fade-in">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-primary-200 text-xs font-bold uppercase tracking-wider border border-white/20">
                Career Intelligence
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1] drop-shadow-lg text-wrap-balance">
              Khám phá hệ sinh thái <br />
              <span className="text-primary-300">nghề nghiệp hiện đại</span>
            </h1>
            <p className="text-slate-200 text-xl font-medium mb-10 max-w-2xl leading-relaxed drop-shadow-md">
              Cập nhật xu hướng thị trường, dữ liệu tuyển dụng và định hướng nghề nghiệp chuẩn xác
              với công nghệ AI.
            </p>

            {/* Professional Search */}
            <div className="bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 flex items-center max-w-xl">
              <Search className="ml-4 text-slate-400 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm lĩnh vực chuyên môn…"
                className="w-full h-14 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/20 outline-none font-medium text-slate-700 placeholder:text-slate-400 bg-transparent text-lg"
              />
              <button className="h-12 px-8 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap hover:scale-105 active:scale-95 flex items-center justify-center">
                Khám phá
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* 2. AI Insight Dashboard Widget */}
        <div className="bg-slate-900 rounded-[1.5rem] p-8 md:p-10 mb-16 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary-300 font-bold mb-3 uppercase text-xs tracking-widest">
                <Sparkles size={14} />
                <span>AI Analysis Report</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Lĩnh vực tiềm năng của bạn</h2>
              <p className="text-slate-400 mb-8 leading-relaxed max-w-lg">
                Dựa trên hồ sơ kỹ năng và lịch sử hoạt động, hệ thống đề xuất các nhóm ngành có chỉ
                số phù hợp cao nhất (Matching Score &gt; 85%).
              </p>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Code2 size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-bold uppercase">Top 1</p>
                    <p className="font-bold text-sm">Công nghệ thông tin</p>
                  </div>
                </div>
                <div className="h-px w-8 bg-white/20"></div>
                <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center">
                    <Megaphone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-bold uppercase">Top 2</p>
                    <p className="font-bold text-sm">Digital Marketing</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md min-w-[300px]">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center justify-between">
                Chỉ số tăng trưởng
                <BarChart3 size={16} />
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>IT & Software</span>
                    <span className="text-green-400">+24%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-[90%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Marketing</span>
                    <span className="text-green-400">+12%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-500 w-[75%] rounded-full"></div>
                  </div>
                </div>
              </div>
              <button className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-500 rounded-lg font-bold text-sm transition-colors">
                Xem báo cáo chi tiết
              </button>
            </div>
          </div>
        </div>

        {/* 3. Controls & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'hot', label: 'Xu hướng Hot' },
              { id: 'student', label: 'Intern/Fresher' },
              { id: 'remote', label: 'Remote First' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-muted/35'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Sắp xếp theo:</span>
            <select className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer">
              <option>Phổ biến nhất</option>
              <option>Lương cao nhất</option>
              <option>Nhu cầu tuyển dụng</option>
            </select>
          </div>
        </div>

        {/* 4. Professional Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(filteredCategories) &&
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-500/50 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
                >
                  {cat.tags.includes('HOT') && (
                    <div className="absolute top-0 right-0">
                      <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-sm">
                        Trending
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-colors">
                        {React.cloneElement(cat.icon, { size: 24 })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <TrendingUp size={12} />
                        {cat.growth}
                      </div>
                    </div>

                    <h3
                      className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors truncate"
                      title={cat.name}
                    >
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
                      {cat.desc}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
                      {cat.tags
                        .filter((t) => t !== 'HOT')
                        .map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded text-[10px] font-bold uppercase tracking-wide"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">
                          {cat.count.toLocaleString()}
                        </span>
                        <span className="text-slate-400">công việc</span>
                      </div>
                      <Link
                        to={`/jobs?category_id=${cat.id}`}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 5. Career Roadmap (Corporate Style) */}
      <div className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lộ trình Phát triển</h2>
          <p className="text-slate-500 mb-12">Định hướng sự nghiệp dài hạn từ chuyên gia</p>

          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              'Intern / Trainee',
              'Fresher / Junior',
              'Mid-Level',
              'Senior / Lead',
              'Manager / Director',
            ].map((level, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:-translate-y-1 transition-transform"
              >
                {idx < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-slate-300 z-10"></div>
                )}
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 font-bold text-sm flex items-center justify-center mx-auto mb-3 border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <p className="font-bold text-slate-900 text-sm">{level}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link to="/career">
              <span className="inline-flex items-center gap-2 text-primary-600 font-bold hover:underline cursor-pointer">
                Xem chi tiết lộ trình ngành IT <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
