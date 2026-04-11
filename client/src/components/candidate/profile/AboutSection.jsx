import PropTypes from 'prop-types';
import React from 'react';
import { UserCheck, Quote } from 'lucide-react';

/**
 * @agent frontend-specialist
 * @style Tech-Brutalist Elite
 * @description Refactored AboutSection with sharp geometry and staggered reveal.
 */
const AboutSection = ({ bio }) => {
  return (
    <div className="relative h-full flex flex-col group">
      {/* Decorative Blur Element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="flex flex-col md:flex-row gap-10 items-start">
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary transition-all duration-300">
            <UserCheck size={24} />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 dark:bg-slate-100 rounded-md flex items-center justify-center text-white dark:text-slate-900 shadow-sm">
            <Quote size={10} />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Identity / Narrative
          </label>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Giới thiệu bản thân
          </h3>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
            {bio ? (
              <p className="text-base leading-relaxed">{bio}</p>
            ) : (
              <p className="italic text-base">
                Không thể tìm thấy dữ liệu. Hãy cập nhật hồ sơ để hệ thống có thể tiến hành phân
                tích tiềm năng của bạn.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AboutSection.propTypes = {
  bio: PropTypes.string,
};

AboutSection.defaultProps = {
  bio: '',
};

export default AboutSection;
