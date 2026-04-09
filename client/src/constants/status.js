import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ScanSearch,
  Star,
  UserCheck,
  XCircle,
} from 'lucide-react';

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  SCREENING: 'screening',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEWING: 'interviewing',
  OFFERED: 'offered',
  HIRED: 'hired',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

export const STATUS_CONFIG = {
  [APPLICATION_STATUS.PENDING]: {
    icon: Clock,
    label: 'Đang chờ',
    bg: 'bg-state-warning/10',
    text: 'text-state-warning',
    border: 'border-state-warning/20',
    accent: 'border-l-state-warning',
  },
  [APPLICATION_STATUS.SCREENING]: {
    icon: ScanSearch,
    label: 'AI Screening',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    accent: 'border-l-primary',
  },
  [APPLICATION_STATUS.REVIEWED]: {
    icon: AlertCircle,
    label: 'Đã xem xét',
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    accent: 'border-l-secondary',
  },
  [APPLICATION_STATUS.SHORTLISTED]: {
    icon: Star,
    label: 'Shortlisted',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    accent: 'border-l-amber-500',
  },
  [APPLICATION_STATUS.INTERVIEWING]: {
    icon: Calendar,
    label: 'Phỏng vấn',
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
    accent: 'border-l-accent',
  },
  [APPLICATION_STATUS.OFFERED]: {
    icon: CheckCircle,
    label: 'Đã offer',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    accent: 'border-l-emerald-500',
  },
  [APPLICATION_STATUS.HIRED]: {
    icon: UserCheck,
    label: 'Đã nhận việc',
    bg: 'bg-state-success/10',
    text: 'text-state-success',
    border: 'border-state-success/20',
    accent: 'border-l-state-success',
  },
  [APPLICATION_STATUS.ACCEPTED]: {
    icon: CheckCircle,
    label: 'Đã chấp nhận',
    bg: 'bg-state-success/10',
    text: 'text-state-success',
    border: 'border-state-success/20',
    accent: 'border-l-state-success',
  },
  [APPLICATION_STATUS.REJECTED]: {
    icon: XCircle,
    label: 'Bị từ chối',
    bg: 'bg-state-danger/10',
    text: 'text-state-danger',
    border: 'border-state-danger/20',
    accent: 'border-l-state-danger',
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    icon: XCircle,
    label: 'Đã rút hồ sơ',
    bg: 'bg-muted',
    text: 'text-txt-muted',
    border: 'border-border',
    accent: 'border-l-border',
  },
};

export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[APPLICATION_STATUS.PENDING];
};

export const getStatusColor = (status) => {
  const config = getStatusConfig(status);

  if (config.text.includes('success')) return 'green';
  if (config.text.includes('danger')) return 'red';
  if (config.text.includes('warning')) return 'yellow';
  if (config.text.includes('accent')) return 'cyan';
  if (config.text.includes('secondary')) return 'blue';
  if (config.text.includes('primary')) return 'indigo';

  return 'gray';
};

export const getStatusLabel = (status) => {
  return getStatusConfig(status).label || status;
};
