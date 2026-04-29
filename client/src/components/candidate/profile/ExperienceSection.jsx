import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { cn } from '@/utils/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const emptyExperienceItem = () => ({
  company: '',
  title: '',
  period: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
});

const ExperienceItemCard = ({ item, onEdit, onDelete }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-1 shrink-0 w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
          <Briefcase className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{item.title || 'Vị trí'}</p>
          <p className="text-sm text-slate-600 mt-0.5">{item.company || 'Công ty'}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.period && (
              <span className="text-xs text-slate-400 font-medium">{item.period}</span>
            )}
            {item.start_date && (
              <span className="text-xs text-slate-400">
                {item.start_date}{item.end_date ? ` — ${item.end_date}` : item.is_current ? ' — Hiện tại' : ''}
              </span>
            )}
            {item.is_current && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold">
                Hiện tại
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  </div>
);

const ExperienceSection = ({ experience = [], onAdd, onUpdate, onDelete, loading }) => {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyExperienceItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      company: item.company || '',
      title: item.title || '',
      period: item.period || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_current: item.is_current || false,
      description: item.description || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.company.trim()) {
      setError('Vui lòng nhập tên công ty');
      return;
    }
    if (!form.title.trim()) {
      setError('Vui lòng nhập vị trí công việc');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (form.is_current) {
        payload.end_date = null;
      }
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onAdd(payload);
      }
      setForm(emptyExperienceItem);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa kinh nghiệm làm việc này?')) {
      await onDelete(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyExperienceItem);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Kinh nghiệm làm việc</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {experience.length} mục
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 text-xs text-muted-foreground"
          >
            {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {expanded ? 'Thu gọn' : 'Mở rộng'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyExperienceItem()); setError(''); }}
            className="h-8 gap-1 rounded-lg border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" />
            Thêm kinh nghiệm
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Công ty *</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="VD: FPT Software, Viettel..."
                className="h-12 rounded-lg text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Vị trí *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="VD: Lập trình viên Full-stack"
                className="h-12 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Từ tháng</Label>
              <Input
                type="month"
                value={form.start_date}
                onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="h-12 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Đến tháng</Label>
              <Input
                type="month"
                value={form.end_date}
                onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                disabled={form.is_current}
                className={cn('h-12 rounded-lg text-sm', form.is_current && 'opacity-50')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="exp-current"
              checked={form.is_current}
              onCheckedChange={(checked) => setForm(f => ({ ...f, is_current: !!checked, end_date: checked ? '' : f.end_date }))}
            />
            <label htmlFor="exp-current" className="text-sm text-slate-700 cursor-pointer select-none font-medium">
              Tôi đang làm việc ở đây
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Mô tả công việc</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn gọn trách nhiệm và thành tích..."
              rows={3}
              className="resize-y rounded-lg text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
              className="h-8 gap-1 rounded-lg bg-violet-600 text-xs font-bold hover:bg-violet-700"
            >
              {saving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel} className="h-8 text-xs">
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {expanded && (
        experience.length > 0 ? (
          <div className="space-y-3">
            {experience.map((item) => (
              <ExperienceItemCard
                key={item.id}
                item={item}
                onEdit={() => startEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        ) : !showForm && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
            <p className="text-sm text-muted-foreground">Chưa có thông tin kinh nghiệm</p>
            <p className="text-xs text-muted-foreground mt-1">Nhấn "Thêm kinh nghiệm" để bắt đầu</p>
          </div>
        )
      )}
    </div>
  );
};

export default ExperienceSection;
