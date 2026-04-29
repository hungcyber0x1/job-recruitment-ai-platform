import PropTypes from 'prop-types';
import React from 'react';
import { Award } from 'lucide-react';

const CertificationsSection = ({ certifications = [] }) => {
  return (
    <div className="relative group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Award size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-normal">
          Chứng chỉ & Giải thưởng
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(certifications || []).map((cert, index) => (
          <div
            key={index}
            className="group/cert flex gap-4 rounded-xl border border-transparent bg-orange-50/50 p-4 transition-colors duration-200 ease-out hover:border-orange-100 hover:bg-muted/40 dark:border-transparent dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="w-10 h-12 rounded-lg bg-orange-100/50 dark:bg-slate-700 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-200/50 dark:border-slate-600/50">
              <Award size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight mb-1">
                {cert.name}
              </h4>
              <p className="text-base font-medium text-slate-500 dark:text-slate-400 mb-2">
                {cert.organization} • {cert.year}
              </p>
              {cert.url && (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                >
                  Verify Certificate
                </a>
              )}
            </div>
          </div>
        ))}

        {(!certifications || certifications.length === 0) && (
          <div className="col-span-full p-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
            <Award size={24} className="text-slate-400 mb-2 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400 text-base">Chưa cập nhật chứng chỉ</p>
          </div>
        )}
      </div>
    </div>
  );
};

CertificationsSection.propTypes = {
  certifications: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      organization: PropTypes.string,
      year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      url: PropTypes.string,
    })
  ),
};

CertificationsSection.defaultProps = {
  certifications: [],
};

export default CertificationsSection;
