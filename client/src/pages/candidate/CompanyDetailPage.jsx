import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import { MapPin, Globe, Users, CheckCircle2, Star } from 'lucide-react';
import JobCard from '../../components/candidate/jobs/JobCard';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  const mockCompany = useMemo(
    () => ({
      id: id,
      name: 'Tech Solutions Inc.',
      industry: 'Information Technology',
      size: '100-500',
      location: 'Tòa nhà Bitexco, 2 Hải Triều, Q.1, TP.HCM',
      website: 'https://techsolutions.com',
      description: `
            <p>Tech Solutions Inc. là công ty công nghệ hàng đầu chuyên cung cấp các giải pháp chuyển đổi số cho doanh nghiệp.</p>
            <p>Môi trường làm việc trẻ trung, năng động, khuyến khích sự sáng tạo và phát triển cá nhân.</p>
        `,
      benefits: ['Lương tháng 13', 'Bảo hiểm Premium', 'Laptop Macbook Pro', 'Du lịch hàng năm'],
      jobs: [
        {
          id: 1,
          title: 'Senior Frontend Developer',
          company_name: 'Tech Solutions Inc.',
          location: 'Hồ Chí Minh',
          salary_range: '30-50M',
          type: 'Full-time',
          skills: ['React', 'TS'],
          logo: '',
        },
        {
          id: 2,
          title: 'Backend Developer (Golang)',
          company_name: 'Tech Solutions Inc.',
          location: 'Hồ Chí Minh',
          salary_range: '40-60M',
          type: 'Full-time',
          skills: ['Golang', 'Docker'],
          logo: '',
        },
      ],
    }),
    [id]
  );

  useEffect(() => {
    setTimeout(() => {
      setCompany(mockCompany);
      setLoading(false);
    }, 500);
  }, [mockCompany]);

  if (loading)
    return (
      <div className="p-10 text-center font-medium text-slate-500 animate-pulse text-wrap-balance">
        Đang tải dữ liệu công ty…
      </div>
    );

  return (
    <div className="min-h-screen bg-emerald-50/30 dark:bg-slate-950 pb-16">
      {/* Header Banner - blog-style: off-white + blurred photo overlay */}
      <div className="company-hero-bg h-48 md:h-56" aria-hidden />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="p-0 overflow-hidden mb-8 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-3xl">
          <div className="px-8 pb-8 pt-4">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-6">
              <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl p-3 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center shrink-0 -mt-16 z-20">
                <img
                  src={
                    company.logo ||
                    `https://ui-avatars.com/api/?name=${company.name}&background=random`
                  }
                  alt={company.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {company.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 font-medium mt-2">
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {company.industry}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <MapPin size={16} /> {company.location}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-auto pb-2 shrink-0">
                <button className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-emerald-700 hover:-translate-y-1 transition-all">
                  + Theo dõi công ty
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quy mô
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {company.size} nhân viên
                  </p>
                </div>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-800 h-12 hidden md:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Website
                  </p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline truncate block max-w-[200px]"
                  >
                    {company.website.replace('https://', '')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
              {[
                { id: 'about', label: 'Giới thiệu' },
                { id: 'jobs', label: `Tuyển dụng (${company.jobs?.length || 0})` },
                { id: 'reviews', label: 'Đánh giá' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-indigo-500/25 -translate-y-0.5'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-muted/35 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                    Về chúng tôi
                  </h3>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(company.description) }}
                  ></div>
                </Card>

                <Card className="p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                    Tại sao bạn sẽ yêu thích làm việc tại đây?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.benefits.map((benefit, idx) => (
                      <div
                        key={`${benefit}-${idx}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 font-bold hover:-translate-y-1 transition-transform"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {company.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-20 text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Star size={32} />
                </div>
                Chưa có đánh giá nào.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm bg-emerald-950 text-white relative overflow-hidden hidden lg:block">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Star size={120} />
              </div>
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10 text-white">
                Đánh giá tổng quan
              </h3>
              <div className="text-center relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <p className="text-6xl font-black text-white mb-2">4.8</p>
                <div className="flex justify-center gap-1 my-3 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={20} fill="currentColor" />
                  ))}
                </div>
                <p className="text-emerald-200 font-bold text-sm uppercase tracking-wider">
                  Dựa trên 128 đánh giá
                </p>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:hidden">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                Đánh giá tổng quan
              </h3>
              <div className="text-center">
                <p className="text-6xl font-black text-slate-900 dark:text-white mb-2">4.8</p>
                <div className="flex justify-center gap-1 my-3 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={20} fill="currentColor" />
                  ))}
                </div>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                  Dựa trên 128 đánh giá
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
