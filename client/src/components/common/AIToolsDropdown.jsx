import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, DollarSign, FileText, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils';
import AppIcon from './AppIcon';

/** Ba công cụ công khai — trọng tâm ứng viên: tối ưu hồ sơ trước khi ứng tuyển, luyện phỏng vấn, tham khảo lương. */
const AI_TOOLS = [
  {
    label: 'Chấm điểm CV',
    description: 'So khớp từ khóa & ATS, gợi ý sửa CV trước khi nộp hồ sơ',
    path: '/ai-cv-scanner',
    icon: FileText,
  },
  {
    label: 'Dự báo lương',
    description: 'Khoảng lương tham khảo theo chức danh, kinh nghiệm & khu vực',
    path: '/salary-predictor',
    icon: DollarSign,
  },
];

/**
 * Dropdown "Công cụ" (AI) - Design: emerald accent, circular icon bg, bold labels
 * Dùng chung cho ModernHeader, LandingHeader, Header
 */
const AIToolsDropdown = ({
  variant = 'desktop',
  onItemClick,
  className,
  triggerClassName,
  contentClassName,
}) => {
  const handleClick = (e) => {
    onItemClick?.(e);
  };

  if (variant === 'mobile') {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 rounded-xl bg-slate-50/90 p-2 dark:bg-slate-900/50',
          className
        )}
      >
        <p className="px-3 py-1.5 text-base font-bold uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Công cụ cho ứng viên
        </p>
        {AI_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.path}
              to={tool.path}
              onClick={handleClick}
              className={cn(
                'group flex gap-3 rounded-xl border border-border/50 bg-white p-3 shadow-sm transition-all',
                'hover:border-primary/25 hover:shadow-[0_8px_28px_-8px_rgba(16,185,129,0.18)]',
                'dark:border-slate-700/80 dark:bg-slate-950'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-emerald-100 dark:bg-primary/15 dark:ring-primary/20">
                <AppIcon icon={Icon} size="md" className="text-primary" />
              </div>
              <span className="min-w-0 flex flex-col gap-0.5 text-left">
                <span className="text-base font-bold leading-snug text-foreground">
                  {tool.label}
                </span>
                <span className="text-sm font-medium leading-snug text-muted-foreground">
                  {tool.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-base font-bold rounded-xl',
          'text-primary hover:bg-primary/10 transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
          triggerClassName
        )}
        aria-label="Công cụ AI cho ứng viên HireBOT — chấm CV, luyện phỏng vấn, dự báo lương"
        aria-haspopup="menu"
      >
        <AppIcon icon={Sparkles} size="sm" className="text-primary" />
        <span>Công cụ</span>
        <AppIcon icon={ChevronDown} size="xs" className="opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className={cn(
          'w-[min(22rem,calc(100vw-2rem))] overflow-hidden border-emerald-100/60 p-0 dark:border-slate-700/80',
          'rounded-xl bg-slate-50/95 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.14)] backdrop-blur-sm dark:bg-slate-900/95',
          contentClassName
        )}
      >
        <div
          className="h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80"
          aria-hidden
        />
        <div className="space-y-1.5 p-2">
          {AI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <DropdownMenuItem key={tool.path} asChild className="p-0 focus:bg-transparent">
                <Link
                  to={tool.path}
                  onClick={handleClick}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-3',
                    'bg-white/90 transition-all dark:bg-slate-950/90',
                    'hover:border-primary/20 hover:shadow-[0_8px_28px_-8px_rgba(16,185,129,0.15)]',
                    'focus:border-primary/20 focus:shadow-[0_8px_28px_-8px_rgba(16,185,129,0.15)]',
                    'dark:hover:border-primary/30'
                  )}
                >
                  <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-primary ring-1 ring-primary/10 dark:bg-primary/15 dark:ring-primary/20">
                    <AppIcon icon={Icon} size="sm" className="text-primary" />
                  </div>
                  <span className="min-w-0 flex flex-col gap-0.5 text-left">
                    <span className="text-base font-bold leading-snug text-foreground">
                      {tool.label}
                    </span>
                    <span className="text-sm font-medium leading-snug text-muted-foreground">
                      {tool.description}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

AIToolsDropdown.propTypes = {
  variant: PropTypes.oneOf(['desktop', 'mobile']),
  onItemClick: PropTypes.func,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
};

export default AIToolsDropdown;
export { AI_TOOLS };
