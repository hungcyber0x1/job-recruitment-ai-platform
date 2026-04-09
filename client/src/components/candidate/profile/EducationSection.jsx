import PropTypes from 'prop-types';
import React from 'react';
import { GraduationCap } from 'lucide-react';

const EducationSection = ({ education = [] }) => {
  return (
    <div className="relative group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-500/10 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
          <GraduationCap size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Học vấn & Bằng cấp
        </h3>
      </div>

      <div className="space-y-4">
        {(education || []).map((edu, index) => (
          <div
            key={index}
            className="flex gap-4 items-start p-4 hover:bg-muted/35 dark:hover:bg-slate-800/50 rounded-xl border border-transparent transition-colors duration-200 ease-out hover:border-slate-100 dark:hover:border-slate-800 group/item"
          >
            <div className="w-12 h-12 rounded-lg bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-100/50 dark:border-slate-700/50">
              <span className="text-lg font-bold">{edu.school ? edu.school.charAt(0) : 'U'}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {edu.school}
                </h4>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-md shrink-0">
                  {edu.period || `${edu.startDate} - ${edu.endDate || 'Hiện tại'}`}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                {edu.degree} - {edu.major}
              </p>
              {edu.gpa && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-md w-fit border border-emerald-100/50 dark:border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold">GPA: {edu.gpa}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {(!education || education.length === 0) && (
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            Chưa có thông tin học vấn.
          </p>
        )}
      </div>
    </div>
  );
};

EducationSection.propTypes = {
  education: PropTypes.arrayOf(
    PropTypes.shape({
      school: PropTypes.string,
      period: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      degree: PropTypes.string,
      major: PropTypes.string,
      gpa: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
};

EducationSection.defaultProps = {
  education: [],
};

export default EducationSection;
