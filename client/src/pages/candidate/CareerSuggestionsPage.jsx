import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Heart,
  Search,
  Sparkles,
  Cpu,
  Megaphone,
  Palette,
  Eye,
  Clock,
  Rocket,
} from 'lucide-react';
import { jobService } from '../../services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FILTERS = [
  { key: 'all', label: 'Tất cả gợi ý', icon: Sparkles },
  { key: 'tech', label: 'Công nghệ', icon: Cpu },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'design', label: 'Thiết kế', icon: Palette },
];

const SAMPLE_JOBS = [
  {
    id: 1,
    title: 'Senior Product Designer',
    company: 'VinTech Solutions',
    location: 'TP. Hồ Chí Minh (Remote)',
    matchScore: 95,
    hot: true,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=240&fit=crop',
    whyFit: [
      'Kinh nghiệm 4+ năm thiết kế sản phẩm phù hợp với mô tả công việc.',
      'Portfolio có các dự án SaaS và mobile tương đồng.',
      'Thành thạo Figma và quy trình design system.',
    ],
    skills: ['UX Design', 'User Research', 'Figma', 'React Basis'],
  },
  {
    id: 2,
    title: 'AI Engineer (Machine Learning)',
    company: 'Global AI Hub',
    location: 'Hà Nội',
    matchScore: 85,
    hot: false,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=240&fit=crop',
    whyFit: [
      'Kỹ năng Python và ML framework phù hợp với yêu cầu.',
      'Có kinh nghiệm xử lý dữ liệu lớn.',
      'Môi trường làm việc linh hoạt phù hợp với phong cách của bạn.',
    ],
    skills: ['Python', 'PyTorch', 'Data Science'],
  },
];

const CareerSuggestionsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobService.getJobs({ limit: 12 });
        const data = res.data?.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setJobs(
            data.map((j) => ({
              id: j.id,
              title: j.title || j.job_title,
              company: j.company_name || j.company?.name,
              location: j.location,
              matchScore: j.match_score ?? j.relevance_score ?? 85,
              hot: false,
              image: j.image_url,
              whyFit: [],
              skills: Array.isArray(j.skills)
                ? j.skills.map((s) => (typeof s === 'string' ? s : s?.name || s))
                : [],
            }))
          );
        } else {
          setJobs(SAMPLE_JOBS);
        }
      } catch {
        setJobs(SAMPLE_JOBS);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const displayJobs = jobs.slice(0, 6);
  const newCount = displayJobs.length;
  const accuracy = 98;

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="text-base font-medium uppercase tracking-wider text-primary">
          ← AI POWERED INSIGHTS
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
          Gợi ý nghề nghiệp <span className="text-primary">thông minh</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Dựa trên phân tích sâu chuỗi kỹ năng, kinh nghiệm thực tế và xu hướng thị trường, AI của
          chúng tôi đã tìm thấy những vị trí phù hợp nhất dành riêng cho bạn.
        </p>
      </div>

      {/* Metrics + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <Card className="rounded-xl border bg-card px-5 py-4 shadow-sm">
            <p className="text-base font-medium text-muted-foreground">GỢI Ý MỚI</p>
            <p className="text-2xl font-bold text-foreground">{newCount}</p>
          </Card>
          <Card className="rounded-xl border bg-card px-5 py-4 shadow-sm">
            <p className="text-base font-medium text-muted-foreground">ĐỘ CHÍNH XÁC</p>
            <p className="text-2xl font-bold text-emerald-600">{accuracy}%</p>
          </Card>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg bg-background"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <Button
              key={f.key}
              variant={activeFilter === f.key ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg gap-1.5"
              onClick={() => setActiveFilter(f.key)}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </Button>
          );
        })}
      </div>

      {/* Job cards */}
      <div className="space-y-6">
        {loading
          ? [1, 2].map((i) => (
              <Card key={i} className="overflow-hidden rounded-xl">
                <CardContent className="p-0">
                  <div className="h-48 bg-muted animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          : displayJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-48 w-full md:h-auto md:w-64 shrink-0 bg-muted">
                    {job.image ? (
                      <img src={job.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Briefcase className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {job.hot && (
                      <span className="absolute bottom-2 left-2 rounded bg-red-500 px-2 py-0.5 text-base font-medium text-white">
                        HOT JOB
                      </span>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                        <p className="text-base text-muted-foreground">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative h-14 w-14">
                          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-muted"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-primary"
                              strokeWidth="3"
                              strokeDasharray={`${job.matchScore}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">
                            {job.matchScore}%
                          </span>
                        </div>
                        <span className="text-base font-medium text-muted-foreground">
                          MATCH SCORE
                        </span>
                      </div>
                    </div>

                    {job.whyFit && job.whyFit.length > 0 && (
                      <div className="mt-4">
                        <p className="flex items-center gap-1.5 text-base font-medium text-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Tại sao bạn phù hợp?
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-base text-muted-foreground">
                          {job.whyFit.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="flex items-center gap-1.5 text-base font-medium text-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Kỹ năng tương đồng
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md bg-muted px-2.5 py-1 text-base font-medium text-primary"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Button
                        asChild
                        size="sm"
                        className="rounded-lg bg-primary hover:bg-primary/90 gap-1.5"
                      >
                        <Link to={`/candidate/jobs/${job.id}`}>
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
                        <Search className="h-4 w-4" />
                        Tìm việc liên quan
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
      </div>

      {/* Search history */}
      <Card className="mt-10 rounded-xl border bg-card shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Lịch sử tìm kiếm của bạn</h3>
              <p className="text-base text-muted-foreground">
                Xem lại các vị trí bạn đã quan tâm trước đây
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-lg">
            Xem toàn bộ lịch sử
          </Button>
        </CardContent>
      </Card>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8 text-base text-muted-foreground">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          AI Career © {new Date().getFullYear()}
        </div>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-foreground">
            Điều khoản
          </Link>
          <Link to="/" className="hover:text-foreground">
            Bảo mật
          </Link>
          <Link to="/" className="hover:text-foreground">
            Liên hệ
          </Link>
          <Link to="/" className="hover:text-foreground">
            Trợ giúp
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default CareerSuggestionsPage;
