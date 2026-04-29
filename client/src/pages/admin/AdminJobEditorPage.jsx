import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AdminJobForm from '../../components/admin/AdminJobForm';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

const AdminJobEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  const fetchJob = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await adminService.getJob(id);
      setJob(response.data?.data ?? null);
    } catch (error) {
      console.error('Failed to load admin job for editing', error);
      showNotification('Unable to load job details.', 'error');
      navigate('/admin/jobs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const heroCards = useMemo(
    () => [
      {
        label: 'Phạm vi vận hành',
        value: 'Đa công ty',
        helper: 'Admin có thể đăng cho mọi doanh nghiệp trong hệ thống.',
        icon: BriefcaseBusiness,
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      },
      {
        label: 'Hỗ trợ nội dung',
        value: 'AI ready',
        helper: 'Có thể tối ưu mô tả công việc ngay trong form.',
        icon: Wand2,
        className: 'bg-sky-50 text-sky-700 ring-sky-100',
      },
      {
        label: 'Trạng thái thao tác',
        value: id ? 'Đang chỉnh sửa' : 'Tạo mới',
        helper: 'Giữ nguyên logic lưu và cập nhật từ admin.',
        icon: ShieldCheck,
        className: 'bg-violet-50 text-violet-700 ring-violet-100',
      },
    ],
    [id]
  );

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/admin/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại danh sách
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                Layout đồng nhất trang doanh nghiệp
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px] xl:items-start">
            <div className="space-y-6">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-emerald-600">Job publishing workspace</p>
                <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                  {id ? 'Chỉnh sửa tin tuyển dụng' : 'Tạo tin tuyển dụng mới'}
                </h1>
                <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Quản trị viên có thể tạo hoặc cập nhật tin tuyển dụng cho bất kỳ công ty nào trên hệ
                  thống, nhưng giao diện được trình bày lại theo nhịp điệu sáng, rõ và hiện đại hơn
                  như khu vực doanh nghiệp.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                            {card.label}
                          </p>
                          <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
                            {card.value}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{card.helper}</p>
                        </div>
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${card.className}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-600">
                Quy tắc xuất bản
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-950">Giữ logic, nâng trải nghiệm</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>Gán đúng công ty trước khi lưu để luồng kiểm duyệt và thống kê không bị lệch.</p>
                <p>AI chỉ hỗ trợ phần mô tả, còn quyết định xuất bản cuối cùng vẫn thuộc admin.</p>
                <p>Tin chỉnh sửa vẫn dùng cùng API và điều hướng cũ nên không ảnh hưởng nghiệp vụ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
            </div>
          </div>
        ) : (
          <AdminJobForm
            job={job}
            onSuccess={() => navigate('/admin/jobs')}
            onCancel={() => navigate('/admin/jobs')}
          />
        )}
      </main>
    </div>
  );
};

export default AdminJobEditorPage;
