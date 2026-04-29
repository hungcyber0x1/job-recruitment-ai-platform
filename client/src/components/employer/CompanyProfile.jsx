import PropTypes from 'prop-types';
import React from 'react';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Phone,
  Mail,
  Edit3,
  Instagram,
  Linkedin,
  Facebook,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const CompanyProfile = ({ companyData, isEditable = false, onEdit }) => {
  return (
    <div className="space-y-10">
      {/* Cover & Brand Area */}
      <Card className="p-0 overflow-hidden border-none shadow-2xl shadow-indigo-100/50">
        <div className="h-48 bg-gradient-to-r from-accent to-violet-600 relative">
          <div className="absolute -bottom-16 left-10 p-2 bg-white rounded-[40px] shadow-xl">
            <div className="w-32 h-32 rounded-[32px] bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
              {companyData?.logo ? (
                <img src={companyData.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={48} className="text-emerald-200" />
              )}
            </div>
          </div>
          {isEditable && (
            <button className="absolute top-6 right-6 px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold text-sm hover:bg-white/30 transition-all border border-white/20">
              Thay đổi ảnh bìa
            </button>
          )}
        </div>

        <div className="pt-20 pb-10 px-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {companyData?.name || 'My Company'}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 capitalize">
              <span className="flex items-center gap-2">
                <Globe size={16} /> {companyData?.industry || 'Tech'}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={16} /> {companyData?.location || 'Vietnam'}
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} /> {companyData?.size || '100-500'} Nhân viên
              </span>
            </div>
          </div>
          {isEditable && onEdit && (
            <Button
              variant="primary"
              className="flex items-center gap-2 shadow-xl shadow-indigo-100"
              onClick={onEdit}
            >
              <Edit3 size={18} />
              Chỉnh sửa hồ sơ
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10 border-none shadow-xl shadow-slate-100/50">
            <h3 className="text-xl font-bold text-slate-900 mb-6 font-bold uppercase tracking-normal">
              Về chúng tôi
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed whitespace-pre-line">
              {companyData?.description || 'Chưa có thông tin mô tả cho công ty này.'}
            </p>
          </Card>

          <Card className="p-10 border-none shadow-xl shadow-slate-100/50">
            <h3 className="text-xl font-bold text-slate-900 mb-8 font-bold uppercase tracking-normal">
              Văn hóa & Giá trị
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Sáng tạo', desc: 'Luôn tìm kiếm những giải pháp mới.' },
                { title: 'Chính trực', desc: 'Làm việc dựa trên sự tin tưởng.' },
              ].map((val, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-2">{val.title}</h4>
                  <p className="text-base text-slate-500 font-medium">{val.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Contact & Socials */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl shadow-slate-100/50">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-normal mb-8">
              Liên hệ
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <span className="text-sm font-bold text-slate-600">
                  {companyData?.email || 'contact@company.com'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <span className="text-sm font-bold text-slate-600">
                  {companyData?.phone || '+84 123 456 789'}
                </span>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50">
              <p className="text-base font-bold text-slate-300 uppercase tracking-normal mb-6 text-center">
                Mạng xã hội
              </p>
              <div className="flex justify-center gap-4">
                {[Linkedin, Facebook, Instagram].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-muted/40 hover:text-emerald-600 hover:shadow-lg transition-colors duration-200 ease-out flex items-center justify-center"
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

CompanyProfile.propTypes = {
  companyData: PropTypes.shape({
    logo: PropTypes.string,
    name: PropTypes.string,
    industry: PropTypes.string,
    location: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    description: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }),
  isEditable: PropTypes.bool,
  onEdit: PropTypes.func,
};

CompanyProfile.defaultProps = {
  companyData: null,
  isEditable: false,
  onEdit: null,
};

export default CompanyProfile;
