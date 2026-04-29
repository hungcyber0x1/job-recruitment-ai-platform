import PropTypes from 'prop-types';
import React from 'react';
import { Briefcase, DollarSign, Filter, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

const SALARY_RANGES = [
  'Dưới 10 triệu',
  '10 - 15 triệu',
  '15 - 20 triệu',
  '20 - 30 triệu',
  '30 - 50 triệu',
  'Trên 50 triệu',
  'Thỏa thuận',
];

const JOB_TYPES = ['Toàn thời gian', 'Bán thời gian', 'Hợp đồng', 'Thực tập', 'Từ xa'];

const EXPERIENCE_LEVELS = [
  'Fresher / Mới tốt nghiệp',
  'Dưới 1 năm',
  '1 - 3 năm',
  '3 - 5 năm',
  'Trên 5 năm',
  'Quản lý / Manager',
];

const FilterSection = ({ title, icon: Icon, children }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </div>
      <h4 className="text-sm font-bold uppercase tracking-normal text-muted-foreground">{title}</h4>
    </div>
    <div className="flex flex-col gap-2 pl-10">{children}</div>
  </div>
);

const JobFilterSidebar = ({ filters, setFilters, onFilterChange, embedded }) => {
  const activeTypes = Array.isArray(filters?.type) ? filters.type : [];

  const updateFilters = (nextFilters) => {
    if (setFilters) {
      setFilters(nextFilters);
      return;
    }
    if (onFilterChange) {
      onFilterChange(nextFilters);
    }
  };

  const handleReset = () => {
    updateFilters({
      ...filters,
      type: [],
      category_id: null,
    });
  };

  const handleTypeToggle = (value) => {
    const nextTypes = activeTypes.includes(value)
      ? activeTypes.filter((item) => item !== value)
      : [...activeTypes, value];
    updateFilters({ ...filters, type: nextTypes });
  };

  const filterContent = (
    <div className="flex flex-col gap-6 p-6">
      <FilterSection title="Mức lương" icon={DollarSign}>
        {SALARY_RANGES.map((item) => (
          <label
            key={item}
            htmlFor={`salary-${item}`}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              'hover:bg-muted/50'
            )}
          >
            <input
              type="checkbox"
              id={`salary-${item}`}
              className="size-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-base font-medium text-foreground">{item}</span>
          </label>
        ))}
      </FilterSection>

      <div className="h-px w-full shrink-0 bg-border" aria-hidden />

      <FilterSection title="Loại hình" icon={Clock}>
        {JOB_TYPES.map((item) => (
          <label
            key={item}
            htmlFor={`type-${item}`}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              'hover:bg-muted/50'
            )}
          >
            <input
              type="checkbox"
              id={`type-${item}`}
              checked={activeTypes.includes(item)}
              onChange={() => handleTypeToggle(item)}
              className="size-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-base font-medium text-foreground">{item}</span>
          </label>
        ))}
      </FilterSection>

      <div className="h-px w-full shrink-0 bg-border" aria-hidden />

      <FilterSection title="Kinh nghiệm" icon={Briefcase}>
        {EXPERIENCE_LEVELS.map((item) => (
          <label
            key={item}
            htmlFor={`exp-${item}`}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              'hover:bg-muted/50'
            )}
          >
            <input
              type="checkbox"
              id={`exp-${item}`}
              className="size-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-base font-medium text-foreground">{item}</span>
          </label>
        ))}
      </FilterSection>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 whitespace-nowrap text-lg font-bold uppercase tracking-normal text-foreground">
            <Filter className="size-4 text-emerald-500" aria-hidden />
            BỘ LỌC
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="whitespace-nowrap h-auto px-0 py-0 text-base font-bold uppercase tracking-normal text-red-500 hover:text-red-600 hover:bg-transparent"
          >
            ĐẶT LẠI
          </Button>
        </div>
        <div className="h-px w-full shrink-0 bg-border" aria-hidden />
        {filterContent}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden rounded-xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 py-5">
        <CardTitle className="flex whitespace-nowrap items-center gap-2 text-lg font-bold uppercase tracking-normal text-foreground">
          <Filter className="size-4 text-emerald-500" aria-hidden />
          BỘ LỌC
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="whitespace-nowrap h-auto px-0 py-0 text-base font-bold uppercase tracking-normal text-red-500 hover:text-red-600 hover:bg-transparent"
        >
          ĐẶT LẠI
        </Button>
      </CardHeader>
      <div className="h-px w-full shrink-0 bg-border" aria-hidden />
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">{filterContent}</ScrollArea>
      </CardContent>
    </Card>
  );
};

JobFilterSidebar.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.arrayOf(PropTypes.string),
    category_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  setFilters: PropTypes.func,
  onFilterChange: PropTypes.func,
  embedded: PropTypes.bool,
};

JobFilterSidebar.defaultProps = {
  filters: { type: [], category_id: null },
  setFilters: undefined,
  onFilterChange: undefined,
  embedded: false,
};

export default JobFilterSidebar;
