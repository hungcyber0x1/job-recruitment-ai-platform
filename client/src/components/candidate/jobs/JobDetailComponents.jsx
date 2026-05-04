import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import Card from '../../common/Card';
import { Button } from '../../common';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import candidateService from '../../../services/candidateService';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import { isJobApplicationDeadlinePassed } from '../../../utils/jobDeadline';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';

const valueOrFallback = (value, fallback = 'Chưa cập nhật') => value || fallback;

const normalizeUrlLabel = (url) =>
  String(url || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

const getPostedBadge = (createdAt) => {
  if (!createdAt) return null;

  const createdDate = new Date(createdAt);
  const diffHours = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);

  if (diffHours < 1) return 'Vừa đăng';
  if (diffHours < 24) return 'Hôm nay';
  if (diffHours < 72) return '3 ngày trước';
  if (diffHours < 168) return '1 tuần trước';

  return null;
};

const getCompanyLogo = (companyName, logo) =>
  logo ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    companyName || 'Company'
  )}&background=ecfdf5&color=047857`;

const InfoTile = ({ icon: Icon, label, value, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  }[tone];

  return (
    <div className="flex min-h-[92px] flex-col rounded-lg border border-slate-200 bg-white/95 px-3 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            toneClass
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 break-words text-[15px] font-bold leading-5 text-slate-950">
        {valueOrFallback(value)}
      </p>
    </div>
  );
};

InfoTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  tone: PropTypes.string,
};

export const JobDetailHeader = ({
  job,
  onApply,
  customAction,
  applyDisabled = false,
  isApplied = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(Boolean(job.is_saved));
  const [saving, setSaving] = useState(false);

  const deadlinePassed = isJobApplicationDeadlinePassed(job.deadline);
  const cannotApply = applyDisabled || (job.status && job.status !== 'published') || deadlinePassed;
  const postedBadge = getPostedBadge(job.created_at);
  const companyName = job.company_name || job.company?.name || job.employer?.name;

  const handleToggleSave = async () => {
    if (saving) return;

    if (!isAuthenticated) {
      if (window.confirm('Bạn cần đăng nhập để lưu việc làm. Chuyển đến trang đăng nhập?')) {
        navigate(`/login?next=${encodeURIComponent(`/candidate/jobs/${job.id}`)}`);
      }
      return;
    }

    setSaving(true);

    try {
      if (isSaved) {
        await candidateService.unsaveJob(job.id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu việc làm', 'info');
      } else {
        await candidateService.saveJob(job.id);
        setIsSaved(true);
        showNotification('Đã lưu việc làm thành công', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle save job:', error);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getButtonText = () => {
    if (isApplied) return 'Đã ứng tuyển';
    if (deadlinePassed) return 'Đã hết hạn ứng tuyển';
    if (job.status && job.status !== 'published') return 'Không nhận ứng tuyển';
    return 'Ứng tuyển ngay';
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100/70 bg-[linear-gradient(135deg,#052e2b_0%,#0f172a_58%,#111827_100%)] px-5 py-7 text-white sm:px-7 lg:px-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {postedBadge && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
                  {postedBadge}
                </span>
              )}
              {job.status && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
                  {job.status === 'published' ? 'Đang mở' : 'Tạm dừng'}
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-base font-semibold text-slate-300">
              <span>tại</span>
              <span className="text-emerald-300">{companyName || 'Doanh nghiệp đang tuyển'}</span>
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[360px] lg:flex-col">
            <button
              type="button"
              onClick={() => {
                if (!cannotApply && !isApplied) onApply?.();
              }}
              disabled={cannotApply || isApplied}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition-colors',
                isApplied
                  ? 'border border-emerald-300/30 bg-emerald-400/10 text-emerald-200'
                  : cannotApply
                    ? 'cursor-not-allowed border border-slate-500/30 bg-slate-700/60 text-slate-300'
                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-500'
              )}
            >
              {isApplied && <CheckCircle2 className="h-4 w-4" />}
              {getButtonText()}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={saving}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors',
                  isSaved
                    ? 'border-rose-300/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15'
                    : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                )}
              >
                <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Đã lưu' : 'Lưu việc'}
              </button>
              {customAction}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile icon={DollarSign} label="Mức lương" value={job.salary_range} tone="emerald" />
        <InfoTile icon={MapPin} label="Địa điểm" value={job.location} tone="blue" />
        <InfoTile
          icon={Users}
          label="Số lượng"
          value={job.vacancies ? `${job.vacancies} người` : 'Không giới hạn'}
          tone="violet"
        />
        <InfoTile
          icon={Calendar}
          label="Hạn nộp"
          value={job.deadline ? formatDate(job.deadline) : 'Không giới hạn'}
          tone="amber"
        />
      </div>
    </section>
  );
};

JobDetailHeader.propTypes = {
  job: PropTypes.object.isRequired,
  onApply: PropTypes.func,
  customAction: PropTypes.node,
  applyDisabled: PropTypes.bool,
  isApplied: PropTypes.bool,
};

const InfoLine = ({ icon: Icon, value, href }) => {
  const content = (
    <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{value}</span>
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="min-w-0 hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

InfoLine.propTypes = {
  icon: PropTypes.elementType.isRequired,
  value: PropTypes.node,
  href: PropTypes.string,
};

export const JobCompanySidebar = ({ company = {} }) => {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(Boolean(company.isSaved || company.is_saved));
  const [saving, setSaving] = useState(false);

  const companyName = company.name || 'Công ty đang tuyển';
  const companyHref = company.id ? `/candidate/companies/${company.id}` : '#';

  const handleToggleSave = async (event) => {
    event.preventDefault();

    if (saving || !company.id) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      if (window.confirm('Bạn cần đăng nhập để lưu công ty. Chuyển đến trang đăng nhập?')) {
        navigate(`/login?next=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    setSaving(true);

    try {
      if (isSaved) {
        await candidateService.unsaveCompany(company.id);
        setIsSaved(false);
        showNotification('Đã bỏ lưu công ty', 'info');
      } else {
        await candidateService.saveCompany(company.id);
        setIsSaved(true);
        showNotification('Đã lưu công ty thành công', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle company save:', error);
      showNotification('Không thể thực hiện tác vụ này', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white p-0 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
          <img
            src={getCompanyLogo(companyName, company.logo || company.logo_url)}
            alt={companyName}
            className="h-full w-full object-contain"
          />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-950">{companyName}</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-700">
          {company.industry || 'Ngành nghề chưa cập nhật'}
        </p>
      </div>

      <div className="space-y-3 p-5">
        {(company.job_count > 0 || company.open_positions > 0) && (
          <InfoLine
            icon={Building2}
            value={
              company.open_positions > 0
                ? `${company.open_positions} vị trí đang tuyển`
                : `${company.job_count} việc làm`
            }
          />
        )}
        <InfoLine icon={Users} value={company.size || 'Quy mô chưa cập nhật'} />
        <InfoLine
          icon={MapPin}
          value={company.address || company.location || 'Địa điểm chưa cập nhật'}
        />
        <InfoLine
          icon={Globe}
          value={company.website ? normalizeUrlLabel(company.website) : 'Website chưa cập nhật'}
          href={company.website}
        />

        <div className="pt-2">
          <Button
            to={company.id ? companyHref : undefined}
            fullWidth
            variant="secondary"
            className="h-10 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
          >
            Xem trang công ty
          </Button>

          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving || !company.id}
            className={cn(
              'mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors',
              isSaved
                ? 'border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            )}
          >
            <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Đã lưu công ty' : 'Lưu công ty'}
          </button>
        </div>
      </div>
    </Card>
  );
};

JobCompanySidebar.propTypes = {
  company: PropTypes.object,
};

const SectionBlock = ({ icon: Icon, title, html, tone = 'emerald' }) => {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
  }[tone];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', toneClass)}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-7 text-slate-600 prose-headings:text-slate-950 prose-strong:text-slate-950 prose-ul:my-3 prose-li:my-1"
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(html || '<p>Chưa cập nhật nội dung.</p>'),
        }}
      />
    </section>
  );
};

SectionBlock.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  html: PropTypes.string,
  tone: PropTypes.string,
};

export const JobDescription = ({ description, requirements, benefits }) => (
  <div className="space-y-4">
    <SectionBlock icon={FileText} title="Mô tả công việc" html={description} tone="emerald" />
    <SectionBlock icon={ShieldCheck} title="Yêu cầu công việc" html={requirements} tone="blue" />
    <SectionBlock icon={Star} title="Quyền lợi và phúc lợi" html={benefits} tone="amber" />
  </div>
);

JobDescription.propTypes = {
  description: PropTypes.string,
  requirements: PropTypes.string,
  benefits: PropTypes.string,
};
