import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock, MapPin, Monitor, Phone, Building2, X } from 'lucide-react';

const INTERVIEW_TYPES = [
  { value: 'online', label: 'Trực tuyến (Zoom / Google Meet)', icon: Monitor },
  { value: 'offline', label: 'Tại văn phòng', icon: Building2 },
  { value: 'phone', label: 'Qua điện thoại', icon: Phone },
];

/**
 * Dialog yêu cầu nhập thông tin lịch phỏng vấn trước khi
 * chuyển ứng viên sang cột "Lịch PV" (interview_scheduled).
 */
export default function InterviewScheduleDialog({
  applicantName,
  jobTitle,
  initialDate = '',
  onConfirm,
  onCancel,
}) {
  const [form, setForm] = useState({
    interview_type: 'online',
    scheduled_date: initialDate,
    scheduled_time: '',
    duration_minutes: 60,
    location: '',
    candidate_note: '',
  });
  const [errors, setErrors] = useState({});
  const submittingRef = useRef(false);

  function validate() {
    const errs = {};
    if (!form.scheduled_date) errs.scheduled_date = 'Vui lòng chọn ngày phỏng vấn';
    if (!form.scheduled_time) errs.scheduled_time = 'Vui lòng chọn giờ phỏng vấn';
    if (form.scheduled_date && form.scheduled_time) {
      const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}:00`);
      if (Number.isNaN(scheduledAt.getTime())) {
        errs.scheduled_time = 'Thời gian phỏng vấn không hợp lệ';
      } else if (scheduledAt.getTime() <= Date.now()) {
        errs.scheduled_time = 'Vui lòng chọn thời gian trong tương lai';
      }
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    submittingRef.current = true;
    try {
      const scheduled_at = new Date(
        `${form.scheduled_date}T${form.scheduled_time}:00`
      ).toISOString();
      await onConfirm({
        interview_type: form.interview_type,
        scheduled_at,
        duration_minutes: parseInt(form.duration_minutes, 10),
        location: form.location || null,
        candidate_note: form.candidate_note || null,
      });
    } finally {
      submittingRef.current = false;
    }
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              Sắp xếp lịch phỏng vấn
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {applicantName} — <span className="font-medium text-slate-700">{jobTitle}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Hình thức */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hình thức phỏng vấn *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('interview_type', value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all text-center text-xs font-medium ${
                    form.interview_type === value
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ngày & Giờ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Calendar size={13} className="inline mr-1 text-slate-400" />
                Ngày *
              </label>
              <input
                type="date"
                value={form.scheduled_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('scheduled_date', e.target.value)}
                className={`w-full rounded-xl border px-3 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.scheduled_date ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.scheduled_date && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduled_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Clock size={13} className="inline mr-1 text-slate-400" />
                Giờ *
              </label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => set('scheduled_time', e.target.value)}
                className={`w-full rounded-xl border px-3 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.scheduled_time ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.scheduled_time && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduled_time}</p>
              )}
            </div>
          </div>

          {/* Thời lượng & Địa điểm */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Thời lượng (phút)
              </label>
              <select
                value={form.duration_minutes}
                onChange={(e) => set('duration_minutes', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} phút
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <MapPin size={13} className="inline mr-1 text-slate-400" />
                {form.interview_type === 'online' ? 'Link Meet' : 'Địa chỉ'}
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder={
                  form.interview_type === 'online'
                    ? 'https://meet.google.com/...'
                    : 'Tầng 5, 123 Điện Biên Phủ...'
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Ghi chú cho ứng viên */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ghi chú gửi ứng viên <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={form.candidate_note}
              onChange={(e) => set('candidate_note', e.target.value)}
              rows={2}
              placeholder="Vd: Mang theo CV bản cứng, ăn mặc lịch sự..."
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingRef.current}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-lg shadow-emerald-500/20"
            >
              {submittingRef.current ? 'Đang lưu...' : 'Xác nhận lịch PV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

InterviewScheduleDialog.propTypes = {
  applicantName: PropTypes.string.isRequired,
  jobTitle: PropTypes.string.isRequired,
  initialDate: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
