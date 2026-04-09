import PropTypes from 'prop-types';
import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  ShieldCheck,
} from 'lucide-react';

/**
 * @agent frontend-specialist
 * @style Tech-Brutalist Elite
 * @description Refactored AdditionalSections with sharp geometry and high-contrast visuals.
 */

export const CVSection = ({ cvUrl }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          CV / Resume
        </h3>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
          Verified
        </span>
      </div>

      {cvUrl ? (
        <div className="group relative flex items-center gap-6 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all duration-300">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 text-primary rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
            <FileText size={32} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Hồ sơ năng lực (CV)
            </h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              PDF • Verified Document • Updated recently
            </p>
          </div>
          <a
            href={cvUrl}
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors shadow-sm"
            aria-label="Download CV"
          >
            <Download size={20} />
          </a>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            No Digital Identity Found
          </p>
          <a
            href="/candidate/resume"
            className="inline-flex px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Upload Resume
          </a>
        </div>
      )}
    </motion.div>
  );
};

export const JobPreferencesSection = ({ preferences }) => {
  const items = [
    {
      label: 'Role',
      value: preferences?.role || 'Engineer',
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Type',
      value: preferences?.type || 'Full-time',
      icon: Clock,
      color: 'text-primary-600',
      bg: 'bg-primary-500/5',
    },
    {
      label: 'Salary',
      value: preferences?.salary || 'Negotiable',
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-500/5',
    },
    {
      label: 'Location',
      value: preferences?.location || 'Remote/VN',
      icon: MapPin,
      color: 'text-rose-600',
      bg: 'bg-rose-500/5',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-primary" size={20} />
          Career Vectors
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex items-start gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}
            >
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-base">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

CVSection.propTypes = {
  cvUrl: PropTypes.string,
};

CVSection.defaultProps = {
  cvUrl: '',
};

JobPreferencesSection.propTypes = {
  preferences: PropTypes.shape({
    role: PropTypes.string,
    type: PropTypes.string,
    salary: PropTypes.string,
    location: PropTypes.string,
  }),
};

JobPreferencesSection.defaultProps = {
  preferences: null,
};
