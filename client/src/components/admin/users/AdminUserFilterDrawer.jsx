import React from 'react';
import { Filter, X, Calendar, UserCircle, MapPin, Shield, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../utils';

const AdminUserFilterDrawer = ({ isOpen, onClose, filters, setFilters, onApply }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-3xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Filter className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Bộ lọc nâng cao</h2>
              <p className="text-xs font-bold uppercase tracking-normal text-slate-400">Điều chỉnh hiển thị</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">
          {/* Join Date Range */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-normal text-slate-500 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-500" />
              Khoảng ngày tham gia
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 ml-1">Từ ngày</span>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 ml-1">Đến ngày</span>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all outline-none" 
                />
              </div>
            </div>
          </div>
          
          {/* Gender Filter */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-normal text-slate-500 flex items-center gap-2">
              <UserCircle size={14} className="text-emerald-500" />
              Giới tính
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'male', label: 'Nam' },
                { id: 'female', label: 'Nữ' },
                { id: 'other', label: 'Khác' }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setFilters({...filters, gender: g.id === 'all' ? '' : g.id})}
                  className={cn(
                    "px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-normal border transition-all active:scale-[0.98]",
                    (filters.gender === g.id || (g.id === 'all' && !filters.gender))
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                      : "bg-white border-slate-200 text-slate-500 hover:border-emerald-500/50 hover:bg-emerald-50/30"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-normal text-slate-500 flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" />
              Vùng miền
            </label>
            <div className="relative group">
              <select
                value={filters.region}
                onChange={e => setFilters({...filters, region: e.target.value})}
                className="w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="">Tất cả vùng miền</option>
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
                <option value="Nước ngoài">Nước ngoài</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
                <MapPin size={16} />
              </div>
            </div>
          </div>

          {/* Email Verification Filter */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-normal text-slate-500 flex items-center gap-2">
              <Shield size={14} className="text-emerald-500" />
              Trạng thái xác thực
            </label>
            <div className="flex flex-col gap-2">
              {[
                { id: 'all', label: 'Tất cả trạng thái' },
                { id: 'true', label: 'Đã xác thực Email' },
                { id: 'false', label: 'Chưa xác thực Email' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setFilters({...filters, isVerified: v.id})}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-normal border text-left transition-all flex items-center justify-between group",
                    filters.isVerified === v.id
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm ring-1 ring-emerald-500/20"
                      : "bg-white border-slate-200 text-slate-500 hover:border-emerald-500/50 hover:bg-emerald-50/30"
                  )}
                >
                  {v.label}
                  <div className={cn(
                     "w-2 h-2 rounded-full transition-all group-hover:scale-125",
                     filters.isVerified === v.id ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-slate-200"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              const reset = { startDate: '', endDate: '', gender: '', region: '', isVerified: 'all' };
              setFilters(reset);
              onApply(reset);
            }}
            className="flex-1 h-12 rounded-xl text-slate-500 font-bold uppercase tracking-normal text-xs hover:bg-slate-50"
          >
            <RotateCcw size={14} className="mr-2" />
            Đặt lại
          </Button>
          <Button
            onClick={() => {
              onApply(filters);
              onClose();
            }}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-normal text-xs shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
          >
            Áp dụng bộ lọc
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserFilterDrawer;
