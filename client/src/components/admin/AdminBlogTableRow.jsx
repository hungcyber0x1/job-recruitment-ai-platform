import React from 'react';
import { 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Eye, 
  User, 
  Calendar,
  MoreVertical,
  BookOpen,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '../../utils/cn';

const formatWhen = (raw) => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

const AdminBlogTableRow = ({ row, onEdit, onDelete }) => {
  const publishedAt = row?.published_at || row?.updated_at || row?.created_at;
  const isDraft = !row.is_published;

  return (
    <tr className="group hover:bg-emerald-50/20 transition-all duration-300">
      <td className="px-8 py-6">
        <div className="flex items-start gap-4 max-w-lg">
          <div className={cn(
            "mt-1 p-2.5 rounded-xl shrink-0 transition-colors",
            isDraft ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-600 ring-4 ring-emerald-500/5"
          )}>
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors uppercase tracking-normal">
              {row.title}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-xs font-mono text-slate-400">
              <Send size={12} className="shrink-0" />
              <span className="truncate">{row.slug}</span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-8 py-6">
        {row.category ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-normal">
            {row.category}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-8 py-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
             <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                {row.author_name?.[0] || 'A'}
             </div>
             <span className="text-sm font-bold text-slate-700">{row.author_name || 'Quản trị viên'}</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs h-4 uppercase font-bold tracking-normal",
              row.author_type === 'employer' 
                ? "bg-amber-50 text-amber-600 border-amber-100" 
                : "bg-slate-50 text-slate-500 border-slate-200"
            )}
          >
            {row.author_type === 'employer' ? 'Nhà tuyển dụng' : 'Admin Hệ thống'}
          </Badge>
          {row.company_name && (
            <p className="text-xs font-medium text-slate-400 line-clamp-1 italic italic">
              @ {row.company_name}
            </p>
          )}
        </div>
      </td>

      <td className="px-8 py-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Eye size={14} className="text-emerald-500" />
            <span className="text-sm font-bold tabular-nums">
              {(row.view_count || row.viewCount || 0).toLocaleString('vi-VN')}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-normal">Lượt xem</p>
        </div>
      </td>

      <td className="px-8 py-6">
        {row.is_published ? (
          <div className="flex flex-col gap-1.5">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 uppercase font-bold text-xs tracking-normal px-2">
              Công khai
            </Badge>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600/70">
              <Calendar size={10} />
              {formatWhen(publishedAt)}
            </div>
          </div>
        ) : (
          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 uppercase font-bold text-xs tracking-normal px-2">
            Bản nháp
          </Badge>
        )}
      </td>

      <td className="px-8 py-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white hover:shadow-md transition-all">
              <MoreVertical size={20} className="text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 p-2 shadow-xl animate-in fade-in zoom-in-95">
            <DropdownMenuLabel className="px-3 text-xs font-bold uppercase tracking-normal text-slate-400">Thao tác bài viết</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {row.is_published && row.slug && (
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                <a href={`/blog/${encodeURIComponent(row.slug)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="size-4 text-emerald-500" />
                  <span className="font-bold">Xem bài đăng</span>
                </a>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => onEdit(row)} className="rounded-xl cursor-pointer gap-2">
              <Pencil className="size-4 text-blue-500" />
              <span className="font-bold">Chỉnh sửa</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(row.id, row)}
              className="rounded-xl cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <Trash2 className="size-4" />
              <span className="font-bold">Xóa bài viết</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export default AdminBlogTableRow;
