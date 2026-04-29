/**
 * RecommendedJobs - Job recommendations section
 * Features:
 * - Glassmorphism design
 * - Animated entrance
 * - Filter/sort capabilities
 * - Empty state handling
 * - Skeleton loading
 */
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import RecommendedJobCard from '../jobs/RecommendedJobCard';

const SORT_OPTIONS = [
  { key: 'salary_desc', label: 'Lương cao nhất' },
  { key: 'recent', label: 'Mới nhất' },
];


const RecommendedJobs = ({ jobs = [], loading = false, onRefresh, showHeader = true, maxDisplay = 4 }) => {
  const [sortBy, setSortBy] = useState('recent');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'salary_desc':
          return (b.salary_max || 0) - (a.salary_max || 0);
        case 'recent':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [jobs, sortBy]);

  const displayedJobs = isExpanded ? filteredJobs : filteredJobs.slice(0, maxDisplay);
  const hasMore = filteredJobs.length > maxDisplay;


  const handleSortChange = (key) => {
    setSortBy(key);
  };


  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-xl border-2 border-foreground bg-gradient-to-br from-amber-500 to-orange-500 p-2 text-white shadow-lg">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gợi ý tối ưu</h2>
            </div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-lg bg-slate-100" />
                    <div className="h-6 w-20 rounded-lg bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-xl border-2 border-foreground bg-gradient-to-br from-amber-500 to-orange-500 p-2 text-white shadow-lg">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gợi ý tối ưu</h2>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Sparkles size={28} className="text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-700">Chưa có gợi ý nào</h3>
          <p className="mb-6 max-w-sm text-sm text-slate-500">
            Khám phá thêm việc làm để hệ thống có thêm dữ liệu đề xuất phù hợp.
          </p>
          <Link to="/candidate/jobs">
            <Button className="rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
              Khám phá việc làm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative flex items-center justify-center rounded-xl border-2 border-foreground bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 text-white shadow-lg"
            >
              <Sparkles size={18} strokeWidth={2.5} />
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            </motion.div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Gợi ý tối ưu</h2>
              <p className="text-xs font-medium text-slate-500">
                {jobs.length} gợi ý việc làm dành cho bạn
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-9 rounded-xl border-2 border-slate-200 text-xs font-semibold hover:border-emerald-300 hover:bg-emerald-50"
              >
                <RotateCcw size={14} className="mr-1.5" />
                Làm mới
              </Button>
            )}
            <Link to="/candidate/jobs">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Xem tất cả
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {SORT_OPTIONS.map(option => {
            const isActive = sortBy === option.key;
            return (
              <button
                key={option.key}
                onClick={() => handleSortChange(option.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {displayedJobs.map((job, index) => (
          <RecommendedJobCard
            key={job.id}
            job={job}
            index={index}
          />
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-11 rounded-xl border-2 border-slate-200 text-sm font-semibold hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
          >
            {isExpanded ? (
              <span>Thu gọn</span>
            ) : (
              <>
                <Sparkles size={14} className="mr-2" />
                Xem thêm {filteredJobs.length - maxDisplay} việc làm
              </>
            )}
          </Button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-600">
              {filteredJobs.length} việc đang mở
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-slate-600">
              {displayedJobs.length} mục đang hiển thị
            </span>
          </div>
        </div>
        <Link
          to="/candidate/jobs"
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Tìm việc ngay
          <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
};

RecommendedJobs.propTypes = {
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string,
      company_name: PropTypes.string,
      company_logo: PropTypes.string,
      location: PropTypes.string,
      salary_range: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  showHeader: PropTypes.bool,
  maxDisplay: PropTypes.number,
};

RecommendedJobs.defaultProps = {
  jobs: [],
  loading: false,
  showHeader: true,
  maxDisplay: 4,
};

export default RecommendedJobs;
