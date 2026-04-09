import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  ChevronLeft,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  UserCircle2,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userModules = [
    {
      title: 'Dinh danh tai khoan',
      description:
        'Tập trung thông tin role, status và lịch sử tham gia để admin kiểm tra tính hợp lệ của user.',
    },
    {
      title: 'Liên kết nghiệp vụ',
      description:
        'Từ trang này có thể lân sang applications, company và CV để điều tra theo ngữ cảnh.',
    },
    {
      title: 'Khung mo rong',
      description:
        'San sang bo sung risk score, bao cao vi pham va audit event cho tung tai khoan.',
    },
  ];

  useEffect(() => {
    let isActive = true;

    const fetchUser = async () => {
      try {
        const response = await adminService.getUser(id);
        if (isActive && response.data?.success) {
          const rawUser = response.data.data;
          if (rawUser && typeof rawUser === 'object') {
            setUser({
              id: rawUser.id ?? 0,
              email: String(rawUser.email ?? ''),
              first_name: String(rawUser.first_name ?? ''),
              last_name: String(rawUser.last_name ?? ''),
              full_name: String(rawUser.full_name ?? ''),
              role: String(rawUser.role ?? ''),
              status: String(rawUser.status ?? ''),
              avatar_url: String(rawUser.avatar_url ?? ''),
              phone: String(rawUser.phone ?? ''),
              employer_id: rawUser.employer_id ?? null,
              created_at: rawUser.created_at ?? new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin user detail', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isActive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Không tìm thấy người dùng.
        </div>
      </AdminLayout>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Không rõ';

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          {userModules.map((module) => (
            <div
              key={module.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                User governance
              </p>
              <h2 className="mt-3 text-xl font-black text-foreground">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
            </div>
          ))}
        </div>

        <Link
          to="/admin/users"
          className="flex items-center gap-2 font-bold text-muted-foreground transition-colors hover:text-secondary"
        >
          <ChevronLeft size={20} /> Quay lại danh sách
        </Link>

        <Card className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-black text-white">
                {fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">{fullName}</h1>
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail size={16} /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={16} /> {user.phone || 'Không rõ'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield size={16} /> {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Trạng thái
                </p>
                <p className="mt-2 text-xl font-black capitalize text-foreground">{user.status}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Tham gia
                </p>
                <p className="mt-2 text-xl font-black text-foreground">
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Ứng tuyển
                </p>
                <p className="mt-2 text-xl font-black text-foreground">
                  {user.application_count || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Việc làm
                </p>
                <p className="mt-2 text-xl font-black text-foreground">{user.job_count || 0}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="space-y-4 p-6 lg:col-span-2">
            <h2 className="text-lg font-black text-foreground">Thông tin hồ sơ</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Vai trò
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{user.role}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Địa chỉ
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {user.address || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Vị trí hiện tại
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {user.current_job_title || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Công ty
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {user.company_name || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Giới thiệu
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {user.bio || 'Không rõ'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-black text-foreground">Liên kết nhanh</h2>
            <Link
              to={`/admin/applications?search=${encodeURIComponent(fullName || user.email || '')}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
            >
              <FileText className="text-secondary" size={18} />
              <div>
                <p className="font-bold text-foreground">Xem ứng tuyển</p>
                <p className="text-sm text-muted-foreground">Tất cả hồ sơ liên quan</p>
              </div>
            </Link>
            {user.employer_id ? (
              <Link
                to={`/admin/companies/${user.employer_id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
              >
                <Briefcase className="text-secondary" size={18} />
                <div>
                  <p className="font-bold text-foreground">Xem công ty</p>
                  <p className="text-sm text-muted-foreground">
                    {user.company_name || 'Hồ sơ công ty'}
                  </p>
                </div>
              </Link>
            ) : null}
            {user.resume_url ? (
              <a
                href={user.resume_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
              >
                <UserCircle2 className="text-secondary" size={18} />
                <div>
                  <p className="font-bold text-foreground">Mở CV</p>
                  <p className="text-sm text-muted-foreground">Tài liệu CV của candidate</p>
                </div>
              </a>
            ) : null}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4">
              <MapPin className="text-secondary" size={18} />
              <div>
                <p className="font-bold text-foreground">Địa điểm</p>
                <p className="text-sm text-muted-foreground">
                  {user.candidate_location || user.company_location || 'Không rõ'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetailPage;
