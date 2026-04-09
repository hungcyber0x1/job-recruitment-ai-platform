import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import candidateService from '../../services/candidateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useNotification } from '../../context/NotificationContext';
import { cn } from '@/utils/index';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    title: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateService.getProfile();
        const profile = response.data.data;
        setFormData({
          bio: profile?.bio || '',
          title: profile?.title || '',
          phone: profile?.phone || '',
          location: profile?.location || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile', error);
        showNotification('Không thể tải thông tin hồ sơ', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await candidateService.updateProfile(formData);
      showNotification('Cập nhật hồ sơ thành công!', 'success');
      navigate('/candidate/profile');
    } catch (error) {
      console.error('Failed to update profile', error);
      showNotification(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50/80">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"
          aria-hidden
        />
      </div>
    );
  }

  const fieldClass =
    'h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm transition-shadow focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 pb-16 pt-8 md:pb-24 md:pt-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/candidate/profile')}
          className="group -ml-2 gap-2 px-2 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-medium">Quay lại hồ sơ</span>
        </Button>

        <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)]">
          <div className="relative border-b border-slate-800/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6 py-8 text-white md:px-10 md:py-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10 max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Hồ sơ ứng viên
              </p>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
                Chỉnh sửa thông tin chuyên môn
              </h1>
              <p className="text-sm leading-relaxed text-slate-300 md:text-[15px]">
                Thông tin chính xác giúp gợi ý việc làm và lộ trình phù hợp hơn — cả từ hệ thống AI
                và từ nhà tuyển dụng khi xem hồ sơ của bạn.
              </p>
            </div>
            <div className="absolute right-0 top-0 h-1 w-32 bg-emerald-500 md:w-40" aria-hidden />
          </div>

          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700">
                    Chức danh công việc
                  </Label>
                  <p className="text-xs text-muted-foreground">Ví dụ: Lập trình viên Full-stack</p>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={cn(fieldClass)}
                    placeholder="Nhập chức danh hiện tại hoặc mong muốn"
                    autoComplete="organization-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700">
                    Địa điểm làm việc
                  </Label>
                  <p className="text-xs text-muted-foreground">Thành phố hoặc khu vực</p>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={cn(fieldClass)}
                    placeholder="Ví dụ: Hà Nội, TP. Hồ Chí Minh"
                    autoComplete="address-level2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700">
                  Số điện thoại
                </Label>
                <p className="text-xs text-muted-foreground">
                  Dùng để nhà tuyển dụng liên hệ khi cần
                </p>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={cn(fieldClass, 'md:max-w-md')}
                  placeholder="+84 900 000 000"
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-700">
                  Giới thiệu bản thân
                </Label>
                <p className="text-xs text-muted-foreground">
                  Kinh nghiệm, kỹ năng nổi bật và định hướng nghề nghiệp (khuyến nghị 2–6 câu)
                </p>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={6}
                  className="min-h-[140px] resize-y rounded-lg border-slate-200 bg-white text-sm shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 md:min-h-[160px]"
                  placeholder="Mô tả ngắn gọn về chuyên môn, dự án tiêu biểu và mục tiêu nghề nghiệp…"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-center text-xs text-muted-foreground sm:text-left">
                  Nhấn &quot;Lưu thay đổi&quot; để cập nhật hồ sơ hiển thị với nhà tuyển dụng.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/candidate/profile')}
                    disabled={saving}
                    className="h-11 rounded-xl border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-11 gap-2 rounded-xl bg-emerald-600 px-8 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:text-white focus-visible:ring-emerald-500"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Đang lưu…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfilePage;
