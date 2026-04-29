import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SkillBadge from './SkillBadge';
import {
  PROFICIENCY_LEVELS,
  PROFICIENCY_CONFIG,
} from '@/constants/candidateProfile';

const emptySkill = {
  skill_id: null,
  name: '',
  proficiency_level: PROFICIENCY_LEVELS.INTERMEDIATE,
  years_experience: 0,
  is_primary: false,
};

const getSkillId = (skill) => skill?.skill_id ?? skill?.id ?? null;

const getSkillKey = (skill, index) => {
  const skillId = getSkillId(skill);
  if (skillId !== null && skillId !== undefined) {
    return `skill-${skillId}`;
  }

  const fallbackName = String(skill?.name || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `skill-${fallbackName}-${index}`;
};

const SkillsSection = ({ skills = [], onAdd, onUpdate, onRemove, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySkill);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTogglePrimary = async (skill) => {
    const skillId = getSkillId(skill);
    if (!onUpdate || skillId === null || skillId === undefined) {
      return;
    }

    await onUpdate(skillId, { is_primary: !skill.is_primary });
  };

  const handleAddSkill = async () => {
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên kỹ năng');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onAdd({
        name: form.name.trim(),
        proficiency_level: form.proficiency_level,
        years_experience: Number(form.years_experience) || 0,
        is_primary: form.is_primary,
      });
      setForm(emptySkill);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thêm kỹ năng');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skill) => {
    const skillId = getSkillId(skill);
    if (!onRemove || skillId === null || skillId === undefined) {
      return;
    }

    if (window.confirm(`Xóa kỹ năng "${skill.name}"?`)) {
      await onRemove(skillId);
    }
  };

  const primaryCount = skills.filter((skill) => skill.is_primary).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Kỹ năng chuyên môn</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {skills.length} kỹ năng
            {primaryCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                <Star className="h-3 w-3 fill-current" />
                {primaryCount} kỹ năng chính
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="h-8 text-xs text-muted-foreground"
          >
            {expanded ? (
              <ChevronUp className="mr-1 h-3 w-3" />
            ) : (
              <ChevronDown className="mr-1 h-3 w-3" />
            )}
            {expanded ? 'Thu gọn' : 'Mở rộng'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowForm((prev) => !prev);
              setError('');
            }}
            className="h-8 gap-1 rounded-lg border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
          >
            <Plus className="h-3 w-3" />
            Thêm kỹ năng
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Tên kỹ năng</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="VD: React, Node.js, Python..."
                className="h-12 rounded-lg text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Trình độ</Label>
              <Select
                value={form.proficiency_level}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, proficiency_level: value }))
                }
              >
                <SelectTrigger className="h-12 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROFICIENCY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Số năm kinh nghiệm
              </Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={form.years_experience}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    years_experience: Number(event.target.value),
                  }))
                }
                className="h-12 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skill-primary"
              checked={form.is_primary}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="skill-primary"
              className="cursor-pointer select-none text-sm text-slate-700"
            >
              Đánh dấu là kỹ năng chính
            </label>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleAddSkill}
              disabled={saving}
              className="h-8 gap-1 rounded-lg bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
            >
              {saving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Thêm
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setForm(emptySkill);
                setError('');
              }}
              className="h-8 text-xs"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {(expanded || skills.length <= 8) ? (
        skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => {
              const hasValidSkillId =
                getSkillId(skill) !== null && getSkillId(skill) !== undefined;

              return (
                <SkillBadge
                  key={getSkillKey(skill, index)}
                  name={skill.name}
                  proficiency_level={skill.proficiency_level}
                  years_experience={skill.years_experience}
                  is_primary={skill.is_primary}
                  onRemove={loading ? undefined : () => handleRemoveSkill(skill)}
                  onEdit={
                    onUpdate && !loading && hasValidSkillId
                      ? () => handleTogglePrimary(skill)
                      : undefined
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
            <p className="text-sm text-muted-foreground">Chưa có kỹ năng nào</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nhấn &quot;Thêm kỹ năng&quot; để bắt đầu
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 8).map((skill, index) => (
            <SkillBadge
              key={getSkillKey(skill, index)}
              name={skill.name}
              proficiency_level={skill.proficiency_level}
              years_experience={skill.years_experience}
              is_primary={skill.is_primary}
            />
          ))}

          {skills.length > 8 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              +{skills.length - 8} kỹ năng khác
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
