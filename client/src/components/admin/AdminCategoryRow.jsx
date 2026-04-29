import React from 'react';
import {
  ChevronRight,
  Edit2,
  Trash2,
  Briefcase,
  Tags,
  X,
  Plus,
  Code2,
  Megaphone,
  Building2,
  GraduationCap,
  Landmark,
  Hotel,
  Truck,
  Factory,
  ShoppingBag,
  Palette,
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
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

const getCategoryIcon = (name) => {
  const n = String(name || '').toLowerCase();
  const iconCls = 'text-emerald-600 dark:text-emerald-400 font-bold';
  const size = 18;
  if (n.includes('công nghệ') || n.includes('it') || n.includes('tech') || n.includes('phần mềm'))
    return <Code2 size={size} className={iconCls} strokeWidth={2.5} />;
  if (
    n.includes('marketing') ||
    n.includes('truyền thông') ||
    n.includes('media') ||
    n.includes('bán hàng') ||
    n.includes('kinh doanh')
  )
    return <Megaphone size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('bất động sản') || n.includes('real'))
    return <Building2 size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('giáo dục') || n.includes('đào tạo'))
    return <GraduationCap size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('kế toán') || n.includes('tài chính') || n.includes('finance'))
    return <Landmark size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('khách sạn') || n.includes('du lịch') || n.includes('nhà hàng'))
    return <Hotel size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('logistics') || n.includes('vận tải') || n.includes('kho bãi'))
    return <Truck size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('kỹ thuật') || n.includes('sản xuất') || n.includes('cơ khí'))
    return <Factory size={size} className={iconCls} strokeWidth={2.5} />;
  if (n.includes('bán lẻ') || n.includes('thương mại'))
    return <ShoppingBag size={size} className={iconCls} strokeWidth={2.5} />;
  return <Palette size={size} className={iconCls} strokeWidth={2.5} />;
};

const AdminCategoryRow = ({
  category,
  skills = [],
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddSkill,
  onDeleteSkill,
}) => {
  const jobCount = category.job_count ?? 0;
  const categorySkills = skills.filter((s) => s.category === category.name);
  const skillCount = categorySkills.length;

  return (
    <div className={cn(
      "transition-all duration-300 border-l-4",
      isExpanded ? "bg-emerald-50/40 border-emerald-500 shadow-sm" : "bg-white hover:bg-slate-50 border-transparent"
    )}>
      <div
        className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center md:grid md:grid-cols-[50px,60px,1fr,280px,120px] md:gap-4 md:px-8 cursor-pointer group"
        onClick={onToggle}
      >
        <div className="flex items-center justify-center">
          <button className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
            isExpanded ? "bg-emerald-500 text-white rotate-90" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 shadow-sm"
          )}>
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex justify-center">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-sm",
            isExpanded ? "bg-white text-emerald-600 ring-2 ring-emerald-500/20" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-md group-hover:ring-1 group-hover:ring-slate-100 ring-transparent"
          )}>
            {getCategoryIcon(category.name)}
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-normal">
            {category.name}
          </h4>
          <p className="mt-0.5 text-sm font-medium text-slate-500 line-clamp-1">
            {category.description || 'Quản lý thông tin và dữ liệu liên quan đến ngành này.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-normal tabular-nums bg-emerald-50/50 border border-emerald-100/50 text-emerald-600 shadow-sm transition-all group-hover:bg-emerald-50 group-hover:shadow-md">
              <Briefcase size={13} strokeWidth={2.5} />
              {jobCount} Tin đăng
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-normal tabular-nums bg-sky-50/50 border border-sky-100/50 text-sky-600 shadow-sm transition-all group-hover:bg-sky-50 group-hover:shadow-md">
              <Tags size={13} strokeWidth={2.5} />
              {skillCount} Kỹ năng
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end px-2" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-12 w-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md ring-1 ring-slate-100 transition-all active:scale-90">
                <MoreHorizontal size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-premium border-slate-100/60 backdrop-blur-xl bg-white/95">
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-normal px-3 py-2"> Quản lý danh mục </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onEdit(category, 'category')}
                className="rounded-xl focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer py-2.5 font-bold"
              >
                <Edit2 size={16} className="mr-2 text-emerald-500" /> Chỉnh sửa ngành
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAddSkill({ category: category.name }, 'skill')}
                className="rounded-xl focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer py-2.5 font-bold"
              >
                <Plus size={16} className="mr-2 text-emerald-500" /> Thêm kỹ năng mới
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2 bg-slate-100" />
              <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-normal px-3 py-2"> Khu vực rủi ro </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onDelete(category.id, true)}
                className="rounded-xl text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer py-2.5 font-bold"
              >
                <Trash2 size={16} className="mr-2" /> Xóa danh mục
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && (
        <div className="px-8 py-8 md:pl-[calc(40px+60px+48px)] bg-gradient-to-b from-white/50 to-white/0 border-t border-emerald-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Skills Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-6 rounded-full bg-emerald-500" />
                  <h5 className="text-xs font-bold uppercase tracking-normal text-emerald-600/80">Từ khóa kỹ năng (Tags)</h5>
                </div>
                <button
                  onClick={() => onAddSkill({ category: category.name }, 'skill')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-normal text-emerald-600 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Plus size={12} strokeWidth={3} /> Thêm kỹ năng
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {categorySkills.length > 0 ? (
                  categorySkills.map((skill) => (
                    <div key={skill.id} className="group/tag relative px-4 py-2 bg-white border border-slate-200/60 rounded-xl text-xs font-bold uppercase tracking-normal text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:ring-4 hover:ring-emerald-500/5 transition-all shadow-sm hover:shadow-md">
                      {skill.name}
                      <button 
                        onClick={() => onDeleteSkill(skill.id, false)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white text-red-500 border border-red-100 opacity-0 group-hover/tag:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white shadow-premium z-10"
                      >
                        <X size={10} strokeWidth={3.5} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full px-6 py-8 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Tags size={32} strokeWidth={1} className="opacity-40" />
                    <p className="text-xs font-bold uppercase tracking-normal">Chưa có kỹ năng nào</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-6 rounded-full bg-slate-300" />
                <h5 className="text-xs font-bold uppercase tracking-normal text-slate-400">Thông tin thị trường</h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 shadow-inner group/card hover:bg-white transition-all duration-500">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-normal group-hover/card:text-emerald-600">Độ hot ngành</p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-2xl font-bold text-slate-400 tabular-nums">—</p>
                  </div>
                </div>
                <div className="p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 shadow-inner group/card hover:bg-white transition-all duration-500">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-normal group-hover/card:text-blue-600">Ứng viên mới</p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-2xl font-bold text-slate-400 tabular-nums">—</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryRow;
