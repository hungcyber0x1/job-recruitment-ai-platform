/**
 * TalentPoolLayout - Main layout for Candidate Pool Management
 * Professional recruitment interface with sidebar filters and candidate grid
 */
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
  Star,
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  Award,
  Zap,
  Check,
  UserPlus,
  Download,
  MoreHorizontal,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react';
import { employerCandidateService } from '../../services';

// ============================================================================
// API DATA NORMALIZATION
// ============================================================================
const PAGE_SIZE = 50;

const STATUS_LABELS = {
  actively_looking: 'Đang tìm việc',
  open_to_work: 'Sẵn sàng trao đổi',
  employed: 'Đang đi làm',
  not_looking: 'Chưa tìm việc',
};

const toSalaryNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

const formatSalaryLabel = (candidate = {}) => {
  const min = toSalaryNumber(candidate.expected_salary_min);
  const max = toSalaryNumber(candidate.expected_salary_max);
  const currency = candidate.salary_currency || 'VND';

  if (min === null && max === null) return 'Chưa cập nhật';

  if (currency === 'VND') {
    const compact = (value) => {
      if (value === null) return null;
      if (value >= 1000000) return `${Math.round(value / 1000000)} triệu`;
      return `${formatNumber(value)} VND`;
    };

    const compactMin = compact(min);
    const compactMax = compact(max);
    if (compactMin && compactMax) return `${compactMin} - ${compactMax}`;
    if (compactMin) return `Từ ${compactMin}`;
    return `Đến ${compactMax}`;
  }

  if (min !== null && max !== null)
    return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
  if (min !== null) return `Từ ${formatNumber(min)} ${currency}`;
  return `Đến ${formatNumber(max)} ${currency}`;
};

const formatDateLabel = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const mapStatus = (status) => {
  if (status === 'actively_looking') return 'active';
  if (status === 'open_to_work') return 'passive';
  if (status === 'employed') return 'employed';
  if (status === 'not_looking') return 'not_looking';
  return 'active';
};

const buildHighlights = (candidate = {}) => {
  const highlights = [];
  if (candidate.education_level) highlights.push(`Học vấn: ${candidate.education_level}`);
  if (Number(candidate.skill_count || 0) > 0)
    highlights.push(`${candidate.skill_count} kỹ năng đã cập nhật`);
  if (Number(candidate.application_count || 0) > 0)
    highlights.push(`${candidate.application_count} lượt ứng tuyển`);
  if (candidate.bio) highlights.push(String(candidate.bio).slice(0, 90));
  return highlights;
};

const normalizeCandidate = (candidate = {}) => ({
  ...candidate,
  name: candidate.name || 'Ứng viên đang cập nhật',
  title: candidate.role || candidate.current_job_title || 'Vị trí đang cập nhật',
  experience: Number(candidate.experience_years || 0),
  experienceLabel:
    Number(candidate.experience_years || 0) > 0
      ? `${candidate.experience_years} năm`
      : 'Mới tốt nghiệp',
  salaryLabel: formatSalaryLabel(candidate),
  location: candidate.location || 'Linh hoạt',
  skills: Array.isArray(candidate.skills) ? candidate.skills : [],
  status: mapStatus(candidate.job_search_status),
  appliedDate: formatDateLabel(
    candidate.last_active_at || candidate.updated_at || candidate.created_at
  ),
  updatedLabel: formatDateLabel(
    candidate.updated_at || candidate.last_active_at || candidate.created_at
  ),
  activityLabel: 'Cập nhật',
  source: 'Hồ sơ công khai',
  availability: STATUS_LABELS[candidate.job_search_status] || 'Hồ sơ công khai',
  highlights: buildHighlights(candidate),
  emailLabel: candidate.contact_unlocked && candidate.email ? candidate.email : 'Chưa công khai',
  phoneLabel: candidate.contact_unlocked && candidate.phone ? candidate.phone : 'Chưa công khai',
  skillCountLabel: `${Number(candidate.skill_count || candidate.skills?.length || 0)} kỹ năng`,
  timelineTitle: `Hồ sơ ${candidate.role || candidate.current_job_title || 'ứng viên'} được cập nhật`,
});

const getSalaryComparable = (candidate = {}) => {
  const values = [
    toSalaryNumber(candidate.expected_salary_min),
    toSalaryNumber(candidate.expected_salary_max),
  ].filter((value) => value !== null);
  if (!values.length) return null;
  const value = Math.max(...values);
  return candidate.salary_currency === 'USD' ? value * 25000 : value;
};

const SKILL_FILTER_TERMS = {
  frontend: ['frontend', 'giao diện', 'react', 'vue', 'javascript', 'typescript', 'tailwind', 'ui'],
  backend: ['backend', 'máy chủ', 'node', 'java', 'spring', 'python', 'go', 'api', 'sql'],
  fullstack: ['full-stack', 'fullstack', 'full stack', 'react', 'node'],
  'ai-ml': ['ai', 'ml', 'machine learning', 'data', 'python', 'tensorflow', 'pytorch', 'llm'],
  devops: ['devops', 'aws', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'cloud'],
  mobile: ['mobile', 'di động', 'react native', 'flutter', 'android', 'ios'],
};

const FILTER_CATEGORIES = [
  {
    id: 'skills',
    title: 'Kỹ năng chính',
    icon: Zap,
    options: [
      { id: 'frontend', label: 'Giao diện người dùng' },
      { id: 'backend', label: 'Máy chủ' },
      { id: 'fullstack', label: 'Phát triển full-stack' },
      { id: 'ai-ml', label: 'AI/ML' },
      { id: 'devops', label: 'DevOps' },
      { id: 'mobile', label: 'Di động' },
    ],
    multiSelect: true,
  },
  {
    id: 'experience',
    title: 'Kinh nghiệm',
    icon: Clock,
    options: [
      { id: '0-2', label: '0-2 năm' },
      { id: '2-5', label: '2-5 năm' },
      { id: '5-8', label: '5-8 năm' },
      { id: '8+', label: '8+ năm' },
    ],
    multiSelect: false,
  },
  {
    id: 'salary',
    title: 'Mức lương mong muốn',
    icon: DollarSign,
    options: [
      { id: 'lt20m', label: 'Dưới 20 triệu' },
      { id: '20m-40m', label: '20 - 40 triệu' },
      { id: '40m-80m', label: '40 - 80 triệu' },
      { id: 'gt80m', label: 'Trên 80 triệu' },
    ],
    multiSelect: false,
  },
  {
    id: 'availability',
    title: 'Tính khả dụng',
    icon: CheckCircle2,
    options: [
      { id: 'actively_looking', label: 'Đang tìm việc' },
      { id: 'open_to_work', label: 'Sẵn sàng trao đổi' },
      { id: 'employed', label: 'Đang đi làm' },
      { id: 'not_looking', label: 'Chưa tìm việc' },
    ],
    multiSelect: false,
  },
  {
    id: 'profile',
    title: 'Mức độ hồ sơ',
    icon: Star,
    options: [
      { id: 'skill-rich', label: 'Đầy đủ kỹ năng' },
      { id: 'has-resume', label: 'Có CV' },
      { id: 'experienced', label: 'Có kinh nghiệm' },
    ],
    multiSelect: false,
  },
];

const candidateSearchText = (candidate = {}) =>
  [
    candidate.name,
    candidate.title,
    candidate.location,
    candidate.availability,
    ...(candidate.skills || []),
  ]
    .join(' ')
    .toLowerCase();

const matchesSkillFilter = (candidate, filterId) => {
  const terms = SKILL_FILTER_TERMS[filterId] || [];
  const text = candidateSearchText(candidate);
  return terms.some((term) => text.includes(term));
};

const matchesExperienceFilter = (candidate, filterId) => {
  const years = Number(candidate.experience || 0);
  if (filterId === '0-2') return years >= 0 && years <= 2;
  if (filterId === '2-5') return years >= 2 && years <= 5;
  if (filterId === '5-8') return years >= 5 && years <= 8;
  if (filterId === '8+') return years >= 8;
  return true;
};

const matchesSalaryFilter = (candidate, filterId) => {
  const salary = getSalaryComparable(candidate);
  if (salary === null) return false;
  if (filterId === 'lt20m') return salary < 20000000;
  if (filterId === '20m-40m') return salary >= 20000000 && salary <= 40000000;
  if (filterId === '40m-80m') return salary >= 40000000 && salary <= 80000000;
  if (filterId === 'gt80m') return salary > 80000000;
  return true;
};

const matchesProfileFilter = (candidate, filterId) => {
  if (filterId === 'skill-rich')
    return Number(candidate.skill_count || candidate.skills?.length || 0) >= 4;
  if (filterId === 'has-resume') return Boolean(candidate.resume_url);
  if (filterId === 'experienced') return Number(candidate.experience || 0) > 0;
  return true;
};

const matchesCandidateFilters = (candidate, selectedFilters = {}) => {
  const skillFilters = selectedFilters.skills || [];
  if (
    skillFilters.length &&
    !skillFilters.some((filterId) => matchesSkillFilter(candidate, filterId))
  )
    return false;

  const experienceFilters = selectedFilters.experience || [];
  if (
    experienceFilters.length &&
    !experienceFilters.some((filterId) => matchesExperienceFilter(candidate, filterId))
  )
    return false;

  const salaryFilters = selectedFilters.salary || [];
  if (
    salaryFilters.length &&
    !salaryFilters.some((filterId) => matchesSalaryFilter(candidate, filterId))
  )
    return false;

  const availabilityFilters = selectedFilters.availability || [];
  if (availabilityFilters.length && !availabilityFilters.includes(candidate.job_search_status))
    return false;

  const profileFilters = selectedFilters.profile || [];
  if (
    profileFilters.length &&
    !profileFilters.some((filterId) => matchesProfileFilter(candidate, filterId))
  )
    return false;

  return true;
};

const buildFilterCategories = (candidates = []) => {
  const countFor = (categoryId, optionId) =>
    candidates.filter((candidate) =>
      matchesCandidateFilters(candidate, { [categoryId]: [optionId] })
    ).length;

  return FILTER_CATEGORIES.map((category) => ({
    ...category,
    options: category.options.map((option) => ({
      ...option,
      count: countFor(category.id, option.id),
    })),
  }));
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Skill Badge - Display individual skills
 */
const SkillBadge = ({ skill, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {skill}
    </span>
  );
};

/**
 * Avatar Component - User avatar with fallback initials
 */
const Avatar = ({ name, size = 'md', className = '' }) => {
  const getInitials = (n) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const palette = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];
  const bg = palette[name.charCodeAt(0) % palette.length];

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

/**
 * Status Indicator - Visual status for candidate
 */
const StatusIndicator = ({ status }) => {
  const statusConfig = {
    active: { color: 'bg-emerald-500', label: 'Đang tìm việc', textColor: 'text-emerald-600' },
    passive: { color: 'bg-amber-500', label: 'Sẵn sàng trao đổi', textColor: 'text-amber-600' },
    employed: { color: 'bg-blue-500', label: 'Đang đi làm', textColor: 'text-blue-600' },
    not_looking: { color: 'bg-slate-500', label: 'Chưa tìm việc', textColor: 'text-slate-600' },
    interviewed: { color: 'bg-blue-500', label: 'Đã phỏng vấn', textColor: 'text-blue-600' },
    hired: { color: 'bg-purple-500', label: 'Đã tuyển', textColor: 'text-purple-600' },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

/**
 * FilterSidebar - Left sidebar for filtering candidates
 */
const FilterSidebar = ({
  isOpen,
  onClose,
  selectedFilters,
  onFilterChange,
  filterCategories = FILTER_CATEGORIES,
}) => {
  const [expandedSections, setExpandedSections] = useState(
    FILTER_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleOptionToggle = (categoryId, optionId, isMultiSelect) => {
    const currentSelection = selectedFilters[categoryId] || [];

    if (isMultiSelect) {
      const newSelection = currentSelection.includes(optionId)
        ? currentSelection.filter((id) => id !== optionId)
        : [...currentSelection, optionId];

      onFilterChange({ ...selectedFilters, [categoryId]: newSelection });
    } else {
      const newSelection = currentSelection.includes(optionId) ? [] : [optionId];
      onFilterChange({ ...selectedFilters, [categoryId]: newSelection });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed lg:static left-0 top-0 h-full w-80 bg-white border-r border-slate-200 z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Bộ lọc</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Clear filters */}
        {Object.values(selectedFilters).some((arr) => arr.length > 0) && (
          <div className="px-4 py-3 border-b border-slate-200">
            <button
              onClick={() => onFilterChange({})}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Filter sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {filterCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedSections[category.id];

            return (
              <div key={category.id} className="space-y-3">
                <button
                  onClick={() => toggleSection(category.id)}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {category.title}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {category.options.map((option) => {
                          const isSelected = (selectedFilters[category.id] || []).includes(
                            option.id
                          );

                          return (
                            <label
                              key={option.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50 border border-emerald-200'
                                  : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div
                                className={`flex-1 flex items-center gap-2 ${
                                  category.multiSelect ? '' : 'flex-row-reverse justify-between'
                                }`}
                              >
                                <span
                                  className={`text-sm ${
                                    isSelected ? 'text-emerald-700 font-medium' : 'text-slate-600'
                                  }`}
                                >
                                  {option.label}
                                </span>
                                <span
                                  className={`text-xs ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`}
                                >
                                  {option.count}
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleOptionToggle(category.id, option.id, category.multiSelect)
                                }
                                className="sr-only"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            {Object.values(selectedFilters).flat().length > 0
              ? `Đã chọn ${Object.values(selectedFilters).flat().length} bộ lọc`
              : 'Chọn bộ lọc để tìm ứng viên'}
          </p>
        </div>
      </motion.aside>
    </>
  );
};

/**
 * CandidateCard - Professional candidate display card
 */
const CandidateCard = ({ candidate, onViewDetail, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 cursor-pointer"
        onClick={() => onViewDetail(candidate)}
      >
        <div className="flex items-center gap-4">
          <Avatar name={candidate.name} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">{candidate.name}</h3>
              <StatusIndicator status={candidate.status} />
            </div>
            <p className="text-sm text-slate-600 mb-2">{candidate.title}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {candidate.experienceLabel}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {candidate.location}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {candidate.salaryLabel}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2">
            {candidate.skills.slice(0, 3).map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
            {candidate.skills.length > 3 && (
              <span className="text-xs text-slate-400">+{candidate.skills.length - 3}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Mail className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Phone className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer group"
      onClick={() => onViewDetail(candidate)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={candidate.name} size="lg" />
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {candidate.name}
              </h3>
              <p className="text-sm text-slate-500">{candidate.title}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span>{candidate.experienceLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{candidate.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>{candidate.salaryLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {candidate.activityLabel} {candidate.appliedDate}
            </span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.skills.slice(0, 4).map((skill) => (
            <SkillBadge key={skill} skill={skill} variant="primary" />
          ))}
          {candidate.skills.length > 4 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              +{candidate.skills.length - 4}
            </span>
          )}
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2 mb-4">
          {candidate.highlights.slice(0, 2).map((highlight) => (
            <span
              key={highlight}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-xs text-slate-600"
            >
              <Award className="w-3 h-3 text-emerald-500" />
              {highlight}
            </span>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Star className="w-4 h-4" />
            </button>
          </div>
          <StatusIndicator status={candidate.status} />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * CandidateDetailModal - Detailed candidate view modal
 */
const CandidateDetailModal = ({ candidate, isOpen, onClose }) => {
  if (!candidate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[900px] lg:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <Avatar name={candidate.name} size="xl" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{candidate.name}</h2>
                  <p className="text-emerald-100 text-lg">{candidate.title}</p>
                </div>
                <StatusIndicator status={candidate.status} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left column - Main info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Skills */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      Kỹ năng
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} variant="primary" />
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-500" />
                      Điểm nổi bật
                    </h3>
                    <div className="space-y-2">
                      {candidate.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Dòng thời gian
                    </h3>
                    <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-6">
                      <div className="relative">
                        <div className="absolute -left-8 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white" />
                        <p className="font-medium text-slate-900">{candidate.timelineTitle}</p>
                        <p className="text-sm text-slate-500">{candidate.appliedDate}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-8 w-4 h-4 rounded-full bg-emerald-200 border-4 border-white" />
                        <p className="font-medium text-slate-900">Hồ sơ được duyệt</p>
                        <p className="text-sm text-slate-500">5 ngày sau</p>
                      </div>
                      {candidate.status === 'interviewed' && (
                        <div className="relative">
                          <div className="absolute -left-8 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                          <p className="font-medium text-slate-900">Phỏng vấn vòng 1</p>
                          <p className="text-sm text-slate-500">2 ngày trước</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column - Quick info */}
                <div className="space-y-4">
                  {/* Quick stats */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Kinh nghiệm</span>
                      <span className="font-medium text-slate-900">
                        {candidate.experienceLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Mức lương</span>
                      <span className="font-medium text-slate-900">{candidate.salaryLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Địa điểm</span>
                      <span className="font-medium text-slate-900">{candidate.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Đánh giá</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {candidate.skillCountLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Nguồn</span>
                      <span className="font-medium text-slate-900">{candidate.source}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Tính khả dụng</span>
                      <span className="font-medium text-emerald-600">{candidate.availability}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-slate-900">Liên hệ</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{candidate.emailLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{candidate.phoneLabel}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                      <UserPlus className="w-4 h-4" />
                      Mời phỏng vấn
                    </button>
                    <button className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                      <Mail className="w-4 h-4" />
                      Gửi tin nhắn
                    </button>
                    <button className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 border border-slate-200 transition-colors">
                      <Download className="w-4 h-4" />
                      Tải CV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * TalentPoolHeader - Top header with search and actions
 */
const TalentPoolHeader = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalCount,
  selectedCount,
  onOpenFilter,
  hasActiveFilters,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm ứng viên theo tên, kỹ năng, vị trí..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenFilter}
              className={`lg:hidden relative p-2.5 rounded-xl border transition-colors ${
                hasActiveFilters
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Xuất dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <span className="text-slate-600">
            <span className="font-semibold text-slate-900">{totalCount}</span> ứng viên
          </span>
          {selectedCount > 0 && (
            <span className="text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              {selectedCount} được chọn
            </span>
          )}
          {hasActiveFilters && (
            <span className="text-slate-500">
              <Filter className="w-4 h-4 inline mr-1" />
              Bộ lọc đang áp dụng
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * EmptyState - Display when no candidates match filters
 */
const EmptyState = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Users className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Không tìm thấy ứng viên</h3>
      <p className="text-slate-500 text-center mb-6 max-w-md">
        {hasFilters
          ? 'Không có ứng viên nào phù hợp với bộ lọc hiện tại. Thử điều chỉnh các tiêu chí tìm kiếm.'
          : 'Chưa có ứng viên nào trong hồ sơ. Danh sách sẽ được cập nhật khi có ứng viên ứng tuyển.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

/**
 * Main TalentPool Component - Integration of all components
 */
const TalentPool = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchCandidates = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await employerCandidateService.searchCandidates({
          page: 1,
          limit: PAGE_SIZE,
          sort: 'recent',
        });
        if (cancelled) return;

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCandidates(rows);
      } catch (fetchError) {
        if (cancelled) return;
        console.error('Failed to load talent pool candidates:', fetchError);
        setCandidates([]);
        setError('Không tải được danh sách ứng viên từ API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedCandidates = useMemo(() => candidates.map(normalizeCandidate), [candidates]);
  const filterCategories = useMemo(
    () => buildFilterCategories(normalizedCandidates),
    [normalizedCandidates]
  );

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return normalizedCandidates.filter((candidate) => {
      if (query && !candidateSearchText(candidate).includes(query)) return false;
      return matchesCandidateFilters(candidate, selectedFilters);
    });
  }, [normalizedCandidates, searchQuery, selectedFilters]);

  const handleViewDetail = (candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  };

  const hasActiveFilters = Object.values(selectedFilters).some((arr) => arr.length > 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 px-4 text-center text-sm font-semibold text-red-600">
          <AlertCircle className="mr-2 h-5 w-5" />
          {error}
        </div>
      );
    }

    if (filteredCandidates.length === 0) {
      return (
        <EmptyState
          hasFilters={hasActiveFilters || searchQuery}
          onClearFilters={() => {
            setSelectedFilters({});
            setSearchQuery('');
          }}
        />
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              viewMode={viewMode}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            viewMode={viewMode}
            onViewDetail={handleViewDetail}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
        filterCategories={filterCategories}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <TalentPoolHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={filteredCandidates.length}
          selectedCount={0}
          onOpenFilter={() => setIsFilterOpen(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Content */}
        <div className="flex-1 p-6">{renderContent()}</div>
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default TalentPool;
