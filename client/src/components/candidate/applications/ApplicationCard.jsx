import PropTypes from 'prop-types';
import { Briefcase, ChevronRight, MapPin } from 'lucide-react';

import { getStatusConfig } from '../../../constants/status';
import { formatDate } from '../../../utils/formatters';

const stepStates = {
  pending: [true, false, false],
  reviewed: [true, true, false],
  shortlisted: [true, true, false],
  interviewing: [true, true, true],
  offered: [true, true, true],
  hired: [true, true, true],
  rejected: [true, true, true],
  withdrawn: [true, false, false],
};

const ApplicationCard = ({ application, onClick }) => {
  const config = getStatusConfig(application.status);
  const Icon = config.icon;
  const progress = stepStates[application.status] || stepStates.pending;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-card transition-all hover:shadow-premium ${config.accent}`}
    >
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-muted p-2">
          {application.company_logo ? (
            <img
              src={application.company_logo}
              alt={application.company_name}
              className="h-full w-full rounded-lg object-contain"
            />
          ) : (
            <Briefcase size={22} className="text-secondary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="truncate text-lg font-bold text-foreground group-hover:text-secondary">
              {application.job_title}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text}`}
            >
              <Icon size={14} />
              {config.label}
            </span>
          </div>

          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-txt-muted">
            <Briefcase size={14} /> {application.company_name}
            <span className="text-border">•</span>
            <MapPin size={14} /> {application.location || 'Đang cập nhật'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-txt-light">
            <span>
              Đã ứng tuyển:{' '}
              <span className="text-txt-muted">{formatDate(application.applied_at)}</span>
            </span>
            {application.updated_at ? (
              <span>
                Cập nhật:{' '}
                <span className="text-txt-muted">{formatDate(application.updated_at)}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-4 md:w-auto">
          <div className="hidden flex-col items-end gap-1 md:flex">
            <div className="flex items-center gap-1">
              {progress.map((done, index) => (
                <div key={`${application.id}-step-${index}`} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${done ? 'bg-secondary' : 'bg-border'}`} />
                  {index < progress.length - 1 ? (
                    <div
                      className={`h-0.5 w-8 ${progress[index + 1] ? 'bg-secondary' : 'bg-border'}`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <p className="text-xs font-bold uppercase text-txt-light">Tiến độ</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-txt-light transition-colors group-hover:bg-secondary/10 group-hover:text-secondary">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </button>
  );
};

ApplicationCard.propTypes = {
  application: PropTypes.shape({
    id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    company_logo: PropTypes.string,
    company_name: PropTypes.string.isRequired,
    job_title: PropTypes.string.isRequired,
    location: PropTypes.string,
    applied_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
};

export default ApplicationCard;
