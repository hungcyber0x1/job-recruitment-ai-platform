import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/admin';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { normalizeCompanyEntity } from '../../utils/domain';
import { cn } from '../../utils';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';

const STATUS_META = {
  pending: {
    label: 'Chờ xác minh',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock,
    summary:
      'Doanh nghiệp mới đăng ký, cần kiểm tra tính pháp lý của hồ sơ trước khi được đăng tuyển.',
  },
  verified: {
    label: 'Đã xác minh',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle,
    summary: 'Hồ sơ doanh nghiệp hợp lệ, có quyền đăng tuyển và tìm kiếm ứng viên.',
  },
  rejected: {
    label: 'Đã từ chối',
    badgeClass: 'border-red-200 bg-red-50 text-red-700',
    icon: XCircle,
    summary:
      'Hồ sơ bị từ chối, nhà tuyển dụng cần bổ sung hoặc chỉnh sửa thông tin trước khi gửi duyệt lại.',
  },
  flagged: {
    label: 'Đang cảnh báo',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: AlertTriangle,
    summary: 'Hồ sơ đang bị gắn cờ kiểm duyệt; cần rà soát thêm trước khi tiếp tục vận hành.',
  },
  banned: {
    label: 'Đã khóa',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: Ban,
    summary: 'Tài khoản doanh nghiệp đã bị khóa do vi phạm hoặc quyết định moderation.',
  },
};

const LOCKED_USER_STATUSES = new Set(['banned', 'suspended', 'locked']);

function resolveCompanyModerationStatus(company = {}) {
  const userStatus = String(company.user_status ?? company.owner_status ?? '')
    .trim()
    .toLowerCase();
  if (LOCKED_USER_STATUSES.has(userStatus)) return 'banned';
  if (company.flagged) return 'flagged';
  if (company.is_verified) return 'verified';
  if (
    String(company.verification_status ?? '')
      .trim()
      .toLowerCase() === 'rejected'
  )
    return 'rejected';
  return 'pending';
}

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-normal text-slate-400">{label}</p>
        <p className="mt-2 break-words text-base font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const AdminCompanyDetailPage = () => {
  const { id } = useParams();
  const { showNotification } = useNotification();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getCompany(id);
      const raw = response.data?.data;

      if (!raw || typeof raw !== 'object') {
        setCompany(null);
        return;
      }

      const normalized = normalizeCompanyEntity(raw);
      const status = resolveCompanyModerationStatus(normalized);

      setCompany({
        ...normalized,
        id: String(raw.id ?? ''),
        email: String(raw.email ?? ''),
        first_name: String(raw.first_name ?? ''),
        last_name: String(raw.last_name ?? ''),
        phone: String(raw.phone ?? raw.user_phone ?? ''),
        tax_code: String(raw.tax_code ?? ''),
        moderation_note: String(raw.moderation_note ?? raw.rejection_reason ?? ''),
        rejection_reason: String(raw.rejection_reason ?? ''),
        verification_status: String(raw.verification_status ?? normalized.verification_status ?? '')
          .trim()
          .toLowerCase(),
        user_status: String(raw.user_status ?? raw.owner_status ?? '')
          .trim()
          .toLowerCase(),
        is_verified: Boolean(raw.is_verified),
        flagged: Boolean(raw.flagged),
        job_count: Number(raw.job_count ?? 0),
        application_count: Number(raw.application_count ?? 0),
        created_at: raw.created_at ?? null,
        updated_at: raw.updated_at ?? null,
        deleted_at: raw.deleted_at ?? null,
        status,
      });
    } catch (error) {
      console.error('Failed to fetch admin company detail', error);
      setCompany(null);
      showNotification('Không thể tải thông tin doanh nghiệp.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const moderationStatus = useMemo(() => {
    if (!company) return STATUS_META.pending;
    return STATUS_META[company.status] || STATUS_META.pending;
  }, [company]);

  const ownerName =
    [company?.first_name, company?.last_name].filter(Boolean).join(' ') || 'Chưa cập nhật';

  const runModerationAction = useCallback(
    async (action) => {
      if (!company) return;

      try {
        setSaving(true);
        await action();
        await fetchCompany();
      } catch (error) {
        console.error('Cập nhật kiểm duyệt doanh nghiệp thất bại', error);
        showNotification(
          error.response?.data?.message || 'Không thể cập nhật trạng thái kiểm duyệt.',
          'error'
        );
      } finally {
        setSaving(false);
      }
    },
    [company, fetchCompany, showNotification]
  );

  const handleVerify = () =>
    runModerationAction(async () => {
      await adminService.verifyCompany(company.id, true, rejectReason.trim() || null);
      setRejectDialogOpen(false);
      setRejectReason('');
      showNotification('Đã xác minh doanh nghiệp thành công.', 'success');
    });

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      showNotification('Vui lòng nhập lý do từ chối doanh nghiệp.', 'error');
      return;
    }

    return runModerationAction(async () => {
      await adminService.verifyCompany(company.id, false, reason);
      setRejectDialogOpen(false);
      setRejectReason('');
      showNotification('Đã từ chối doanh nghiệp và lưu lý do kiểm duyệt.', 'success');
    });
  };

  const handleFlagToggle = () =>
    runModerationAction(async () => {
      await adminService.flagCompany(
        company.id,
        !company.flagged,
        company.flagged ? null : 'Cần admin xem xét thêm'
      );
      showNotification(
        company.flagged ? 'Đã gỡ cờ cảnh báo doanh nghiệp.' : 'Đã gắn cờ cảnh báo doanh nghiệp.',
        'success'
      );
    });

  const handleBan = async () => {
    if (!company) return;
    if (!window.confirm('Khóa doanh nghiệp này và tất cả tin tuyển dụng liên quan?')) {
      return;
    }

    await runModerationAction(async () => {
      await adminService.banCompany(company.id);
      showNotification('Đã khóa doanh nghiệp.', 'success');
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto text-slate-300" size={42} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy doanh nghiệp</h1>
          <p className="mt-2 text-base text-slate-500">
            Bản ghi này có thể đã bị xóa hoặc không tồn tại.
          </p>
        </div>
        <div>
          <Link
            to="/admin/companies"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = moderationStatus.icon;

  return (
    <div className="space-y-7 pb-10 animate-fade-in">
      <PageHeader
        icon={Building2}
        eyebrow="Kiểm duyệt doanh nghiệp"
        badge={moderationStatus.label}
        title={company.company_name || 'Chưa cập nhật'}
        description={moderationStatus.summary}
        actions={
          <>
            <Link
              to="/admin/companies"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700"
            >
              <ArrowLeft size={18} />
              Quay lại danh sách
            </Link>
            {!company.is_verified || company.status === 'rejected' ? (
              <Button
                type="button"
                disabled={saving || company.status === 'banned'}
                onClick={handleVerify}
                className="h-11 rounded-xl bg-emerald-600 px-4 font-bold text-white hover:bg-emerald-700"
              >
                Xác minh
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={saving || company.status === 'banned'}
              variant="outline"
              onClick={() => setRejectDialogOpen(true)}
              className="h-11 rounded-xl bg-white px-4 font-bold"
            >
              Từ chối / ghi chú
            </Button>
            <Button
              type="button"
              disabled={saving}
              variant="outline"
              onClick={handleFlagToggle}
              className="h-11 rounded-xl bg-white px-4 font-bold"
            >
              {company.flagged ? 'Gỡ cờ cảnh báo' : 'Gắn cờ cảnh báo'}
            </Button>
            <Button
              type="button"
              disabled={saving || company.status === 'banned'}
              variant="destructive"
              onClick={handleBan}
              className="h-11 rounded-xl px-4 font-bold"
            >
              Khóa doanh nghiệp
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={Briefcase} label="Tin đăng" value={String(company.job_count)} />
          <InfoCard icon={Users} label="Ứng tuyển" value={String(company.application_count)} />
          <InfoCard icon={Mail} label="Email" value={company.email || 'Chưa cập nhật'} />
          <InfoCard icon={Users} label="Người đại diện" value={ownerName} />
        </div>
      </PageHeader>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {company.company_logo ? (
                  <img
                    src={company.company_logo}
                    alt={company.company_name || 'Company logo'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 size={32} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={cn('gap-2 rounded-full px-3 py-1', moderationStatus.badgeClass)}
                  >
                    <StatusIcon size={14} />
                    {moderationStatus.label}
                  </Badge>
                  {company.flagged ? (
                    <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                      Đang bị cảnh báo
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  {moderationStatus.summary}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
              <InfoCard icon={Briefcase} label="Tin đăng" value={String(company.job_count)} />
              <InfoCard icon={Users} label="Ứng tuyển" value={String(company.application_count)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
          <InfoCard icon={Users} label="Người đại diện" value={ownerName} />
          <InfoCard icon={Mail} label="Email" value={company.email || 'Chưa cập nhật'} />
          <InfoCard icon={Phone} label="Số điện thoại" value={company.phone || 'Chưa cập nhật'} />
          <InfoCard icon={MapPin} label="Địa điểm" value={company.location || 'Chưa cập nhật'} />
          <InfoCard
            icon={Building2}
            label="Lĩnh vực / quy mô"
            value={
              [company.industry, company.company_size].filter(Boolean).join(' / ') ||
              'Chưa cập nhật'
            }
          />
          <InfoCard
            icon={AlertTriangle}
            label="Ngày tạo"
            value={company.created_at ? formatDate(company.created_at) : 'Chưa cập nhật'}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Thông tin doanh nghiệp</h2>
            {company.company_website ? (
              <a
                href={company.company_website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Mở website
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-slate-400">
                Mô tả công ty
              </p>
              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-600">
                {company.company_description || 'Doanh nghiệp chưa cập nhật mô tả.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={Building2}
                label="Mã số thuế"
                value={company.tax_code || 'Chưa cập nhật'}
              />
              <InfoCard
                icon={ExternalLink}
                label="Website"
                value={company.company_website || 'Chưa cập nhật'}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Ghi chú moderation</h2>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-normal text-slate-400">Nội bộ</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-600">
              {company.moderation_note || company.rejection_reason || 'Chưa có ghi chú moderation.'}
            </p>
          </div>
        </section>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật moderation note</DialogTitle>
            <DialogDescription>
              Ghi lý do từ chối hoặc yêu cầu bổ sung hồ sơ. Lý do là bắt buộc khi chuyển doanh
              nghiệp sang trạng thái từ chối.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            rows={5}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Nhập ghi chú moderation..."
          />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              Hủy
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={handleReject}>
              Từ chối và lưu note
            </Button>
            <Button type="button" disabled={saving} onClick={handleVerify}>
              Xác minh và lưu note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanyDetailPage;
