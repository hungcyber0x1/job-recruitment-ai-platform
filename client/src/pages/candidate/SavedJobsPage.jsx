import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Clock, Search, Flag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common';
import { Input } from '@/components/ui/input';
import { candidateService } from '../../services';
import { useNotification } from '../../context/NotificationContext';

const SavedJobsPage = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { showNotification } = useNotification();
  const totalPages = 1;

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return savedJobs;
    const query = searchQuery.toLowerCase();
    return savedJobs.filter(
      (j) =>
        (j.title || j.job?.title || '').toLowerCase().includes(query) ||
        (j.company_name || j.company?.name || '').toLowerCase().includes(query)
    );
  }, [savedJobs, searchQuery]);

  const displayList = searched;
  const hasJobs = savedJobs.length > 0;

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const response = await candidateService.getSavedJobs();
        setSavedJobs(response.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch saved jobs:', error);
        showNotification('Không thể tải danh sách việc đã lưu', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSavedJobs();
  }, [showNotification]);

  const handleUnsave = async (jobId) => {
    try {
      await candidateService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((j) => (j.id || j.job_id) !== jobId));
      showNotification('Đã bỏ lưu việc làm', 'info');
    } catch (error) {
      console.error('Failed to unsave job:', error);
      showNotification('Không thể bỏ lưu việc làm', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 animate-slide-up">
      {/* Header: Title + Description */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
              <Flag className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Việc làm đã lưu</h1>
          </div>
          <p className="mt-2 text-base text-muted-foreground">
            Quản lý và theo dõi các vị trí bạn đang quan tâm.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm việc làm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg bg-background"
          />
        </div>
      </div>

      {/* Job list count */}
      <div className="mb-6">
        <p className="text-base text-muted-foreground">
          Đang hiển thị <span className="font-bold text-foreground">{searched.length}</span> việc
          làm phù hợp.
        </p>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl">
              <CardContent className="flex gap-4 p-6">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-64 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !hasJobs ? (
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              variant="robotReading"
              title="Chưa có việc làm đã lưu"
              description="Lưu các vị trí bạn quan tâm để so sánh và ứng tuyển khi sẵn sàng."
              action={
                <Button asChild className="rounded-lg bg-primary hover:bg-primary/90">
                  <Link to="/candidate/jobs">Khám phá việc làm</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayList.map((job) => (
            <Card
              key={job.id}
              className="rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md hover-lift group"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-emerald-500 transition-all duration-300">
                      {job.logo || job.company_logo ? (
                        <img
                          src={job.logo || job.company_logo}
                          alt=""
                          className="h-full w-full rounded-xl object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <span className="text-lg font-black text-slate-300 group-hover:text-emerald-500">
                          {(job.company_name || job.company?.name || 'C').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {job.title || job.job?.title}
                      </h3>
                      <p className="mt-1 text-base text-muted-foreground">
                        {job.company_name || job.company?.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Hạn nộp: {job.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                    <p className="text-base font-semibold text-foreground">
                      {job.salary_range || 'Thỏa thuận'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-emerald-500/20 px-6"
                      >
                        <Link to={`/candidate/jobs/${job.id || job.job_id}`}>Ứng tuyển</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-slate-200 transition-colors duration-200 ease-out hover:scale-105 active:scale-95"
                        onClick={() => handleUnsave(job.id || job.job_id)}
                      >
                        <Bookmark size={14} className="fill-current" />
                        Bỏ lưu
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {hasJobs && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </Button>
          {[1, 2, 3].map((n) => (
            <Button
              key={n}
              variant={page === n ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <span className="px-2 text-base text-muted-foreground">...</span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
