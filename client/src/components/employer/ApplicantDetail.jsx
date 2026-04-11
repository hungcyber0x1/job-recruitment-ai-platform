import PropTypes from 'prop-types';
import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';

const ApplicantDetail = ({ applicant, onUpdateStatus }) => {
  return (
    <div className="space-y-10">
      {/* Profile Summary Card */}
      <Card className="p-10 border border-slate-200 bg-white shadow-sm overflow-hidden rounded-2xl">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <Avatar
            name={`${applicant.first_name} ${applicant.last_name}`}
            src={applicant.avatar_url}
            size="xl"
            className="w-32 h-32 rounded-2xl shadow-md border-4 border-white"
          />
          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                {applicant.first_name} {applicant.last_name}
              </h2>
              <Badge
                variant={
                  applicant.status === 'hired' || applicant.status === 'offered'
                    ? 'green'
                    : applicant.status === 'rejected'
                      ? 'red'
                      : 'yellow'
                }
              >
                {applicant.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-primary font-black text-base uppercase tracking-widest mb-6">
              {applicant.current_job_title || 'Ứng viên tiềm năng'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-slate-400 capitalize">
              <span className="flex items-center gap-2">
                <Mail size={16} /> {applicant.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone size={16} /> {applicant.phone || 'N/A'}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={16} /> {applicant.location || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="p-4 rounded-2xl bg-white group">
              <MessageSquare
                size={20}
                className="text-slate-400 group-hover:text-primary transition-colors"
              />
            </Button>
            <a href={applicant.resume_url} target="_blank" rel="noreferrer">
              <Button
                variant="primary"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-primary/30"
              >
                <Download size={20} />
                Tải hồ sơ
              </Button>
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Covering Letter */}
          <Card className="p-10 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              Thư ứng tuyển (Cover Letter)
            </h3>
            <p className="text-slate-500 font-medium leading-loose whitespace-pre-line">
              {applicant.cover_letter || 'Ứng viên không gửi kèm thư ứng tuyển.'}
            </p>
          </Card>

          {/* Application Info */}
          <Card className="p-10 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              Thông tin ứng tuyển
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <p className="text-base font-black text-slate-300 uppercase tracking-widest mb-2">
                    Vị trí ứng tuyển
                  </p>
                  <p className="font-black text-slate-900 text-lg leading-tight">
                    {applicant.job_title}
                  </p>
                </div>
                <div>
                  <p className="text-base font-black text-slate-300 uppercase tracking-widest mb-2">
                    Ngày ứng tuyển
                  </p>
                  <p className="font-bold text-slate-600 flex items-center gap-2">
                    <Calendar size={18} />{' '}
                    {new Date(applicant.applied_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-4 text-center">
                  Xử lý hồ sơ
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => onUpdateStatus(applicant.id, 'hired')}
                    className="flex-1 bg-emerald-600 text-white border-none rounded-xl py-4 flex items-center justify-center gap-2 font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle size={16} /> DUYỆT
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(applicant.id, 'rejected')}
                    className="flex-1 bg-rose-600 text-white border-none rounded-xl py-4 flex items-center justify-center gap-2 font-black text-sm hover:bg-rose-700 shadow-lg shadow-rose-500/20"
                  >
                    <XCircle size={16} /> TỪ CHỐI
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Match Sidebar */}
        <div className="space-y-8">
          <Card className="p-8 border border-emerald-100 bg-emerald-50/30 relative overflow-hidden group rounded-2xl">
            <Sparkles
              className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700 text-emerald-600"
              size={120}
            />
            <div className="relative z-10">
              <div className="bg-emerald-600 px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest w-fit mb-4 text-white">
                AI Ranking
              </div>
              <h4 className="text-3xl font-black mb-2 text-emerald-600">92% Phù hợp</h4>
              <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
                Ứng viên có kỹ năng React và TypeScript vượt trội. Kinh nghiệm 5 năm tại các tập
                đoàn lớn rất tương đồng với yêu cầu của vị trí này.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-black uppercase tracking-widest mb-2 text-slate-400">
                    <span>Kỹ năng chuyên môn</span>
                    <span className="text-slate-900">95%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[95%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-black uppercase tracking-widest mb-2 text-slate-400">
                    <span>Kinh nghiệm nghành</span>
                    <span className="text-slate-900">88%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[88%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">
              Lịch sử tương tác
            </h4>
            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              <div className="pl-10 relative">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                <p className="text-base font-black text-slate-900">Đã xem hồ sơ</p>
                <p className="text-base text-slate-400 font-bold">Hôm nay, 10:45 AM</p>
              </div>
              <div className="pl-10 relative">
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                <p className="text-base font-black text-slate-400">Ứng tuyển thành công</p>
                <p className="text-base text-slate-300 font-bold">2 ngày trước</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

ApplicantDetail.propTypes = {
  applicant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    avatar_url: PropTypes.string,
    status: PropTypes.string,
    current_job_title: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    location: PropTypes.string,
    resume_url: PropTypes.string,
    cover_letter: PropTypes.string,
    job_title: PropTypes.string,
    applied_at: PropTypes.string,
  }).isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
};

export default ApplicantDetail;
