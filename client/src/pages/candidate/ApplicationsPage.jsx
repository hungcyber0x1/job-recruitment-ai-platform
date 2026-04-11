import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MessageSquare, Monitor } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import ChartSurface from '@/components/charts/ChartSurface';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ApplicationDetailModal from '../../components/candidate/applications/ApplicationDetailModal';
import { getStatusConfig } from '../../constants/status';
import applicationService from '../../services/applicationService';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/formatters';

const TAB_IDS = ['all', 'pending', 'interviewing', 'offered', 'rejected'];
const TAB_LABELS = {
  all: 'Tất cả',
  pending: 'Đang chờ duyệt',
  interviewing: 'Đang phỏng vấn',
  offered: 'Đã nhận offer',
  rejected: 'Đã từ chối',
};

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await applicationService.getMyApplications();
        setApplications(response.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const openApplicationDetails = async (applicationId) => {
    setDetailLoading(true);
    try {
      const [appRes, historyRes] = await Promise.all([
        applicationService.getMyApplication(applicationId),
        applicationService.getMyApplicationHistory(applicationId),
      ]);
      setSelectedApplication(appRes.data?.data || null);
      setApplicationHistory(historyRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch application details:', error);
      setSelectedApplication(null);
      setApplicationHistory([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeApplicationDetails = () => {
    setSelectedApplication(null);
    setApplicationHistory([]);
  };

  const isDetailOpen = detailLoading || Boolean(selectedApplication);

  const totalCount = applications.length;
  const interviewCount = useMemo(
    () => applications.filter((a) => a.status === 'interviewing').length,
    [applications]
  );
  const pendingCount = useMemo(
    () =>
      applications.filter((a) =>
        ['pending', 'screening', 'reviewed', 'shortlisted'].includes(a.status || '')
      ).length,
    [applications]
  );
  const offerCount = useMemo(
    () => applications.filter((a) => ['offered', 'hired'].includes(a.status || '')).length,
    [applications]
  );

  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') return applications;
    if (activeTab === 'pending')
      return applications.filter((app) =>
        ['pending', 'screening', 'reviewed', 'shortlisted'].includes(app.status || '')
      );
    return applications.filter((app) => (app.status || '') === activeTab);
  }, [applications, activeTab]);

  const funnelData = useMemo(
    () => [
      { name: 'Ứng tuyển', value: totalCount },
      {
        name: 'Xem hồ sơ',
        value: applications.filter((a) =>
          ['reviewed', 'shortlisted', 'interviewing', 'offered', 'hired'].includes(a.status)
        ).length,
      },
      { name: 'Phỏng vấn', value: interviewCount },
      { name: 'Nhận việc', value: offerCount },
    ],
    [applications, totalCount, interviewCount, offerCount]
  );

  const activeCount = useMemo(
    () =>
      applications.filter((a) =>
        ['pending', 'screening', 'reviewed', 'shortlisted', 'interviewing', 'offered'].includes(
          a.status || ''
        )
      ).length,
    [applications]
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 animate-slide-up">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Đơn ứng tuyển của tôi</h1>
            <p className="mt-1 text-base text-muted-foreground">
              Bạn đang có {activeCount} đơn ứng tuyển đang hoạt động. Tiếp tục cố gắng nhé!
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { key: 'all', value: totalCount, label: 'TẤT CẢ', active: activeTab === 'all' },
              {
                key: 'interview',
                value: interviewCount,
                label: 'PHỎNG VẤN',
                active: activeTab === 'interviewing',
              },
              {
                key: 'pending',
                value: pendingCount,
                label: 'ĐANG CHỜ',
                active: activeTab === 'pending',
              },
              {
                key: 'offer',
                value: offerCount,
                label: 'OFFER',
                active: activeTab === 'offered',
                green: true,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    item.key === 'all'
                      ? 'all'
                      : item.key === 'interview'
                        ? 'interviewing'
                        : item.key
                  )
                }
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all duration-300 hover-lift',
                  item.active
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/5'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-500/30'
                )}
              >
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-base font-bold uppercase tracking-wider opacity-80 leading-none">
                  {item.label}
                </p>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'px-4 py-2 text-base font-bold transition-all relative',
                  activeTab === id
                    ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-500 after:rounded-full'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {TAB_LABELS[id]}
              </button>
            ))}
          </div>

          {/* Application list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="flex gap-4 p-6">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-64 rounded bg-muted animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Briefcase className="mb-4 h-14 w-14 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Không tìm thấy đơn ứng tuyển nào
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Thử đổi bộ lọc hoặc khám phá việc làm để ứng tuyển.
                </p>
                <Button asChild className="mt-6 rounded-lg" variant="outline">
                  <Link to="/candidate/jobs">Khám phá việc làm</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const config = getStatusConfig(app.status);
                const StatusIcon = config?.icon;
                return (
                  <Card
                    key={app.id}
                    className="card-premium-hover rounded-2xl border border-slate-200/60 bg-white group"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-all">
                            {app.company_logo ? (
                              <img
                                src={app.company_logo}
                                alt=""
                                className="h-full w-full rounded-xl object-contain opacity-80 group-hover:opacity-100"
                              />
                            ) : (
                              <Monitor className="h-7 w-7" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {app.job_title || app.job?.title}
                            </h3>
                            <p className="mt-1 text-base text-muted-foreground">
                              {app.company_name || app.company?.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground">
                              <span>Ứng tuyển: {formatDate(app.applied_at || app.created_at)}</span>
                              {typeof app.match_score === 'number' && (
                                <span className="text-emerald-600 font-medium">
                                  AI Match: {app.match_score}%
                                </span>
                              )}
                              <span>{app.location || '—'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-stretch gap-3 sm:items-end">
                          {config && (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-base font-bold uppercase tracking-wider',
                                app.status === 'interviewing'
                                  ? 'bg-emerald-500/10 text-emerald-700'
                                  : app.status === 'offered' || app.status === 'hired'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-500'
                              )}
                            >
                              {StatusIcon && <StatusIcon size={12} />}
                              {config.label}
                            </span>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-emerald-500/20"
                              onClick={() => openApplicationDetails(app.id)}
                            >
                              Xem chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl gap-1.5 border-slate-200 hover:bg-primary/10 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:scale-105 active:scale-95"
                            >
                              <MessageSquare size={14} />
                              Nhắn tin
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground">Phân tích ứng tuyển</h3>
              <div className="mt-4 h-44 min-h-[176px] w-full min-w-0">
                <ChartSurface className="h-full" minChartHeight={160}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartSurface>
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                Dựa trên {totalCount} đơn ứng tuyển trong hệ thống.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground">Gợi ý từ AI</h3>
              <ul className="mt-4 space-y-2 text-base text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Hoàn thiện đầy đủ các dự án thực tế để tăng điểm tin cậy.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Thêm các kỹ năng mềm và chứng chỉ liên quan.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  Tối ưu hóa từ khóa trong hồ sơ để AI đề xuất chính xác hơn.
                </li>
              </ul>
              <Button
                asChild
                className="mt-4 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600"
              >
                <Link to="/candidate/profile/edit">Cập nhật hồ sơ ngay</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-0 bg-primary text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold">Mở khóa tính năng Premium</h3>
              <p className="mt-2 text-base text-white/90">
                Xem ai đã xem hồ sơ của bạn và nhận phân tích chi tiết từ AI.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full rounded-lg border-white bg-transparent text-white hover:bg-white/10"
              >
                Nâng cấp
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ApplicationDetailModal
        isOpen={isDetailOpen}
        onClose={closeApplicationDetails}
        application={selectedApplication}
        history={applicationHistory}
        loading={detailLoading}
      />
    </div>
  );
};

export default ApplicationsPage;
