import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Mail,
  MessageSquare,
  UserCheck,
  UserX,
  Briefcase,
  FileText,
  Star,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '../../utils';
import auditService from '../../services/auditService';
import { formatTimeAgo } from '../../utils/formatters';

const ACTION_ICONS = {
  application_status_change: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
  application_note_added: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-50' },
  application_email_sent: { icon: Mail, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  application_shortlisted: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  application_rejected: { icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
  application_interview_scheduled: { icon: Calendar, color: 'text-teal-500', bg: 'bg-teal-50' },
  job_created: { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  job_updated: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  job_status_change: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-50' },
  job_approved: { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  job_rejected: { icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
};

const AuditEntry = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = ACTION_ICONS[entry.action] || ACTION_ICONS[entry.action];
  const Icon = cfg?.icon || Activity;

  const performerName = entry.first_name
    ? `${entry.first_name} ${entry.last_name || ''}`.trim()
    : 'Hệ thống';

  return (
    <div className="relative pl-6 pb-5 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-1 bottom-0 w-px bg-slate-100 last:hidden" />

      {/* Dot */}
      <div className={cn(
        'absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm z-10',
        cfg?.bg || 'bg-slate-100'
      )}>
        <Icon className={cn('h-2 w-2 absolute inset-0 m-auto', cfg?.color || 'text-slate-400')} />
      </div>

      <div className="ml-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              {auditService.getActionLabels()[entry.action] || entry.action}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {performerName} • {formatTimeAgo(entry.created_at)}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-300 shrink-0">
            {new Date(entry.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-600 line-clamp-2">{entry.notes}</p>
          </div>
        )}

        {/* Old/New values */}
        {(entry.old_values || entry.new_values) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
        )}

        {expanded && (entry.old_values || entry.new_values) && (
          <div className="mt-2 space-y-2">
            {entry.old_values && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Trước đó</p>
                {Object.entries(entry.old_values).map(([key, val]) => (
                  <p key={key} className="text-xs text-red-600">
                    <span className="font-medium">{key}:</span> {String(val)}
                  </p>
                ))}
              </div>
            )}
            {entry.new_values && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Sau đó</p>
                {Object.entries(entry.new_values).map(([key, val]) => (
                  <p key={key} className="text-xs text-emerald-600">
                    <span className="font-medium">{key}:</span> {String(val)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationAuditLog = ({ applicationId }) => {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getApplicationAudit(applicationId, { limit: 50 });
      setAudit(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load audit:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) loadAudit();
  }, [applicationId, loadAudit]);

  const filteredAudit = filter === 'all'
    ? audit
    : audit.filter(e => e.action.includes(filter));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-700">Nhật ký hoạt động</h3>
          <Badge variant="outline" className="text-xs">{filteredAudit.length} sự kiện</Badge>
        </div>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={loadAudit}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'note', label: 'Ghi chú' },
          { key: 'email', label: 'Email' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-xs font-bold transition-all',
              filter === f.key
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {loading ? (
          <div className="text-center py-6">
            <div className="h-5 w-5 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAudit.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="mx-auto h-8 w-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-400">Chưa có nhật ký hoạt động</p>
          </div>
        ) : (
          filteredAudit.map((entry, i) => (
            <AuditEntry key={entry.id || entry.history_id || i} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
};

const JobAuditLog = ({ jobId }) => {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        const res = await auditService.getJobAudit(jobId, { limit: 50 });
        setAudit(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load job audit:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-4">
          <div className="h-5 w-5 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : audit.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Chưa có thay đổi nào</p>
      ) : (
        audit.map((entry, i) => <AuditEntry key={entry.id || i} entry={entry} />)
      )}
    </div>
  );
};

export { ApplicationAuditLog, JobAuditLog };
export default ApplicationAuditLog;
