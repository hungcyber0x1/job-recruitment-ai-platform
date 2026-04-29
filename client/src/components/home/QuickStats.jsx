import React, { useEffect, useState } from 'react';
import { Briefcase, Building2, Database, Layers3 } from 'lucide-react';
import { motion } from 'framer-motion';

import { AppIcon } from '@/components/common';
import api from '@/services/api';

function formatNumber(value) {
  if (!Number.isFinite(value)) return '--';
  return new Intl.NumberFormat('vi-VN').format(value);
}

function getMetricDisplay(metric, isLoading) {
  if (isLoading) return '...';
  if (metric.error) return '--';
  return formatNumber(metric.value);
}

const QuickStats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    openJobs: { value: null, error: false },
    publicCompanies: { value: null, error: false },
    activeCategories: { value: null, error: false },
  });

  useEffect(() => {
    let cancelled = false;

    const fetchLiveMetrics = async () => {
      setIsLoading(true);

      const [jobsResult, companiesResult, categoriesResult] = await Promise.allSettled([
        api.get('jobs', { params: { limit: 1, offset: 0 } }),
        api.get('companies', { params: { page: 1, limit: 1 } }),
        api.get('categories'),
      ]);

      if (cancelled) return;

      if (jobsResult.status === 'rejected') {
        console.warn('Failed to fetch live open jobs metric:', jobsResult.reason);
      }

      if (companiesResult.status === 'rejected') {
        console.warn('Failed to fetch live public companies metric:', companiesResult.reason);
      }

      if (categoriesResult.status === 'rejected') {
        console.warn('Failed to fetch live active categories metric:', categoriesResult.reason);
      }

      const openJobsTotal =
        jobsResult.status === 'fulfilled'
          ? Number(jobsResult.value.data?.meta?.pagination?.total)
          : null;

      const publicCompaniesTotal =
        companiesResult.status === 'fulfilled'
          ? Number(companiesResult.value.data?.meta?.pagination?.total)
          : null;

      const activeCategoriesTotal =
        categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.data?.data)
          ? categoriesResult.value.data.data.length
          : null;

      setMetrics({
        openJobs: {
          value: Number.isFinite(openJobsTotal) ? openJobsTotal : 0,
          error: jobsResult.status === 'rejected',
        },
        publicCompanies: {
          value: Number.isFinite(publicCompaniesTotal) ? publicCompaniesTotal : 0,
          error: companiesResult.status === 'rejected',
        },
        activeCategories: {
          value: Number.isFinite(activeCategoriesTotal) ? activeCategoriesTotal : 0,
          error: categoriesResult.status === 'rejected',
        },
      });

      setIsLoading(false);
    };

    fetchLiveMetrics();

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    {
      key: 'open-jobs',
      icon: Briefcase,
      value: getMetricDisplay(metrics.openJobs, isLoading),
      eyebrow: 'Tuyển dụng',
      label: 'Việc làm đang mở',
      helper: 'Tin tuyển dụng public còn hiệu lực',
    },
    {
      key: 'public-companies',
      icon: Building2,
      value: getMetricDisplay(metrics.publicCompanies, isLoading),
      eyebrow: 'Doanh nghiệp',
      label: 'Hồ sơ công khai',
      helper: 'Doanh nghiệp đang hiển thị trên nền tảng',
    },
    {
      key: 'active-categories',
      icon: Layers3,
      value: getMetricDisplay(metrics.activeCategories, isLoading),
      eyebrow: 'Danh mục',
      label: 'Ngành nghề hoạt động',
      helper: 'Danh mục tuyển dụng public đang bật',
    },
  ];

  return (
    <section className="relative z-30 mt-10 pb-10 md:pb-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="section-accent-line" />
              <p className="text-base font-bold uppercase tracking-normal text-primary">
                Dữ liệu nền tảng
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold leading-[1.08] tracking-normal text-foreground md:text-4xl">
                Các chỉ số <span className="text-primary">đang vận hành</span>
              </h2>
              <p className="max-w-xl text-base font-medium leading-relaxed text-muted-foreground">
                Số liệu hiển thị trực tiếp từ dữ liệu public của hệ thống, đồng bộ theo trạng thái
                hiện có trên nền tảng.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary shadow-sm md:self-auto">
            <Database className="h-4 w-4" />
            Đồng bộ từ 3 nguồn dữ liệu public
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {statCards.map((stat) => (
            <article
              key={stat.key}
              className="card-premium-hover group flex h-full flex-col rounded-xl border border-border/60 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold tracking-normal text-muted-foreground">
                    {stat.eyebrow}
                  </p>
                  <p className="text-[2.5rem] font-bold leading-none tabular-nums tracking-normal text-primary transition-colors duration-300">
                    {stat.value}
                  </p>
                </div>

                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  <AppIcon icon={stat.icon} size="md" className="transition-colors duration-300" />
                </div>
              </div>

              <div className="mt-6 border-t border-border/50 pt-5">
                <p className="text-xl font-bold tracking-normal text-foreground transition-colors duration-300 group-hover:text-primary">
                  {stat.label}
                </p>
                <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                  {stat.helper}
                </p>
              </div>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default QuickStats;
