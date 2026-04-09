import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  ChevronLeft,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout';
import Card from '../../components/common/Card';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';

const AdminCompanyDetailPage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const companyModules = [
    {
      title: 'Trust signal doanh nghiệp',
      description:
        'Tổng hợp xác minh, quy mô, website và thông tin chủ tài khoản để admin đánh giá độ tin cậy.',
    },
    {
      title: 'Ảnh hưởng nền tảng',
      description:
        'Theo dõi job count và application count để biết mức độ ảnh hưởng của doanh nghiệp trên hệ thống.',
    },
    {
      title: 'Moderation mở rộng',
      description:
        'Sẵn sàng mở rộng thêm lịch sử duyệt, cảnh báo và support issue cho từng company.',
    },
  ];

  useEffect(() => {
    let isActive = true;

    const fetchCompany = async () => {
      try {
        const response = await adminService.getCompany(id);
        if (isActive && response.data?.success) {
          const rawCompany = response.data.data;
          if (rawCompany && typeof rawCompany === 'object') {
            setCompany({
              id: rawCompany.id ?? 0,
              company_name: String(rawCompany.company_name ?? ''),
              company_logo: String(rawCompany.company_logo ?? ''),
              company_website: String(rawCompany.company_website ?? ''),
              company_description: String(rawCompany.company_description ?? ''),
              location: String(rawCompany.location ?? ''),
              city: String(rawCompany.city ?? ''),
              industry: String(rawCompany.industry ?? ''),
              category_name: String(rawCompany.category_name ?? ''),
              company_size: String(rawCompany.company_size ?? ''),
              is_verified: Boolean(rawCompany.is_verified ?? false),
              flagged: Boolean(rawCompany.flagged ?? false),
              job_count: Number(rawCompany.job_count ?? 0),
              created_at: rawCompany.created_at ?? new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin company detail', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchCompany();

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

  if (!company) {
    return (
      <AdminLayout>
        <div className="p-10 text-center font-medium text-muted-foreground">
          Không tìm thấy công ty.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          {companyModules.map((module) => (
            <div
              key={module.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
              <p className="text-base font-black uppercase tracking-[0.22em] text-muted-foreground">
                Company governance
              </p>
              <h2 className="mt-3 text-xl font-black text-foreground">{module.title}</h2>
              <p className="mt-2 text-base leading-6 text-muted-foreground">{module.description}</p>
            </div>
          ))}
        </div>

        <Link
          to="/admin/companies"
          className="flex items-center gap-2 font-bold text-muted-foreground transition-colors hover:text-secondary"
        >
          <ChevronLeft size={20} /> Quay lại danh sách
        </Link>

        <Card className="p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                {company.company_logo ? (
                  <img
                    src={company.company_logo}
                    alt={company.company_name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <Building2 className="text-muted-foreground" size={32} />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">{company.company_name}</h1>
                <div className="mt-3 flex flex-wrap gap-4 text-base font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} /> {company.location || 'Không rõ'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail size={16} /> {company.email || 'Không rõ'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} />{' '}
                    {company.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Việc làm
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">{company.job_count || 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Ứng tuyển
                </p>
                <p className="mt-2 text-2xl font-black text-foreground">
                  {company.application_count || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Lĩnh vực
                </p>
                <p className="mt-2 text-xl font-black text-foreground">
                  {company.industry || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Tạo lúc
                </p>
                <p className="mt-2 text-xl font-black text-foreground">
                  {formatDate(company.created_at)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="space-y-4 p-6 lg:col-span-2">
            <div>
              <h2 className="text-lg font-black text-foreground">Mô tả công ty</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">
                {company.company_description || 'Chưa có mô tả.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Website
                </p>
                <p className="mt-2 break-all text-base font-semibold text-foreground">
                  {company.company_website || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Quy mô công ty
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {company.company_size || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Chủ tài khoản
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {[company.first_name, company.last_name].filter(Boolean).join(' ') || 'Không rõ'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                  Số điện thoại
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {company.phone || company.user_phone || 'Không rõ'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-black text-foreground">Liên kết nhanh</h2>
            <Link
              to={`/admin/jobs?search=${encodeURIComponent(company.company_name || '')}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
            >
              <Briefcase className="text-secondary" size={18} />
              <div>
                <p className="font-bold text-foreground">Xem việc làm</p>
                <p className="text-base text-muted-foreground">Tất cả tin của công ty này</p>
              </div>
            </Link>
            <Link
              to={`/admin/applications?search=${encodeURIComponent(company.company_name || '')}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
            >
              <Users className="text-secondary" size={18} />
              <div>
                <p className="font-bold text-foreground">Xem ứng tuyển</p>
                <p className="text-base text-muted-foreground">Hồ sơ ứng tuyển liên quan</p>
              </div>
            </Link>
            {company.company_website ? (
              <a
                href={company.company_website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 transition-colors hover:bg-card"
              >
                <Globe className="text-secondary" size={18} />
                <div>
                  <p className="font-bold text-foreground">Mở website</p>
                  <p className="text-base text-muted-foreground">Truy cập website công ty</p>
                </div>
              </a>
            ) : null}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanyDetailPage;
