import PropTypes from 'prop-types';
import Card from '../../common/Card';
import {
  MapPin,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/formatters';
import { isJobApplicationDeadlinePassed } from '../../../utils/jobDeadline';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';

/**
 * Job detail header component
 */
export const JobDetailHeader = ({ job, onApply, customAction, applyDisabled = false }) => {
  const deadlinePassed = isJobApplicationDeadlinePassed(job.deadline);
  const cannotApply = applyDisabled || (job.status && job.status !== 'published') || deadlinePassed;

  return (
    <Card className="mb-8 overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative">
      {/* Decorative background block */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50 dark:from-indigo-900/20 to-transparent pointer-events-none" />

      <div className="p-8 md:p-10 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-10">
          <div className="w-full lg:w-2/3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Mới đăng
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
              {job.title}
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium mb-8">
              tại{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {job.company_name}
              </span>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    Mức lương
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{job.salary_range}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    Địa điểm
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{job.location}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    Kinh nghiệm
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{job.experience}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    Hạn nộp
                  </p>
                  <p
                    className={`font-bold text-slate-900 dark:text-slate-100 ${deadlinePassed ? 'text-amber-700 dark:text-amber-400' : ''}`}
                  >
                    {job.deadline ? formatDate(job.deadline) : 'Không giới hạn'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!cannotApply) onApply?.();
              }}
              disabled={cannotApply}
              className={`w-full lg:w-48 px-8 py-4 font-bold rounded-2xl transition-all ${
                cannotApply
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-indigo-600/20 hover:-translate-y-1'
              }`}
            >
              {deadlinePassed
                ? 'Đã hết hạn ứng tuyển'
                : job.status && job.status !== 'published'
                  ? 'Không nhận ứng tuyển'
                  : 'Ứng tuyển ngay'}
            </button>
            <button className="w-full lg:w-48 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-muted/35 dark:hover:bg-slate-800 transition-colors duration-200 ease-out shadow-sm">
              Lưu tin
            </button>
            {customAction}
          </div>
        </div>
      </div>
    </Card>
  );
};

JobDetailHeader.propTypes = {
  job: PropTypes.shape({
    title: PropTypes.string.isRequired,
    company_name: PropTypes.string.isRequired,
    salary_range: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    experience: PropTypes.string.isRequired,
    deadline: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onApply: PropTypes.func,
  customAction: PropTypes.node,
  applyDisabled: PropTypes.bool,
};

/**
 * Company sidebar component
 */
export const JobCompanySidebar = ({ company }) => (
  <Card className="p-8 mb-8 sticky top-24 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
    <div className="flex flex-col items-center text-center mb-8 relative">
      {/* Decorative subtle background for logo */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl p-3 border border-slate-100 dark:border-slate-700 shadow-xl mb-5 hover:-translate-y-1 transition-transform">
        <img
          src={company.logo || `https://ui-avatars.com/api/?name=${company.name}&background=random`}
          alt={company.name}
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        {company.name}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{company.industry}</p>
    </div>

    <div className="space-y-5 mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
          <Users size={16} />
        </div>
        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">
          {company.size} nhân viên
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
          <MapPin size={16} />
        </div>
        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm line-clamp-2">
          {company.address}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
          <Globe size={16} />
        </div>
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline truncate text-sm"
        >
          {company.website}
        </a>
      </div>
    </div>

    <Link
      to={`/candidate/companies/${company.id}`}
      className="block w-full text-center py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-muted/35 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors duration-200 ease-out"
    >
      Xem trang công ty
    </Link>
  </Card>
);

JobCompanySidebar.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    logo: PropTypes.string,
    industry: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    website: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * AI analysis card component
 */
export const AIAnalysisCard = ({ matchScore = 85 }) => (
  <Card className="p-6 mb-8 bg-gradient-to-br from-blue-900 to-slate-900 text-white relative overflow-hidden border-none">
    <Sparkles className="absolute -right-10 -top-10 text-white/5 w-48 h-48" />

    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <Sparkles size={20} className="text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold">AI Phân tích mức độ phù hợp</h3>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
          {matchScore}%
        </span>
        <span className="text-primary-200 font-bold mb-1">Rất phù hợp</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 size={16} className="text-primary-400 mt-0.5 shrink-0" />
          <p className="text-base text-primary-100">
            Bạn đáp ứng <span className="text-white font-bold">9/10 kỹ năng</span> yêu cầu.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-base text-primary-100">
            Kinh nghiệm của bạn trong lĩnh vực Fintech là điểm cộng lớn.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-base text-primary-100">
            Cần bổ sung kiến thức về{' '}
            <span className="underline decoration-orange-400/50">GraphQL</span>.
          </p>
        </div>
      </div>
    </div>
  </Card>
);

AIAnalysisCard.propTypes = {
  matchScore: PropTypes.number,
};

/**
 * Job description component
 */
export const JobDescription = ({ description, requirements, benefits }) => (
  <Card className="p-8 md:p-10 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
    <div className="space-y-12">
      <section className="relative group">
        <div className="absolute -left-10 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-r-full hidden md:block transition-all group-hover:bg-emerald-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FileText size={20} />
          </div>
          Mô tả công việc
        </h3>
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
        ></div>
      </section>

      <section className="relative group">
        <div className="absolute -left-10 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-r-full hidden md:block transition-all group-hover:bg-emerald-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          Yêu cầu công việc
        </h3>
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed list-inside"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(requirements) }}
        ></div>
      </section>

      <section className="relative group">
        <div className="absolute -left-10 top-0 bottom-0 w-1 bg-yellow-500/20 rounded-r-full hidden md:block transition-all group-hover:bg-yellow-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
            <Star size={20} />
          </div>
          Quyền lợi
        </h3>
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed list-inside"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(benefits) }}
        ></div>
      </section>
    </div>
  </Card>
);

JobDescription.propTypes = {
  description: PropTypes.string.isRequired,
  requirements: PropTypes.string.isRequired,
  benefits: PropTypes.string.isRequired,
};
