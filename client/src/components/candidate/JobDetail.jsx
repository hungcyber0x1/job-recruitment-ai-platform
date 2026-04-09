import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Building2, Clock, DollarSign, Heart, MapPin, Send, Share2, Sparkles } from 'lucide-react';

import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';

const formatSalary = (min, max) => {
  if (!min && !max) return 'Thỏa thuận';
  if (!min) return `Den ${Math.round(max / 1000000)}Tr`;
  if (!max) return `Tu ${Math.round(min / 1000000)}Tr`;
  return `${Math.round(min / 1000000)}-${Math.round(max / 1000000)}Tr`;
};

const JobDetail = ({ job, onApply }) => {
  const [isSaved, setIsSaved] = useState(false);

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-10">
      <Card className="border-none p-10 shadow-2xl shadow-indigo-100/50">
        <div className="flex flex-col gap-10 md:flex-row">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-100">
            {job.company_logo ? (
              <img src={job.company_logo} alt="Logo" className="h-16 w-16 object-contain" />
            ) : (
              <Building2 size={40} className="text-emerald-200" />
            )}
          </div>

          <div className="flex-grow">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
              <div>
                <h1 className="mb-2 text-3xl font-black leading-tight text-slate-900">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <span className="cursor-pointer font-black text-emerald-600 hover:underline">
                    {job.company_name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-500">
                    <MapPin size={16} /> {job.location || 'Đang cập nhật'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-500">
                    <Clock size={16} />{' '}
                    {job.created_at
                      ? new Date(job.created_at).toLocaleDateString('vi-VN')
                      : 'Mới đăng'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaved((prev) => !prev)}
                  className={`rounded-2xl border p-4 transition-all ${
                    isSaved
                      ? 'border-rose-100 bg-rose-50 text-rose-500'
                      : 'border-slate-100 bg-slate-50 text-slate-300 hover:text-rose-500'
                  }`}
                >
                  <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-300 transition-all hover:text-emerald-600"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Badge
                variant="indigo"
                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest"
              >
                {job.type || 'full-time'}
              </Badge>
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-6 py-2 text-sm font-black text-green-700">
                <DollarSign size={18} /> {formatSalary(job.salary_min, job.salary_max)} VND
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-black uppercase tracking-tight text-slate-900">
              Mô tả công việc
            </h3>
            <div className="whitespace-pre-line font-medium leading-loose text-slate-600">
              {job.description || 'Đang cập nhật mô tả công việc.'}
            </div>
          </Card>

          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-black uppercase tracking-tight text-slate-900">
              Yêu cầu kỹ thuật
            </h3>
            <div className="whitespace-pre-line font-medium leading-loose text-slate-600">
              {job.requirements || 'Đang cập nhật yêu cầu.'}
            </div>
          </Card>

          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-black uppercase tracking-tight text-slate-900">
              Quyền lợi của bạn
            </h3>
            <div className="whitespace-pre-line font-medium leading-loose text-slate-600">
              {job.benefits || 'Đang cập nhật quyền lợi.'}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="sticky top-32 space-y-8">
            <Card className="border-none p-8 text-center shadow-2xl shadow-indigo-100/50">
              <h4 className="mb-2 text-lg font-black text-slate-900">Sẵn sàng thử thách?</h4>
              <p className="mb-8 text-sm font-medium text-slate-400">
                Nộp hồ sơ ngay để AI matching đánh giá mức độ phù hợp của bạn.
              </p>
              <Button
                variant="primary"
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black shadow-xl shadow-indigo-100"
                onClick={onApply}
              >
                <Send size={18} /> Ứng tuyển ngay
              </Button>
              <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Hạn nộp:{' '}
                {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không có'}
              </p>
            </Card>

            <Card className="group relative overflow-hidden bg-slate-900 p-8 text-white">
              <Sparkles
                className="absolute -right-4 -top-4 opacity-10 transition-transform duration-700 group-hover:scale-110"
                size={120}
              />
              <div className="mb-4 w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                AI Insight
              </div>
              <h4 className="mb-4 text-lg font-black">85% Phù hợp</h4>
              <p className="mb-6 text-xs font-medium leading-relaxed text-slate-400">
                Kinh nghiệm và kỹ năng hiện tại của bạn đang khớp tốt với vị trí này. AI gợi ý bổ
                sung thêm dự án liên quan để tăng tỉ lệ qua vòng.
              </p>
              <Button
                variant="secondary"
                className="w-full border-none bg-white text-xs font-black text-slate-900"
              >
                Hỏi AI về công việc này
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

JobDetail.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string,
    company_logo: PropTypes.string,
    company_name: PropTypes.string,
    location: PropTypes.string,
    created_at: PropTypes.string,
    type: PropTypes.string,
    salary_min: PropTypes.number,
    salary_max: PropTypes.number,
    description: PropTypes.string,
    requirements: PropTypes.string,
    benefits: PropTypes.string,
    deadline: PropTypes.string,
  }),
  onApply: PropTypes.func,
};

JobDetail.defaultProps = {
  job: null,
  onApply: undefined,
};

export default JobDetail;
