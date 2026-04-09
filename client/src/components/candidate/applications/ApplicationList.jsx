import PropTypes from 'prop-types';
import React from 'react';
import { Briefcase, CheckCircle, ChevronRight, Clock, XCircle } from 'lucide-react';

import { getStatusLabel } from '../../../constants/status';
import Card from '../../common/Card';

const getStatusConfig = (status) => {
  switch (status) {
    case 'hired':
    case 'offered':
      return {
        sideClass: 'bg-state-success',
        badgeClass: 'bg-state-success/10 text-state-success',
        icon: <CheckCircle size={16} />,
      };
    case 'rejected':
      return {
        sideClass: 'bg-state-danger',
        badgeClass: 'bg-state-danger/10 text-state-danger',
        icon: <XCircle size={16} />,
      };
    default:
      return {
        sideClass: 'bg-state-warning',
        badgeClass: 'bg-state-warning/10 text-state-warning',
        icon: <Clock size={16} />,
      };
  }
};

const ApplicationList = ({ applications = [] }) => {
  return (
    <div className="space-y-6">
      {applications.map((application) => {
        const config = getStatusConfig(application.status);

        return (
          <Card
            key={application.id}
            className="group overflow-hidden p-0 transition-all hover:shadow-2xl hover:shadow-secondary/10"
          >
            <div className="flex items-stretch">
              <div className={`w-2 ${config.sideClass}`} />

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
                      <Briefcase size={20} className="text-txt-light" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground transition-colors group-hover:text-secondary">
                      {application.job_title}
                    </h4>
                    <p className="mt-1 text-xs font-medium text-txt-muted">
                      {application.company_name} • {application.location || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-black uppercase ${config.badgeClass}`}
                  >
                    {config.icon}
                    {getStatusLabel(application.status)}
                  </div>
                  <ChevronRight size={20} className="text-txt-light" />
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
