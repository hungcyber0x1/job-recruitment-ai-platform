import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils';

const StatCard = ({ icon: Icon, title, label, value, trend, trendLabel, borderColor, iconColor, iconBg, color, description, premium }) => {
  // Handle both prop styles (old and new) to be resilient
  const displayTitle = title || label;
  const displayTrend = trend;
  
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  };

  const selectedColor = colors[color] || '';

  return (
    <Card className={cn(
      "relative overflow-hidden p-6",
      borderColor
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-[1.02]",
              iconBg || "bg-slate-50",
              iconColor || (color ? "" : "text-slate-500"),
              selectedColor
            )}>
              <Icon size={20} />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{displayTitle}</h3>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
            {displayTrend && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  displayTrend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                )}>
                  {displayTrend}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{trendLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {description && (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
      )}

      {/* Background decoration */}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-slate-50/50 blur-2xl -z-0" />
    </Card>
  );
};

export default StatCard;
