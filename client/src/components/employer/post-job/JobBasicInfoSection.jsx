import React from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  MapPin,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Input } from '../../common';

const EDUCATION_OPTIONS = [
  { value: 'any', label: 'Khong bat buoc' },
  { value: 'high_school', label: 'Trung hoc pho thong' },
  { value: 'college', label: 'Cao dang' },
  { value: 'bachelor', label: 'Cu nhan' },
  { value: 'master', label: 'Thac si' },
  { value: 'phd', label: 'Tien si' },
  { value: 'other', label: 'Khac' },
];

const selectClassName =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300';

function FieldLabel({ children }) {
  return <label className="text-sm font-semibold text-slate-700">{children}</label>;
}

function SectionHeader({ icon: Icon, eyebrow, title, description, insight }) {
  return (
    <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-5 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        {insight ? (
          <div className="max-w-sm rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Goi y
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80">{insight}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const JobBasicInfoSection = ({ formData, jobTypes, onChange, today }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
    >
      <SectionHeader
        icon={FileText}
        eyebrow="Nen tang vi tri"
        title="Thong tin co ban"
        description="Quy tu cac tin hieu cot loi de ung vien hieu nhanh vai tro, dia diem va khung dieu kien tuyen dung."
        insight="Dia diem ro rang, khoang luong minh bach va dieu kien dau vao thuc te thuong giup ho so ve dung nhu cau hon."
      />

      <div className="space-y-6 px-6 py-6 sm:px-7">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
            <Input
              label="Tinh/Thanh pho"
              name="location"
              value={formData.location}
              onChange={onChange}
              required
              placeholder="TP. Ho Chi Minh"
              icon={MapPin}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
            <Input
              label="Dia chi chi tiet"
              name="address"
              value={formData.address}
              onChange={onChange}
              placeholder="Vi du: Tang 15, toa nha Bitexco, 2 Hai Trieu, Quan 1"
              icon={Home}
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm shadow-slate-950/[0.03]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Dai ngo
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-950">Muc luong du kien</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Khoang luong ro rang giup ung vien danh gia nhanh muc do phu hop va tang ty le ho
                  so dung nhu cau.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <input
              name="salaryMin"
              value={formData.salaryMin}
              onChange={onChange}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Luong toi thieu"
            />
            <input
              name="salaryMax"
              value={formData.salaryMax}
              onChange={onChange}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Luong toi da"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
              <Users className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                name="vacancies"
                type="number"
                value={formData.vacancies}
                onChange={onChange}
                min="1"
                max="9999"
                placeholder="So luong tuyen"
                className="h-12 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
              <span className="text-sm text-slate-400">nguoi</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Cho phep thuong luong luong</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Bat khi chua muon cong khai dai luong co dinh.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newVal = !formData.salaryNegotiable;
                onChange({ target: { name: 'salaryNegotiable', value: newVal } });
              }}
              className={`ml-auto inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors ${
                formData.salaryNegotiable
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${formData.salaryNegotiable ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
              <span>{formData.salaryNegotiable ? 'Dang bat' : 'Dang tat'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
            <div className="space-y-2">
              <FieldLabel>Han nop ho so</FieldLabel>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={onChange}
                  min={today}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
            <div className="space-y-2">
              <FieldLabel>Hoc van yeu cau</FieldLabel>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  name="education"
                  value={formData.education}
                  onChange={onChange}
                  className={`${selectClassName} pl-10`}
                >
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]">
            <div className="space-y-2">
              <FieldLabel>Loai hinh lam viec</FieldLabel>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={onChange}
                  className={`${selectClassName} pl-10`}
                >
                  {jobTypes.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default JobBasicInfoSection;
