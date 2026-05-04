import PropTypes from 'prop-types';
import { cn } from '../../utils';
import { APP_STATUS_CONFIG, JOB_STATUS_CONFIG, USER_STATUS_CONFIG } from '@/constants/status';

const fallbackStatusClass = (status = '') => {
  const value = String(status).toLowerCase();
  if (['active', 'approved', 'published', 'success', 'verified'].includes(value)) {
    return 'bg-success/10 text-success-700 border-success/20';
  }
  if (
    [
      'pending',
      'pending_review',
      'pending_verification',
      'submitted',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'flagged',
    ].includes(value)
  ) {
    return 'bg-warning/10 text-warning-700 border-warning/25';
  }
  if (['rejected', 'banned', 'danger', 'failed'].includes(value)) {
    return 'bg-danger/10 text-danger-700 border-danger/20';
  }
  return 'bg-muted text-muted-foreground border-border';
};

const colorToStatusClass = (color) => {
  const value = String(color || '').toLowerCase();
  if (['emerald', 'green', 'success', 'teal'].includes(value)) {
    return 'bg-success/10 text-success-700 border-success/20';
  }
  if (['amber', 'yellow', 'orange', 'warning'].includes(value)) {
    return 'bg-warning/10 text-warning-700 border-warning/25';
  }
  if (['red', 'danger', 'error', 'destructive'].includes(value)) {
    return 'bg-danger/10 text-danger-700 border-danger/20';
  }
  if (['blue', 'indigo', 'info'].includes(value)) {
    return 'bg-primary/10 text-primary border-primary/20';
  }
  return 'bg-muted text-muted-foreground border-border';
};

/**
 * Unified StatusBadge cho toàn hệ thống.
 *
 * @param {string} entityType - 'job' | 'application' | 'user'
 * @param {string} status    - giá trị status key
 * @param {string} className - className bổ sung
 *
 * Ưu tiên dùng component này thay vì định nghĩa badge inline trong từng page.
 */
const StatusBadge = ({ entityType, status, className }) => {
  let cfg = null;

  switch (entityType) {
    case 'job':
      cfg = JOB_STATUS_CONFIG?.[status] || null;
      break;
    case 'application':
      cfg = APP_STATUS_CONFIG?.[status] || null;
      break;
    case 'user':
      cfg = USER_STATUS_CONFIG?.[status] || null;
      break;
    case 'company':
      cfg = null;
      break;
    default:
      cfg = null;
  }

  if (!cfg) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-4',
          fallbackStatusClass(status),
          className
        )}
      >
        {status || 'unknown'}
      </span>
    );
  }

  const Icon = cfg?.icon;

  if (typeof Icon !== 'function') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4',
          colorToStatusClass(cfg?.color),
          className
        )}
      >
        {cfg?.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4',
        colorToStatusClass(cfg?.color),
        className
      )}
    >
      <Icon size={14} strokeWidth={2.25} />
      {cfg?.label}
    </span>
  );
};

StatusBadge.propTypes = {
  entityType: PropTypes.oneOf(['job', 'application', 'user', 'company']).isRequired,
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default StatusBadge;
