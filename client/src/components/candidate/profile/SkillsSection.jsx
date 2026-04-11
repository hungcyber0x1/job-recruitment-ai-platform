import PropTypes from 'prop-types';
import React from 'react';
import { Zap } from 'lucide-react';

const SkillsSection = ({ skills = [] }) => {
  // skills structure expected: { name: string, level: string } or just string

  return (
    <div className="relative h-full flex flex-col group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-primary dark:text-emerald-400">
          <Zap size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Kỹ năng chuyên môn
        </h3>
      </div>

      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors cursor-default"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {typeof skill === 'string' ? skill : skill.name}
              </span>
              {typeof skill === 'object' && skill.level && (
                <span
                  className={`text-sm font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                    skill.level === 'Expert'
                      ? 'bg-primary/10 text-primary'
                      : skill.level === 'Advanced'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {skill.level}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
          <Zap size={24} className="text-slate-400 mb-2 opacity-50" />
          <p className="text-slate-500 dark:text-slate-400 text-base">Chưa cập nhật kỹ năng</p>
        </div>
      )}
    </div>
  );
};

SkillsSection.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string,
        level: PropTypes.string,
      }),
    ])
  ),
};

SkillsSection.defaultProps = {
  skills: [],
};

export default SkillsSection;
