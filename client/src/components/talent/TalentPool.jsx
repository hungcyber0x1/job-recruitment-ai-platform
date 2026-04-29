/**
 * TalentPoolLayout - Main layout for Candidate Pool Management
 * Professional recruitment interface with sidebar filters and candidate grid
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  TrendingUp,
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  Award,
  Zap,
  Target,
  Heart,
  Lightbulb,
  Check,
  UserPlus,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// DESIGN TOKENS - Consistent with design system
// ============================================================================
const colors = {
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

// ============================================================================
// MOCK DATA - Sample candidates
// ============================================================================
const MOCK_CANDIDATES = [
  {
    id: 1,
    name: 'Nguyễn Văn Minh',
    avatar: null,
    title: 'Lập trình viên full-stack cấp cao',
    experience: 6,
    salary: { min: 3500, max: 5000, currency: 'USD' },
    location: 'TP. Hồ Chí Minh',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker'],
    status: 'active',
    appliedDate: '2024-01-15',
    source: 'LinkedIn',
    rating: 4.8,
    availability: 'Sẵn sàng gia nhập ngay',
    highlights: ['Team lead 3 người', 'Tốt nghiệp FPT', 'IELTS 7.5'],
    email: 'minh.nguyen@email.com',
    phone: '+84 912 345 678',
  },
  {
    id: 2,
    name: 'Trần Thị Lan Anh',
    avatar: null,
    title: 'Kỹ sư AI/ML',
    experience: 4,
    salary: { min: 4000, max: 6000, currency: 'USD' },
    location: 'Hà Nội',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'LLM', 'RAG', 'MLOps'],
    status: 'active',
    appliedDate: '2024-01-18',
    source: 'GitHub',
    rating: 4.6,
    availability: 'Có thể bắt đầu sau 1 tháng',
    highlights: ['Đã công bố bài nghiên cứu', 'Chuyên gia Kaggle', 'Chứng chỉ Stanford'],
    email: 'lananh.tran@email.com',
    phone: '+84 987 654 321',
  },
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    avatar: null,
    title: 'Lập trình viên giao diện cấp cao',
    experience: 5,
    salary: { min: 3000, max: 4500, currency: 'USD' },
    location: 'Đà Nẵng',
    skills: ['Vue.js', 'React', 'TypeScript', 'TailwindCSS', 'GraphQL'],
    status: 'passive',
    appliedDate: '2024-01-20',
    source: 'Giới thiệu nội bộ',
    rating: 4.5,
    availability: 'Đang làm việc, cân nhắc cơ hội tốt',
    highlights: ['Hơn 200 đóng góp mã nguồn', 'Diễn giả tại VueConf', 'Cố vấn kỹ thuật'],
    email: 'nam.le@email.com',
    phone: '+84 912 345 679',
  },
  {
    id: 4,
    name: 'Phạm Quốc Khánh',
    avatar: null,
    title: 'Lập trình viên backend (Java)',
    experience: 7,
    salary: { min: 4000, max: 5500, currency: 'USD' },
    location: 'TP. Hồ Chí Minh',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Kafka'],
    status: 'active',
    appliedDate: '2024-01-22',
    source: 'VietnamWorks',
    rating: 4.9,
    availability: 'Sẵn sàng gia nhập ngay',
    highlights: ['Từng làm tại FPT', 'Có chứng chỉ AWS', 'Điều phối Scrum'],
    email: 'khanh.pham@email.com',
    phone: '+84 912 345 680',
  },
  {
    id: 5,
    name: 'Hoàng Thu Minh',
    avatar: null,
    title: 'Nhà thiết kế sản phẩm',
    experience: 4,
    salary: { min: 2500, max: 4000, currency: 'USD' },
    location: 'TP. Hồ Chí Minh',
    skills: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Research'],
    status: 'interviewed',
    appliedDate: '2024-01-10',
    source: 'Behance',
    rating: 4.7,
    availability: 'Sẵn sàng gia nhập ngay',
    highlights: ['Được giới thiệu trên Dribbble', 'Kinh nghiệm sản phẩm SaaS', 'Dẫn dắt thiết kế'],
    email: 'minh.hoang@email.com',
    phone: '+84 912 345 681',
  },
  {
    id: 6,
    name: 'Đặng Minh Tuấn',
    avatar: null,
    title: 'Kỹ sư DevOps',
    experience: 5,
    salary: { min: 3500, max: 5000, currency: 'USD' },
    location: 'Hà Nội',
    skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
    status: 'active',
    appliedDate: '2024-01-25',
    source: 'LinkedIn',
    rating: 4.4,
    availability: 'Có thể bắt đầu sau 2 tuần',
    highlights: ['Kiến trúc sư giải pháp AWS', 'Có chứng chỉ CKA', 'Diễn giả cộng đồng'],
    email: 'tuan.dang@email.com',
    phone: '+84 912 345 682',
  },
];

// Filter categories with options
const FILTER_CATEGORIES = [
  {
    id: 'skills',
    title: 'Kỹ năng chính',
    icon: Zap,
    options: [
      { id: 'frontend', label: 'Giao diện người dùng', count: 52 },
      { id: 'backend', label: 'Máy chủ', count: 48 },
      { id: 'fullstack', label: 'Phát triển full-stack', count: 38 },
      { id: 'ai-ml', label: 'AI/ML', count: 25 },
      { id: 'devops', label: 'DevOps', count: 18 },
      { id: 'mobile', label: 'Di động', count: 12 },
    ],
    multiSelect: true,
  },
  {
    id: 'experience',
    title: 'Kinh nghiệm',
    icon: Clock,
    options: [
      { id: '0-2', label: '0-2 năm', count: 22 },
      { id: '2-5', label: '2-5 năm', count: 45 },
      { id: '5-8', label: '5-8 năm', count: 35 },
      { id: '8+', label: '8+ năm', count: 18 },
    ],
    multiSelect: false,
  },
  {
    id: 'salary',
    title: 'Mức lương mong muốn',
    icon: DollarSign,
    options: [
      { id: '0-1500', label: 'Dưới $1,500', count: 15 },
      { id: '1500-3000', label: '$1,500 - $3,000', count: 35 },
      { id: '3000-5000', label: '$3,000 - $5,000', count: 42 },
      { id: '5000+', label: 'Trên $5,000', count: 28 },
    ],
    multiSelect: false,
  },
  {
    id: 'availability',
    title: 'Tính khả dụng',
    icon: CheckCircle2,
    options: [
      { id: 'immediately', label: 'Sẵn sàng ngay', count: 38 },
      { id: '2-weeks', label: 'Sau 2 tuần', count: 25 },
      { id: '1-month', label: 'Sau 1 tháng', count: 20 },
      { id: 'passive', label: 'Ứng viên thụ động', count: 37 },
    ],
    multiSelect: false,
  },
  {
    id: 'rating',
    title: 'Đánh giá',
    icon: Star,
    options: [
      { id: '4.5+', label: '4.5+ sao', count: 42 },
      { id: '4.0+', label: '4.0+ sao', count: 65 },
      { id: '3.5+', label: '3.5+ sao', count: 78 },
    ],
    multiSelect: false,
  },
];

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
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
    passive: { color: 'bg-amber-500', label: 'Thụ động', textColor: 'text-amber-600' },
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
const FilterSidebar = ({ isOpen, onClose, selectedFilters, onFilterChange }) => {
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
          {FILTER_CATEGORIES.map((category) => {
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
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
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
                          const isSelected = (selectedFilters[category.id] || []).includes(option.id);

                          return (
                            <label
                              key={option.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                                  ? 'bg-emerald-50 border border-emerald-200'
                                  : 'hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-slate-300'
                                  }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div
                                className={`flex-1 flex items-center gap-2 ${category.multiSelect ? '' : 'flex-row-reverse justify-between'
                                  }`}
                              >
                                <span
                                  className={`text-sm ${isSelected ? 'text-emerald-700 font-medium' : 'text-slate-600'
                                    }`}
                                >
                                  {option.label}
                                </span>
                                <span className={`text-xs ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`}>
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
                {candidate.experience} năm
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {candidate.location}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                ${candidate.salary.min / 1000}k - ${candidate.salary.max / 1000}k
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
            <span>{candidate.experience} năm kinh nghiệm</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{candidate.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>${candidate.salary.min / 1000}k - ${candidate.salary.max / 1000}k</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Ứng tuyển {candidate.appliedDate}</span>
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
          {candidate.highlights.slice(0, 2).map((highlight, idx) => (
            <span
              key={idx}
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
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); }}
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
                        <p className="font-medium text-slate-900">Ứng tuyển vị trí lập trình viên cấp cao</p>
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
                      <span className="font-medium text-slate-900">{candidate.experience} năm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Mức lương</span>
                      <span className="font-medium text-slate-900">
                        ${candidate.salary.min / 1000}k - ${candidate.salary.max / 1000}k
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Địa điểm</span>
                      <span className="font-medium text-slate-900">{candidate.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Đánh giá</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {candidate.rating}
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
                      <span className="text-slate-600">{candidate.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{candidate.phone}</span>
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
              className={`lg:hidden relative p-2.5 rounded-xl border transition-colors ${hasActiveFilters
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
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

  // Filter candidates based on search and filters
  const filteredCandidates = useMemo(() => {
    return MOCK_CANDIDATES.filter((candidate) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          candidate.name.toLowerCase().includes(query) ||
          candidate.title.toLowerCase().includes(query) ||
          candidate.skills.some((skill) => skill.toLowerCase().includes(query)) ||
          candidate.location.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [searchQuery, selectedFilters]);

  const handleViewDetail = (candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  };

  const hasActiveFilters = Object.values(selectedFilters).some((arr) => arr.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedFilters={selectedFilters}
        onFilterChange={setSelectedFilters}
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
        <div className="flex-1 p-6">
          {filteredCandidates.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters || searchQuery}
              onClearFilters={() => {
                setSelectedFilters({});
                setSearchQuery('');
              }}
            />
          ) : viewMode === 'grid' ? (
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
          ) : (
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
          )}
        </div>
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
