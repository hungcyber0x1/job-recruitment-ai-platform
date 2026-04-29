/**
 * Employer Team Service - Quản lý recruiter trong công ty
 */
import api from './api';

const employerTeamService = {
  // ─── Team Members ────────────────────────────────────────────────────
  getTeamMembers: () => api.get('employer/team'),

  inviteMember: (data) => api.post('employer/team/invite', data),

  updateMemberRole: (userId, data) => api.put(`employer/team/${userId}/role`, data),

  updateMemberPermissions: (userId, data) => api.put(`employer/team/${userId}/permissions`, data),

  removeMember: (userId) => api.delete(`employer/team/${userId}`),

  getMyPermissions: () => api.get('employer/team/permissions'),

  // ─── Role & Permission helpers ────────────────────────────────────────
  getRoleLabels: () => ({
    owner: 'Chủ sở hữu',
    admin: 'Quản trị viên',
    recruiter: 'Nhà tuyển dụng',
  }),

  getPermissionFields: () => [
    { key: 'can_post_job', label: 'Đăng tin tuyển dụng', description: 'Có thể tạo và đăng tin mới' },
    { key: 'can_edit_job', label: 'Sửa tin tuyển dụng', description: 'Có thể chỉnh sửa tin đã đăng' },
    { key: 'can_delete_job', label: 'Xóa tin tuyển dụng', description: 'Có thể xóa tin tuyển dụng' },
    { key: 'can_approve_job', label: 'Duyệt tin', description: 'Có thể phê duyệt tin trước khi đăng' },
    { key: 'can_view_applications', label: 'Xem ứng viên', description: 'Có thể xem hồ sơ ứng viên' },
    { key: 'can_manage_applications', label: 'Quản lý ứng viên', description: 'Chuyển trạng thái, ghi chú, từ chối' },
    { key: 'can_send_email', label: 'Gửi email', description: 'Có thể gửi email cho ứng viên' },
    { key: 'can_view_salary', label: 'Xem lương', description: 'Có thể xem thông tin lương' },
    { key: 'can_export_data', label: 'Xuất dữ liệu', description: 'Có thể xuất danh sách ứng viên' },
  ],
};

export default employerTeamService;
