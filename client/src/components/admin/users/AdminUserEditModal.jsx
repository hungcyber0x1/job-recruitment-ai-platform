import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Mail,
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  MapPin,
  Key,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import adminService from '../../../services/adminService';
import { useNotification } from '../../../context/NotificationContext';

const ROLE_VALUES = new Set(['admin', 'recruiter', 'candidate']);

function normalizeEditableRole(role) {
  const normalizedRole = String(role ?? '')
    .trim()
    .toLowerCase();
  return ROLE_VALUES.has(normalizedRole) ? normalizedRole : 'candidate';
}

const AdminUserEditModal = ({ isOpen, onClose, user, onSave, loading }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'candidate',
    status: 'active',
    region: '',
    gender: '',
    internal_notes: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState({
    resetPassword: false,
    resendVerification: false,
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: normalizeEditableRole(user.role),
        status: user.status || 'active',
        region: user.region || '',
        gender: user.gender || '',
        internal_notes: user.internal_notes || '',
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showNotification('Mật khẩu mới phải từ 6 ký tự trở lên.', 'error');
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, resetPassword: true }));
      await adminService.resetPassword(user.id, newPassword);
      showNotification('Đã đặt lại mật khẩu thành công!', 'success');
      setNewPassword('');
    } catch (err) {
      showNotification('Lỗi khi đặt lại mật khẩu.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, resetPassword: false }));
    }
  };

  const handleResendEmail = async () => {
    try {
      setActionLoading((prev) => ({ ...prev, resendVerification: true }));
      await adminService.resendVerificationEmail(user.id);
      showNotification('Đã gửi lại email xác thực.', 'success');
    } catch (err) {
      showNotification('Lỗi khi gửi lại email.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, resendVerification: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <User className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa người dùng</h2>
              <p className="text-sm text-slate-500 font-medium">
                Cập nhật thông tin và phân quyền hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên..."
                  className="w-full pl-12 pr-4 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  disabled
                  className="w-full pl-12 pr-4 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 outline-none font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                <Shield size={16} className="text-slate-400" />
                Vai trò hệ thống
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              >
                <option value="candidate">Ứng viên (Candidate)</option>
                <option value="recruiter">Nhà tuyển dụng (Recruiter)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                <CheckCircle size={16} className="text-slate-400" />
                Trạng thái tài khoản
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              >
                <option value="active">Đang hoạt động</option>
                <option value="pending">Chờ phê duyệt</option>
                <option value="inactive">Đã vô hiệu hóa</option>
                <option value="banned">Đã khóa tài khoản</option>
                <option value="locked">Đã khóa bởi admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" />
                Vùng miền
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-4 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
              >
                <option value="">Chưa thiết lập</option>
                <option value="Miền Bắc">Miền Bắc</option>
                <option value="Miền Trung">Miền Trung</option>
                <option value="Miền Nam">Miền Nam</option>
                <option value="Nước ngoài">Nước ngoài</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Giới tính</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 h-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
              >
                <option value="">Chưa thiết lập</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 text-slate-500">
            <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-400" />
              Ghi chú nội bộ (Chỉ Admin thấy)
            </label>
            <textarea
              name="internal_notes"
              value={formData.internal_notes}
              onChange={handleChange}
              rows="3"
              placeholder="Nhập ghi chú quan trọng về người dùng này..."
              className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium resize-none text-slate-700"
            />
          </div>

          <div className="p-6 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm uppercase tracking-normal">
              <Key size={16} /> Quản trị bảo mật
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="relative">
                  <Key
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới..."
                    className="w-full pl-11 pr-4 h-12 rounded-xl bg-white border border-amber-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={actionLoading.resetPassword || !newPassword}
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-normal transition-all"
                >
                  {actionLoading.resetPassword ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </Button>
              </div>

              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={
                    actionLoading.resendVerification ||
                    (!['pending', 'pending_verification'].includes(user.status) &&
                      user.email_verified_at)
                  }
                  variant="outline"
                  className="w-full h-12 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-bold uppercase tracking-normal transition-all"
                >
                  {actionLoading.resendVerification ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Send size={14} className="mr-2" />
                      Gửi lại xác thực
                    </>
                  )}
                </Button>
                {!['pending', 'pending_verification'].includes(user.status) &&
                  user.email_verified_at && (
                    <span className="text-xs text-amber-600 font-medium mt-2 text-center">
                      Tài khoản này đã được xác thực email.
                    </span>
                  )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-12 px-8 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl h-12 px-8 bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Đang lưu...
                </div>
              ) : (
                <>
                  <Save size={18} />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserEditModal;
