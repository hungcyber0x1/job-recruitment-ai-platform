import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Building2, Clock, DollarSign, Heart, MapPin, Send, Share2 } from 'lucide-react';

import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

const formatSalary = (min, max) => {
  if (!min && !max) return 'Thỏa thuận';
  if (!min) return `Đến ${Math.round(max / 1000000)} triệu`;
  if (!max) return `Từ ${Math.round(min / 1000000)} triệu`;
  return `${Math.round(min / 1000000)}-${Math.round(max / 1000000)} triệu`;
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
                <h1 className="mb-2 text-3xl font-bold leading-tight text-slate-900">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <span className="cursor-pointer font-bold text-emerald-600 hover:underline">
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
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-slate-300 transition-all hover:text-emerald-600"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Badge
                variant="indigo"
                className="px-6 py-2 text-sm font-bold uppercase tracking-normal"
              >
                {job.type || 'full-time'}
              </Badge>
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-6 py-2 text-sm font-bold text-green-700">
                <DollarSign size={18} /> {formatSalary(job.salary_min, job.salary_max)} VND
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-bold uppercase tracking-normal text-slate-900">
              Mô tả công việc
            </h3>
            {job.description?.trim() ? (
              <div className="prose prose-slate max-w-none text-base leading-relaxed font-medium text-slate-600">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }} />
              </div>
            ) : (
              <p className="whitespace-pre-line font-medium leading-loose text-slate-400">
                Đang cập nhật mô tả công việc.
              </p>
            )}
          </Card>

          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-bold uppercase tracking-normal text-slate-900">
              Yêu cầu kỹ thuật
            </h3>
            {job.requirements?.trim() ? (
              <div className="prose prose-slate max-w-none text-base leading-relaxed font-medium text-slate-600">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.requirements) }} />
              </div>
            ) : (
              <p className="whitespace-pre-line font-medium leading-loose text-slate-400">
                Đang cập nhật yêu cầu.
              </p>
            )}
          </Card>

          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-xl font-bold uppercase tracking-normal text-slate-900">
              Quyền lợi của bạn
            </h3>
            {job.benefits?.trim() ? (
              <div className="prose prose-slate max-w-none text-base leading-relaxed font-medium text-slate-600">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.benefits) }} />
              </div>
            ) : (
              <p className="whitespace-pre-line font-medium leading-loose text-slate-400">
                Đang cập nhật quyền lợi.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-8">
          <div className="sticky top-32 space-y-8">
            <Card className="border-none p-8 text-center shadow-2xl shadow-indigo-100/50">
              <h4 className="mb-2 text-lg font-bold text-slate-900">Sẵn sàng thử thách?</h4>
              <p className="mb-8 text-base font-medium text-slate-400">
                Nộp hồ sơ ngay để bắt đầu quá trình tuyển dụng.
              </p>
              <Button
                variant="primary"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold shadow-xl shadow-indigo-100"
                onClick={onApply}
              >
                <Send size={18} /> Ứng tuyển ngay
              </Button>
              <p className="mt-6 text-base font-bold uppercase tracking-normal text-slate-300">
                Hạn nộp:{' '}
                {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không có'}
              </p>
            </Card>

            <Card className="border-none p-8 text-center shadow-xl shadow-indigo-100/50">
              <h4 className="mb-2 text-lg font-bold text-slate-900">Mẹo ứng tuyển</h4>
              <p className="mb-6 text-base font-medium leading-relaxed text-slate-400">
                Hãy đảm bảo CV của bạn nêu rõ kinh nghiệm và kỹ năng phù hợp với vị trí này để tăng
                cơ hội được liên hệ.
              </p>
              <Button
                variant="secondary"
                className="w-full border-none bg-emerald-50 text-sm font-bold text-emerald-700"
              >
                Tìm hiểu thêm
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
