import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Facebook,
  Linkedin,
  Twitter,
  Edit3,
  ExternalLink,
  Target,
  FileText,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { employerService } from '../../services';
import { toast } from 'react-hot-toast';

const CompanyProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await employerService.getProfile();
        setProfile(response.data?.data);
      } catch (error) {
        console.error('Error fetching company profile:', error);
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-fade-in bg-slate-50/50 min-h-screen max-w-[1400px] mx-auto">
      {/* Top Header - Premium View Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-tight">
              HỒ SƠ CÔNG TY
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-600 border-emerald-200 uppercase tracking-widest text-base px-3 py-1 font-black shadow-sm"
            >
              CHẾ ĐỘ XEM TRƯỚC
            </Badge>
          </div>
          <p className="text-slate-500 font-bold tracking-tight text-base uppercase opacity-70">
            Trình bày thương hiệu tuyển dụng chuyên nghiệp
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/employer/company-profile/edit">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-3 rounded-2xl px-8 h-14 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all text-base font-black uppercase tracking-widest">
              <Edit3 size={20} />
              Cập nhật hồ sơ
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-4">
        <div className="lg:col-span-2 space-y-10">
          {/* Header Card with Hero Background */}
          <div className="relative group rounded-[40px] overflow-hidden bg-white shadow-2xl shadow-slate-200/60 border border-slate-200 transition-all duration-500 hover:border-emerald-200">
            {/* Cover Image */}
            <div className="h-72 md:h-96 w-full overflow-hidden relative">
              <img
                src={
                  profile?.cover_image ||
                  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'
                }
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent opacity-90" />
            </div>

            {/* Logo and Quick Info */}
            <div className="relative px-10 pb-10 -mt-20 flex flex-col md:flex-row items-end gap-8">
              <div className="p-3 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-[2.2rem] bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 relative group/logo">
                  {profile?.company_logo ? (
                    <img
                      src={profile.company_logo}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="text-emerald-500 w-20 h-20 opacity-20" />
                  )}
                  <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1 pb-4">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-none">
                  {profile?.company_name || 'HỒ SƠ CHƯA ĐỊNH DANH.'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-slate-500">
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-base font-black uppercase tracking-widest text-slate-600 shadow-sm">
                    <Target size={16} className="text-emerald-600" />
                    {profile?.field || 'Lĩnh vực'}
                  </span>
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-base font-black uppercase tracking-widest text-slate-600 shadow-sm">
                    <Users size={16} className="text-emerald-600" />
                    {profile?.scale || 'Quy mô'}
                  </span>
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-base font-black uppercase tracking-widest text-slate-600 shadow-sm">
                    <MapPin size={16} className="text-emerald-600" />
                    {profile?.address || 'Địa điểm'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* About Company */}
          <Card className="p-10 md:p-14 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[40px] relative overflow-hidden group hover:border-emerald-100 transition-all duration-500">
            <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 pointer-events-none group-hover:scale-110 group-hover:-rotate-12">
              <FileText size={200} className="text-slate-900" />
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                <FileText className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Câu chuyện doanh nghiệp
              </h3>
            </div>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-wrap">
              {profile?.description ||
                'Hãy cập nhật giới thiệu đầy đủ để thu hút ứng viên tài năng.'}
            </div>
          </Card>

          {/* Values & Culture */}
          <Card className="p-10 md:p-14 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[40px] hover:border-emerald-100 transition-all duration-500">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                <Heart className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Văn hóa & Giá trị cốt lõi
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Đổi mới sáng tạo',
                  desc: 'Luôn tiên phong trong công nghệ và giải pháp',
                  icon: Target,
                },
                {
                  title: 'Gắn kết đồng đội',
                  desc: 'Xây dựng môi trường làm việc hạnh phúc',
                  icon: Users,
                },
                {
                  title: 'Bền vững',
                  desc: 'Phát triển hài hòa cùng lợi ích cộng đồng',
                  icon: Globe,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-300 transition-all hover:shadow-2xl hover:-translate-y-2 group duration-500 hover:bg-card"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md group-hover:shadow-emerald-200/50 group-hover:border-emerald-200">
                    <item.icon className="text-emerald-600" size={28} />
                  </div>
                  <h4 className="font-black text-slate-900 mb-3 uppercase text-base tracking-widest">
                    {item.title}
                  </h4>
                  <p className="text-base text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Sidebar Info */}
        <div className="space-y-10">
          {/* Contact Info */}
          <Card className="p-10 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-[40px] relative overflow-hidden group hover:border-emerald-100 transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <Phone size={100} className="text-slate-900" />
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
                <Phone className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Kết nối nhanh
              </h3>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Số điện thoại', value: profile?.phone || 'Chưa cập nhật', icon: Phone },
                {
                  label: 'Email liên hệ',
                  value: profile?.contact_email || 'Chưa cập nhật',
                  icon: Mail,
                },
                {
                  label: 'Website chính thức',
                  value: profile?.website || 'Chưa cập nhật',
                  icon: Globe,
                  link: true,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-[24px] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-card transition-all hover:shadow-lg group/item box-border"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-emerald-200 group-hover/item:scale-110 transition-all">
                    <item.icon className="text-emerald-600" size={20} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-70 group-hover/item:text-emerald-600 transition-colors">
                      {item.label}
                    </p>
                    {item.link ? (
                      <a
                        href={item.value.startsWith('http') ? item.value : `http://${item.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-black text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-2 truncate"
                      >
                        {item.value} <ExternalLink size={14} className="shrink-0" />
                      </a>
                    ) : (
                      <p className="text-base font-black text-slate-900 truncate">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="mt-10 pt-10 border-t border-slate-100">
              <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-6 opacity-70">
                Sự hiện diện trên mạng xã hội
              </p>
              <div className="flex gap-4">
                {[Facebook, Linkedin, Twitter].map((Icon, idx) => (
                  <button
                    key={idx}
                    className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 transition-all hover:scale-110 shadow-sm hover:shadow-xl hover:shadow-emerald-600/20 active:scale-90"
                  >
                    <Icon size={24} />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Brand Score Card */}
          <Card className="p-10 border-transparent bg-slate-900 shadow-2xl shadow-slate-900/30 rounded-[40px] overflow-hidden relative group">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-600/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                  <TrendingUp className="text-emerald-500" size={24} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  Rating Thương hiệu
                </h3>
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-7xl font-black text-white leading-none tracking-tighter italic">
                  85
                </span>
                <span className="text-emerald-500 font-black mb-2 uppercase tracking-widest text-base">
                  / 100 ĐIỂM
                </span>
              </div>

              <div className="h-3 w-full bg-white/10 rounded-full mb-8 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: '85%' }}
                />
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-[24px] p-6 mb-8 border border-white/10 shadow-inner">
                <p className="text-base font-bold text-slate-300 text-center leading-relaxed">
                  Hồ sơ đạt mức{' '}
                  <span className="text-emerald-500 font-black italic">CHUYÊN NGHIỆP</span>. Hãy bổ
                  sung thêm Video văn hóa để vươn tới 100 điểm!
                </p>
              </div>

              <Link to="/employer/company-profile/edit" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-emerald-600/25 uppercase tracking-widest text-base">
                  TỐI ƯU HỒ SƠ NGAY
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
