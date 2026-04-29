import { resolveMediaUrl } from './mediaUrl';

/**
 * Domain-level constants - dùng chung cho toàn bộ client.
 *
 * ⚠️  CÁC GIÁ TRỊ TRONG FILE NÀY PHẢI KHỚP VỚI server/src/utils/constants.js
 *
 * Sau khi sync xong, ưu tiên dùng constants/status.js thay vì domain.js.
 */

// ─── ROLES ──────────────────────────────────────────────────────────────────
export const ROLE_VALUES = ['admin', 'employer', 'candidate', 'recruiter'];
export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  recruiter: 'Nhà tuyển dụng',
  candidate: 'Ứng viên',
};

export function normalizeUserRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();
  return normalizedRole === 'employer' ? 'recruiter' : normalizedRole;
}

// ─── USER STATUS ────────────────────────────────────────────────────────────
/**

 * ⚠️  'blocked' đã bị loại - chỉ còn 5 giá trị hợp lệ.
 * ⚠️  Đồng bộ với USER_STATUS_VALUES trong server/src/utils/constants.js
 */
export const USER_STATUS_VALUES = ['active', 'pending', 'inactive', 'banned', 'locked'];
export const USER_STATUS_LABELS = {
  active:   'Hoạt động',
  pending:  'Chờ xác minh',
  inactive: 'Không hoạt động',
  banned:   'Bị cấm',
  locked:   'Đã khóa',
};

// ─── USER GENDER ────────────────────────────────────────────────────────────
export const USER_GENDER_VALUES = ['male', 'female', 'other'];
export const USER_GENDER_LABELS = {
  male:   'Nam',
  female: 'Nữ',
  other:  'Khác',
};

// ─── USER REGION ────────────────────────────────────────────────────────────
export const USER_REGION_VALUES = ['North', 'Central', 'South', 'Overseas'];
export const USER_REGION_LABELS = {
  North:    'Miền Bắc',
  Central:  'Miền Trung',
  South:    'Miền Nam',
  Overseas: 'Nước ngoài',
};

// ─── JOB TYPES ────────────────────────────────────────────────────────────
/**
 * ⚠️  Keys phải khớp với DB enum values (underscore format per Migration 005).
 * Frontend form state dùng underscore — dùng JOB_TYPE_LABELS để convert → display label.
 */
export const JOB_TYPE_LABELS = {
  full_time:  'Toàn thời gian',
  part_time:  'Bán thời gian',
  contract:   'Hợp đồng',
  internship: 'Thực tập',
  remote:     'Từ xa',
};

// ─── JOB STATUS ────────────────────────────────────────────────────────────
/**

 * ⚠️  7 giá trị - đồng bộ với JOB_STATUS_VALUES trong server/src/utils/constants.js
 */
export const JOB_STATUS_VALUES = [
  'draft', 'pending', 'published', 'rejected',
  'closed', 'archived', 'expired',
];
export const JOB_STATUS_LABELS = {
  draft:     'Bản nháp',
  pending:   'Chờ duyệt',
  published: 'Đã đăng',
  rejected:  'Từ chối',
  closed:    'Đã đóng',
  archived:  'Lưu trữ',
  expired:   'Hết hạn',
};

// ─── APPLICATION STATUS ──────────────────────────────────────────────────────
/**

 * ⚠️  10 giá trị - đồng bộ với APP_STATUS_VALUES trong server/src/utils/constants.js
 */
export const APPLICATION_STATUS_VALUES = [
  'pending', 'reviewed', 'shortlisted',
  'interviewing', 'offered', 'hired',
  'rejected', 'accepted', 'withdrawn',
];
export const APPLICATION_STATUS_LABELS = {
  pending:     'Chờ xử lý',
  reviewed:    'Đã xem',
  shortlisted: 'Danh sách rút gọn',
  interviewing:'Phỏng vấn',
  offered:     'Đề nghị',
  hired:       'Đã tuyển',
  rejected:    'Từ chối',
  accepted:    'Đã chấp nhận',
  withdrawn:   'Đã rút',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────
export const DOMAIN_FIELD_ALIASES = {
  avatar: 'avatar_url',
  companyName: 'company_name',
  companyLogo: 'company_logo',
};

const USER_REGION_ALIASES = {
  North: 'North',
  'Mien Bac':    'North',
  'Miền Bắc':    'North',
  Central:  'Central',
  'Mien Trung':  'Central',
  'Miền Trung':  'Central',
  South:    'South',
  'Mien Nam':    'South',
  'Miền Nam':    'South',
  Overseas: 'Overseas',
  'Nuoc ngoai':  'Overseas',
  'Nước ngoài':  'Overseas',
};

export function getDomainLabel(labels, value, fallback = '') {
  if (value == null || value === '') return fallback;
  return labels[value] || value;
}

export function normalizeUserRegion(value = '') {
  const normalized = String(value ?? '').trim();
  return USER_REGION_ALIASES[normalized] || normalized;
}

export function getUserRegionLabel(value, fallback = '') {
  const canonicalRegion = normalizeUserRegion(value);
  return getDomainLabel(USER_REGION_LABELS, canonicalRegion, fallback || canonicalRegion);
}

export function getUserFullName(user = {}) {
  const firstName = String(user.first_name ?? user.firstName ?? '').trim();
  const lastName = String(user.last_name ?? user.lastName ?? '').trim();
  const explicitName = String(user.full_name ?? user.fullName ?? user.name ?? '').trim();
  return explicitName || [firstName, lastName].filter(Boolean).join(' ').trim();
}

const setStringField = (target, key, value) => {
  if (value === undefined || value === null) return;
  target[key] = String(value).trim();
};

const setOptionalField = (target, key, value) => {
  if (value === undefined) return;
  target[key] = value;
};

export function buildRegisterPayload(formData = {}, role = 'candidate') {
  // Normalize UI role to server-canonical role ('employer' UI → 'recruiter' API)
  const serverRole = normalizeUserRole(role);
  const payload = { role: serverRole };
  setStringField(payload, 'email', formData.email);
  setStringField(payload, 'password', formData.password);
  setStringField(payload, 'first_name', formData.first_name);
  setStringField(payload, 'last_name', formData.last_name);
  if (role === 'employer' || role === 'recruiter') {
    setStringField(payload, 'company_name', formData.company_name);
  }
  return payload;
}

export function buildUserProfilePayload(formData = {}) {
  const payload = {};
  setStringField(payload, 'first_name', formData.first_name);
  setStringField(payload, 'last_name', formData.last_name);
  setStringField(payload, 'phone', formData.phone);
  setStringField(payload, 'address', formData.address ?? formData.location);
  setStringField(payload, 'gender', formData.gender);
  setStringField(payload, 'region', normalizeUserRegion(formData.region));
  return payload;
}

export function buildAdminUserPayload(formData = {}) {
  const payload = buildUserProfilePayload(formData);
  setStringField(payload, 'role', formData.role);
  setStringField(payload, 'status', formData.status);
  setStringField(payload, 'internal_notes', formData.internal_notes);
  setOptionalField(payload, 'email_verified_at', formData.email_verified_at);
  return payload;
}

export function normalizeUserEntity(user = {}) {
  const fullName = getUserFullName(user);
  const companyName = String(user.company_name ?? user.companyName ?? '').trim();
  const companyLogo = String(user.company_logo ?? user.companyLogo ?? '').trim();
  const address = String(user.address ?? '').trim();
  const location = String(user.location ?? user.candidate_location ?? user.company_location ?? '').trim();
  const canonicalRegion = normalizeUserRegion(user.region);

  return {
    ...user,
    id: user.id ?? null,
    email: String(user.email ?? '').trim(),
    first_name: String(user.first_name ?? user.firstName ?? '').trim(),
    last_name: String(user.last_name ?? user.lastName ?? '').trim(),
    full_name: fullName,
    fullName,
    name: fullName,
    role: normalizeUserRole(user.role),
    avatar_url: resolveMediaUrl(String(user.avatar_url ?? user.avatar ?? '').trim()),
    phone: String(user.phone ?? '').trim(),
    address,
    location,
    gender: String(user.gender ?? '').trim(),
    region: canonicalRegion,
    region_label: getUserRegionLabel(canonicalRegion, ''),
    status: String(user.status ?? '').trim().toLowerCase(),
    company_name: companyName,
    companyName,
    company_logo: companyLogo,
    companyLogo,
    oauth_provider: user.oauth_provider != null ? String(user.oauth_provider).trim() : '',
    password_updated_at:
      user.password_updated_at != null ? String(user.password_updated_at).trim() : '',
    has_local_password: Boolean(user.has_local_password),
    email_notifications:
      user.email_notifications === undefined ? true : Boolean(user.email_notifications),
    push_notifications: Boolean(user.push_notifications),
  };
}

export function normalizeCompanyEntity(company = {}) {
  const companyName = String(company.company_name ?? company.companyName ?? '').trim();
  const companyLogo = String(company.company_logo ?? company.companyLogo ?? '').trim();
  const companyWebsite = String(company.company_website ?? company.website ?? '').trim();
  const companyDescription = String(
    company.company_description ?? company.description ?? ''
  ).trim();
  const companySize = String(company.company_size ?? company.scale ?? '').trim();
  const industry = String(company.industry ?? company.field ?? '').trim();
  const location = String(company.location ?? company.address ?? '').trim();
  const email = String(company.email ?? company.contact_email ?? '').trim();
  const openPositionsRaw =
    company.open_positions ?? company.openPositions ?? company.job_count ?? company.open_jobs_count;
  const openPositions =
    openPositionsRaw == null || openPositionsRaw === ''
      ? 0
      : Number.parseInt(openPositionsRaw, 10) || 0;

  return {
    ...company,
    id: company.id ?? null,
    name: companyName,
    company_name: companyName,
    companyName,
    logo: companyLogo,
    company_logo: companyLogo,
    companyLogo,
    company_website: companyWebsite,
    website: companyWebsite,
    company_description: companyDescription,
    description: companyDescription,
    size: companySize,
    company_size: companySize,
    scale: companySize,
    industry,
    field: industry,
    location,
    address: location,
    open_positions: openPositions,
    openPositions,
    job_count:
      company.job_count == null || company.job_count === ''
        ? openPositions
        : Number.parseInt(company.job_count, 10) || 0,
    email,
    contact_email: email,
    phone: String(company.phone ?? '').trim(),
    gender: String(company.gender ?? '').trim(),
    region: normalizeUserRegion(company.region ?? ''),
  };
}

export function buildEmployerProfilePayload(profile = {}) {
  const normalized = normalizeCompanyEntity(profile);
  return {
    company_name: normalized.company_name,
    company_logo: normalized.company_logo,
    company_website: normalized.company_website,
    company_description: normalized.company_description,
    company_size: normalized.company_size,
    industry: normalized.industry,
    location: normalized.location,
    email: normalized.email,
    phone: normalized.phone,
    gender: normalized.gender,
    region: normalized.region,
    first_name: String(profile.first_name ?? '').trim(),
    last_name: String(profile.last_name ?? '').trim(),
  };
}

export function normalizeJobEntity(job = {}) {
  return {
    ...job,
    type_label: getDomainLabel(JOB_TYPE_LABELS, job.type, ''),
    status_label: getDomainLabel(JOB_STATUS_LABELS, job.status, ''),
  };
}

export function normalizeApplicationEntity(application = {}) {
  return {
    ...application,
    status_label: getDomainLabel(APPLICATION_STATUS_LABELS, application.status, ''),
  };
}
