import { AlertCircle, Briefcase, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

import { JOB_STATUS_LABELS, JOB_TYPE_LABELS, getDomainLabel, normalizeJobEntity } from '@/utils';

export const ADMIN_JOB_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending_review', label: 'Chờ duyệt' },
  { value: 'published', label: 'Đang hiển thị' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'archived', label: 'Đã lưu trữ' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'flagged', label: 'Bị gắn cờ' },
];

export const ADMIN_JOB_STATUS_BADGE_META = {
  draft: { label: 'Bản nháp', variant: 'outline' },
  pending_review: { label: 'Chờ duyệt', variant: 'warning' },
  published: { label: 'Đang hiển thị', variant: 'success' },
  closed: { label: 'Đã đóng', variant: 'secondary' },
  rejected: { label: 'Đã từ chối', variant: 'destructive' },
  archived: { label: 'Đã lưu trữ', variant: 'secondary' },
  expired: { label: 'Hết hạn', variant: 'destructive' },
  flagged: { label: 'Bị gắn cờ', variant: 'destructive' },
};

export function formatCanonicalJobType(type) {
  const normalized = String(type || '')
    .trim()
    .replace(/_/g, '-')
    .toLowerCase();
  return getDomainLabel(JOB_TYPE_LABELS, normalized, normalized || '--');
}

export function normalizeAdminJob(rawJob = {}) {
  const normalized = normalizeJobEntity({
    ...rawJob,
    type: String(rawJob?.type ?? rawJob?.job_type ?? '')
      .trim()
      .replace(/_/g, '-')
      .toLowerCase(),
    status: String(rawJob?.status ?? 'draft')
      .trim()
      .toLowerCase(),
  });

  return {
    ...normalized,
    id: normalized.id ?? 0,
    title: String(normalized.title ?? ''),
    company_name: String(normalized.company_name ?? ''),
    employer_id: normalized.employer_id ?? null,
    location: String(normalized.location ?? 'Remote'),
    salary_min: normalized.salary_min ?? null,
    salary_max: normalized.salary_max ?? null,
    salary_negotiable:
      normalized.salary_negotiable === true ||
      normalized.salary_negotiable === 1 ||
      normalized.salary_negotiable === '1' ||
      normalized.salary_negotiable === 'true',
    vacancies: Number(normalized.vacancies ?? 1) || 1,
    applicants: Number(normalized.applicant_count ?? normalized.applicants ?? 0),
    views: Number(normalized.views ?? 0),
    flagged: Boolean(normalized.flagged ?? normalized.is_flagged ?? false),
    moderation_note: String(normalized.moderation_note ?? ''),
    created_at: normalized.created_at ?? new Date().toISOString(),
    status_label: getDomainLabel(JOB_STATUS_LABELS, normalized.status, normalized.status || ''),
    type_label: formatCanonicalJobType(normalized.type),
  };
}

export function buildAdminJobStats(jobs = [], total = jobs.length) {
  return [
    { label: 'Tong tin tuyen dung', value: total, icon: Briefcase, color: 'bg-primary-500' },
    {
      label: 'Cho duyet',
      value: jobs.filter((job) => job.status === 'pending_review').length,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      label: 'Da dang',
      value: jobs.filter((job) => job.status === 'published').length,
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
    {
      label: 'Bi gan co',
      value: jobs.filter((job) => job.flagged).length,
      icon: ShieldAlert,
      color: 'bg-red-500',
    },
  ];
}

export function getAdminJobStatusMeta(job = {}) {
  const key = job.flagged ? 'flagged' : String(job.status || 'draft').toLowerCase();
  return ADMIN_JOB_STATUS_BADGE_META[key] || ADMIN_JOB_STATUS_BADGE_META.draft;
}

export function getAdminJobHealthNote(jobs = []) {
  const unknownStatuses = jobs.filter(
    (job) =>
      ![
        'draft',
        'pending_review',
        'approved',
        'published',
        'expired',
        'closed',
        'rejected',
        'suspended',
      ].includes(String(job.status || '').toLowerCase())
  ).length;

  if (!unknownStatuses) return null;

  return {
    icon: AlertCircle,
    message: `${unknownStatuses} job dang co status ngoai contract hien tai.`,
  };
}
