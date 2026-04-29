import PropTypes from 'prop-types';
import { Briefcase, ChevronRight, MapPin } from 'lucide-react';

import { formatDate } from '../../../utils/formatters';
import StatusBadge from '../../common/StatusBadge';

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
  const progress = stepStates[application.status] || stepStates.pending;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-lg border border-border bg-card p-5 text-left shadow-sm transition-colors duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted p-2">
          {application.company_logo ? (
            <img
              src={application.company_logo}
              alt={application.company_name}
              className="h-full w-full rounded-lg object-contain"
            />
          ) : (
            <Briefcase size={22} className="text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="truncate text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {application.job_title}
            </h3>
            <StatusBadge entityType="application" status={application.status} />
          </div>

          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase size={14} /> {application.company_name}
            <span className="text-border">•</span>
            <MapPin size={14} /> {application.location || 'Đang cập nhật'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>
              Đã ứng tuyển:{' '}
              <span className="text-foreground">{formatDate(application.applied_at)}</span>
            </span>
            {application.updated_at ? (
              <span>
                Cập nhật:{' '}
                <span className="text-foreground">{formatDate(application.updated_at)}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-4 md:w-auto">
          <div className="hidden flex-col items-end gap-1 md:flex">
            <div className="flex items-center gap-1">
              {progress.map((done, index) => (
                <div key={`${application.id}-step-${index}`} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${done ? 'bg-primary' : 'bg-border'}`} />
                  {index < progress.length - 1 ? (
                    <div
                      className={`h-0.5 w-8 ${progress[index + 1] ? 'bg-primary' : 'bg-border'}`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Tiến độ</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
            <ChevronRight size={18} />
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
