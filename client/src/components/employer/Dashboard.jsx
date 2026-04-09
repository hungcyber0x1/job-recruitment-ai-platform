import PropTypes from 'prop-types';
import React from 'react';
import {
  Users,
  Briefcase,
  Eye,
  TrendingUp,
  Plus,
  ArrowRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Statistics from './Statistics';

const EmployerDashboard = ({ stats, activeJobs }) => {
  return (
    <div className="space-y-10">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Tin tuyển dụng',
            val: stats?.totalJobs || 0,
            icon: <Briefcase size={20} />,
            color: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Tổng ứng viên',
            val: stats?.totalApplicants || 0,
            icon: <Users size={20} />,
            color: 'bg-violet-50 text-violet-600',
          },
          {
            label: 'Lượt xem tin',
            val: stats?.totalViews || '0',
            icon: <Eye size={20} />,
            color: 'bg-primary-50 text-primary-600',
          },
          {
            label: 'Đã tuyển dụng',
            val: stats?.hired || 0,
            icon: <UserCheck size={20} />,
            color: 'bg-green-50 text-green-600',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="p-8 border-none shadow-xl shadow-slate-100/50 flex flex-col items-center text-center"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{stat.val}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Analytics Chart */}
        <div className="lg:col-span-2">
          <Card className="p-8 border-none shadow-xl shadow-slate-100/50 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Biểu đồ tăng trưởng</h3>
              <Badge variant="indigo">7 NGÀY QUA</Badge>
            </div>
            <div className="h-80 min-h-[280px] w-full min-w-0">
              <Statistics />
            </div>
          </Card>
        </div>

        {/* Active Jobs & Actions */}
        <div className="space-y-8">
          <Link to="/employer/post-job" className="block">
            <button className="w-full bg-slate-900 text-white p-8 rounded-[32px] hover:bg-emerald-600 transition-all group flex items-center justify-between">
              <div>
                <p className="text-xl font-black mb-1">Đăng tin mới</p>
                <p className="text-xs text-slate-400 group-hover:text-emerald-100 transition-colors">
                  Tìm kiếm tài năng ngay lập tức
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
            </button>
          </Link>

          <Card className="p-8 border-none shadow-xl shadow-slate-100/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 font-black">
              Tin đang hoạt động
            </h3>
            <div className="space-y-6">
              {activeJobs?.length > 0 ? (
                activeJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                          {job.title}
                        </p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                          {job.applicant_count} Ứng viên
                        </p>
                      </div>
                    </div>
                    <Link to={`/employer/jobs/${job.id}/applicants`}>
                      <Button
                        variant="ghost"
                        className="p-2 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-muted/35"
                      >
                        <ArrowRight size={20} />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 font-medium italic">
                  Không có tin nào đang hoạt động.
                </p>
              )}
            </div>
            <Link to="/employer/manage-jobs">
              <Button
                variant="outline"
                className="w-full mt-8 py-3 text-xs font-black uppercase tracking-widest"
              >
                Quản lý tất cả
              </Button>
            </Link>
          </Card>

          <Card className="p-8 bg-amber-50 border-amber-100 text-amber-900 flex items-center gap-4">
            <AlertCircle size={24} className="shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              Bạn có{' '}
              <span className="font-black text-amber-600 underline cursor-pointer">
                05 hồ sơ mới
              </span>{' '}
              từ tin tuyển dụng Senior Java Developer. Hãy review ngay nhé!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

EmployerDashboard.propTypes = {
  stats: PropTypes.shape({
    totalJobs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalApplicants: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalViews: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hired: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  activeJobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      applicant_count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
};

EmployerDashboard.defaultProps = {
  stats: null,
  activeJobs: [],
};

export default EmployerDashboard;
