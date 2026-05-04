import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2,
  GraduationCap as GraduationIcon,
} from 'lucide-react';
import { cn } from '@/utils/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EDUCATION_LEVELS, EDUCATION_LEVEL_CONFIG } from '@/constants/candidateProfile';

const emptyEducationItem = () => ({
  school: '',
  degree: '',
  major: '',
  year: '',
  start_date: '',
  end_date: '',
  description: '',
});

// ============================================================================
// DESIGN SYSTEM COMPONENTS
// ============================================================================

/**
 * Education Badge - Visual badge for education level
 */
const EducationBadge = ({ level }) => {
  const config = EDUCATION_LEVEL_CONFIG[level] || {};
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
        config.color || 'bg-blue-50 text-blue-700'
      )}
    >
      <GraduationCap className="w-3 h-3" />
      {config.label || level}
    </span>
  );
};

/**
 * Timeline dot for education timeline
 */
const TimelineDot = ({ isLast }) => (
  <div className="flex flex-col items-center">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shadow-sm ring-4 ring-white">
      <BookOpen className="w-5 h-5 text-violet-600" />
    </div>
    {!isLast && (
      <div className="w-0.5 flex-1 bg-gradient-to-b from-violet-200 to-violet-100 mt-2" />
    )}
  </div>
);

/**
 * Education Card - Modern card display for education item
 */
const EducationCard = ({ item, onEdit, onDelete, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Timeline connector */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-violet-300 to-slate-200 -translate-x-1/2 hidden sm:block" />

      {/* Card */}
      <div
        className={cn(
          'relative flex gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border transition-all duration-300',
          isHovered
            ? 'bg-white border-violet-200 shadow-xl shadow-violet-100/50 -translate-y-1'
            : 'bg-white/80 border-slate-200/80 shadow-sm'
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              isHovered
                ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-200/50'
                : 'bg-gradient-to-br from-violet-100 to-violet-200'
            )}
          >
            <BookOpen
              className={cn(
                'w-6 h-6 transition-colors duration-300',
                isHovered ? 'text-white' : 'text-violet-600'
              )}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-base leading-tight truncate group-hover:text-violet-700 transition-colors">
                {item.school || 'Tên trường học'}
              </h4>
              <p className="text-sm text-slate-600 mt-0.5">
                {item.degree}
                {item.major && <span className="text-slate-400"> — </span>}
                {item.major && <span className="font-medium">{item.major}</span>}
              </p>
            </div>

            {/* Actions */}
            <div
              className={cn(
                'flex items-center gap-1 transition-all duration-300',
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              )}
            >
              <button
                type="button"
                onClick={onEdit}
                className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Year */}
            {item.year && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Tốt nghiệp {item.year}</span>
              </div>
            )}

            {/* Duration */}
            {(item.start_date || item.end_date) && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {item.start_date || '...'}
                  {' → '}
                  {item.end_date || 'Hiện tại'}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Hover highlight effect */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 h-1 rounded-b-2xl transition-all duration-300',
              isHovered ? 'bg-gradient-to-r from-violet-500 to-violet-400 opacity-20' : 'opacity-0'
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Empty State for Education
 */
const EmptyEducationState = ({ onAdd }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white py-12 px-6"
  >
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -top-16 -right-16 w-48 h-48 bg-violet-100/40 rounded-full blur-3xl"
      />
    </div>

    <div className="relative flex flex-col items-center text-center max-w-sm mx-auto">
      {/* Icon */}
      <motion.div
        className="relative mb-4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200/50">
          <GraduationCap className="w-10 h-10 text-violet-600" />
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
        </motion.div>
      </motion.div>

      <h4 className="text-lg font-bold text-slate-900 mb-2">Thêm thông tin học vấn</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        Học vấn là phần quan trọng giúp nhà tuyển dụng hiểu rõ hơn về nền tảng kiến thức của bạn.
      </p>

      {/* Feature list */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {['Tăng khả năng được liên hệ', 'Thể hiện kỹ năng chuyên môn', 'Được ưu tiên hơn'].map(
          (text, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium"
            >
              <CheckCircle2 className="w-3 h-3" />
              {text}
            </span>
          )
        )}
      </div>

      <Button
        type="button"
        onClick={onAdd}
        className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-violet-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5 mr-2" />
        Thêm học vấn
      </Button>
    </div>
  </motion.div>
);

/**
 * Education Form Dialog
 */
const EducationForm = ({ form, setForm, onSubmit, onCancel, editingId, saving, error }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-violet-200/50 bg-gradient-to-b from-violet-50/30 to-white p-6 shadow-lg shadow-violet-100/30">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            {editingId ? (
              <Edit2 className="w-5 h-5 text-violet-600" />
            ) : (
              <GraduationCap className="w-5 h-5 text-violet-600" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">
              {editingId ? 'Chỉnh sửa học vấn' : 'Thêm học vấn mới'}
            </h4>
            <p className="text-xs text-slate-500">Điền thông tin học vấn của bạn</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* School & Degree */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                Trường học <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.school}
                onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
                placeholder="VD: Đại học Bách Khoa TP.HCM"
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                Bằng cấp <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.degree}
                onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
                placeholder="VD: Cử nhân, Thạc sĩ..."
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
              />
            </div>
          </div>

          {/* Major & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Chuyên ngành</Label>
              <Input
                value={form.major}
                onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
                placeholder="VD: Công nghệ thông tin"
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Năm tốt nghiệp</Label>
              <Input
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                placeholder="VD: 2022"
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Từ tháng</Label>
              <Input
                type="month"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Đến tháng</Label>
              <Input
                type="month"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Mô tả thêm</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Thành tích học tập, hoạt động nổi bật, giải thưởng..."
              rows={3}
              className="resize-y rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-300"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-violet-200/50 transition-all duration-300"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EducationSection = ({ education = [], onAdd, onUpdate, onDelete, loading }) => {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyEducationItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      school: item.school || '',
      degree: item.degree || '',
      major: item.major || '',
      year: item.year || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      description: item.description || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.school.trim()) {
      setError('Vui lòng nhập tên trường');
      return;
    }
    if (!form.degree.trim()) {
      setError('Vui lòng nhập bằng cấp');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await onUpdate(editingId, form);
      } else {
        await onAdd(form);
      }
      setForm(emptyEducationItem());
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa mục học vấn này?')) {
      await onDelete(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyEducationItem());
    setError('');
  };

  const handleAddNew = () => {
    setShowForm(true);
    setEditingId(null);
    setForm(emptyEducationItem());
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200/50">
            <GraduationIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Học vấn</h3>
            <p className="text-sm text-slate-500">
              {education.length > 0
                ? `${education.length} mục ${education.length >= 2 ? '✓' : ''}`
                : 'Chưa có thông tin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-9 px-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            {expanded ? 'Thu gọn' : 'Mở rộng'}
          </Button>

          {education.length > 0 && (
            <Button
              type="button"
              onClick={handleAddNew}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-200/50 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Form */}
            <AnimatePresence>
              {showForm && (
                <EducationForm
                  form={form}
                  setForm={setForm}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  editingId={editingId}
                  saving={saving}
                  error={error}
                />
              )}
            </AnimatePresence>

            {/* List */}
            {education.length > 0 ? (
              <div className="relative space-y-4">
                {education.map((item, index) => (
                  <EducationCard
                    key={item.id}
                    item={item}
                    index={index}
                    onEdit={() => startEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            ) : (
              !showForm && <EmptyEducationState onAdd={handleAddNew} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EducationSection;
