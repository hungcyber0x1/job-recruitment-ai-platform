import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { employerService } from '../../services';
import uploadService from '../../services/uploadService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const EditCompanyProfilePage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({
    company_name: '',
    field: '',
    scale: '',
    address: '',
    website: '',
    contact_email: '',
    phone: '',
    description: '',
    company_logo: '',
    cover_image: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState({ logo: false, cover: false });

  const logoInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await employerService.getProfile();
        setProfile(response.data?.data || {});
      } catch {
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      e.target.value = '';
      return;
    }

    setIsUploading((prev) => ({ ...prev, [type]: true }));

    try {
      if (type === 'logo') {
        const res = await uploadService.uploadCompanyLogo(file);
        const logoUrl = res.data?.data?.company_logo;
        if (!logoUrl) {
          throw new Error('No logo URL');
        }
        setProfile((prev) => ({ ...prev, company_logo: logoUrl }));
        updateUser({ avatar_url: logoUrl, company_logo: logoUrl });
        toast.success('Đã cập nhật logo — avatar trên trang chủ sẽ hiển thị logo này.');
      } else {
        const previewUrl = URL.createObjectURL(file);
        setProfile((prev) => ({ ...prev, cover_image: previewUrl }));
        toast.success('Đã chọn ảnh bìa (xem trước). Lưu hồ sơ để gửi kèm nếu API hỗ trợ.');
      }
    } catch (err) {
      console.error(err);
      toast.error(
        type === 'logo' ? 'Không tải được logo lên máy chủ.' : 'Không xử lý được ảnh bìa.'
      );
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await employerService.updateProfile(profile);
      toast.success('Hồ sơ đã được cập nhật thành công');
      navigate('/employer/company-profile');
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in bg-slate-50/50 min-h-screen">
      {/* Top Header - Premium Design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              CHỈNH SỬA HỒ SƠ
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest text-[10px] px-2.5 py-1"
            >
              CHẾ ĐỘ CHỈNH SỬA
            </Badge>
          </div>
          <p className="text-slate-500 font-medium tracking-wide">
            Tối ưu hóa hình ảnh thương hiệu của bạn để thu hút nhân tài
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/employer/company-profile')}
            className="rounded-2xl px-6 h-12 font-bold text-slate-600 transition-colors duration-200 ease-out hover:bg-muted/60"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-2xl px-6 h-12 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Save size={18} />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card with Cover and Logo Upload */}
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden rounded-3xl">
            {/* Hidden Inputs */}
            <input
              type="file"
              ref={logoInputRef}
              onChange={(e) => handleFileChange(e, 'logo')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={coverInputRef}
              onChange={(e) => handleFileChange(e, 'cover')}
              accept="image/*"
              className="hidden"
            />

            {/* Cover Image Upload */}
            <div
              className="h-64 md:h-80 w-full relative group cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              <img
                src={
                  profile.cover_image ||
                  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'
                }
                alt="Cover"
                className={`w-full h-full object-cover transition-all duration-700 ${isUploading.cover ? 'blur-sm grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                {isUploading.cover ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-white font-black text-xs uppercase tracking-widest">
                      ĐANG TẢI LÊN...
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-emerald-600 gap-2 rounded-2xl active:scale-95 transition-all"
                  >
                    <Camera size={18} />
                    Đổi ảnh bìa
                  </Button>
                )}
              </div>
            </div>

            {/* Logo and Main Fields */}
            <div className="px-8 pb-10">
              <div className="relative flex flex-col md:flex-row items-end gap-6 -mt-16 mb-8">
                <div
                  className="p-2 bg-white rounded-3xl shadow-xl border border-slate-100 group relative cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                    {isUploading.logo ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                      </div>
                    ) : profile.company_logo ? (
                      <img
                        src={resolveMediaUrl(profile.company_logo)}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="text-emerald-500 w-16 h-16" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all m-2">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Tên công ty *
                    </Label>
                    <Input
                      name="company_name"
                      value={profile.company_name}
                      onChange={handleChange}
                      placeholder="Nhập tên doanh nghiệp..."
                      className="bg-white border-slate-200 text-slate-900 h-14 rounded-2xl font-bold text-lg focus:ring-emerald-500/20 focus:border-emerald-500/50 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Lĩnh vực & Quy mô Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Lĩnh vực
                  </Label>
                  <Input
                    name="field"
                    value={profile.field}
                    onChange={handleChange}
                    placeholder="Công nghệ & Năng lượng tái tạo"
                    className="bg-white border-slate-200 h-12 rounded-xl text-slate-700 font-bold focus:ring-emerald-500/20 shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Quy mô nhân sự
                  </Label>
                  <select
                    name="scale"
                    value={profile.scale}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 h-12 rounded-xl text-slate-700 font-bold px-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 shadow-sm"
                  >
                    <option value="">Chọn quy mô</option>
                    <option value="1-10 nhân viên">1-10 nhân viên</option>
                    <option value="11-50 nhân viên">11-50 nhân viên</option>
                    <option value="51-200 nhân viên">51-200 nhân viên</option>
                    <option value="201-500 nhân viên">201-500 nhân viên</option>
                    <option value="500+ nhân viên">500+ nhân viên</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* About Section */}
          <Card className="p-8 md:p-10 border-slate-200 bg-white shadow-sm rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="text-emerald-500" size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider">
                Giới thiệu công ty
              </h3>
            </div>
            <Textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              placeholder="Chia sẻ về sứ mệnh, tầm nhìn và giá trị của công ty..."
              className="min-h-[300px] bg-white border-slate-200 text-slate-700 rounded-2xl p-6 leading-relaxed font-medium focus:ring-emerald-500/20 shadow-sm"
            />
          </Card>
        </div>

        {/* Right Column - Secondary Info */}
        <div className="space-y-8">
          {/* Contact Card */}
          <Card className="p-8 md:p-10 border-slate-200 bg-white shadow-sm rounded-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <MapPin className="text-emerald-500" size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider">
                Thông tin liên hệ
              </h3>
            </div>

            <div className="space-y-6">
              {[
                {
                  label: 'Địa chỉ trụ sở',
                  name: 'address',
                  icon: MapPin,
                  placeholder: 'Quận 1, TP.HCM',
                },
                {
                  label: 'Website',
                  name: 'website',
                  icon: Globe,
                  placeholder: 'https://company.io',
                },
                {
                  label: 'Email liên hệ',
                  name: 'contact_email',
                  icon: Mail,
                  placeholder: 'hr@company.com',
                },
                {
                  label: 'Số điện thoại',
                  name: 'phone',
                  icon: Phone,
                  placeholder: '028 1234 XXXX',
                },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {field.label}
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <field.icon size={18} />
                    </div>
                    <Input
                      name={field.name}
                      value={profile[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="bg-white border-slate-200 pl-12 h-12 rounded-xl text-slate-700 font-bold focus:ring-emerald-500/20 shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Brand Builder Card - Gamification */}
          <Card className="p-8 border border-emerald-100 bg-emerald-50/30 shadow-sm rounded-3xl relative overflow-hidden group">
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-10 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="text-emerald-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                  Mẹo tối ưu hồ sơ
                </h3>
              </div>

              <ul className="space-y-4">
                {[
                  'Thêm ảnh bìa chất lượng cao',
                  'Mô tả chi tiết văn hóa làm việc',
                  'Cập nhật địa chỉ website vả mxh',
                ].map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-slate-600 text-sm font-medium"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <ChevronRight size={12} className="text-emerald-600" />
                    </div>
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-8 p-4 rounded-2xl bg-white border border-emerald-100/50">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Hồ sơ đầy đủ giúp tăng tỷ lệ ứng tuyển lên đến{' '}
                  <span className="text-emerald-600 font-bold">60%</span>. Hãy bổ sung ngay các
                  thông tin còn thiếu!
                </p>
              </div>
            </div>
          </Card>

          {/* Social Links Form Update (Shortened for brevity) */}
          <div className="p-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-muted/35"
            >
              + Facebook
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-muted/35"
            >
              + LinkedIn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCompanyProfilePage;
