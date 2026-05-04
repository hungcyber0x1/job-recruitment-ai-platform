import PropTypes from 'prop-types';
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';

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
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-normal flex items-center gap-3">
          <FileText className="text-primary" size={20} />
          CV / hồ sơ đính kèm
        </h3>
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
          Đã xác minh
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
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">
              PDF • Tài liệu đã xác minh • Vừa cập nhật gần đây
            </p>
          </div>
          <a
            href={cvUrl}
            target="_blank"
            rel="noreferrer"
            className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors shadow-sm"
            aria-label="Tải CV xuống"
          >
            <Download size={20} />
          </a>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <p className="text-slate-500 dark:text-slate-400 text-base mb-4">Chưa có CV điện tử</p>
          <a
            href="/candidate/resume"
            className="inline-flex px-5 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tải CV lên
          </a>
        </div>
      )}
    </motion.div>
  );
};

CVSection.propTypes = {
  cvUrl: PropTypes.string,
};

CVSection.defaultProps = {
  cvUrl: '',
};
