import PropTypes from 'prop-types';
import { Briefcase, CheckCircle, Clock, MessageSquare, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import { getStatusLabel } from '../../constants/status';

const CandidateDashboard = ({ stats, recentApplications }) => {
  const summaryCards = [
    {
      label: 'Việc làm đã ứng tuyển',
      value: stats.applications,
      icon: <Briefcase size={20} />,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
    {
      label: 'Hồ sơ đã xem',
      value: stats.views,
      icon: <CheckCircle size={20} />,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: 'Tin nhắn mới',
      value: stats.messages,
      icon: <MessageSquare size={20} />,
      bg: 'bg-violet-50',
      color: 'text-violet-600',
    },
    {
      label: 'Việc làm đã lưu',
      value: stats.saved,
      icon: <Star size={20} />,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
  ];


  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              hover
              className="group relative overflow-hidden border-none p-6 shadow-xl shadow-slate-100/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-slate-50 to-transparent opacity-60 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative z-10 flex items-center gap-5">
                <div
                  className={`flex h-13 w-13 items-center justify-center rounded-2xl ${item.bg} ${item.color} shadow-sm transition-transform group-hover:scale-110`}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                  <p className="text-sm font-bold uppercase tracking-normal text-slate-400">
                    {item.label}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Main Content: Recent Applications + Sidebar */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-8 rounded-full bg-primary" />
              <h3 className="text-lg font-bold text-slate-900">Ứng tuyển gần đây</h3>
            </div>
            <Link
              to="/candidate/applications"
              className="text-sm font-bold text-primary hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {recentApplications.length ? (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <Card key={application.id} hover className="group border-border p-5 transition-all hover:border-emerald-200 hover:shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                      {application.company_logo ? (
                        <img
                          src={application.company_logo}
                          alt={application.company_name}
                          className="h-7 w-7 object-contain"
                        />
                      ) : (
                        <Briefcase size={18} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="mb-0.5 text-sm font-bold uppercase tracking-normal text-slate-900 transition-colors group-hover:text-primary truncate">
                        {application.job_title}
                      </h4>
                      <p className="text-sm font-medium text-slate-400 truncate">
                        {application.company_name} ·{' '}
                        {application.applied_at
                          ? new Date(application.applied_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'short',
                          })
                          : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {getStatusLabel(application.status)}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed overflow-hidden">
              <EmptyState
                variant="robotReading"
                title="Chưa có hoạt động ứng tuyển nào"
                description="Bắt đầu tìm kiếm và ứng tuyển vào các vị trí phù hợp với bạn."
                action={
                  <Button asChild>
                    <Link to="/candidate/jobs">Khám phá việc làm</Link>
                  </Button>
                }
              />
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reminders Card */}
          <Card className="rounded-2xl border border-slate-100 bg-slate-900 p-7 shadow-sm">
            <h4 className="mb-5 flex items-center gap-2 font-bold text-white">
              <Clock size={16} className="text-emerald-400" />
              Nhắc nhở
            </h4>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Theo dõi đơn ở trạng thái{' '}
                  <span className="font-bold text-white">đã xem / phỏng vấn</span>.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Cập nhật CV và hồ sơ để nhận thêm nhiều gợi ý việc làm.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Theo dõi các công ty bạn quan tâm để cập nhật tin tuyển dụng mới.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recommended Jobs Section */}
    </div>
  );
};

CandidateDashboard.propTypes = {
  stats: PropTypes.shape({
    applications: PropTypes.number,
    views: PropTypes.number,
    messages: PropTypes.number,
    saved: PropTypes.number,
  }),
  recentApplications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      job_title: PropTypes.string,
      company_name: PropTypes.string,
      company_logo: PropTypes.string,
      applied_at: PropTypes.string,
      status: PropTypes.string,
    })
  ),
};

CandidateDashboard.defaultProps = {
  stats: {
    applications: 0,
    views: 0,
    messages: 0,
    saved: 0,
  },
  recentApplications: [],
};

export default CandidateDashboard;
