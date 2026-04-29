/**
 * Candidate Profile Phase 1.1 constants
 * Sync with server-side ENUM values and labels
 */

import {
  Search,
  Briefcase,
  XCircle,
  UserCheck,
  Award,
  BookOpen,
  Star,
  Globe,
} from 'lucide-react';

// ─── Job Search Status ──────────────────────────────────────────────────────────

export const JOB_SEARCH_STATUS = {
  ACTIVELY_LOOKING: 'actively_looking',
  OPEN_TO_WORK: 'open_to_work',
  NOT_LOOKING: 'not_looking',
  EMPLOYED: 'employed',
};

export const JOB_SEARCH_STATUS_CONFIG = {
  [JOB_SEARCH_STATUS.ACTIVELY_LOOKING]: {
    icon: Search,
    label: 'Đang tìm việc',
    color: 'emerald',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  [JOB_SEARCH_STATUS.OPEN_TO_WORK]: {
    icon: Briefcase,
    label: 'Mở cơ hội',
    color: 'blue',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  [JOB_SEARCH_STATUS.NOT_LOOKING]: {
    icon: XCircle,
    label: 'Không tìm việc',
    color: 'slate',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  [JOB_SEARCH_STATUS.EMPLOYED]: {
    icon: UserCheck,
    label: 'Đang làm việc',
    color: 'violet',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
};

// ─── Proficiency Levels ────────────────────────────────────────────────────────

export const PROFICIENCY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
};

export const PROFICIENCY_CONFIG = {
  [PROFICIENCY_LEVELS.BEGINNER]: {
    label: 'Người mới',
    short: 'Mới',
    color: 'slate',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    progress: 25,
  },
  [PROFICIENCY_LEVELS.INTERMEDIATE]: {
    label: 'Trung bình',
    short: 'TB',
    color: 'blue',
    bg: 'bg-primary/10',
    text: 'text-primary',
    progress: 50,
  },
  [PROFICIENCY_LEVELS.ADVANCED]: {
    label: 'Nâng cao',
    short: 'NC',
    color: 'amber',
    bg: 'bg-warning/10',
    text: 'text-warning-700',
    progress: 75,
  },
  [PROFICIENCY_LEVELS.EXPERT]: {
    label: 'Chuyên gia',
    short: 'CG',
    color: 'emerald',
    bg: 'bg-success/10',
    text: 'text-primary',
    progress: 100,
  },
};

// ─── Education Levels ──────────────────────────────────────────────────────────

export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: 'high_school',
  COLLEGE: 'college',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  PHD: 'phd',
  OTHER: 'other',
};

export const EDUCATION_LEVEL_CONFIG = {
  [EDUCATION_LEVELS.HIGH_SCHOOL]: { label: 'Trung học phổ thông' },
  [EDUCATION_LEVELS.COLLEGE]: { label: 'Cao đẳng' },
  [EDUCATION_LEVELS.BACHELOR]: { label: 'Cử nhân' },
  [EDUCATION_LEVELS.MASTER]: { label: 'Thạc sĩ' },
  [EDUCATION_LEVELS.PHD]: { label: 'Tiến sĩ' },
  [EDUCATION_LEVELS.OTHER]: { label: 'Khác' },
};

// ─── Language Levels ───────────────────────────────────────────────────────────

export const LANGUAGE_LEVELS = ['native', 'fluent', 'advanced', 'intermediate', 'basic'];

export const LANGUAGE_LEVEL_CONFIG = {
  native: { label: 'Bản ngữ', short: 'NN' },
  fluent: { label: 'Thành thạo', short: 'TT' },
  advanced: { label: 'Nâng cao', short: 'NC' },
  intermediate: { label: 'Trung bình', short: 'TB' },
  basic: { label: 'Cơ bản', short: 'CB' },
};

// ─── Job Types ────────────────────────────────────────────────────────────────

export const JOB_TYPES_LIST = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' },
  { value: 'internship', label: 'Thực tập' },
  { value: 'remote', label: 'Từ xa / Remote' },
];

// ─── Preferred Locations ───────────────────────────────────────────────────────

export const VIETNAM_LOCATIONS = [
  { value: 'Hà Nội', label: 'Hà Nội' },
  { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
  { value: 'Hải Phòng', label: 'Hải Phòng' },
  { value: 'Cần Thơ', label: 'Cần Thơ' },
  { value: 'Biên Hòa', label: 'Biên Hòa' },
  { value: 'Remote', label: 'Từ xa / Remote' },
];

// ─── Salary Currencies ────────────────────────────────────────────────────────

export const SALARY_CURRENCIES = [
  { value: 'VND', label: 'VND (Việt Nam Đồng)', prefix: '' },
  { value: 'USD', label: 'USD (US Dollar)', prefix: '$' },
  { value: 'EUR', label: 'EUR (Euro)', prefix: '€' },
];

