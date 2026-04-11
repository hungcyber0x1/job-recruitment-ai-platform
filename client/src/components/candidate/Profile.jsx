import PropTypes from 'prop-types';
import React, { useState } from 'react';
import {
  Briefcase,
  Camera,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  User,
} from 'lucide-react';

import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

const Profile = ({ user, candidate, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: candidate?.phone || '',
    location: candidate?.location || '',
    currentJobTitle: candidate?.current_job_title || '',
    experienceYears: candidate?.experience_years || '',
    bio: candidate?.bio || '',
    github: candidate?.github_url || '',
    linkedin: candidate?.linkedin_url || '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Card className="border-none p-10 shadow-2xl shadow-indigo-100/50">
        <div className="flex flex-col items-center gap-10 md:flex-row">
          <div className="group relative">
            <Avatar
              name={`${formData.firstName} ${formData.lastName}`}
              src={user?.avatar_url}
              size="xl"
              className="h-32 w-32 rounded-[40px] shadow-2xl shadow-indigo-100"
            />
            <button
              type="button"
              className="absolute -bottom-2 -right-2 rounded-2xl bg-emerald-600 p-3 text-white shadow-xl transition-transform hover:scale-110"
            >
              <Camera size={20} />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h2 className="mb-2 text-3xl font-black text-slate-900">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="flex items-center justify-center gap-2 text-base font-bold uppercase tracking-widest text-slate-400 md:justify-start">
              <Sparkles size={14} className="text-emerald-600" />
              Candidate Profile • ID: {user?.id || 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-900">
              <div className="h-6 w-1.5 rounded-full bg-emerald-600" />
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Input
                label="Ho"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                icon={<User size={18} />}
              />
              <Input
                label="Tên"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                icon={<User size={18} />}
              />
              <Input
                label="Email"
                name="email"
                value={formData.email}
                readOnly
                icon={<Mail size={18} />}
              />
              <Input
                label="So dien thoai"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={<Phone size={18} />}
              />
            </div>
          </Card>

          <Card className="border-none p-10 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-slate-900">
              <div className="h-6 w-1.5 rounded-full bg-emerald-600" />
              Su nghiep
            </h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Input
                  label="Vi tri hien tai"
                  name="currentJobTitle"
                  value={formData.currentJobTitle}
                  onChange={handleChange}
                  icon={<Briefcase size={18} />}
                />
                <Input
                  label="So nam kinh nghiem"
                  name="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  icon={<Globe size={18} />}
                />
              </div>
              <Input
                label="Dia diem"
                name="location"
                value={formData.location}
                onChange={handleChange}
                icon={<MapPin size={18} />}
              />
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Gioi thieu ban than
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="5"
                  className="w-full rounded-3xl border border-transparent bg-slate-50 px-6 py-4 font-medium outline-none transition-all focus:border-emerald-500 focus:bg-white"
                  placeholder="Ke ve nhung kinh nghiem noi bat cua ban..."
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none p-8 shadow-xl shadow-slate-100/50">
            <h3 className="mb-8 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Ket noi
            </h3>
            <div className="space-y-6">
              <Input
                label="LinkedIn URL"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                icon={<Linkedin size={18} />}
              />
              <Input
                label="GitHub URL"
                name="github"
                value={formData.github}
                onChange={handleChange}
                icon={<Github size={18} />}
              />
            </div>
          </Card>

          <div className="sticky top-32 space-y-6">
            <Button
              type="submit"
              variant="primary"
              className="flex w-full items-center justify-center gap-3 rounded-3xl py-5 text-lg font-black shadow-2xl shadow-indigo-200"
            >
              <Save size={24} />
              Luu thay doi
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-3xl bg-white py-5 font-bold"
            >
              Huy bo
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

Profile.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    email: PropTypes.string,
    avatar_url: PropTypes.string,
  }),
  candidate: PropTypes.shape({
    phone: PropTypes.string,
    location: PropTypes.string,
    current_job_title: PropTypes.string,
    experience_years: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    bio: PropTypes.string,
    github_url: PropTypes.string,
    linkedin_url: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
};

Profile.defaultProps = {
  user: null,
  candidate: null,
};

export default Profile;
