import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Clock, DollarSign, ChevronRight, Bookmark, Users } from 'lucide-react';
import { cn } from '@/utils';
import { getJobSalaryCardLabel, hasConcreteJobSalary } from '@/utils/jobSalary';

const RecommendedJobCard = ({ job, isApplied, isSaved, onSave, onApply }) => {
  const getJobTitle = (job) => job.title || job.job_title || 'Vị trí chưa xác định';
  const getCompanyName = (job) =>
    job.company_name || (job.company && job.company.name) || 'Công ty ẩn danh';
  const getLocation = (job) => job.location || job.work_location || 'Toàn quốc';
  const salaryDisplay = getJobSalaryCardLabel(job);
  const hasConcreteSalary = hasConcreteJobSalary(job);
  const vacancies = Number.parseInt(job.vacancies, 10);
  const vacanciesLabel = Number.isFinite(vacancies) && vacancies > 0 ? `${vacancies} người` : null;

  return (
    <Card className="group overflow-hidden rounded-[32px] border-border/40 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={getCompanyName(job)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-slate-200" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {getJobTitle(job)}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <span className="hover:text-primary transition-colors cursor-pointer">
                  {getCompanyName(job)}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-300" />
                  {getLocation(job)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs',
                    hasConcreteSalary
                      ? 'border-emerald-100 bg-emerald-50 font-bold text-emerald-700'
                      : 'border-slate-100 bg-slate-50 font-semibold text-slate-600'
                  )}
                >
                  <DollarSign
                    size={14}
                    className={hasConcreteSalary ? 'text-emerald-500' : 'text-slate-400'}
                  />
                  {salaryDisplay}
                </div>
                {vacanciesLabel && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100">
                    <Users size={14} className="text-sky-500" />
                    Tuyển {vacanciesLabel}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50/50 px-3 py-1.5 rounded-xl">
                  <Clock size={14} />
                  {job.created_at ? '2 ngày trước' : 'Mới đăng'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end gap-4 border-t sm:border-none pt-4 sm:pt-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-11 w-11 rounded-xl transition-all duration-300',
                  isSaved
                    ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                )}
                onClick={onSave}
              >
                <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
              </Button>
              <Button
                className="h-11 rounded-xl bg-slate-900 px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 group/btn"
                onClick={onApply}
                disabled={isApplied}
              >
                {isApplied ? 'Đã nộp' : 'Chi tiết'}
                <ChevronRight
                  size={16}
                  className="ml-1 group-hover/btn:translate-x-1 transition-transform"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags section */}
      <div className="bg-slate-50/50 px-6 py-4 flex flex-wrap gap-2 border-t border-border/10">
        {job.job_type && (
          <span className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {job.job_type}
          </span>
        )}
        <span className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Hỗ trợ làm từ xa
        </span>
        <span className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Urgent Hire
        </span>
      </div>
    </Card>
  );
};

export default RecommendedJobCard;
