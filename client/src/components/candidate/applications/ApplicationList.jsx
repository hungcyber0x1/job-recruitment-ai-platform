import PropTypes from 'prop-types';
import React from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';

import { getAppStatusConfig } from '../../../constants/status';
import Card from '../../common/Card';
import StatusBadge from '../../common/StatusBadge';

/**
 * ApplicationList - hiển thị danh sách đơn ứng tuyển của candidate
 * Dùng centralized constants từ ../../../constants/status.js
 */
const ApplicationList = ({ applications = [] }) => {
  return (
    <div className="space-y-6">
      {applications.map((application) => {
        const cfg = getAppStatusConfig(application.status);

        return (
          <Card key={application.id} hover className="group overflow-hidden p-0">
            <div className="flex items-stretch">
              <div className={`w-2 ${cfg.bg}`} />

              <div className="flex flex-grow items-center justify-between p-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {application.company_logo ? (
                      <img
                        src={application.company_logo}
                        alt="Logo"
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <Briefcase size={20} className="text-muted-foreground" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary">
                      {application.job_title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {application.company_name} • {application.location || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <StatusBadge entityType="application" status={application.status} />
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

ApplicationList.propTypes = {
  applications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      status: PropTypes.string,
      company_logo: PropTypes.string,
      job_title: PropTypes.string,
      company_name: PropTypes.string,
      location: PropTypes.string,
    })
  ),
};

export default ApplicationList;
