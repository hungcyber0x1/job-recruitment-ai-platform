import React, { useState } from 'react';
import { DollarSign, MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/index';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  JOB_SEARCH_STATUS,
  JOB_SEARCH_STATUS_CONFIG,
  JOB_TYPES_LIST,
  VIETNAM_LOCATIONS,
  SALARY_CURRENCIES,
} from '@/constants/candidateProfile';

const MILLION_VND = 1000000;

const toInputSalary = (value, currency = 'VND') => {
  if (value === null || value === undefined || value === '') return '';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '';

  if (currency === 'VND') {
    return amount >= MILLION_VND ? Math.round(amount / MILLION_VND) : amount;
  }

  return amount;
};

const toPayloadSalary = (value, currency = 'VND') => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return currency === 'VND' ? amount * MILLION_VND : amount;
};

const getSalaryPlaceholder = (currency, boundary) => {
  if (currency === 'VND') return `${boundary} (triệu VND)`;
  return `${boundary} (${currency})`;
};

const JobPreferencesSection = ({
  job_search_status,
  expected_salary_min,
  expected_salary_max,
  salary_currency,
  preferred_job_types,
  preferred_locations,
  willing_to_relocate,
  onSave,
  loading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const initialCurrency = salary_currency || 'VND';
  const [form, setForm] = useState({
    job_search_status: job_search_status || JOB_SEARCH_STATUS.OPEN_TO_WORK,
    expected_salary_min: toInputSalary(expected_salary_min, initialCurrency),
    expected_salary_max: toInputSalary(expected_salary_max, initialCurrency),
    salary_currency: initialCurrency,
    preferred_job_types: preferred_job_types || [],
    preferred_locations: preferred_locations || [],
    willing_to_relocate: willing_to_relocate || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleJobType = (value) => {
    setForm((f) => ({
      ...f,
      preferred_job_types: f.preferred_job_types.includes(value)
        ? f.preferred_job_types.filter((v) => v !== value)
        : [...f.preferred_job_types, value],
    }));
    setSaved(false);
  };

  const toggleLocation = (value) => {
    setForm((f) => ({
      ...f,
      preferred_locations: f.preferred_locations.includes(value)
        ? f.preferred_locations.filter((v) => v !== value)
        : [...f.preferred_locations, value],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        job_search_status: form.job_search_status,
        expected_salary_min: toPayloadSalary(form.expected_salary_min, form.salary_currency),
        expected_salary_max: toPayloadSalary(form.expected_salary_max, form.salary_currency),
        salary_currency: form.salary_currency,
        preferred_job_types: form.preferred_job_types,
        preferred_locations: form.preferred_locations,
        willing_to_relocate: form.willing_to_relocate,
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Tùy chọn việc làm</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Giúp nhà tuyển dụng tìm thấy bạn</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-8 text-xs text-muted-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3 mr-1" />
          ) : (
            <ChevronDown className="h-3 w-3 mr-1" />
          )}
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-5">
          {/* Job Search Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              Trạng thái tìm việc
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(JOB_SEARCH_STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, job_search_status: key }));
                      setSaved(false);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all text-sm font-medium',
                      form.job_search_status === key
                        ? `${cfg.bg} ${cfg.text} border-current`
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              Mức lương mong muốn
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder={getSalaryPlaceholder(form.salary_currency, 'Từ')}
                value={form.expected_salary_min}
                onChange={(e) => {
                  setForm((f) => ({ ...f, expected_salary_min: e.target.value }));
                  setSaved(false);
                }}
                className="h-12 rounded-xl text-sm"
              />
              <span className="text-slate-400 text-sm shrink-0">—</span>
              <Input
                type="number"
                min={0}
                placeholder={getSalaryPlaceholder(form.salary_currency, 'Đến')}
                value={form.expected_salary_max}
                onChange={(e) => {
                  setForm((f) => ({ ...f, expected_salary_max: e.target.value }));
                  setSaved(false);
                }}
                className="h-12 rounded-xl text-sm"
              />
              <Select
                value={form.salary_currency}
                onValueChange={(v) => {
                  setForm((f) => ({ ...f, salary_currency: v }));
                  setSaved(false);
                }}
              >
                <SelectTrigger className="h-12 w-28 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Job Types */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              Loại hình công việc ưa thích
            </Label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES_LIST.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleJobType(type.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                    form.preferred_job_types.includes(type.value)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Locations */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              Địa điểm ưa thích
            </Label>
            <div className="flex flex-wrap gap-2">
              {VIETNAM_LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => toggleLocation(loc.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
                    form.preferred_locations.includes(loc.value)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Willing to Relocate */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Checkbox
              id="willing-relocate"
              checked={form.willing_to_relocate}
              onCheckedChange={(checked) => {
                setForm((f) => ({ ...f, willing_to_relocate: !!checked }));
                setSaved(false);
              }}
            />
            <label
              htmlFor="willing-relocate"
              className="text-sm text-slate-700 cursor-pointer select-none font-medium"
            >
              Sẵn sàng chuyển đổi địa điểm làm việc
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && (
              <span className="text-xs text-emerald-600 font-semibold animate-pulse">✓ Đã lưu</span>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-12 gap-2 rounded-xl bg-emerald-600 text-sm font-bold hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang lưu...
                </>
              ) : (
                'Lưu tùy chọn'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPreferencesSection;
