/**
 * Application Status - Nguồn chuẩn DUY NHẤT cho toàn hệ thống.
 * KHỚP với server/src/utils/constants.js APP_STATUS
 *
 * Pipeline: submitted → shortlisted → interview_scheduled → interviewed → offered → hired
 * Side paths: rejected (từ bất kỳ stage nào), withdrawn (candidate rút đơn)
 *
 * Ứng viên, Recruiter, Admin đều dùng cùng bộ status này.
 */
import {
  Clock,
  Star,
  Calendar,
  CheckCircle,
  Award,
  UserCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export const APPLICATION_STATUS = {
  SUBMITTED:           'submitted',
  SHORTLISTED:         'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED:         'interviewed',
  OFFERED:             'offered',
  HIRED:               'hired',
  REJECTED:            'rejected',
  WITHDRAWN:           'withdrawn',
};

export const APP_STATUS_PIPELINE_ORDER = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
  APPLICATION_STATUS.OFFERED,
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
];

export const LEGACY_APPLICATION_STATUS_MAP = {
  pending: APPLICATION_STATUS.SUBMITTED,
  applied: APPLICATION_STATUS.SUBMITTED,
  screening: APPLICATION_STATUS.SHORTLISTED,
  reviewed: APPLICATION_STATUS.SHORTLISTED,
  interview: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  interviewing: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  offer: APPLICATION_STATUS.OFFERED,
  accepted: APPLICATION_STATUS.HIRED,
  expired: APPLICATION_STATUS.REJECTED,
};

export const APPLICATION_STATUS_TRANSITIONS = {
  [APPLICATION_STATUS.SUBMITTED]: [
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.SHORTLISTED]: [
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: [
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.INTERVIEWED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.INTERVIEWED]: [
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.OFFERED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.OFFERED]: [
    APPLICATION_STATUS.HIRED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.HIRED]: [],
  [APPLICATION_STATUS.REJECTED]: [],
  [APPLICATION_STATUS.WITHDRAWN]: [],
};

export const INTERVIEW_APPLICATION_STATUSES = new Set([
  APPLICATION_STATUS.INTERVIEW_SCHEDULED,
  APPLICATION_STATUS.INTERVIEWED,
]);

export const TERMINAL_APPLICATION_STATUSES = new Set([
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
]);

export const normalizeApplicationStatus = (status) => {
  if (!status) return APPLICATION_STATUS.SUBMITTED;
  if (LEGACY_APPLICATION_STATUS_MAP[status]) return LEGACY_APPLICATION_STATUS_MAP[status];
  if (APP_STATUS_PIPELINE_ORDER.includes(status)) return status;
  return APPLICATION_STATUS.SUBMITTED;
};

export const getNextApplicationStatuses = (status) =>
  APPLICATION_STATUS_TRANSITIONS[normalizeApplicationStatus(status)] || [];

export const canTransitionApplicationStatus = (currentStatus, nextStatus) =>
  getNextApplicationStatuses(currentStatus).includes(normalizeApplicationStatus(nextStatus));

export const APP_STATUS_CONFIG = {
  [APPLICATION_STATUS.SUBMITTED]: {
    icon: Clock,
    label: 'Đã nộp',
    shortLabel: 'Nộp',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    color: 'amber',
    pipelineGroup: 'active',
    canWithdraw: true,
    description: 'Đơn đã được gửi, đang chờ recruiter xem xét',
  },
  [APPLICATION_STATUS.SHORTLISTED]: {
    icon: Star,
    label: 'Phù hợp sơ bộ',
    shortLabel: 'Phù hợp SB',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    color: 'amber',
    pipelineGroup: 'active',
    canWithdraw: true,
    description: 'Hồ sơ của bạn đã được chọn vào danh sách rút gọn',
  },
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: {
    icon: Calendar,
    label: 'Lịch phỏng vấn',
    shortLabel: 'Lịch PV',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    color: 'amber',
    pipelineGroup: 'interview',
    canWithdraw: true,
    description: 'Bạn có lịch phỏng vấn được xếp. Kiểm tra email để biết chi tiết.',
  },
  [APPLICATION_STATUS.INTERVIEWED]: {
    icon: CheckCircle,
    label: 'Đã phỏng vấn',
    shortLabel: 'Đã PV',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    color: 'amber',
    pipelineGroup: 'interview',
    canWithdraw: false,
    description: 'Bạn đã hoàn thành phỏng vấn. Đang chờ kết quả.',
  },
  [APPLICATION_STATUS.OFFERED]: {
    icon: Award,
    label: 'Nhận offer',
    shortLabel: 'Offer',
    bg: 'bg-success/10',
    text: 'text-success-700',
    border: 'border-success/20',
    color: 'emerald',
    pipelineGroup: 'success',
    canWithdraw: true,
    description: 'Chúc mừng! Bạn nhận được offer. Kiểm tra email để biết chi tiết.',
  },
  [APPLICATION_STATUS.HIRED]: {
    icon: UserCheck,
    label: 'Đã tuyển',
    shortLabel: 'Tuyển',
    bg: 'bg-success/10',
    text: 'text-success-700',
    border: 'border-success/20',
    color: 'emerald',
    pipelineGroup: 'success',
    canWithdraw: false,
    description: 'Bạn đã chính thức được tuyển. Chào mừng đến công ty mới!',
  },
  [APPLICATION_STATUS.REJECTED]: {
    icon: XCircle,
    label: 'Từ chối',
    shortLabel: 'Từ chối',
    bg: 'bg-danger/10',
    text: 'text-danger-700',
    border: 'border-danger/20',
    color: 'red',
    pipelineGroup: 'closed',
    canWithdraw: false,
    description: 'Rất tiếc, đơn ứng tuyển không được chấp nhận. Đừng nản chí!',
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    icon: RotateCcw,
    label: 'Đã rút hồ sơ',
    shortLabel: 'Rút',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    color: 'slate',
    pipelineGroup: 'closed',
    canWithdraw: false,
    description: 'Bạn đã rút đơn ứng tuyển này.',
  },
};

export const PIPELINE_STAGES = [
  { key: 'all', label: 'Tất cả', icon: null, color: 'bg-muted-foreground' },
  { key: APPLICATION_STATUS.SUBMITTED, label: 'Đã nộp', icon: Clock, color: 'bg-warning/100' },
  { key: APPLICATION_STATUS.SHORTLISTED, label: 'Phù hợp SB', icon: Star, color: 'bg-warning/100' },
  { key: APPLICATION_STATUS.INTERVIEW_SCHEDULED, label: 'Lịch PV', icon: Calendar, color: 'bg-warning/100' },
  { key: APPLICATION_STATUS.INTERVIEWED, label: 'Đã PV', icon: CheckCircle, color: 'bg-warning/100' },
  { key: APPLICATION_STATUS.OFFERED, label: 'Offer', icon: Award, color: 'bg-success/100' },
  { key: APPLICATION_STATUS.HIRED, label: 'Tuyển', icon: UserCheck, color: 'bg-success/100' },
  { key: APPLICATION_STATUS.REJECTED, label: 'Từ chối', icon: XCircle, color: 'bg-danger/100' },
  { key: APPLICATION_STATUS.WITHDRAWN, label: 'Rút', icon: RotateCcw, color: 'bg-muted-foreground' },
];

export const getAppStatusConfig = (status) =>
  APP_STATUS_CONFIG[status] || APP_STATUS_CONFIG[APPLICATION_STATUS.SUBMITTED];

export const getAppStatusLabel = (status) =>
  getAppStatusConfig(status)?.label || status || 'Không xác định';

export const getAppStatusShortLabel = (status) =>
  getAppStatusConfig(status).shortLabel || status;

export const getPipelineGroup = (status) =>
  getAppStatusConfig(status).pipelineGroup || 'active';

export const getActiveStatuses = () =>
  Object.values(APPLICATION_STATUS).filter(s =>
    APP_STATUS_CONFIG[s]?.pipelineGroup === 'active' ||
    APP_STATUS_CONFIG[s]?.pipelineGroup === 'interview'
  );

export const getInterviewStatuses = () =>
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.INTERVIEWED];

export const getSuccessStatuses = () =>
  [APPLICATION_STATUS.OFFERED, APPLICATION_STATUS.HIRED];

export const getClosedStatuses = () =>
  [APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN];

export const canCandidateWithdraw = (status) =>
  getAppStatusConfig(status).canWithdraw ?? false;

export const getStatusColor = (status) =>
  getAppStatusConfig(status).color || 'slate';

export const statusToBadgeVariant = (status) => {
  const color = getStatusColor(status);
  const map = {
    emerald: 'success',
    teal: 'success',
    amber: 'warning',
    blue: 'info',
    violet: 'default',
    red: 'error',
    slate: 'secondary',
  };
  return map[color] || 'default';
};

export { getAppStatusConfig as getStatusConfig };
export { getAppStatusLabel as getStatusLabel };

// ─── JOB STATUS (Employer view) ───────────────────────────────────────────────
/**
 * Labels khớp với server/src/utils/constants.js JOB_STATUS_LABELS
 *
 * Quy trình: draft → pending_review → approved → published → expired/closed
 *            rejected (từ pending_review)
 *            suspended (admin can suspend any published job)
 */
export const JOB_STATUS = {
  DRAFT:           'draft',
  PENDING_REVIEW:  'pending_review',
  APPROVED:        'approved',
  REJECTED:        'rejected',
  PUBLISHED:       'published',
  EXPIRED:         'expired',
  CLOSED:          'closed',
  SUSPENDED:       'suspended',
};

export const JOB_STATUS_CONFIG = {
  [JOB_STATUS.DRAFT]: {
    label: 'Bản nháp',
    shortLabel: 'Nháp',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    color: 'slate',
    description: 'Chưa gửi duyệt, chỉ bạn thấy',
    candidateVisible: false,
    recruiterAction: 'Gửi duyệt',
  },
  [JOB_STATUS.PENDING_REVIEW]: {
    label: 'Chờ duyệt',
    shortLabel: 'Chờ duyệt',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    color: 'amber',
    description: 'Đang chờ admin duyệt trước khi đăng',
    candidateVisible: false,
    recruiterAction: 'Hủy gửi',
  },
  [JOB_STATUS.APPROVED]: {
    label: 'Đã duyệt',
    shortLabel: 'Duyệt',
    bg: 'bg-success/10',
    text: 'text-success-700',
    border: 'border-success/20',
    color: 'emerald',
    description: 'Đã được duyệt, sẵn sàng đăng',
    candidateVisible: false,
    recruiterAction: 'Đăng ngay',
  },
  [JOB_STATUS.REJECTED]: {
    label: 'Bị từ chối',
    shortLabel: 'Từ chối',
    bg: 'bg-danger/10',
    text: 'text-danger-700',
    border: 'border-danger/20',
    color: 'red',
    description: 'Bị từ chối bởi admin. Liên hệ để biết lý do.',
    candidateVisible: false,
    recruiterAction: 'Liên hệ admin',
  },
  [JOB_STATUS.PUBLISHED]: {
    label: 'Đã đăng',
    shortLabel: 'Đăng',
    bg: 'bg-success/10',
    text: 'text-success-700',
    border: 'border-success/20',
    color: 'emerald',
    description: 'Đang hiển thị công khai trên trang tuyển dụng',
    candidateVisible: true,
    recruiterAction: 'Đóng tuyển',
  },
  [JOB_STATUS.EXPIRED]: {
    label: 'Hết hạn',
    shortLabel: 'Hết hạn',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    color: 'slate',
    description: 'Đã hết hạn đăng tuyển theo deadline',
    candidateVisible: false,
    recruiterAction: 'Gia hạn',
  },
  [JOB_STATUS.CLOSED]: {
    label: 'Đã đóng',
    shortLabel: 'Đóng',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    color: 'slate',
    description: 'Đã đóng tuyển bởi recruiter',
    candidateVisible: false,
    recruiterAction: 'Mở lại',
  },
  [JOB_STATUS.SUSPENDED]: {
    label: 'Tạm ngưng',
    shortLabel: 'Ngưng',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    color: 'slate',
    description: 'Bị tạm ngưng bởi admin',
    candidateVisible: false,
    recruiterAction: 'Liên hệ admin',
  },
};

export const JOB_STATUS_ORDER = [
  JOB_STATUS.PUBLISHED,
  JOB_STATUS.PENDING_REVIEW,
  JOB_STATUS.APPROVED,
  JOB_STATUS.DRAFT,
  JOB_STATUS.CLOSED,
  JOB_STATUS.EXPIRED,
  JOB_STATUS.REJECTED,
  JOB_STATUS.SUSPENDED,
];

export const getJobStatusConfig = (status) =>
  JOB_STATUS_CONFIG[status] || JOB_STATUS_CONFIG[JOB_STATUS.DRAFT];

export const getJobStatusLabel = (status) =>
  getJobStatusConfig(status).label || status;

export const isJobVisibleToCandidate = (status) =>
  getJobStatusConfig(status).candidateVisible ?? false;

export const jobStatusToBadgeVariant = (status) => {
  const color = getJobStatusConfig(status).color || 'slate';
  const map = {
    emerald: 'success',
    amber: 'warning',
    blue: 'info',
    red: 'error',
    orange: 'warning',
    slate: 'secondary',
  };
  return map[color] || 'default';
};

// ─── COMPANY MEMBER ROLES ────────────────────────────────────────────────────
export const COMPANY_ROLES = {
  OWNER:     'owner',
  ADMIN:     'admin',
  RECRUITER: 'recruiter',
};

export const COMPANY_ROLE_LABELS = {
  owner:     'Chủ sở hữu',
  admin:     'Quản trị viên',
  recruiter: 'Nhà tuyển dụng',
};

// ─── USER STATUS (Account status) ───────────────────────────────────────────
export const USER_STATUS = {
  ACTIVE:               'active',
  PENDING_VERIFICATION: 'pending_verification',
  SUSPENDED:            'suspended',
  BANNED:               'banned',
};

export const USER_STATUS_CONFIG = {
  [USER_STATUS.ACTIVE]: {
    label: 'Hoạt động',
    bg: 'bg-success/10',
    text: 'text-success-700',
    border: 'border-success/20',
    icon: UserCheck,
    color: 'emerald',
  },
  [USER_STATUS.PENDING_VERIFICATION]: {
    label: 'Chờ xác minh',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    border: 'border-warning/25',
    icon: Clock,
    color: 'amber',
  },
  [USER_STATUS.SUSPENDED]: {
    label: 'Tạm ngưng',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: RotateCcw,
    color: 'slate',
  },
  [USER_STATUS.BANNED]: {
    label: 'Bị cấm',
    bg: 'bg-danger/10',
    text: 'text-danger-700',
    border: 'border-danger/20',
    icon: XCircle,
    color: 'red',
  },
};

export const getUserStatusConfig = (status) =>
  USER_STATUS_CONFIG[status] || USER_STATUS_CONFIG[USER_STATUS.ACTIVE];

export const getUserStatusLabel = (status) =>
  getUserStatusConfig(status).label || status;

export const getCompanyRoleLabel = (role) =>
  COMPANY_ROLE_LABELS[role] || role;

// ─── JOB TYPE MAPPINGS ───────────────────────────────────────────────────────
export const FORM_VALUE_TO_JOB_TYPE = {
  'full-time': 'full_time',
  'part-time': 'part_time',
  'contract': 'contract',
  'internship': 'internship',
  'remote': 'remote',
  'full_time': 'full-time',
  'part_time': 'part-time',
};

export const JOB_TYPE_TO_FORM_VALUE = {
  'full_time': 'full-time',
  'part_time': 'part-time',
  'contract': 'contract',
  'internship': 'internship',
  'remote': 'remote',
  'full-time': 'full_time',
  'part-time': 'part-time',
};

export const JOB_TYPE_FORM_LABELS = {
  'full_time': 'Toàn thời gian',
  'part_time': 'Bán thời gian',
  'contract': 'Hợp đồng',
  'internship': 'Thực tập',
  'remote': 'Làm việc từ xa',
};

// ─── NOTIFICATION TYPE CONFIG ─────────────────────────────────────────────────
export const NOTIFICATION_TYPE_CONFIG = {
  application: {
    icon: 'Briefcase',
    bg: 'bg-primary/10',
    text: 'text-primary',
  },
  status_change: {
    icon: 'TrendingUp',
    bg: 'bg-info/10',
    text: 'text-info',
  },
  interview: {
    icon: 'Calendar',
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  offer: {
    icon: 'Award',
    bg: 'bg-success/10',
    text: 'text-success',
  },
  rejection: {
    icon: 'XCircle',
    bg: 'bg-danger/10',
    text: 'text-danger',
  },
  message: {
    icon: 'MessageCircle',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
  default: {
    icon: 'Bell',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
};
