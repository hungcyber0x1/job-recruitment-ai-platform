import PropTypes from 'prop-types';
import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Edit3,
  Award,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * @agent frontend-specialist
 * @style Premium Neo-Minimalism / Asymmetric Layout
 * @description Highly polished, premium Profile Header with asymmetric content flow, glassmorphic accents, and refined typography.
 */
const ProfileHeader = ({ user, profile }) => {
  const socialLinks = [
    {
      icon: Linkedin,
      url: profile?.linkedin,
      label: 'LinkedIn',
      color: 'group-hover:text-[#0077b5]',
    },
    {
      icon: Github,
      url: profile?.github,
      label: 'GitHub',
      color: 'group-hover:text-foreground dark:group-hover:text-white',
    },
    { icon: Globe, url: profile?.website, label: 'Website', color: 'group-hover:text-emerald-500' },
  ].filter((link) => link.url);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full mb-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="relative z-10 flex flex-col xl:flex-row min-h-[400px]">
        <div className="w-full xl:w-[30%] p-8 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center xl:items-start justify-between relative overflow-hidden">
          <motion.div
            variants={itemVariants}
            className="relative w-full max-w-[240px] aspect-square rounded-xl p-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 group z-10 mx-auto xl:mx-0"
          >
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-900">
              <img
                src={
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${user?.fullName}&background=f8fafc&color=0f172a&bold=true&size=512`
                }
                alt={user?.fullName}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            <button className="absolute -bottom-3 -right-3 w-10 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-primary transition-colors shadow-sm z-20">
              <Camera size={18} />
            </button>
          </motion.div>

          {/* Core Status */}
          <motion.div variants={itemVariants} className="mt-8 w-full text-center xl:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold tracking-normal mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Đang tìm cơ hội
            </div>

            <div className="flex flex-col gap-5 text-left">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
                  Mức hoàn thiện hồ sơ
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-[12rem] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    85%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
                  Cập nhật gần nhất
                </h3>
                <span className="text-sm text-slate-700 dark:text-slate-300">2 ngày trước</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Information Stream */}
        <div className="w-full xl:w-[70%] p-8 md:p-10 flex flex-col justify-between relative z-10">
          <div className="max-w-4xl">
            <motion.div variants={itemVariants} className="mb-10 text-center xl:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold mb-6 border border-slate-200 dark:border-slate-700">
                <Award size={14} className="text-amber-500" />
                Nhân sự cấp cao
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-normal mb-4">
                {user?.fullName}
              </h1>

              <div className="flex flex-col sm:flex-row items-center gap-3 xl:justify-start justify-center text-slate-600 dark:text-slate-400">
                <h2 className="text-xl sm:text-2xl font-medium tracking-normal">
                  {profile?.title || 'Kỹ sư phần mềm'}
                </h2>
                <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-sm">
                  {profile?.yearsOfExperience || '5'} năm kinh nghiệm
                </span>
              </div>
            </motion.div>

            {/* Smart Contact Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
            >
              {[
                { label: 'Email', value: user?.email, icon: Mail },
                { label: 'Điện thoại', value: profile?.phone || 'Chưa cung cấp', icon: Phone },
                {
                  label: 'Địa điểm',
                  value: profile?.location || 'TP. Hồ Chí Minh, Việt Nam',
                  icon: MapPin,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <item.icon size={16} />
                    <span className="text-sm uppercase tracking-normal font-semibold">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.value}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Action Footer */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200 dark:border-slate-800"
          >
            {/* Social Connectivity */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {socialLinks.length > 0 ? (
                  socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon size={18} />
                    </a>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">Chưa thêm liên kết mạng xã hội</span>
                )}
              </div>
            </div>

            {/* Smart Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-muted/35 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <Zap size={16} className="text-primary" />
                Phân tích AI
              </button>

              <Link
                to="/candidate/profile/edit"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:bg-slate-800 dark:hover:bg-muted/55 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 size={16} />
                Chỉnh sửa hồ sơ
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    avatar_url: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
  }),
  profile: PropTypes.shape({
    linkedin: PropTypes.string,
    github: PropTypes.string,
    website: PropTypes.string,
    title: PropTypes.string,
    yearsOfExperience: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    phone: PropTypes.string,
    location: PropTypes.string,
  }),
};

ProfileHeader.defaultProps = {
  user: null,
  profile: null,
};

export default ProfileHeader;
