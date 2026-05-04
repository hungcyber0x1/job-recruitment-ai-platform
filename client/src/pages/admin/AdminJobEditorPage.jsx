import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BriefcaseBusiness, ChevronLeft, ShieldCheck, Wand2 } from 'lucide-react';

import { ContentCard, PageHeader } from '@/components/admin';
import StatCard from '@/components/common/StatCard';
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
    if (!id) {
      navigate('/admin/jobs', { replace: true });
      return;
    }

    fetchJob();
  }, [fetchJob, id, navigate]);

  const heroCards = useMemo(
    () => [
      {
        label: 'Phạm vi quản lý',
        value: 'Tin đã có',
        helper: 'Admin chỉ rà soát và chỉnh sửa dữ liệu do nhà tuyển dụng tạo.',
        icon: BriefcaseBusiness,
        type: 'success',
      },
      {
        label: 'Chuẩn hóa nội dung',
        value: 'Theo UI công khai',
        helper: 'Nội dung cập nhật ảnh hưởng trực tiếp tới trang chi tiết tin tuyển dụng.',
        icon: Wand2,
        type: 'primary',
      },
      {
        label: 'Trạng thái thao tác',
        value: 'Chỉnh sửa',
        helper: 'Không tạo tin mới trong Admin; nhà tuyển dụng là luồng tạo nguồn.',
        icon: ShieldCheck,
        type: 'neutral',
      },
    ],
    []
  );

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={BriefcaseBusiness}
        eyebrow="Kiểm duyệt nội dung tin tuyển dụng"
        badge="Quản lý theo dữ liệu người dùng"
        title="Chỉnh sửa tin tuyển dụng"
        description="Admin chỉ cập nhật dữ liệu tin tuyển dụng đã được nhà tuyển dụng tạo để đảm bảo nội dung hiển thị công khai đúng, an toàn và dễ hiểu với ứng viên."
        actions={
          <Link
            to="/admin/jobs"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {heroCards.map((card) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={card.value}
              subtitle={card.helper}
              icon={card.icon}
              type={card.type}
            />
          ))}
        </div>
      </PageHeader>

      <ContentCard
        icon={ShieldCheck}
        title="Biểu mẫu rà soát tin tuyển dụng"
        description="Các thay đổi tại đây chỉ dùng để chuẩn hóa nội dung đang hoặc sẽ hiển thị cho ứng viên."
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          </div>
        ) : (
          <AdminJobForm
            job={job}
            onSuccess={() => navigate('/admin/jobs')}
            onCancel={() => navigate('/admin/jobs')}
          />
        )}
      </ContentCard>
    </div>
  );
};

export default AdminJobEditorPage;
