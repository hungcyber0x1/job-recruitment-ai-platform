/**
 * Central constants for the entire application.
 * Each enum exports both a value→label object (for display) and a values array (for validation).
 *
 * ─── Naming convention ───────────────────────────────────────────────────────────
 * JOB_STATUS    → status của tin tuyển dụng (draft/pending/published/...)
 * APP_STATUS    → status của đơn ứng tuyển  (pending/shortlisted/...)
 * USER_STATUS   → status của tài khoản       (active/pending/inactive/banned)
 * ─── Source of truth ────────────────────────────────────────────────────────────
 * Luôn đồng bộ với:
 *   - server/src/models/* (JSDoc @typedef)
 *   - client/src/constants/ hoặc client/src/utils/constants-copy.js
 * ───────────────────────────────────────────────────────────────────────────────
 */

// ─── ROLES ──────────────────────────────────────────────────────────────────────
exports.ROLES = {
  ADMIN:     'admin',
  EMPLOYER:  'recruiter',
  CANDIDATE: 'candidate',
};
exports.ROLE_LABELS = {
  admin:     'Quản trị viên',
  recruiter: 'Nhà tuyển dụng',
  candidate: 'Ứng viên',
};
exports.ROLE_VALUES = ['admin', 'recruiter', 'candidate'];

// ─── JOB TYPES ────────────────────────────────────────────────────────────────
exports.JOB_TYPES = {
  FULL_TIME:  'full-time',
  PART_TIME:  'part-time',
  CONTRACT:   'contract',
  INTERNSHIP: 'internship',
  REMOTE:     'remote',
};
exports.JOB_TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  'contract':   'Hợp đồng',
  'internship': 'Thực tập',
  'remote':     'Từ xa',
};
exports.JOB_TYPE_VALUES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

// ─── JOB STATUS ─────────────────────────────────────────────────────────────
/**
 * Chuẩn hóa job status - 8 giá trị, dùng chung backend/frontend.
 *
 * | DB value          | Candidate thấy? | Employer thấy? | Admin thấy? |
 * |-------------------|----------------|----------------|-------------|
 * | draft            | ❌             | ✅ (của mình)  | ✅           |
 * | pending_review   | ❌             | ✅ (của mình)   | ✅ + action  |
 * | approved         | ❌             | ✅ (của mình)   | ✅           |
 * | rejected         | ❌             | ✅ (của mình)   | ✅           |
 * | published        | ✅             | ✅               | ✅           |
 * | expired          | ✅             | ✅               | ✅           |
 * | closed           | ❌             | ✅               | ✅           |
 * | suspended        | ❌             | ✅               | ✅           |
 */
exports.JOB_STATUS = {
  DRAFT:           'draft',
  PENDING_REVIEW:  'pending_review',
  APPROVED:        'approved',
  REJECTED:        'rejected',
  PUBLISHED:       'published',
  EXPIRED:         'expired',
  CLOSED:          'closed',
  SUSPENDED:       'suspended',
};
exports.JOB_STATUS_LABELS = {
  draft:           'Bản nháp',
  pending_review:  'Chờ duyệt',
  approved:        'Đã duyệt',
  rejected:        'Từ chối',
  published:       'Đã đăng',
  expired:         'Hết hạn',
  closed:          'Đã đóng',
  suspended:       'Tạm ngưng',
};
exports.JOB_STATUS_VALUES = ['draft', 'pending_review', 'approved', 'rejected', 'published', 'expired', 'closed', 'suspended'];

// ─── APPLICATION STATUS ─────────────────────────────────────────────────────
/**
 * Chuẩn hóa application status - 9 giá trị.
 * Dùng cho cả Admin, Employer và Candidate.
 *
 * Pipeline: submitted → shortlisted → interview_scheduled → interviewed → offered → hired
 * Side paths: rejected (từ bất kỳ stage nào), withdrawn (candidate rút đơn)
 */
exports.APP_STATUS = {
  SUBMITTED:           'submitted',
  SHORTLISTED:         'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED:         'interviewed',
  OFFERED:             'offered',
  HIRED:               'hired',
  REJECTED:            'rejected',
  WITHDRAWN:           'withdrawn',
};
exports.APP_STATUS_LABELS = {
  submitted:           'Đã nộp',
  shortlisted:         'Danh sách rút gọn',
  interview_scheduled: 'Lịch phỏng vấn',
  interviewed:         'Đã phỏng vấn',
  offered:             'Đề nghị',
  hired:               'Đã tuyển',
  rejected:            'Từ chối',
  withdrawn:           'Đã rút',
};
exports.APP_STATUS_VALUES = [
  'submitted', 'shortlisted',
  'interview_scheduled', 'interviewed', 'offered', 'hired',
  'rejected', 'withdrawn',
];

// ─── USER STATUS ────────────────────────────────────────────────────────────
/**
 * Chuẩn hóa user status - 4 giá trị.
 * ⚠️  CHÍNH SÁCH STATUS:
 * - Nguồn trạng thái DUY NHẤT: cột `status`
 * - Cột `is_active` là LEGACY - chỉ dùng để đồng bộ DB, KHÔNG dùng trong logic ứng dụng
 * - Tất cả kiểm tra status phải dùng cột `status`, không fallback về `is_active`
 * - Giá trị: active | pending_verification | suspended | banned
 */
exports.USER_STATUS = {
  ACTIVE:              'active',
  PENDING_VERIFICATION:'pending_verification',
  SUSPENDED:           'suspended',
  BANNED:              'banned',
};
exports.USER_STATUS_LABELS = {
  active:               'Hoạt động',
  pending_verification: 'Chờ xác minh',
  suspended:            'Tạm ngưng',
  banned:              'Bị cấm',
};
exports.USER_STATUS_VALUES = ['active', 'pending_verification', 'suspended', 'banned'];

// ─── INTERVIEW STATUS ───────────────────────────────────────────────────────
exports.INTERVIEW_STATUS = {
  SCHEDULED:  'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
  RESCHEDULED: 'rescheduled',
};
exports.INTERVIEW_STATUS_LABELS = {
  scheduled:  'Đã lên lịch',
  in_progress: 'Đang phỏng vấn',
  completed:   'Hoàn thành',
  cancelled:   'Đã hủy',
  rescheduled: 'Đổi lịch',
};
exports.INTERVIEW_STATUS_VALUES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];

// ─── MATCH TYPE ─────────────────────────────────────────────────────────────
exports.MATCH_TYPE = {
  PERFECT: 'perfect_match',
  STRONG:  'strong_match',
  GOOD:    'good_match',
  PARTIAL: 'partial_match',
};
exports.MATCH_TYPE_LABELS = {
  perfect_match: 'Phù hợp hoàn hảo',
  strong_match:  'Phù hợp tốt',
  good_match:    'Phù hợp',
  partial_match: 'Phù hợp một phần',
};
exports.MATCH_TYPE_VALUES = ['perfect_match', 'strong_match', 'good_match', 'partial_match'];

// ─── CAREER STATUS ──────────────────────────────────────────────────────────
exports.CAREER_STATUS = {
  ACTIVE:   'active',
  COMPLETED:'completed',
  ARCHIVED: 'archived',
};
exports.CAREER_STATUS_VALUES = ['active', 'completed', 'archived'];

// ─── NOTIFICATION TYPE ──────────────────────────────────────────────────────
/**
 * Notification types - dùng chung cho backend + frontend.
 *
 * Backend query trả về type 'application' cho tất cả application notifications.
 * Frontend có thể map thêm dựa trên application status.
 *
 * ⚠️  'message' và 'system' là placeholder cho future expansion.
 */
exports.NOTIFICATION_TYPE = {
  APPLICATION: 'application',   // Thông báo ứng tuyển (từ applications + application_history)
  JOB:         'job',           // Thông báo tin tuyển dụng (future)
  SYSTEM:      'system',        // Thông báo hệ thống (future)
  MESSAGE:     'message',       // Tin nhắn (future)
};
exports.NOTIFICATION_TYPE_VALUES = ['application', 'job', 'system', 'message'];

/**
 * Map application status → notification type/category
 * Dùng để frontend hiển thị notification icon/label phù hợp.
 *
 * pending    → application.pending  (chờ xử lý)
 * reviewed  → application.reviewed
 * shortlisted→ application.shortlisted
 * interviewing→ application.interviewing  (phỏng vấn)
 * offered   → application.offered   (offer)
 * hired     → application.hired     (kết quả)
 * rejected  → application.rejected
 * accepted  → application.accepted
 * withdrawn → application.withdrawn
 */
exports.APP_STATUS_TO_NOTIFICATION_TYPE = {
  submitted:           'application.submitted',
  shortlisted:         'application.shortlisted',
  interview_scheduled: 'application.interview_scheduled',
  interviewed:         'application.interviewed',
  offered:             'application.offered',
  hired:               'application.hired',
  rejected:            'application.rejected',
  withdrawn:           'application.withdrawn',
};

// ─── EMPLOYER/COMPANY NAMING CONVENTION ─────────────────────────────────────
/**
 * ⚠️  QUY ƯỚC RẤT QUAN TRỌNG: EMPLOYER = COMPANY
 *
 * Trong hệ thống này, "Employer" và "Company" refer đến CÙNG MỘT bảng `employers`.
 *
 * | Thuật ngữ | Ý nghĩa | Dùng khi |
 * |-----------|---------|-----------|
 * | employer  | Role/tài khoản người dùng | User có role='employer', các thao tác auth |
 * | company   | Thông tin doanh nghiệp | Khi hiển thị/thao tác thông tin công ty |
 *
 * ─── Database ──────────────────────────────────────────────────────────────────
 * - Bảng: `employers` (SINGLE source of truth)
 * - employers.id = khóa chính (dùng làm employer_id hoặc company_id)
 *
 * ─── Foreign Keys ─────────────────────────────────────────────────────────────
 * - jobs.employer_id → employers.id (Job belongs to Employer/Company)
 * - applications có thể có employer_id thông qua jobs
 *
 * ─── Response Fields ────────────────────────────────────────────────────────────
 * - Các field luôn dùng prefix `company_*`: company_name, company_logo, etc.
 * - KHÔNG dùng `employer_name`, `employer_logo`, etc.
 *
 * ─── Repository Classes ──────────────────────────────────────────────────────────
 * - EmployerRepository (models/Employer.js): business logic cho employer profile
 * - CompanyRepository (models/Company.js): public listing và admin company management
 * - Cả hai đều query bảng `employers`
 *
 * ─── ID Mapping ─────────────────────────────────────────────────────────────────
 * - employer_id = company_id = employers.id (cùng một giá trị)
 * - Khi query job, nên dùng job.company_id (đã được normalize trong toJobContract)
 * - Legacy code có thể dùng job.employer_id - cả hai đều valid
 *
 * ─── Nested Objects ─────────────────────────────────────────────────────────────
 * - job.company = { id, name, logo, ... } - company summary object
 * - job.employer = job.company (alias)
 * - Nên dùng job.company thay vì job.employer
 */
exports.EMPLOYER_COMPANY_SCHEMA = {
  TABLE: 'employers',
  PRIMARY_KEY: 'id',
  // Fields luôn dùng company_* prefix
  FIELDS: {
    NAME: 'company_name',
    LOGO: 'company_logo',
    WEBSITE: 'company_website',
    DESCRIPTION: 'company_description',
    SIZE: 'company_size',
    INDUSTRY: 'industry',
    LOCATION: 'location',
    PHONE: 'phone',
    TAX_CODE: 'tax_code',
  },
};
