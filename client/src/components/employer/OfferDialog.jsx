import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Award, DollarSign, Calendar, AlignLeft, X } from 'lucide-react';

/**
 * Dialog nhập thông tin offer trước khi chuyển ứng viên sang cột "Offer".
 */
export default function OfferDialog({ applicantName, jobTitle, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    salary_offered: '',
    response_deadline: '',
    start_date: '',
    benefits: '',
    offer_notes: '',
  });
  const [errors, setErrors] = useState({});
  const submittingRef = useRef(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }

  function validate() {
    const nextErrors = {};
    const hasOfferDetail =
      form.salary_offered ||
      form.response_deadline ||
      form.start_date ||
      form.benefits.trim() ||
      form.offer_notes.trim();

    if (!hasOfferDetail) {
      nextErrors.form = 'Vui lòng nhập ít nhất một thông tin offer.';
    }

    if (form.salary_offered && Number(form.salary_offered) < 0) {
      nextErrors.salary_offered = 'Mức lương không hợp lệ.';
    }

    const today = new Date().toISOString().split('T')[0];
    if (form.response_deadline && form.response_deadline < today) {
      nextErrors.response_deadline = 'Hạn phản hồi phải từ hôm nay trở đi.';
    }
    if (form.start_date && form.start_date < today) {
      nextErrors.start_date = 'Ngày bắt đầu phải từ hôm nay trở đi.';
    }

    return nextErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submittingRef.current = true;
    try {
      await onConfirm({
        salary_offered: form.salary_offered ? parseInt(form.salary_offered, 10) : null,
        response_deadline: form.response_deadline || null,
        start_date: form.start_date || null,
        benefits: form.benefits || null,
        offer_notes: form.offer_notes || null,
      });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-emerald-600" />
              Gửi đề nghị tuyển dụng (Offer)
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
          {/* Mức lương */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <DollarSign size={13} className="inline mr-1 text-slate-400" />
              Mức lương đề nghị (VND){' '}
              <span className="text-slate-400 font-normal">— để trống nếu thỏa thuận</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.salary_offered}
                onChange={(e) => set('salary_offered', e.target.value)}
                min={0}
                step={500000}
                placeholder="Vd: 25000000"
                className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.salary_offered ? 'border-red-400' : 'border-slate-200'}`}
              />
              {form.salary_offered && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    form.salary_offered
                  )}
                </span>
              )}
            </div>
            {errors.salary_offered && (
              <p className="mt-1 text-xs text-red-500">{errors.salary_offered}</p>
            )}
          </div>

          {/* Hạn phản hồi & Ngày bắt đầu */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Calendar size={13} className="inline mr-1 text-slate-400" />
                Hạn phản hồi
              </label>
              <input
                type="date"
                value={form.response_deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('response_deadline', e.target.value)}
                className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.response_deadline ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.response_deadline && (
                <p className="mt-1 text-xs text-red-500">{errors.response_deadline}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Calendar size={13} className="inline mr-1 text-slate-400" />
                Ngày bắt đầu dự kiến
              </label>
              <input
                type="date"
                value={form.start_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('start_date', e.target.value)}
                className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.start_date ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>
              )}
            </div>
          </div>

          {/* Phúc lợi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Các phúc lợi kèm theo <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={form.benefits}
              onChange={(e) => set('benefits', e.target.value)}
              placeholder="Vd: Laptop, bảo hiểm sức khoẻ, 13 tháng lương..."
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <AlignLeft size={13} className="inline mr-1 text-slate-400" />
              Ghi chú gửi ứng viên <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={form.offer_notes}
              onChange={(e) => set('offer_notes', e.target.value)}
              rows={2}
              placeholder="Chi tiết thêm về điều kiện, quy trình onboarding..."
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          {errors.form && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {errors.form}
            </div>
          )}

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
              {submittingRef.current ? 'Đang gửi...' : '🎉 Gửi Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

OfferDialog.propTypes = {
  applicantName: PropTypes.string.isRequired,
  jobTitle: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
