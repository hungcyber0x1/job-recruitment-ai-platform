import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, User, Mail, Phone, MapPin, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import userService from '../../services/userService';
import { Button } from '@/components/ui/button';

const AdminProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(formData);
      await refreshUser();
      showNotification('Cập nhật hồ sơ thành công!', 'success');
    } catch (error) {
      console.error('Failed to update profile', error);
      showNotification('Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn tệp hình ảnh.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Kích thước ảnh không được vượt quá 2MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      showNotification('Cập nhật ảnh đại diện thành công!', 'success');
    } catch (error) {
      console.error('Failed to upload avatar', error);
      showNotification('Không thể tải ảnh lên. Vui lòng thử lại.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const inputClass =
    'w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium';
  const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Hồ sơ cá nhân
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Quản lý thông tin tài khoản quản trị của bạn.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-emerald-600 hover:bg-primary/10 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
              <div className="relative inline-block group">
                <div className="w-32 h-32 rounded-3xl bg-emerald-50 border-4 border-white shadow-xl overflow-hidden mb-4 ring-1 ring-slate-100 transition-transform group-hover:scale-[1.02]">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-emerald-500">
                      {(user?.first_name?.[0] || user?.name?.[0] || 'A').toUpperCase()}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mt-1">
                {user?.role === 'admin' ? 'Quản trị viên hệ thống' : user?.role}
              </p>

              <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3 text-slate-500 text-sm font-medium px-4">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm font-medium px-4">
                  <Shield size={16} className="text-slate-400 shrink-0" />
                  <span>ID: #{user?.id ? String(user.id).slice(-6) : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-lg shadow-emerald-200/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-lg font-bold mb-2">Bảo mật tài khoản</h3>
              <p className="text-sm text-emerald-100 font-medium leading-relaxed">
                Đảm bảo mật khẩu của bạn là duy nhất và không được sử dụng ở nơi khác.
              </p>
              <Button
                variant="secondary"
                className="w-full mt-6 bg-white text-emerald-600 hover:bg-primary/10 border-none rounded-xl font-bold uppercase tracking-wider text-xs"
                onClick={() => navigate('/admin/settings')}
              >
                Cập nhật bảo mật
              </Button>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Thông tin cá nhân
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={labelClass} htmlFor="first_name">
                      Họ (First Name)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={18} />
                      </div>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`${inputClass} pl-12`}
                        placeholder="Nhập họ..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass} htmlFor="last_name">
                      Tên (Last Name)
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Nhập tên..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={labelClass} htmlFor="phone">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone size={18} />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`${inputClass} pl-12`}
                        placeholder="0xxx xxx xxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass} htmlFor="email">
                      Email Hệ thống
                    </label>
                    <div className="relative opacity-60">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className={`${inputClass} pl-12 bg-slate-50 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelClass} htmlFor="address">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-4 text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className={`${inputClass} pl-12 py-3 h-auto resize-none`}
                      placeholder="Nhập địa chỉ của bạn..."
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 px-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="mr-3 h-4 w-4" />
                    {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfilePage;
