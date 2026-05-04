import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Trash2,
  MoreHorizontal,
  Briefcase,
  MapPin,
  Clock,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import AdminJobStatusBadge from './AdminJobStatusBadge';

const isTruthyFlag = (value) =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

const formatSalary = (job) => {
  if (isTruthyFlag(job.salary_negotiable)) return 'Thỏa thuận';
  if (!job.salary_min && !job.salary_max) return 'Thỏa thuận';
  const formatMoney = (value) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  if (job.salary_min && job.salary_max)
    return `${formatMoney(job.salary_min)} - ${formatMoney(job.salary_max)}`;
  if (job.salary_min) return `Từ ${formatMoney(job.salary_min)}`;
  return `Đến ${formatMoney(job.salary_max)}`;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
};

const AdminJobTableRow = ({ job, onStatusUpdate, onFlagToggle, onDelete }) => (
  <tr className="group border-b border-slate-100/60 transition-all duration-300 hover:bg-emerald-50/20">
    <td className="px-8 py-6">
      <div className="flex flex-col gap-1.5">
        <Link
          to={`/admin/jobs/${job.id}`}
          className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 uppercase tracking-normal"
          title={job.title}
        >
          {job.title}
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold uppercase tracking-normal">
          <span className="bg-slate-100/80 px-2 py-0.5 rounded-lg text-slate-500 border border-slate-200/50 shadow-sm">
            ID: {job.id}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} strokeWidth={2.5} className="text-emerald-500" />
            {formatDate(job.created_at)}
          </span>
          {job.type_label ? <span>{job.type_label}</span> : null}
        </div>
        {job.moderation_note ? (
          <div className="mt-2 flex items-start gap-1.5 text-sm text-red-600 bg-red-50/50 p-2 rounded-lg border border-red-100">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{job.moderation_note}</span>
          </div>
        ) : null}
      </div>
    </td>

    <td className="px-8 py-6">
      <div className="flex flex-col">
        <span className="text-base font-bold text-slate-800 line-clamp-1 uppercase tracking-normal">
          {job.company_name || 'N/A'}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 uppercase tracking-normal">
          <MapPin size={12} strokeWidth={2.5} className="text-emerald-500" />
          {job.location}
        </span>
      </div>
    </td>

    <td className="px-8 py-6">
      <div className="flex flex-col">
        <span className="text-base font-bold text-slate-900 tabular-nums">{formatSalary(job)}</span>
        <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-normal">
          <span className="flex items-center gap-1.5">
            <Briefcase size={12} strokeWidth={2.5} className="text-emerald-500" />
            {job.applicants} ung vien
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{job.views} luot xem</span>
          {job.vacancies ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Tuyển {job.vacancies} người</span>
            </>
          ) : null}
        </div>
      </div>
    </td>

    <td className="px-8 py-6">
      <AdminJobStatusBadge job={job} />
    </td>

    <td className="px-8 py-6 text-right">
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-12 p-0 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all ring-1 ring-slate-200/50 hover:ring-emerald-200/60 shadow-sm"
            >
              <MoreHorizontal size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 p-2 rounded-xl shadow-premium border-slate-100/60 backdrop-blur-xl bg-white/95"
          >
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-normal px-3 py-2">
              Ho so tin tuyen dung
            </DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              className="rounded-xl focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer py-2.5 font-bold"
            >
              <Link to={`/admin/jobs/${job.id}`}>
                <Eye size={16} className="mr-2 text-emerald-500" /> Xem chi tiet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer py-2.5 font-bold"
            >
              <Link to={`/admin/jobs/${job.id}/edit`}>
                <Pencil size={16} className="mr-2 text-emerald-500" /> Chinh sua tin
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2 bg-slate-100" />
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-normal px-3 py-2">
              Dieu phoi va kiem duyet
            </DropdownMenuLabel>

            {job.status === 'pending_review' ? (
              <DropdownMenuItem
                onClick={() => onStatusUpdate(job.id, 'published', 'Da duyet tin tuyen dung.')}
                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-md cursor-pointer"
              >
                <CheckCircle size={16} className="mr-2" /> Duyet tin
              </DropdownMenuItem>
            ) : null}

            {job.status === 'pending_review' ? (
              <DropdownMenuItem
                onClick={() => onStatusUpdate(job.id, 'rejected', 'Da tu choi tin tuyen dung.')}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-md cursor-pointer"
              >
                <XCircle size={16} className="mr-2" /> Tu choi
              </DropdownMenuItem>
            ) : null}

            {job.status === 'published' ? (
              <DropdownMenuItem
                onClick={() => onStatusUpdate(job.id, 'closed', 'Da an tin tuyen dung.')}
                className="rounded-md cursor-pointer"
              >
                <XCircle size={16} className="mr-2" /> An tin
              </DropdownMenuItem>
            ) : null}

            {job.status === 'closed' || job.status === 'rejected' || job.status === 'draft' ? (
              <DropdownMenuItem
                onClick={() => onStatusUpdate(job.id, 'published', 'Da dang tin tuyen dung.')}
                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-md cursor-pointer"
              >
                <CheckCircle size={16} className="mr-2" /> Dang tin
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-normal px-2 py-1.5">
              Hanh dong khac
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => onFlagToggle(job)}
              className={cn(
                'rounded-md cursor-pointer',
                job.flagged
                  ? 'text-emerald-600 focus:bg-emerald-50'
                  : 'text-amber-600 focus:bg-amber-50'
              )}
            >
              <ShieldAlert size={16} className="mr-2" />{' '}
              {job.flagged ? 'Go gan co' : 'Gan co vi pham'}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-md cursor-pointer font-medium"
            >
              <Trash2 size={16} className="mr-2" /> Xoa vinh vien
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  </tr>
);

AdminJobTableRow.propTypes = {
  job: PropTypes.object.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
  onFlagToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default AdminJobTableRow;
