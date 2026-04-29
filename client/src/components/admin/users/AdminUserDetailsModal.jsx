import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Mail, Calendar, Activity, MapPin, Hash, FileText, User, ShieldCheck, ShieldAlert, Phone, Globe, LogOut, Loader2, Zap } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../utils';
import adminService from '../../../services/adminService';
import { useNotification } from '../../../context/NotificationContext';

const AdminUserDetailsModal = ({ isOpen, onClose, user }) => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = React.useState('details');
  const [activities, setActivities] = React.useState([]);
  const [loadingActivities, setLoadingActivities] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && user && activeTab === 'activity') {
      fetchActivities();
    }
  }, [isOpen, user, activeTab]);

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await adminService.getUserActivity(user.id);
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      showNotification('Không thể tải lịch sử hoạt động.', 'error');
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleForceLogout = async () => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất cưỡng ép tài khoản này?')) return;
    try {
      setActionLoading(true);
      await adminService.forceLogout(user.id);
      showNotification('Đã thực hiện đăng xuất cưỡng ép.', 'success');
    } catch (err) {
      showNotification('Lỗi khi thực hiện đăng xuất cưỡng ép.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !user) return null;
  
  const getRoleBadgeVariant = (role) => {
    if (role === 'admin') return 'destructive';
    if (role === 'employer') return 'emerald';
    return 'outline';
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 'active') return 'emerald';
    if (status === 'banned' || status === 'inactive' || status === 'locked') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-3xl animate-in zoom-in-95 fade-in duration-300 ease-out border border-white">
        {/* Banner Section */}
        <div className="h-40 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-emerald-300/20 blur-2xl" />
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2.5 bg-black/10 hover:bg-black/20 text-white rounded-xl backdrop-blur-md transition-all active:scale-95 border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-8 pb-10">
          {/* Profile Header */}
          <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="relative">
              <div className="w-36 h-36 rounded-[2.5rem] border-[6px] border-white bg-slate-100 overflow-hidden shadow-2xl relative group">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <User size={48} className="text-slate-300" />
                  </div>
                )}
                {user.status === 'active' && (
                   <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                )}
              </div>
              {user.email_verified_at && (
                <div className="absolute -top-1 -right-1 w-10 h-12 rounded-xl bg-white p-1 shadow-lg flex items-center justify-center border border-slate-50">
                   <div className="w-full h-full rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-inner shadow-emerald-600/20">
                    <ShieldCheck size={18} />
                   </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3 mb-2">
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={getRoleBadgeVariant(user.role)} 
                  className="h-9 px-4 rounded-xl font-bold text-xs tracking-normal uppercase border-2 shadow-sm"
                >
                  {user.role}
                </Badge>
                <Badge 
                  variant={getStatusBadgeVariant(user.status)} 
                  className="h-9 px-4 rounded-xl font-bold text-xs tracking-normal uppercase border-2 shadow-sm"
                >
                  {user.status}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceLogout}
                disabled={actionLoading}
                className="h-9 gap-2 rounded-xl text-xs font-bold uppercase tracking-normal text-rose-600 border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Đăng xuất cưỡng ép
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100/50 rounded-xl border border-slate-100">
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal transition-all",
                activeTab === 'details' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <User size={14} />
              Chi tiết
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal transition-all",
                activeTab === 'activity' ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Activity size={14} />
              Lịch sử hoạt động
            </button>
          </div>
          
          {/* Name & Basic Info */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              {user.full_name}
              {user.role === 'admin' && <ShieldAlert size={20} className="text-rose-500" />}
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-default">
                <Mail size={16} className="text-emerald-500" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-default border-l border-slate-100 pl-6">
                  <Phone size={16} className="text-emerald-500" />
                  {user.phone}
                </div>
              )}
            </div>
          </div>
          
            {activeTab === 'details' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-normal mb-2 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                      <div className="p-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <Calendar size={12} />
                      </div>
                      Ngày tham gia
                    </div>
                    <p className="font-bold text-slate-700 text-base tabular-nums">
                      {new Date(user.created_at).toLocaleDateString('vi-VN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-normal mb-2 flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                      <div className="p-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <Activity size={12} />
                      </div>
                      Lần truy cập cuối
                    </div>
                    <p className="font-bold text-slate-700 text-base tabular-nums">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString('vi-VN') : 'Chưa ghi nhận'}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-normal mb-2 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                      <div className="p-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <Globe size={12} />
                      </div>
                      Khu vực & Vùng miền
                    </div>
                    <p className="font-bold text-slate-700 text-base">
                      {user.region || 'Cập nhật sau'}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors group">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-normal mb-2 flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                      <div className="p-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
                        <Hash size={12} />
                      </div>
                      Mã định danh hệ thống
                    </div>
                    <p className="font-mono font-bold text-slate-500 truncate text-sm">
                      ID: {user.id}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-normal flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    Ghi chú nội bộ
                    <div className="w-8 h-px bg-slate-100" />
                  </h3>
                  <div className={cn(
                    "p-6 rounded-[2rem] border transition-all hover:shadow-lg hover:shadow-slate-100/50",
                    user.internal_notes 
                      ? "bg-amber-50/30 border-amber-100 text-slate-700" 
                      : "bg-slate-50 border-slate-100 text-slate-400 italic"
                  )}>
                    <FileText size={18} className={cn("mb-3", user.internal_notes ? "text-amber-500" : "text-slate-300")} />
                    <p className="font-bold leading-relaxed">
                      {user.internal_notes || 'Hiện chưa có ghi chú nội bộ cho người dùng này.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingActivities ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <p className="text-sm font-bold uppercase tracking-normal">Đang tải lịch sử...</p>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 py-2">
                    {activities.map((activity, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm shadow-emerald-200" />
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                             <Badge variant="outline" className="text-xs font-bold uppercase tracking-normal rounded-lg border-slate-100 bg-white shadow-sm">
                               {activity.action}
                             </Badge>
                             <span className="text-xs font-bold text-slate-400">
                               {new Date(activity.created_at).toLocaleString('vi-VN')}
                             </span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-snug">{activity.details}</p>
                          {activity.ip_address && (
                            <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase">
                              <Globe size={10} /> IP: {activity.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400 text-center">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <Activity size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-normal">Chưa có hoạt động nào được ghi lại</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default AdminUserDetailsModal;
