import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { Search, Briefcase } from 'lucide-react';
import CompanyCard from '../../components/candidate/companies/CompanyCard';
import Button from '../../components/common/Button';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockCompanies = Array(9)
      .fill(0)
      .map((_, i) => ({
        id: i + 1,
        name: i % 2 === 0 ? 'Tech Solutions Inc.' : 'Creative Studio Global',
        industry: i % 2 === 0 ? 'Information Technology' : 'Design & Creative',
        location: 'Hồ Chí Minh, Vietnam',
        size: '100-500',
        openPositions: 3 + i,
        logo: '',
      }));

    setTimeout(() => {
      setCompanies(mockCompanies);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-emerald-50/30 dark:bg-slate-950 pb-16">
      {/* Hero - blog-style: off-white + blurred photo overlay */}
      <div className="company-hero-bg pt-16 pb-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-[#D1FAE5] dark:bg-primary/10 px-4 py-2 text-base font-semibold text-primary">
            <Briefcase size={16} />
            Khám phá doanh nghiệp
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#1A202C] dark:text-white tracking-tight mb-4">
            Khám phá <span className="text-primary">Văn hóa Doanh nghiệp</span>
          </h1>
          <p className="text-[#4A5568] dark:text-slate-400 text-base md:text-lg max-w-2xl font-medium">
            Tìm kiếm không gian làm việc lý tưởng tại các công ty hàng đầu. Sự nghiệp thăng hoa bắt
            đầu từ môi trường phù hợp.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-20">
        <Card className="mb-12 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] rounded-3xl">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Nhập tên doanh nghiệp..."
                className="w-full pl-14 pr-4 py-4 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-800/50 hover:bg-muted/50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <Briefcase
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <select className="w-full pl-14 pr-8 py-4 rounded-2xl border-none bg-slate-50/50 dark:bg-slate-800/50 hover:bg-muted/50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium appearance-none text-slate-900 dark:text-white cursor-pointer">
                <option>Tất cả ngành nghề</option>
                <option>IT - Phần mềm</option>
                <option>Marketing</option>
                <option>Tài chính - Ngân hàng</option>
              </select>
            </div>

            <Button className="h-[56px] px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 whitespace-nowrap hidden md:flex shrink-0">
              Tìm kiếm (1,234)
            </Button>

            {/* Mobile Actions */}
            <div className="flex md:hidden mt-2">
              <Button className="w-full h-[56px] rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-indigo-500/25">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
