import React from 'react';
import PropTypes from 'prop-types';
import {
  Activity,
  CheckCircle,
  FileText,
  Building2,
  Flag,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  Edit,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/utils';
import Skeleton from '@/components/common/Skeleton';

const actionConfig = {
  LOGIN: { icon: LogIn, color: 'blue', text: 'Đăng nhập hệ thống' },
  LOGOUT: { icon: LogOut, color: 'slate', text: 'Đăng xuất' },
  UPDATE_APPLICATION_STATUS: {
    icon: CheckCircle,
    color: 'emerald',
    text: 'Cập nhật trạng thái ứng tuyển',
  },
  CREATE_JOB: { icon: FileText, color: 'violet', text: 'Tạo tin tuyển dụng mới' },
  UPDATE_JOB: { icon: Edit, color: 'amber', text: 'Cập nhật tin tuyển dụng' },
  DELETE_JOB: { icon: Trash2, color: 'red', text: 'Xóa tin tuyển dụng' },
  VERIFY_COMPANY: { icon: Building2, color: 'emerald', text: 'Xác minh doanh nghiệp' },
  FLAG_JOB: { icon: Flag, color: 'red', text: 'Gắn cờ tin tuyển dụng' },
  FLAG_COMPANY: { icon: Flag, color: 'red', text: 'Gắn cờ công ty' },
  CREATE_USER: { icon: UserPlus, color: 'blue', text: 'Tạo tài khoản mới' },
  UPDATE_SETTINGS: { icon: Settings, color: 'slate', text: 'Cập nhật cài đặt' },
};

const colorSchemes = {
  emerald: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-500',
    iconText: 'text-white',
    text: 'text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-500',
    iconText: 'text-white',
    text: 'text-blue-600',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    iconText: 'text-white',
    text: 'text-amber-600',
  },
  violet: {
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-500',
    iconText: 'text-white',
    text: 'text-violet-600',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-500',
    iconText: 'text-white',
    text: 'text-red-600',
  },
  slate: {
    bg: 'bg-slate-100',
    iconBg: 'bg-slate-500',
    iconText: 'text-white',
    text: 'text-slate-600',
  },
};

const AdminActivityFeed = ({ logs = [], loading, nowTs = 0, maxItems = 8, className }) => {
  const formatLogTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      const diff = Math.floor((nowTs - date.getTime()) / 60000);
      if (diff < 1) return 'Vừa xong';
      if (diff < 60) return `${diff} phút trước`;
      if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
      if (diff < 10080) return `${Math.floor(diff / 1440)} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm', className)}>
      <div className="border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Hoạt động gần đây</h3>
            <p className="text-xs text-muted-foreground">Theo dõi các thay đổi trong hệ thống</p>
          </div>
        </div>
      </div>

      <div className="max-h-[320px] divide-y divide-border/50 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-6 py-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/4 rounded-full" />
              </div>
            </div>
          ))
        ) : logs.length > 0 ? (
          logs.slice(0, maxItems).map((log, i) => {
            const config = actionConfig[log.action] || actionConfig.LOGIN;
            const scheme = colorSchemes[config.color] || colorSchemes.slate;
            const Icon = config.icon;

            return (
              <div
                key={log.id || i}
                className={cn(
                  'group flex items-start gap-4 px-6 py-4 transition-colors duration-200',
                  'hover:bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md',
                    'transition-transform duration-200 group-hover:scale-105',
                    scheme.iconBg
                  )}
                >
                  <Icon className={cn('h-4 w-4', scheme.iconText)} />

                  {i === 0 && !loading && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-semibold">{log.admin_name || 'Admin'}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className={scheme.text}>{log.details || config.text}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatLogTime(log.created_at)}</span>
                    {log.target && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="max-w-[150px] truncate text-xs text-muted-foreground">{log.target}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Chưa có hoạt động nào</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Các hoạt động trong hệ thống sẽ hiển thị tại đây
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

AdminActivityFeed.propTypes = {
  logs: PropTypes.array,
  loading: PropTypes.bool,
  nowTs: PropTypes.number,
  maxItems: PropTypes.number,
  className: PropTypes.string,
};

export default AdminActivityFeed;
