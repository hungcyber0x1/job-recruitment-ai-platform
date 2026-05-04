import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  KeyRound,
  Minus,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

import StatCard from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ADMIN_PERMISSIONS, ADMIN_PRESETS } from '@/utils/adminPermissions';

const permissionRows = [
  {
    id: ADMIN_PERMISSIONS.DASHBOARD,
    name: 'Tổng quan',
    description: 'Xem tổng quan vận hành và các chỉ số chính của toàn hệ thống.',
    group: 'Nền tảng',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.USERS_READ,
    name: 'Xem người dùng',
    description: 'Tra cứu, xem hồ sơ và theo dõi trạng thái của tài khoản người dùng.',
    group: 'Tài khoản',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.USERS_MANAGE,
    name: 'Quản lý tài khoản',
    description: 'Khóa, mở khóa và cập nhật trạng thái hay thông tin tài khoản.',
    group: 'Tài khoản',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.USERS_DELETE,
    name: 'Xóa tài khoản',
    description: 'Xóa tài khoản và dữ liệu chức năng liên quan theo quy trình hệ thống.',
    group: 'Tài khoản',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.ADMIN_PERMISSIONS,
    name: 'Phân quyền admin',
    description: 'Gán preset hoặc cấu hình quyền cho các tài khoản admin khác.',
    group: 'Tài khoản',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.COMPANIES_MANAGE,
    name: 'Quản lý doanh nghiệp',
    description: 'Duyệt, gắn cờ, cập nhật và kiểm soát hồ sơ doanh nghiệp.',
    group: 'Doanh nghiệp',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.COMPANIES_DELETE,
    name: 'Xóa / restore doanh nghiệp',
    description: 'Xóa mềm, khôi phục doanh nghiệp và dữ liệu liên quan.',
    group: 'Doanh nghiệp',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.JOBS_MANAGE,
    name: 'Quản lý tin tuyển dụng',
    description: 'Tạo, sửa, duyệt, đóng và kiểm duyệt tin tuyển dụng.',
    group: 'Tuyển dụng',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.JOBS_DELETE,
    name: 'Xóa tin tuyển dụng',
    description: 'Thực hiện thao tác xóa tin tuyển dụng khỏi hệ thống.',
    group: 'Tuyển dụng',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.APPLICATIONS_MANAGE,
    name: 'Quản lý ứng tuyển',
    description: 'Xem và cập nhật pipeline ứng tuyển trong khu vực admin.',
    group: 'Tuyển dụng',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.CONTENT_MANAGE,
    name: 'Quản lý nội dung',
    description: 'Quản trị blog, CMS trang chủ và các thành phần nội dung.',
    group: 'Nội dung',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.CONTENT_DELETE,
    name: 'Xóa nội dung',
    description: 'Xóa blog, banner hoặc các thao tác xóa hàng loạt.',
    group: 'Nội dung',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.TAXONOMY_MANAGE,
    name: 'Quản lý taxonomy',
    description: 'Quản trị ngành nghề, kỹ năng và danh mục dữ liệu chuẩn.',
    group: 'Nội dung',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.AI_MANAGE,
    name: 'Quản lý AI',
    description: 'Điều phối chatbot, prompt và các công cụ AI của hệ thống.',
    group: 'Vận hành',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.SUPPORT_MANAGE,
    name: 'Hỗ trợ',
    description: 'Xử lý ticket và phối hợp phản hồi các vấn đề từ người dùng.',
    group: 'Vận hành',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.ANALYTICS_READ,
    name: 'Báo cáo',
    description: 'Truy cập các bảng phân tích, báo cáo và số liệu vận hành.',
    group: 'Nền tảng',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.AUDIT_READ,
    name: 'Audit logs',
    description: 'Xem lịch sử hoạt động và truy vết thao tác quản trị.',
    group: 'Nền tảng',
    highLevel: false,
  },
  {
    id: ADMIN_PERMISSIONS.SETTINGS_MANAGE,
    name: 'Cài đặt hệ thống',
    description: 'Quản lý cấu hình, bảo mật, SMTP và feature flags.',
    group: 'Vận hành',
    highLevel: true,
  },
  {
    id: ADMIN_PERMISSIONS.BACKUP_MANAGE,
    name: 'Backup / restore',
    description: 'Sao lưu và phục hồi dữ liệu hệ thống.',
    group: 'Vận hành',
    highLevel: true,
  },
];

const rolePresets = [
  {
    id: 'admin',
    name: 'Admin',
    description:
      'Toàn quyền hệ thống: quản lý người dùng, doanh nghiệp, việc làm, nội dung, cấu hình và sao lưu.',
    userCount: 1,
    permissions: ADMIN_PRESETS.admin,
  },
];

const ROLE_STYLES = {
  admin: {
    icon: Shield,
    surfaceClass: 'border-rose-200/80 bg-[linear-gradient(145deg,#fff1f2_0%,#ffffff_62%)]',
    iconClass: 'bg-rose-100 text-rose-700 ring-rose-200',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    progressClass: 'bg-rose-500',
  },
};

const GROUP_STYLES = {
  'Nền tảng': 'border-slate-200 bg-slate-100 text-slate-700',
  'Tài khoản': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Doanh nghiệp': 'border-sky-200 bg-sky-50 text-sky-700',
  'Tuyển dụng': 'border-violet-200 bg-violet-50 text-violet-700',
  'Nội dung': 'border-amber-200 bg-amber-50 text-amber-700',
  'Vận hành': 'border-rose-200 bg-rose-50 text-rose-700',
};

const governanceNotes = [
  {
    title: 'Admin là vai trò quản trị duy nhất',
    description: 'Mọi tài khoản có role admin đều hiển thị là Admin và có toàn quyền hệ thống.',
  },
  {
    title: 'Nhà tuyển dụng tập trung nghiệp vụ tuyển dụng',
    description:
      'Role recruiter quản lý công ty, tin tuyển dụng và ứng viên thuộc phạm vi của mình.',
  },
  {
    title: 'Ứng viên quản lý hồ sơ cá nhân',
    description: 'Role candidate dùng để ứng tuyển, lưu việc làm và cập nhật hồ sơ cá nhân.',
  },
  {
    title: 'Ma trận dùng để đối chiếu nhanh',
    description:
      'Các quyền bên dưới mô tả phạm vi toàn quyền của Admin sau khi hệ thống chuẩn hóa còn ba vai trò.',
  },
];

const totalPermissions = permissionRows.length;
const highLevelPermissions = permissionRows.filter((permission) => permission.highLevel).length;

const permissionLabelMap = permissionRows.reduce((result, permission) => {
  result[permission.id] = permission.name;
  return result;
}, {});

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  children,
  ...props
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200/70 hover:shadow-md sm:p-6 ${className}`}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-normal text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function roleHasPermission(role, permissionId) {
  return (
    role.permissions.includes(ADMIN_PERMISSIONS.ALL) || role.permissions.includes(permissionId)
  );
}

function getRolePermissionCount(role) {
  return role.permissions.includes(ADMIN_PERMISSIONS.ALL)
    ? totalPermissions
    : role.permissions.length;
}

function getRoleHighLevelCount(role) {
  return role.permissions.includes(ADMIN_PERMISSIONS.ALL)
    ? highLevelPermissions
    : permissionRows.filter(
        (permission) => permission.highLevel && role.permissions.includes(permission.id)
      ).length;
}

function getRoleHighlights(role) {
  if (role.permissions.includes(ADMIN_PERMISSIONS.ALL)) {
    return ['Toàn bộ quyền hệ thống', 'Quản trị admin', 'Cài đặt & sao lưu'];
  }

  return role.permissions
    .map((permission) => permissionLabelMap[permission])
    .filter(Boolean)
    .slice(0, 3);
}

const AdminPermissionsPage = () => {
  const adminPreset = rolePresets.find((role) => role.id === 'admin');
  const heroMetrics = [
    {
      label: 'Vai trò hệ thống',
      value: '3',
      helper: 'Admin · Recruiter · Candidate',
      type: 'success',
      icon: Shield,
    },
    {
      label: 'Quyền nghiệp vụ',
      value: formatNumber(totalPermissions),
      helper: 'Điểm kiểm soát truy cập',
      type: 'primary',
      icon: KeyRound,
    },
    {
      label: 'Quyền cấp cao',
      value: formatNumber(highLevelPermissions),
      helper: 'Cần kiểm soát chặt',
      type: 'warning',
      icon: ShieldAlert,
    },
    {
      label: 'Preset Admin',
      value: `${getRolePermissionCount(adminPreset)}/${totalPermissions}`,
      helper: 'Admin có toàn quyền',
      type: 'neutral',
      icon: Settings2,
    },
  ];
  const showOverviewSidebar = rolePresets.length > 0 && governanceNotes.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/40 pb-16 animate-fade-in">
      <section className="relative overflow-hidden border-b border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-bold text-emerald-700 shadow-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Admin workspace
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-bold text-slate-600 shadow-sm">
                Quy tắc phân quyền hệ thống
              </Badge>
            </div>

            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-emerald-600">Permission governance</p>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl lg:text-5xl">
                Phân quyền & vai trò
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                Chuẩn hóa quyền truy cập sau khi hợp nhất admin thành một vai trò duy nhất, đồng
                nhất với ba role hệ thống: Admin, Nhà tuyển dụng và Ứng viên.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroMetrics.map((metric) => (
                <StatCard
                  key={metric.label}
                  title={metric.label}
                  value={metric.value}
                  subtitle={metric.helper}
                  icon={metric.icon}
                  type={metric.type}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-lg bg-slate-950 px-5 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <a href="#permission-matrix">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Xem ma trận quyền
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-lg border-white/80 bg-white/80 px-5 font-bold shadow-sm hover:bg-white"
              >
                <Link to="/admin/users?role=admin">
                  <Users className="mr-2 h-4 w-4" />
                  Xem tài khoản admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <div className="space-y-6">
            <SectionCard
              icon={Shield}
              title="Preset vai trò"
              description="Hệ thống chỉ còn một preset Admin với toàn quyền quản trị, không tách loại admin phụ."
            >
              <div className="grid gap-4 md:grid-cols-2">
                {rolePresets.map((role) => {
                  const style = ROLE_STYLES[role.id];
                  const Icon = style.icon;
                  const permissionCount = getRolePermissionCount(role);
                  const highLevelCount = getRoleHighLevelCount(role);
                  const coverage = Math.round((permissionCount / totalPermissions) * 100);
                  const highlights = getRoleHighlights(role);

                  return (
                    <article
                      key={role.id}
                      className={`rounded-[1.25rem] border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${style.surfaceClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${style.iconClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-950">{role.name}</h3>
                            <p className="text-sm text-slate-500">
                              {formatNumber(role.userCount)} người dùng
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={`rounded-full border px-3 py-1 font-semibold ${style.badgeClass}`}
                        >
                          {role.permissions.includes(ADMIN_PERMISSIONS.ALL)
                            ? 'Toàn quyền'
                            : `${permissionCount} quyền`}
                        </Badge>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">{role.description}</p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-white/80 p-4 ring-1 ring-inset ring-white">
                          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Quyền
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {formatNumber(permissionCount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/80 p-4 ring-1 ring-inset ring-white">
                          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Cấp cao
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">
                            {formatNumber(highLevelCount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/80 p-4 ring-1 ring-inset ring-white">
                          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                            Phủ hệ thống
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-950">{coverage}%</p>
                        </div>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-white">
                        <div
                          className={`h-full rounded-full ${style.progressClass}`}
                          style={{ width: `${coverage}%` }}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {highlights.map((highlight) => (
                          <Badge
                            key={highlight}
                            className="rounded-full border border-white/90 bg-white/85 px-3 py-1 font-semibold text-slate-700 shadow-sm"
                          >
                            {highlight}
                          </Badge>
                        ))}
                        {!role.permissions.includes(ADMIN_PERMISSIONS.ALL) &&
                        role.permissions.length > highlights.length ? (
                          <Badge className="rounded-full border border-white/90 bg-white/85 px-3 py-1 font-semibold text-slate-600 shadow-sm">
                            +{role.permissions.length - highlights.length} quyền khác
                          </Badge>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              id="permission-matrix"
              icon={KeyRound}
              title="Ma trận quyền hạn"
              description="Đối chiếu nhanh phạm vi toàn quyền của Admin trong hệ thống ba vai trò."
              action={
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {formatNumber(totalPermissions)} quyền · {formatNumber(highLevelPermissions)}{' '}
                  quyền cấp cao
                </div>
              }
            >
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/90">
                        <th className="sticky left-0 z-20 min-w-[320px] bg-slate-50/90 px-5 py-4 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                          Quyền truy cập
                        </th>
                        {rolePresets.map((role) => (
                          <th key={role.id} className="px-4 py-4 text-center align-top">
                            <div className="mx-auto inline-flex min-w-[150px] flex-col items-center rounded-lg border border-white bg-white px-3 py-3 shadow-sm">
                              <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                                {role.name}
                              </span>
                              <span className="mt-1 text-lg font-bold text-slate-950">
                                {formatNumber(getRolePermissionCount(role))}
                              </span>
                              <span className="text-xs text-slate-500">quyền</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {permissionRows.map((permission) => (
                        <tr
                          key={permission.id}
                          className="group transition-colors hover:bg-emerald-50/30"
                        >
                          <td className="sticky left-0 z-10 bg-white px-5 py-4 align-top transition-colors group-hover:bg-emerald-50/30">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={`rounded-full border px-3 py-1 font-semibold ${GROUP_STYLES[permission.group]}`}
                              >
                                {permission.group}
                              </Badge>
                              {permission.highLevel ? (
                                <Badge className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                                  Cấp cao
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm font-bold text-slate-950">
                              {permission.name}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {permission.description}
                            </p>
                          </td>
                          {rolePresets.map((role) => {
                            const granted = roleHasPermission(role, permission.id);

                            return (
                              <td key={role.id} className="px-4 py-4 text-center align-middle">
                                <div
                                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                                    granted
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-400'
                                  }`}
                                  title={`${role.name}: ${granted ? 'Có quyền' : 'Không có quyền'}`}
                                >
                                  {granted ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Minus className="h-4 w-4" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          </div>

          {showOverviewSidebar && (
            <div className="space-y-6 xl:sticky xl:top-24">
              <SectionCard
                icon={Users}
                title="Tổng quan kiểm soát"
                description="Nhìn nhanh phạm vi quyền của preset Admin và mức độ chạm tới quyền cấp cao."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Vai trò chuẩn
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {formatNumber(rolePresets.length)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Quyền cấp cao
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {formatNumber(highLevelPermissions)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {rolePresets.map((role) => {
                    const style = ROLE_STYLES[role.id];
                    const Icon = style.icon;
                    const permissionCount = getRolePermissionCount(role);
                    const highLevelCount = getRoleHighLevelCount(role);
                    const coverage = Math.round((permissionCount / totalPermissions) * 100);

                    return (
                      <div
                        key={role.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ${style.iconClass}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{role.name}</p>
                              <p className="text-xs text-slate-500">{coverage}% phạm vi hệ thống</p>
                            </div>
                          </div>
                          <Badge
                            className={`rounded-full border px-3 py-1 font-semibold ${style.badgeClass}`}
                          >
                            {permissionCount} quyền
                          </Badge>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${style.progressClass}`}
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                        <p className="mt-3 text-xs font-medium text-slate-500">
                          Quyền cấp cao: {formatNumber(highLevelCount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard
                icon={Sparkles}
                title="Nguyên tắc phân quyền"
                description="Giữ đồng nhất hệ thống khi thêm tài khoản Admin, Nhà tuyển dụng hoặc Ứng viên."
              >
                <div className="space-y-3">
                  {governanceNotes.map((note) => (
                    <div
                      key={note.title}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4"
                    >
                      <p className="text-sm font-bold text-emerald-800">{note.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{note.description}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPermissionsPage;
