import PropTypes from 'prop-types';
import { Briefcase, CheckCircle, Clock, MessageSquare, Star, Zap } from 'lucide-react';
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
    },
    {
      label: 'Hồ sơ đã xem',
      value: stats.views,
      icon: <CheckCircle size={20} />,
    },
    {
      label: 'Tin nhắn mới',
      value: stats.messages,
      icon: <MessageSquare size={20} />,
    },
    {
      label: 'Việc làm đã lưu',
      value: stats.saved,
      icon: <Star size={20} />,
    },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card
            key={item.label}
            className="flex items-center gap-5 border-none p-6 shadow-xl shadow-slate-100/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {item.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{item.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {item.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Ứng tuyển gần đây</h3>
            <Link
              to="/candidate/applications"
              className="text-sm font-bold text-primary hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {recentApplications.length ? (
              recentApplications.map((application) => (
                <Card
                  key={application.id}
                  className="group border-border p-6 transition-all hover:border-primary/20"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                      {application.company_logo ? (
                        <img
                          src={application.company_logo}
                          alt={application.company_name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Briefcase size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-900 transition-colors group-hover:text-primary">
                        {application.job_title}
                      </h4>
                      <p className="text-xs font-medium text-slate-400">
                        {application.company_name} •{' '}
                        {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{getStatusLabel(application.status)}</Badge>
                  </div>
                </Card>
              ))
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
        </div>

        <div className="space-y-8">
          <Card className="group relative overflow-hidden bg-primary p-8 text-white">
            <Zap
              className="absolute -bottom-4 -right-4 opacity-10 transition-transform duration-700 group-hover:scale-110"
              size={120}
            />
            <div className="relative z-10">
              <div className="mb-4 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-widest">
                Gợi ý bởi AI
              </div>
              <h4 className="mb-4 text-xl font-black">Hoàn thiện hồ sơ để tăng 80% cơ hội.</h4>
              <p className="mb-8 text-sm font-medium leading-relaxed text-white/80">
                AI nhận thấy bạn cần bổ sung thêm kỹ năng và mô tả kinh nghiệm để khớp với nhiều vị
                trí hơn.
              </p>
              <Button variant="secondary" className="w-full border-none bg-white text-primary">
                <Link to="/candidate/profile">Cập nhật profile</Link>
              </Button>
            </div>
          </Card>

          <div className="rounded-[32px] bg-slate-900 p-8 text-white">
            <h4 className="mb-6 flex items-center gap-2 font-black">
              <Clock size={18} className="text-primary/60" /> Nhắc nhở
            </h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <p className="text-sm font-medium text-slate-400">
                  Theo dõi các đơn đang ở trạng thái{' '}
                  <span className="text-white">reviewed / interviewing</span>.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-sm font-medium text-slate-400">
                  Cập nhật CV và profile để nhận thêm nhiều gợi ý việc làm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
