import PropTypes from 'prop-types';
import React from 'react';
import { Briefcase } from 'lucide-react';

const ExperienceSection = ({ experiences = [] }) => {
  return (
    <div className="relative group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Briefcase size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Kinh nghiệm làm việc
        </h3>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8">
        {(experiences || []).map((exp, index) => (
          <div key={index} className="relative group/item">
            {/* Pulsing Dot on timeline */}
            <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500" />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
                  {exp.title || exp.position}
                </h4>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-base mt-1">
                  {exp.company}
                </p>
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-md shrink-0">
                {exp.period || `${exp.startDate} - ${exp.endDate || 'Hiện tại'}`}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mt-2 whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
              {exp.description || exp.desc}
            </p>
          </div>
        ))}

        {(!experiences || experiences.length === 0) && (
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base italic">
              Chưa có thông tin kinh nghiệm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

ExperienceSection.propTypes = {
  experiences: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      position: PropTypes.string,
      company: PropTypes.string,
      period: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      description: PropTypes.string,
      desc: PropTypes.string,
    })
  ),
};

ExperienceSection.defaultProps = {
  experiences: [],
};

export default ExperienceSection;
